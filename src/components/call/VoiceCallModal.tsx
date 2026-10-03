"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  Languages,
  CheckCircle2
} from "lucide-react";
import { AlexAvatar, AvatarState } from "../character/AlexAvatar";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { VoiceRecognizer } from "@/lib/speech/speechRecognition";
import { getStorage } from "@/lib/storage/storageAdapter";
import { ChatMessageItem } from "@/lib/storage/types";
import { awardXP, unlockBadge } from "@/lib/gamification/xpSystem";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  onNewMessage?: (msg: ChatMessageItem) => void;
}

export function VoiceCallModal({
  isOpen,
  onClose,
  studentName = "Daud",
  onNewMessage
}: VoiceCallModalProps) {
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showHints, setShowHints] = useState(false);

  const [currentEnglish, setCurrentEnglish] = useState(`Hello, ${studentName}! How are you today?`);
  const [currentRussian, setCurrentRussian] = useState(`Привет, ${studentName}! Как твои дела сегодня?`);
  const [currentPraise, setCurrentPraise] = useState<string | null>("Рад тебя слышать! Давай попрактикуемся.");
  const [currentCorrection, setCurrentCorrection] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState("");

  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Suggested replies for "Подскажи, что ответить"
  const suggestedReplies = [
    { en: "I am fine, thank you!", ru: "У меня всё хорошо, спасибо!" },
    { en: "I am ready to practice.", ru: "Я готов практиковаться." },
    { en: "I live in Kyiv and work with meat.", ru: "Я живу в Киеве и работаю с мясом." }
  ];

  // Call timer
  useEffect(() => {
    if (!isOpen) {
      setCallDuration(0);
      return;
    }
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Initial greeting speech on call start
  useEffect(() => {
    if (!isOpen) {
      voiceSpeaker.stop();
      recognizerRef.current?.stop();
      return;
    }

    unlockBadge("b4"); // Телефонный мастер
    unlockBadge("b3"); // Голосовой герой

    setAvatarState("speaking");
    voiceSpeaker.speak(currentEnglish, {
      slow: false,
      onStart: () => setAvatarState("speaking"),
      onEnd: () => {
        setAvatarState("idle");
        // Automatically start listening after Alex finishes greeting
        startListeningAuto();
      }
    });

    // Record practice minutes periodically
    const practiceInterval = setInterval(() => {
      getStorage().recordPracticeTime(1).catch(console.warn);
    }, 60000);

    return () => clearInterval(practiceInterval);
  }, [isOpen]);

  // Initialize Speech Recognizer
  const getRecognizer = () => {
    if (!recognizerRef.current && typeof window !== "undefined") {
      recognizerRef.current = new VoiceRecognizer({
        onStart: () => {
          setIsListening(true);
          setAvatarState("listening");
        },
        onResult: (text, isFinal) => {
          setUserTranscript(text);
          if (isFinal && text.trim()) {
            handleUserSpoke(text.trim());
          }
        },
        onError: () => {
          setIsListening(false);
          setAvatarState("idle");
        },
        onEnd: () => {
          setIsListening(false);
          if (!isLoading) {
            setAvatarState("idle");
          }
        }
      });
    }
    return recognizerRef.current;
  };

  const startListeningAuto = () => {
    const rec = getRecognizer();
    if (!rec || !rec.isSupported()) return;
    try {
      setUserTranscript("");
      rec.start();
      setIsListening(true);
      setAvatarState("listening");
    } catch (e) {
      // Ignore start errors
    }
  };

  const toggleListening = () => {
    const rec = getRecognizer();
    if (!rec) return;

    if (isListening) {
      rec.stop();
      setIsListening(false);
      setAvatarState("idle");
    } else {
      voiceSpeaker.stop();
      setUserTranscript("");
      rec.start();
      setIsListening(true);
      setAvatarState("listening");
    }
  };

  const handleUserSpoke = async (spokenText: string) => {
    if (!spokenText.trim() || isLoading) return;

    setIsListening(false);
    recognizerRef.current?.stop();
    setIsLoading(true);
    setAvatarState("thinking");
    setShowHints(false);

    // Save user message to storage
    const userMsg: ChatMessageItem = {
      id: "call-user-" + Date.now(),
      sender: "user",
      english: spokenText,
      russian: /[а-яёіїє]/i.test(spokenText) ? "Ваш ответ" : "",
      timestamp: Date.now(),
      isAudio: true
    };
    getStorage().saveMessage(userMsg).catch(console.warn);
    onNewMessage?.(userMsg);

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: spokenText,
          chatHistory: [
            { sender: "teacher", english: currentEnglish, russian: currentRussian }
          ],
          context: {
            studentName: studentName,
            studentLevel: "A0–A1",
            studentFacts: {
              city: "Kyiv",
              occupation: "мясной бизнес / meat business",
              family: "двое детей (two children)"
            }
          }
        })
      });

      const data = await res.json();
      setCurrentEnglish(data.english || "I am glad to speak with you!");
      setCurrentRussian(data.russian || "Рад поговорить с тобой!");
      setCurrentPraise(data.praise || "Отлично сказано!");
      setCurrentCorrection(data.correction || null);

      const teacherMsg: ChatMessageItem = {
        id: "call-teacher-" + Date.now(),
        sender: "teacher",
        english: data.english,
        russian: data.russian,
        timestamp: Date.now(),
        correction: data.correction,
        repeatPrompt: data.repeatPrompt,
        praise: data.praise
      };
      awardXP(10);
      getStorage().saveMessage(teacherMsg).catch(console.warn);
      onNewMessage?.(teacherMsg);

      // Alex speaks reply
      setAvatarState(data.correction ? "encouraging" : "speaking");
      voiceSpeaker.speak(data.english, {
        slow: false,
        onStart: () => setAvatarState("speaking"),
        onEnd: () => {
          setAvatarState("idle");
          // Resume listening loop automatically
          setTimeout(() => {
            startListeningAuto();
          }, 600);
        }
      });
    } catch (e) {
      setAvatarState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between text-white p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Top Header: Caller Info & Status */}
      <div className="flex items-center justify-between pt-2 px-2">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Alex</span>
              <span className="text-xs font-normal text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                ИИ-Учитель
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">{formatTimer(callDuration)}</p>
          </div>
        </div>

        {/* Translation Toggle */}
        <button
          onClick={() => setShowTranslation((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700/60 transition-all active:scale-95"
        >
          {showTranslation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showTranslation ? "Скрыть перевод" : "Перевод"}</span>
        </button>
      </div>

      {/* Center: Large Interactive Avatar & Speech Waves */}
      <div className="flex-1 flex flex-col items-center justify-center my-4 min-h-0">
        <div className="relative mb-6">
          <AlexAvatar state={avatarState} size="xl" />

          {/* Avatar Status Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 border border-slate-700/70 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
            {avatarState === "speaking" && "🎙️ Алекс говорит..."}
            {avatarState === "listening" && "👂 Слушаю ваш голос..."}
            {avatarState === "thinking" && "💭 Алекс думает..."}
            {avatarState === "happy" && "⭐ Отлично!"}
            {avatarState === "encouraging" && "🤝 Хорошая попытка!"}
            {avatarState === "idle" && "Свободный разговор"}
          </div>
        </div>

        {/* Praise Badge if active */}
        {currentPraise && (
          <div className="inline-flex items-center gap-1.5 bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentPraise}</span>
          </div>
        )}

        {/* Subtitles: Large English & Clear Russian */}
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-sm text-center">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-snug">
            {currentEnglish}
          </p>

          {showTranslation && (
            <p className="text-sm sm:text-base font-medium text-slate-300 transition-all">
              {currentRussian}
            </p>
          )}

          {/* Realtime User Transcript when speaking */}
          {userTranscript && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-brand-300 italic">
              Вы сказали: «{userTranscript}»
            </div>
          )}

          {/* Mistake gentle tip */}
          {currentCorrection && (
            <div className="mt-3 bg-amber-950/60 border border-amber-800/60 rounded-xl p-2.5 text-xs text-amber-200 text-left">
              <span className="font-bold block text-amber-400">Подсказка:</span>
              {currentCorrection}
            </div>
          )}
        </div>

        {/* Quick Helper Tools */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            onClick={() => voiceSpeaker.speak(currentEnglish, { slow: false })}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700/60 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
            <span>Повтори</span>
          </button>

          <button
            onClick={() => voiceSpeaker.speak(currentEnglish, { slow: true })}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700/60 active:scale-95 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Медленнее (0.6x)</span>
          </button>

          <button
            onClick={() => voiceSpeaker.speak(currentRussian, { slow: false })}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700/60 active:scale-95 transition-all"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>По-русски</span>
          </button>

          <button
            onClick={() => setShowHints((prev) => !prev)}
            className="flex items-center gap-1 px-3 py-2 bg-brand-900/60 hover:bg-brand-900 text-xs font-semibold text-brand-200 rounded-xl border border-brand-700/60 active:scale-95 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
            <span>Подскажи ответ</span>
          </button>
        </div>

        {/* Suggested Answers Drawer */}
        {showHints && (
          <div className="w-full max-w-md mt-3 bg-slate-900/90 border border-brand-800/60 rounded-2xl p-3 animate-in slide-in-from-bottom duration-200">
            <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider block mb-2">
              Прочитайте один из вариантов вслух:
            </span>
            <div className="space-y-1.5">
              {suggestedReplies.map((reply, idx) => (
                <button
                  key={idx}
                  onClick={() => handleUserSpoke(reply.en)}
                  className="w-full text-left p-2.5 bg-slate-800/90 hover:bg-brand-950 border border-slate-700/60 hover:border-brand-600 rounded-xl transition-all"
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-brand-400" />
                    <span>{reply.en}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 ml-4.5">{reply.ru}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls: Big Mic & End Call Button */}
      <div className="flex items-center justify-center gap-8 pb-4">
        {/* Main Microphone Button */}
        <button
          onClick={toggleListening}
          disabled={isLoading}
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-90 ${
            isListening
              ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/40"
              : "bg-brand-600 hover:bg-brand-500 text-white ring-4 ring-brand-500/30"
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Говорите</span>
            </>
          ) : (
            <>
              <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Микрофон</span>
            </>
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          title="Завершить звонок"
          className="w-14 h-14 rounded-full bg-slate-800 hover:bg-rose-900/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 shadow-lg"
        >
          <PhoneOff className="w-6 h-6 text-rose-400" />
        </button>
      </div>
    </div>
  );
}
