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
          text: `Сообщение ученика: "${userMessage.trim()}". ВАЖНО: Учитывай всю предыдущую историю нашего диалога. СТРОГО ЗАПРЕЩЕНО переспрашивать то, что ученик уже сообщил (например, если он уже сказал, откуда он, или про семью, или имя). Задавай новый логичный вопрос. Если есть ошибка — обязательно исправь её, объясни по-русски и похвали ТОЛЬКО за попытку в поле praise. Ответь строго в формате JSON.`
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
      
      let finalPraise = parsed.praise;
      if (parsed.correction) {
        // When there is an error, praise the attempt, NOT a flawless performance
        if (!finalPraise || /отлично справляешься|всё правильно|идеально|на пять/i.test(finalPraise)) {
          finalPraise = `Хорошая попытка, ${studentName}! Главное — говорить и не бояться ошибок.`;
        }
      } else {
        if (!finalPraise) {
          finalPraise = `Отлично сказано, ${studentName}!`;
        }
      }

      const result = {
        english: parsed.english || `Hello ${studentName}! How are you today?`,
        russian: parsed.russian || `Привет, ${studentName}! Как твои дела сегодня?`,
        correction: parsed.correction || null,
        repeatPrompt: parsed.repeatPrompt || null,
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
