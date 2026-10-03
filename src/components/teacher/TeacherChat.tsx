"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  VolumeX,
  Loader2
} from "lucide-react";
import { InteractiveText } from "./InteractiveText";
import { WordModal } from "./WordModal";
import { ShadowingModal } from "./ShadowingModal";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { VoiceRecognizer } from "@/lib/speech/speechRecognition";
import { getStorage, ChatMessageItem } from "@/lib/storage/storageAdapter";

export function TeacherChat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentName, setStudentName] = useState("Daud");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | undefined>(undefined);
  const [shadowingPhrase, setShadowingPhrase] = useState<{ phrase: string; russian?: string } | null>(null);
  const [collapsedTranslations, setCollapsedTranslations] = useState<Record<string, boolean>>({});
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  const scrollToBottom = (smooth: boolean = true) => {
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight + 500,
          behavior: smooth ? "smooth" : "auto"
        });
      }
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end"
      });
    });
  };

  // Load student name and chat history with legacy migration
  useEffect(() => {
    let mounted = true;

    getStorage().getStudentName().then((storedName) => {
      if (!mounted) return;
      const sName = storedName || "Daud";
      setStudentName(sName);

      getStorage().getMessages().then((loaded) => {
        if (!mounted) return;
        if (loaded.length === 0) {
          const starter: ChatMessageItem = {
            id: "msg-starter",
            sender: "teacher",
            english: `Hello, ${sName}! How are you today?`,
            russian: `Привет, ${sName}! Как твои дела сегодня?`,
            timestamp: Date.now(),
            praise: "Добро пожаловать! Я твой личный ИИ-учитель. Напиши или скажи мне что-нибудь на английском или русском!"
          };
          getStorage().saveMessage(starter);
          setMessages([starter]);
          voiceSpeaker.speak(starter.english, { slow: false });
        } else {
          // Migrate any existing starter asking "What is your name?"
          const migrated = loaded.map((m) => {
            if (
              m.sender === "teacher" &&
              (m.english.toLowerCase().includes("what is your name") || m.id === "msg-starter")
            ) {
              return {
                ...m,
                english: `Hello, ${sName}! How are you today?`,
                russian: `Привет, ${sName}! Как твои дела сегодня?`,
                praise: "Добро пожаловать! Я твой личный ИИ-учитель. Напиши или скажи мне что-нибудь на английском или русском!"
              };
            }
            return m;
          });
          setMessages(migrated);
          if (migrated[0] && migrated[0].id === "msg-starter") {
            getStorage().saveMessage(migrated[0]).catch(console.warn);
          }
        }
      });
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll on new messages or typing indicator
  useEffect(() => {
    scrollToBottom(true);
    const timer = setTimeout(() => scrollToBottom(true), 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string, isAudio: boolean = false) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setInputText("");
    setSpeechError(null);

    console.log("[TeacherChat] Sending user message:", userText);

    const isRussian = /[а-яёіїє]/i.test(userText);
    const userMsg: ChatMessageItem = {
      id: "msg-" + Date.now(),
      sender: "user",
      english: userText,
      russian: isRussian ? "Ваш ответ на русском" : "",
      timestamp: Date.now(),
      isAudio
    };

    // 1. Immediately show user message in chat
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);

    // 2. Immediately activate typing indicator
    setIsLoading(true);

    // Save user message asynchronously in background
    getStorage().saveMessage(userMsg).catch((e) => console.warn("Failed to persist user msg:", e));
    getStorage().recordPracticeTime(1).catch((e) => console.warn("Failed to record time:", e));

    try {
      console.log("[TeacherChat] Calling /api/teacher...");
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          chatHistory: messages.slice(-10).map((m) => ({
            sender: m.sender,
            english: m.english,
            russian: m.russian
          })),
          context: {
            studentName: studentName,
            studentLevel: "A0–A1"
          }
        })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        data = null;
      }

      if (!res.ok || data?.isError) {
        const errorDetail = data?.message || "⚠️ ИИ не подключён: проверьте ключ Gemini в файле .env.local (переменная GEMINI_API_KEY) и перезапустите dev-сервер.";
        console.error("[TeacherChat] API reported error:", errorDetail, data);

        const errorMsg: ChatMessageItem = {
          id: "err-" + Date.now(),
          sender: "teacher",
          english: "⚠️ AI is not connected. Please check your GEMINI_API_KEY in .env.local.",
          russian: errorDetail,
          timestamp: Date.now(),
          praise: "Требуется проверка ключа Gemini API"
        };

        setMessages((prev) => [...prev, errorMsg]);
        getStorage().saveMessage(errorMsg).catch(console.warn);
        return;
      }

      console.log("[TeacherChat] Received teacher response:", data);

      const teacherMsg: ChatMessageItem = {
        id: "msg-" + Date.now(),
        sender: "teacher",
        english: data.english || `Good job, ${studentName}!`,
        russian: data.russian || `Отличная работа, ${studentName}!`,
        timestamp: Date.now(),
        correction: data.correction,
        repeatPrompt: data.repeatPrompt,
        praise: data.praise
      };

      setMessages((prev) => [...prev, teacherMsg]);
      getStorage().saveMessage(teacherMsg).catch(console.warn);

      if (data.correction) {
        getStorage().addMistake(data.correction).catch(console.warn);
      }

      // Automatically speak teacher's response
      voiceSpeaker.speak(teacherMsg.english, { slow: false });

    } catch (err: any) {
      console.error("[TeacherChat] Network/Connection error:", err);
      
      const errorMsg: ChatMessageItem = {
        id: "err-" + Date.now(),
        sender: "teacher",
        english: "⚠️ Could not connect to the server. Please check your connection.",
        russian: `⚠️ Ошибка связи с сервером: ${err?.message || "Не удалось отправить запрос"}. Проверьте соединение или перезапустите dev-сервер.`,
        timestamp: Date.now(),
        praise: "Сетевая ошибка"
      };

      setMessages((prev) => [...prev, errorMsg]);
      getStorage().saveMessage(errorMsg).catch(console.warn);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    setSpeechError(null);

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    voiceSpeaker.stop();

    const recognizer = new VoiceRecognizer(
      {
        onStart: () => setIsListening(true),
        onResult: (transcript, isFinal) => {
          setInputText(transcript);
          if (isFinal) {
            handleSendMessage(transcript, true);
          }
        },
        onError: (err) => {
          setSpeechError(err);
          setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
        }
      },
      "en-US"
    );

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const handleClearHistory = async () => {
    if (confirm("Очистить историю диалога и начать сначала?")) {
      await getStorage().clearMessages();
      const starter: ChatMessageItem = {
        id: "msg-starter-" + Date.now(),
        sender: "teacher",
        english: `Hello, ${studentName}! How are you today?`,
        russian: `Привет, ${studentName}! Как твои дела сегодня?`,
        timestamp: Date.now(),
        praise: "Начнём новый диалог!"
      };
      await getStorage().saveMessage(starter);
      setMessages([starter]);
      voiceSpeaker.speak(starter.english);
    }
  };

  const toggleTranslation = (id: string) => {
    setCollapsedTranslations((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 max-w-2xl w-full mx-auto bg-slate-50">
      {/* Top Bar inside Chat */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">ИИ-Учитель готов</span>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
            Ученик: {studentName}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => voiceSpeaker.stop()}
            title="Остановить звук"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <VolumeX className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearHistory}
            title="Очистить диалог"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth">
        {messages.map((msg) => {
          const isTeacher = msg.sender === "teacher";
          const isTranslationHidden = collapsedTranslations[msg.id];

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTeacher ? "items-start" : "items-end"} gap-1.5`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[85%] rounded-3xl p-4 shadow-sm border transition-all ${
                  isTeacher
                    ? "bg-white border-slate-200/90 text-slate-900 rounded-tl-sm"
                    : "bg-brand-600 border-brand-700 text-white rounded-tr-sm"
                }`}
              >
                {/* Praise badge if present */}
                {isTeacher && msg.praise && (
                  <div
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2 border ${
                      msg.correction
                        ? "bg-amber-50 text-amber-900 border-amber-200/80"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                    }`}
                  >
                    <Sparkles
                      className={`w-3 h-3 ${msg.correction ? "text-amber-600" : "text-emerald-600"}`}
                    />
                    <span>{msg.praise}</span>
                  </div>
                )}

                {/* Message Text with Interactive Words */}
                <div className="text-xl sm:text-2xl font-bold tracking-tight">
                  {isTeacher ? (
                    <InteractiveText
                      text={msg.english}
                      onWordClick={(word) => {
                        setSelectedWord(word);
                        setSelectedSentence(msg.english);
                      }}
                    />
                  ) : (
                    <div>
                      <span>{msg.english}</span>
                      {msg.russian && (
                        <span className="block text-xs text-brand-100 font-normal mt-1 opacity-90">
                          {msg.russian}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Teacher controls: Audio play, slow, translation toggle */}
                {isTeacher && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => voiceSpeaker.speak(msg.english, { slow: false })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Повторить</span>
                      </button>
                      <button
                        onClick={() => voiceSpeaker.speak(msg.english, { slow: true })}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                        title="Медленная озвучка для лучшего понимания"
                      >
                        0.6x
                      </button>
                    </div>

                    <button
                      onClick={() => toggleTranslation(msg.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 font-medium px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <span>{isTranslationHidden ? "Перевод" : "Скрыть"}</span>
                      {isTranslationHidden ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                )}

                {/* Russian Translation */}
                {isTeacher && msg.russian && !isTranslationHidden && (
                  <div className="mt-2.5 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 text-sm text-slate-600">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                      Перевод:
                    </span>
                    {msg.russian}
                  </div>
                )}

                {/* Mistake Correction Card */}
                {isTeacher && msg.correction && (
                  <div className="mt-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-amber-900 mb-0.5">Подсказка:</span>
                      {msg.correction}
                    </div>
                  </div>
                )}

                {/* Prompt to repeat aloud */}
                {isTeacher && msg.repeatPrompt && (
                  <button
                    onClick={() =>
                      setShadowingPhrase({
                        phrase: msg.repeatPrompt!,
                        russian: "Повтори за учителем"
                      })
                    }
                    className="w-full mt-3 py-2.5 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 hover:border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                  >
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>Повтори вслух: «{msg.repeatPrompt}»</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Clear Typing Indicator ("Учитель печатает...") */}
        {isLoading && (
          <div className="flex flex-col items-start gap-1 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200/90 rounded-3xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-bounce" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-sm font-semibold text-slate-700 ml-1">
                Учитель печатает...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="mx-4 mb-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between">
          <span>{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold px-1.5 py-0.5 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Voice & Text Input */}
      <div className="p-3 bg-white border-t border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2 max-w-full">
          {/* Text Input */}
          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (isComposing || e.nativeEvent.isComposing || (e as any).keyCode === 229) {
                    return;
                  }
                  e.preventDefault();
                  if (inputText.trim()) {
                    handleSendMessage(inputText, false);
                  }
                }
              }}
              placeholder={isListening ? "Слушаю ваш голос..." : "Напишите или скажите..."}
              className="w-full min-w-0 py-3.5 pl-3 pr-10 bg-slate-100/90 border border-slate-200/70 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            {inputText.trim() && (
              <button
                onClick={() => handleSendMessage(inputText, false)}
                disabled={isLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Large Main Voice Microphone Button */}
          <button
            onClick={toggleListening}
            title={isListening ? "Остановить запись" : "Говорить в микрофон"}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-300 active:scale-95 shrink-0 ${
              isListening
                ? "bg-rose-500 ring-4 ring-rose-200 animate-pulse"
                : "bg-brand-600 hover:bg-brand-700 ring-4 ring-brand-100 shadow-brand-500/25"
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
          💡 Говорите по-английски или по-русски — учитель поймёт и подскажет!
        </p>
      </div>

      {/* Word Details Modal */}
      {selectedWord && (
        <WordModal
          word={selectedWord}
          sentenceContext={selectedSentence}
          onClose={() => {
            setSelectedWord(null);
            setSelectedSentence(undefined);
          }}
        />
      )}

      {/* Shadowing Modal */}
      {shadowingPhrase && (
        <ShadowingModal
          targetPhrase={shadowingPhrase.phrase}
          targetRussian={shadowingPhrase.russian}
          onClose={() => setShadowingPhrase(null)}
        />
      )}
    </div>
  );
}
