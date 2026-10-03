"use client";

import React, { useState } from "react";
import {
  ROLEPLAY_SCENARIOS,
  RoleplayScenario,
  RoleplayMissionStep
} from "@/lib/scenarios/roleplayData";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Volume2,
  Mic,
  MicOff,
  ArrowLeft,
  Star,
  Award,
  Send,
  HelpCircle,
  RotateCcw
} from "lucide-react";
import { AlexAvatar, AvatarState } from "../character/AlexAvatar";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { VoiceRecognizer } from "@/lib/speech/speechRecognition";
import { getStorage } from "@/lib/storage/storageAdapter";
import confetti from "canvas-confetti";
import { awardXP, unlockBadge } from "@/lib/gamification/xpSystem";

interface RoleplayScreenProps {
  studentName?: string;
  onAddXP?: (amount: number) => void;
}

export function RoleplayScreen({ studentName = "Daud", onAddXP }: RoleplayScreenProps) {
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);
  const [messages, setMessages] = useState<Array<{ sender: "teacher" | "user"; text: string; ru?: string }>>([]);
  const [steps, setSteps] = useState<RoleplayMissionStep[]>([]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [isCompleted, setIsCompleted] = useState(false);

  const startScenario = (scenario: RoleplayScenario) => {
    setSelectedScenario(scenario);
    setSteps(scenario.steps.map((s) => ({ ...s, completed: false })));
    setMessages([
      {
        sender: "teacher",
        text: scenario.initialTeacherMessage.en,
        ru: scenario.initialTeacherMessage.ru
      }
    ]);
    setIsCompleted(false);

    // Speak initial line
    setAvatarState("speaking");
    voiceSpeaker.speak(scenario.initialTeacherMessage.en, {
      slow: false,
      onStart: () => setAvatarState("speaking"),
      onEnd: () => setAvatarState("idle")
    });
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading || !selectedScenario) return;

    const trimmed = userText.trim();
    setInputText("");
    const newHistory = [...messages, { sender: "user" as const, text: trimmed }];
    setMessages(newHistory);
    setIsLoading(true);
    setAvatarState("thinking");

    // Check if user completed next mission step
    setSteps((prev) => {
      const nextIncompleteIdx = prev.findIndex((s) => !s.completed);
      if (nextIncompleteIdx !== -1) {
        const updated = [...prev];
        updated[nextIncompleteIdx] = { ...updated[nextIncompleteIdx], completed: true };
        return updated;
      }
      return prev;
    });

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: trimmed,
          chatHistory: newHistory.slice(-6).map((m) => ({
            sender: m.sender,
            english: m.text,
            russian: m.ru
          })),
          context: {
            studentName: studentName,
            studentLevel: "A0–A1",
            currentTopic: selectedScenario.titleRu,
            frequentMistakes: [selectedScenario.promptRoleInstruction]
          }
        })
      });

      const data = await res.json();
      const teacherReply = {
        sender: "teacher" as const,
        text: data.english || "Thank you! Have a great day.",
        ru: data.russian || "Спасибо! Отличного дня."
      };

      setMessages((prev) => [...prev, teacherReply]);
      setAvatarState("speaking");
      voiceSpeaker.speak(teacherReply.text, {
        slow: false,
        onStart: () => setAvatarState("speaking"),
        onEnd: () => setAvatarState("idle")
      });

      // Check if mission is complete
      const completedCount = steps.filter((s) => s.completed).length + 1;
      if (completedCount >= selectedScenario.steps.length) {
        setTimeout(() => {
          setIsCompleted(true);
          setAvatarState("happy");
          awardXP(100);
          onAddXP?.(100);
          if (selectedScenario.id === "meat-market") {
            unlockBadge("b2"); // Мясной эксперт
          }
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }, 1200);
      }
    } catch (e) {
      setAvatarState("idle");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const Recognizer = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognizer) {
      alert("Распознавание речи поддерживается в Google Chrome или Safari.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const rec = new Recognizer();
      rec.lang = "en-US";
      rec.onstart = () => {
        setIsListening(true);
        setAvatarState("listening");
      };
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };
      rec.onerror = () => {
        setIsListening(false);
        setAvatarState("idle");
      };
      rec.onend = () => {
        setIsListening(false);
      };
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // If a scenario is active, show the roleplay simulation room
  if (selectedScenario) {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-2xl w-full mx-auto">
        {/* Scenario Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm">
          <button
            onClick={() => setSelectedScenario(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Назад</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedScenario.icon}</span>
            <div className="text-left">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {selectedScenario.titleRu}
              </h3>
              <p className="text-[10px] text-slate-400">Роль Алекса: {selectedScenario.roleTeacher}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-xl text-xs font-bold text-amber-800">
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>+100 XP</span>
          </div>
        </div>

        {/* Mission Checklist bar */}
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border-b border-brand-100/60 px-4 py-2.5 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800 flex items-center gap-1">
              <span>Цели диалога</span>
              <span className="text-[10px] font-semibold text-brand-600">
                ({steps.filter((s) => s.completed).length} из {steps.length})
              </span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={`flex items-start gap-1.5 p-1.5 rounded-lg text-[11px] transition-all ${
                  step.completed
                    ? "bg-emerald-100/80 text-emerald-900 font-semibold"
                    : "bg-white/80 text-slate-600"
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                )}
                <span className="line-clamp-2 leading-snug">{step.taskRu}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dialogue Scroll View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === "teacher" ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 shadow-sm border ${
                  m.sender === "teacher"
                    ? "bg-white border-slate-200 text-slate-900 rounded-tl-sm"
                    : "bg-brand-600 border-brand-700 text-white rounded-tr-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    {m.sender === "teacher" ? selectedScenario.roleTeacher : studentName}
                  </span>
                  {m.sender === "teacher" && (
                    <button
                      onClick={() => voiceSpeaker.speak(m.text)}
                      className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-base sm:text-lg font-bold leading-snug">{m.text}</p>
                {m.ru && (
                  <p className="text-xs text-slate-500 mt-1 pt-1 border-t border-slate-100">
                    {m.ru}
                  </p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-3 w-fit">
              <AlexAvatar state="thinking" size="sm" />
              <span className="text-xs font-semibold text-slate-600">Алекс отвечает в роли...</span>
            </div>
          )}
        </div>

        {/* Quick Helper Phrase Chips */}
        <div className="px-3 py-2 bg-slate-100/90 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Подсказки:</span>
          {selectedScenario.usefulPhrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(phrase.en)}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-brand-700 transition-all shadow-xs"
            >
              💬 {phrase.en}
            </button>
          ))}
        </div>

        {/* Bottom Input Controls */}
        <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(inputText);
              }
            }}
            placeholder="Ответьте по-английски..."
            className="flex-1 py-3 px-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />

          {inputText.trim() && (
            <button
              onClick={() => handleSendMessage(inputText)}
              className="p-3 bg-brand-600 text-white rounded-2xl active:scale-95 transition-all shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleVoiceInput}
            className={`p-3 rounded-2xl text-white transition-all active:scale-95 shadow-md ${
              isListening ? "bg-rose-500 animate-pulse" : "bg-brand-600 hover:bg-brand-700"
            }`}
            title="Говорить голосом"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Mission Completed Summary Modal */}
        {isCompleted && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Award className="w-8 h-8" />
              </div>

              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3].map((s) => (
                  <Star key={s} className="w-6 h-6 text-amber-400 fill-amber-400 animate-bounce" />
                ))}
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1">Сценка пройдена!</h3>
              <p className="text-xs text-slate-500 mb-4">
                Отличная работа, {studentName}! Ты справился с ролью в жизненной ситуации.
              </p>

              {/* Useful phrases learned */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 text-left mb-5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                  Фразы для запоминания:
                </span>
                <div className="space-y-1.5">
                  {selectedScenario.usefulPhrases.map((p, i) => (
                    <div key={i} className="text-xs font-semibold text-slate-800">
                      • {p.en} <span className="font-normal text-slate-400">({p.ru})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 bg-emerald-50 text-emerald-800 py-2 rounded-xl text-xs font-bold border border-emerald-200">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>+100 XP начислено!</span>
              </div>

              <button
                onClick={() => setSelectedScenario(null)}
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
              >
                Отлично, продолжить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Catalogue of scenarios list view
  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-2xl w-full mx-auto overflow-y-auto p-4 pb-20">
      {/* Catalogue Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Ролевые сценки</h2>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-full">
            {ROLEPLAY_SCENARIOS.length} сценариев
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Тренируйте английский в реальных ситуациях: кафе, аэропорт, мясной рынок и отель!
        </p>
      </div>

      {/* Scenarios Grid */}
      <div className="space-y-3">
        {ROLEPLAY_SCENARIOS.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => startScenario(scenario)}
            className="p-4 bg-white rounded-3xl border border-slate-200/90 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer active:scale-98 group"
          >
            <div className="flex items-start gap-3.5">
              <span className="text-3xl sm:text-4xl p-2.5 bg-slate-100 rounded-2xl group-hover:scale-110 transition-transform shrink-0">
                {scenario.icon}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                    {scenario.titleRu}
                  </h3>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                    Уровень {scenario.level}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                  {scenario.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 border-t border-slate-100">
                  <span>Роль: {scenario.roleTeacher}</span>
                  <span className="text-brand-600 font-bold flex items-center gap-1">
                    Начать <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
