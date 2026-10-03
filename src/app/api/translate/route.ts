import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const DICT: Record<string, { russian: string; transcription: string }> = {
  hello: { russian: "Привет / Здравствуйте", transcription: "Хэлло́у" },
  hi: { russian: "Привет", transcription: "Хай" },
  name: { russian: "Имя", transcription: "Нэйм" },
  nice: { russian: "Приятный / Милый", transcription: "Найс" },
  meet: { russian: "Встречать / Знакомиться", transcription: "Миит" },
  you: { russian: "Ты / Вы / Тебя", transcription: "Ю" },
  how: { russian: "Как", transcription: "Хау" },
  are: { russian: "Являетесь / Есть", transcription: "Аа" },
  fine: { russian: "Хорошо / В порядке", transcription: "Файн" },
  today: { russian: "Сегодня", transcription: "Тэдэ́й" },
  thank: { russian: "Благодарить", transcription: "Сэнк" },
  thanks: { russian: "Спасибо", transcription: "Сэнкс" },
  coffee: { russian: "Кофе", transcription: "Ко́фи" },
  water: { russian: "Вода", transcription: "Уо́тэ" },
  tea: { russian: "Чай", transcription: "Тии" },
  please: { russian: "Пожалуйста", transcription: "Плииз" },
  table: { russian: "Столик / Стол", transcription: "Тэйбл" },
  check: { russian: "Счёт / Чек", transcription: "Чек" },
  good: { russian: "Хороший", transcription: "Гуд" },
  great: { russian: "Отличный / Замечательный", transcription: "Грэйт" },
  yes: { russian: "Да", transcription: "Йес" },
  no: { russian: "Нет", transcription: "Ноу" },
  where: { russian: "Где / Куда", transcription: "Уэ́а" },
  what: { russian: "Что / Какой", transcription: "Уот" },
  when: { russian: "Когда", transcription: "Уэн" },
  who: { russian: "Кто", transcription: "Ху" },
  bus: { russian: "Автобус", transcription: "Бас" },
  stop: { russian: "Остановка / Остановитесь", transcription: "Стоп" },
  ticket: { russian: "Билет", transcription: "Ти́кет" },
  card: { russian: "Карта (банковская)", transcription: "Каад" },
  cash: { russian: "Наличные", transcription: "Кэш" },
  dollar: { russian: "Доллар", transcription: "До́лэ" },
  dollars: { russian: "Доллары", transcription: "До́лэрз" },
  bag: { russian: "Пакет / Сумка", transcription: "Бэг" },
  hotel: { russian: "Отель / Гостиница", transcription: "Хоутэ́л" },
  room: { russian: "Комната / Номер", transcription: "Руум" },
  key: { russian: "Ключ", transcription: "Кии" },
  passport: { russian: "Паспорт", transcription: "Па́споот" },
  airport: { russian: "Аэропорт", transcription: "Э́эпоот" },
  help: { russian: "Помощь / Помогать", transcription: "Хэлп" },
  doctor: { russian: "Врач / Доктор", transcription: "До́ктэ" },
  speak: { russian: "Говорить", transcription: "Спиик" },
  slow: { russian: "Медленный", transcription: "Слоу" },
  slower: { russian: "Медленнее", transcription: "Сло́уэ" },
  work: { russian: "Работа / Работать", transcription: "Уёрк" },
  ready: { russian: "Готов", transcription: "Рэ́ди" },
  hear: { russian: "Слышать", transcription: "Хи́а" },
};

export async function POST(req: NextRequest) {
  try {
    const { word, sentence } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const clean = word.toLowerCase().replace(/[^a-z]/gi, "");

    // Check fast local dictionary first
    if (DICT[clean]) {
      return NextResponse.json({
        english: word,
        russian: DICT[clean].russian,
        transcription: DICT[clean].transcription,
      });
    }

    // Fallback to Gemini if API key available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Переведи на русский слово "${word}" (контекст предложения: "${sentence || word}"). Ответь строго JSON: {"russian": "краткий перевод 1-3 слова", "transcription": "русская транскрипция, например [Хэллоу]"}`
                }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(res.text || "{}");
        if (parsed.russian) {
          return NextResponse.json({
            english: word,
            russian: parsed.russian,
            transcription: parsed.transcription || `[${word}]`
          });
        }
      } catch (geminiErr) {
        // Fallback below
      }
    }

    return NextResponse.json({
      english: word,
      russian: `Перевод слова «${word}»`,
      transcription: `[${word}]`
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to translate" }, { status: 500 });
  }
}
