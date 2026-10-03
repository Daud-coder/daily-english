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

    // If API key is missing, report explicit error to terminal and client
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      console.error("[Teacher API] ❌ ОШИБКА: GEMINI_API_KEY не задан в файле .env.local!");
      return NextResponse.json(
        {
          error: "api_key_missing",
          message: "⚠️ ИИ не подключён: проверьте ключ Gemini в файле .env.local (переменная GEMINI_API_KEY) и перезапустите dev-сервер.",
          english: "AI is not connected. Please configure GEMINI_API_KEY in .env.local.",
          russian: "ИИ не подключён: проверьте ключ Gemini в файле .env.local.",
          isError: true
        },
        { status: 401 }
      );
    }

    const systemInstruction = getTeacherSystemPrompt(context);

    // Format chat history for Gemini (up to 10 recent messages)
    const contents: any[] = [];
    
    // Filter history to exclude exact duplicate of current message if client passed it
    const recent = chatHistory.slice(-10).filter(
      (m, idx, arr) => !(idx === arr.length - 1 && m.sender === "user" && m.english.trim() === userMessage.trim())
    );

    for (const msg of recent) {
      if (msg.sender === "user") {
        contents.push({
          role: "user",
          parts: [{ text: msg.english }]
        });
      } else {
        contents.push({
          role: "model",
          parts: [{ text: JSON.stringify({ english: msg.english, russian: msg.russian }) }]
        });
      }
    }

    // Add current user prompt with explicit reminder of dialogue history
    contents.push({
      role: "user",
      parts: [
        {
          text: `Сообщение ученика: "${userMessage.trim()}".
ВАЖНЕЙШИЕ ПРАВИЛА:
1. Оценивай грамматику ТОЛЬКО И ИСКЛЮЧИТЕЛЬНО в этом последнем сообщении: "${userMessage.trim()}". Предыдущие ошибки из истории УЖЕ исправлены — их повторять КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО!
2. Если в последнем сообщении "${userMessage.trim()}" ошибок нет (например, "I live in Kyiv. I work with meat" — это грамотная речь):
   - "correction": null (ОБЯЗАТЕЛЬНО null!)
   - "repeatPrompt": null (ОБЯЗАТЕЛЬНО null!)
   - "praise": "Отлично сказано, ${studentName}! Всё понятно и правильно."
3. Если есть ошибка именно в "${userMessage.trim()}":
   - "correction": доброе объяснение на русском
   - "praise": "Хорошая попытка, ${studentName}!"
4. Не переспрашивай то, что ученик уже сообщил (город, работу, семью, имя). Задавай новый логичный вопрос.
Ответь строго в формате JSON.`
        }
      ]
    });

    const ai = new GoogleGenAI({ apiKey });
    
    // Candidate models in priority order: fast response & reliability
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-flash-lite-latest"
    ];
    let responseText = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        console.log(`[Teacher API] Trying model: ${model}...`);
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
          console.log(`[Teacher API] ✅ Success with model: ${model}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Teacher API] ⚠️ Model ${model} failed, trying next:`, err?.message || err);
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
      
      let finalCorrection = parsed.correction || null;
      let finalRepeat = parsed.repeatPrompt || null;
      let finalPraise = parsed.praise;

      // Double-check: ensure correction strictly applies to userMessage
      if (finalCorrection) {
        const lowerUser = userMessage.toLowerCase();
        // If correction mentions 'child' / 'детей' but user didn't write 'child'
        if ((finalCorrection.includes("child") || finalCorrection.includes("детей")) && !lowerUser.includes("child")) {
          console.warn("[Teacher API] Stripping stale 'child' correction not present in latest message");
          finalCorrection = null;
          finalRepeat = null;
        }
        // If correction mentions 'from' but user didn't write 'from'
        if (finalCorrection && (finalCorrection.includes("from") || finalCorrection.includes("is from")) && !lowerUser.includes("from") && !lowerUser.includes("is")) {
          console.warn("[Teacher API] Stripping stale 'from' correction not present in latest message");
          finalCorrection = null;
          finalRepeat = null;
        }
      }

      if (finalCorrection) {
        if (!finalPraise || /отлично сказано|всё правильно|идеально|на пять/i.test(finalPraise)) {
          finalPraise = `Хорошая попытка, ${studentName}! Главное — говорить и не бояться ошибок.`;
        }
      } else {
        finalCorrection = null;
        finalRepeat = null;
        if (!finalPraise || /попытка|пробуешь/i.test(finalPraise)) {
          finalPraise = `Отлично сказано, ${studentName}! Всё правильно.`;
        }
      }

      const result = {
        english: parsed.english || `Hello ${studentName}! How are you today?`,
        russian: parsed.russian || `Привет, ${studentName}! Как твои дела сегодня?`,
        correction: finalCorrection,
        repeatPrompt: finalRepeat,
        praise: finalPraise
      };
      return NextResponse.json(result);
    } catch (parseErr) {
      console.warn("[Teacher API] JSON parse error, using text fallback:", parseErr);
      return NextResponse.json({
        english: text.slice(0, 150) || `Good job, ${studentName}!`,
        russian: `Отличная работа, ${studentName}!`,
        correction: null,
        repeatPrompt: null,
        praise: `Хорошая попытка, ${studentName}!`
      });
    }

  } catch (error: any) {
    const errorDetails = error?.message || String(error);
    console.error("[Teacher API] ❌ Gemini API error:", errorDetails);
    
    return NextResponse.json(
      {
        error: "gemini_api_error",
        message: `⚠️ Ошибка Gemini ИИ: ${errorDetails.slice(0, 200)}. Попробуйте отправить сообщение ещё раз.`,
        english: "I am having trouble connecting right now. Please try again in a moment.",
        russian: "Не удалось связаться с Gemini ИИ. Пожалуйста, попробуй отправить сообщение ещё раз.",
        isError: true
      },
      { status: 502 }
    );
  }
}
