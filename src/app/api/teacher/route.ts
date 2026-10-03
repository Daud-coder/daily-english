import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getTeacherSystemPrompt, TeacherPromptContext } from "@/lib/prompts/teacherPrompt";

export interface TeacherRequestBody {
  userMessage: string;
  chatHistory?: Array<{ sender: "user" | "teacher"; english: string; russian?: string }>;
  context?: TeacherPromptContext;
}

export async function POST(req: NextRequest) {
  try {
    const body: TeacherRequestBody = await req.json();
    const { userMessage, chatHistory = [], context = {} } = body;
    const studentName = context.studentName || "Daud";

    console.log("[Teacher API] Request received:", { userMessage, studentName });

    if (!userMessage || !userMessage.trim()) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is not configured or placeholder, return intelligent contextual mock response
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      console.log("[Teacher API] Using smart mock mode (GEMINI_API_KEY not set)");
      const mock = getSmartMockResponse(userMessage, studentName);
      return NextResponse.json(mock);
    }

    const systemInstruction = getTeacherSystemPrompt(context);

    // Format chat history for Gemini
    const contents: any[] = [];
    
    // Add recent history (last 6 exchanges)
    const recent = chatHistory.slice(-6);
    for (const msg of recent) {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.sender === "user" ? msg.english : JSON.stringify({ english: msg.english, russian: msg.russian }) }]
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [
        {
          text: `Сообщение ученика: "${userMessage.trim()}". Пожалуйста, ответь строго в формате JSON по инструкции.`
        }
      ]
    });

    const ai = new GoogleGenAI({ apiKey });
    
    // Try primary model with automatic failover to alternative flash models on 503/429
    const candidateModels = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-flash-latest"];
    let responseText = "";
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7,
          }
        });
        responseText = response.text || "";
        if (responseText) {
          console.log(`[Teacher API] Success with model: ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Teacher API] Model ${model} failed, trying next:`, err?.message || err);
      }
    }

    if (!responseText) {
      throw lastError || new Error("All Gemini models returned empty response");
    }

    const text = responseText;
    console.log("[Teacher API] Gemini response raw text:", text);
    
    try {
      const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      
      const result = {
        english: parsed.english || `Hello ${studentName}! How are you?`,
        russian: parsed.russian || `Привет, ${studentName}! Как дела?`,
        correction: parsed.correction || null,
        repeatPrompt: parsed.repeatPrompt || null,
        praise: parsed.praise || `Отлично, ${studentName}, продолжай говорить!`
      };
      return NextResponse.json(result);
    } catch (parseErr) {
      console.warn("[Teacher API] JSON parse error, using fallback format:", parseErr);
      return NextResponse.json({
        english: `Good job, ${studentName}! Say hello!`,
        russian: `Отличная работа, ${studentName}! Скажи hello!`,
        correction: null,
        repeatPrompt: "Hello!",
        praise: "Молодец, что пробуешь говорить!"
      });
    }

  } catch (error: any) {
    console.error("[Teacher API] Gemini API error:", error?.message || error);
    // Return friendly resilient fallback response with the student's name
    const fallback = getSmartMockResponse(userMessage, studentName);
    return NextResponse.json(fallback);
  }
}

/**
 * Intelligent beginner-tailored fallback responses for testing without API key
 */
function getSmartMockResponse(input: string, studentName: string = "Daud") {
  const lower = input.toLowerCase();

  // Russian response handling
  if (/[а-яёіїє]/i.test(lower)) {
    if (lower.includes("зовут") || lower.includes("меня зовут") || lower.includes("дауд")) {
      return {
        english: `Nice to meet you, ${studentName}! How are you?`,
        russian: `Приятно познакомиться, ${studentName}! Как твои дела?`,
        correction: `По-английски «Меня зовут ${studentName}» будет: «My name is ${studentName}» [Май нэйм из ${studentName}].`,
        repeatPrompt: `My name is ${studentName}.`,
        praise: `Отлично, ${studentName}! Давай скажем это по-английски:`
      };
    }
    if (lower.includes("привет") || lower.includes("здравствуй")) {
      return {
        english: `Hello, ${studentName}! How are you today?`,
        russian: `Привет, ${studentName}! Как твои дела сегодня?`,
        correction: "По-английски поздороваться можно простым словом «Hello!» [Хэллоу].",
        repeatPrompt: "Hello! Nice to meet you.",
        praise: "Отлично! Давай попробуем сказать это по-английски:"
      };
    }
    if (lower.includes("кофе") || lower.includes("чай")) {
      return {
        english: "One coffee, please.",
        russian: "Один кофе, пожалуйста.",
        correction: "В кафе говорим: «One coffee, please» [Уан кофи, плииз].",
        repeatPrompt: "One coffee, please.",
        praise: "Ты отлично выразил мысль! Повтори вслух:"
      };
    }
    if (lower.includes("хорошо") || lower.includes("нормально") || lower.includes("отлично")) {
      return {
        english: "I am fine, thank you.",
        russian: "У меня всё хорошо, спасибо.",
        correction: "Когда спрашивают «Как дела?», можно ответить: «I am fine» [Ай эм файн].",
        repeatPrompt: "I am fine, thank you.",
        praise: "Супер! Давай закрепим вслух:"
      };
    }

    return {
      english: `I understand you, ${studentName}! Speak English!`,
      russian: `Я тебя понимаю, ${studentName}! Давай по-английски!`,
      correction: "Ты ответил по-русски — это здорово! Давай переведём на английский.",
      repeatPrompt: "I am learning English.",
      praise: "Главное не бояться! Повтори за мной простую фразу:"
    };
  }

  // English input handling
  if (lower.includes("my name is") || lower.includes("name is") || lower.includes("daud")) {
    return {
      english: `Nice to meet you, ${studentName}! How are you today?`,
      russian: `Приятно познакомиться, ${studentName}! Как твои дела сегодня?`,
      correction: null,
      repeatPrompt: null,
      praise: `Прекрасно, ${studentName}! Идеальное английское предложение.`
    };
  }

  if (lower.includes("hello") || lower.includes("hi")) {
    return {
      english: `Hello ${studentName}! What is your name?`,
      russian: `Привет, ${studentName}! Как тебя зовут?`,
      correction: null,
      repeatPrompt: null,
      praise: "Прекрасное приветствие! На пять с плюсом."
    };
  }

  if (lower.includes("fine") || lower.includes("good") || lower.includes("ok")) {
    return {
      english: "Great! Do you like coffee?",
      russian: "Здорово! Ты любишь кофе?",
      correction: null,
      repeatPrompt: null,
      praise: "Отличный ответ! Коротко и понятно."
    };
  }

  if (lower.includes("yes") || lower.includes("no")) {
    return {
      english: "Nice! Where are you now?",
      russian: "Отлично! Где ты сейчас?",
      correction: null,
      repeatPrompt: null,
      praise: "Молодец! Всё правильно."
    };
  }

  // Default A0 response
  return {
    english: `Good, ${studentName}! How are you?`,
    russian: `Хорошо, ${studentName}! Как твои дела?`,
    correction: null,
    repeatPrompt: null,
    praise: "Ты делаешь отличные успехи!"
  };
}
