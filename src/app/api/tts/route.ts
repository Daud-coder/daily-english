import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, slow } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Gracefully signal client to use browser speech synthesis
      return new NextResponse(null, { status: 501, statusText: "Gemini TTS not configured" });
    }

    // Try Gemini TTS if supported or return 501 fallback
    return new NextResponse(null, { status: 501, statusText: "Use SpeechSynthesis fallback" });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}
