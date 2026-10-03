"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Volume2,
  Mic,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  BookOpen,
  MessageSquare,
  RotateCcw,
  Check,
  ChevronRight
} from "lucide-react";
import { CURRICULUM, CurriculumTopic, LessonPhrase } from "@/lib/topics/curriculum";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { ShadowingModal } from "../teacher/ShadowingModal";
import { getStorage, LessonProgress } from "@/lib/storage/storageAdapter";

export function TodayLesson() {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Phrases, 2: Shadowing, 3: Dialogue, 4: Summary
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [shadowPhraseIndex, setShadowPhraseIndex] = useState(0);
  const [showShadowModal, setShowShadowModal] = useState(false);
  const [shadowScores, setShadowScores] = useState<Record<number, number>>({});
  
  // Step 3 Mini Dialogue state
  const [dialogueExchanges, setDialogueExchanges] = useState<Array<{ sender: "teacher" | "user"; text: string; russian?: string }>>([]);
  const [dialogueTurnCount, setDialogueTurnCount] = useState(0);
  const [dialogueInput, setDialogueInput] = useState("");
  const [dialogueLoading, setDialogueLoading] = useState(false);

  const topic: CurriculumTopic = CURRICULUM[currentTopicIndex] || CURRICULUM[0];

  useEffect(() => {
    getStorage().getAllCompletedLessons().then((completed) => {
      setCompletedLessons(completed);
      // Auto-select first uncompleted topic
      const firstUncompleted = CURRICULUM.findIndex((t) => !completed.includes(t.id));
      if (firstUncompleted !== -1) {
        setCurrentTopicIndex(firstUncompleted);
      }
    });
  }, []);

  const handleStartStep2 = () => {
    setStep(2);
    setShadowPhraseIndex(0);
  };

  const handleStartStep3 = () => {
    setStep(3);
    const starter = {
      sender: "teacher" as const,
      text: topic.starterDialogue.teacherEnglish,
      russian: topic.starterDialogue.teacherRussian
    };
    setDialogueExchanges([starter]);
    setDialogueTurnCount(1);
    voiceSpeaker.speak(starter.text);
  };

  const handleCompleteLesson = async () => {
    setStep(4);
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    const progress: LessonProgress = {
      topicId: topic.id,
      completedStep1: true,
      completedStep2: true,
      completedStep3: true,
      completedAt: new Date().toISOString()
    };

    await getStorage().saveLessonProgress(progress);
    await getStorage().recordPracticeTime(10);
    await getStorage().updateProgress({
      completedTopicsCount: completedLessons.length + 1
    });

    setCompletedLessons((prev) => Array.from(new Set([...prev, topic.id])));
  };

  const handleSendDialogueReply = async (userText: string) => {
    if (!userText.trim() || dialogueLoading) return;

    const userEntry = {
      sender: "user" as const,
      text: userText.trim(),
      russian: /[а-яёіїє]/i.test(userText) ? "Ваш ответ" : ""
    };

    const updated = [...dialogueExchanges, userEntry];
    setDialogueExchanges(updated);
    setDialogueInput("");

    if (dialogueTurnCount >= 3) {
      // Finish lesson after 3 exchanges
      handleCompleteLesson();
      return;
    }

    setDialogueLoading(true);

    try {
      const res = await fetch("/api/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          chatHistory: updated.map((d) => ({
            sender: d.sender,
            english: d.text,
            russian: d.russian
          })),
          context: {
            currentTopic: topic.title,
            studentLevel: "A0–A1"
          }
        })
      });
      const data = await res.json();
      const teacherEntry = {
        sender: "teacher" as const,
        text: data.english,
        russian: data.russian
      };
      setDialogueExchanges((prev) => [...prev, teacherEntry]);
      setDialogueTurnCount((prev) => prev + 1);
      voiceSpeaker.speak(data.english);
    } catch (err) {
      const fallback = {
        sender: "teacher" as const,
        text: "Well done! Thank you for practice.",
        russian: "Отлично! Спасибо за практику."
      };
      setDialogueExchanges((prev) => [...prev, fallback]);
      setDialogueTurnCount((prev) => prev + 1);
      voiceSpeaker.speak(fallback.text);
    } finally {
      setDialogueLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
      {/* Topic Switcher Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl p-2 bg-brand-50 rounded-2xl">{topic.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                Тема {topic.order} из {CURRICULUM.length}
              </span>
              {completedLessons.includes(topic.id) && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                  <Check className="w-3 h-3" /> Пройдено
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{topic.title}</h2>
          </div>
        </div>

        {/* Topic dropdown / selector */}
        <select
          value={currentTopicIndex}
          onChange={(e) => {
            setCurrentTopicIndex(Number(e.target.value));
            setStep(1);
            setShadowScores({});
            setDialogueExchanges([]);
          }}
          className="text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
        >
          {CURRICULUM.map((t, idx) => (
            <option key={t.id} value={idx}>
              #{t.order} {t.title} {completedLessons.includes(t.id) ? "✓" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 3 Steps Progress Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setStep(1)}
          className={`p-3 rounded-2xl border text-center transition-all ${
            step === 1
              ? "bg-brand-600 text-white border-brand-700 shadow-sm"
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-bold uppercase mb-0.5">Шаг 1</div>
          <div className="text-xs font-medium truncate">5 полезных фраз</div>
        </button>

        <button
          onClick={handleStartStep2}
          className={`p-3 rounded-2xl border text-center transition-all ${
            step === 2
              ? "bg-brand-600 text-white border-brand-700 shadow-sm"
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-bold uppercase mb-0.5">Шаг 2</div>
          <div className="text-xs font-medium truncate">Повтори за мной</div>
        </button>

        <button
          onClick={handleStartStep3}
          className={`p-3 rounded-2xl border text-center transition-all ${
            step === 3
              ? "bg-brand-600 text-white border-brand-700 shadow-sm"
              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="text-xs font-bold uppercase mb-0.5">Шаг 3</div>
          <div className="text-xs font-medium truncate">Мини-диалог</div>
        </button>
      </div>

      {/* --- STEP 1: 5 USEFUL PHRASES --- */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="bg-brand-50/60 border border-brand-100 rounded-2xl p-3 text-xs text-brand-900 font-medium">
            💡 Послушайте каждую фразу, обратите внимание на русскую подсказку и произношение:
          </div>

          {topic.phrases.map((phrase, idx) => (
            <div
              key={phrase.id}
              className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex items-start justify-between gap-3 hover:border-brand-200 transition-all"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{phrase.english}</h3>
                </div>

                <p className="text-xs font-medium text-slate-500">{phrase.transcription}</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">{phrase.russian}</p>
                {phrase.tip && (
                  <p className="text-[11px] text-brand-700 bg-brand-50/70 inline-block px-2.5 py-0.5 rounded-lg mt-1 font-medium">
                    {phrase.tip}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => voiceSpeaker.speak(phrase.english, { slow: false })}
                  className="p-3 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-2xl transition-all active:scale-95 flex items-center justify-center"
                  title="Озвучить"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => voiceSpeaker.speak(phrase.english, { slow: true })}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all text-center"
                  title="Медленнее"
                >
                  0.6x
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleStartStep2}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span>Перейти к тренировке произношения</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* --- STEP 2: REPEAT AFTER ME (SHADOWING) --- */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 text-xs text-emerald-900 font-medium">
            🎤 Отработайте каждую из 5 фраз. Нажмите на микрофон и повторите вслух!
          </div>

          {topic.phrases.map((phrase, idx) => {
            const score = shadowScores[idx];
            const isDone = typeof score === "number";

            return (
              <div
                key={phrase.id}
                className={`bg-white rounded-3xl p-4 shadow-sm border transition-all ${
                  isDone ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{phrase.english}</h4>
                    </div>
                    <p className="text-xs text-slate-500">{phrase.russian}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isDone && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          score >= 70
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {score}%
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setShadowPhraseIndex(idx);
                        setShowShadowModal(true);
                      }}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                        isDone
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                          : "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                      <span>{isDone ? "Повторить" : "Сказать"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleStartStep3}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <span>Перейти к диалогу с учителем</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* --- STEP 3: MINI DIALOGUE --- */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-xs text-indigo-900 font-medium flex items-center justify-between">
            <span>💬 Короткий диалог: 3 вопроса учителя по теме</span>
            <span className="font-bold text-indigo-700">Обмен: {dialogueTurnCount}/3</span>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 space-y-3 min-h-[220px]">
            {dialogueExchanges.map((item, idx) => {
              const isTeacher = item.sender === "teacher";
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isTeacher ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                      isTeacher
                        ? "bg-slate-100 text-slate-900 rounded-tl-sm"
                        : "bg-brand-600 text-white rounded-tr-sm"
                    }`}
                  >
                    <div className="font-bold text-base">{item.text}</div>
                    {item.russian && (
                      <div className="text-xs text-slate-500 mt-1">{item.russian}</div>
                    )}
                  </div>
                  {isTeacher && (
                    <button
                      onClick={() => voiceSpeaker.speak(item.text)}
                      className="mt-1 ml-1 text-slate-400 hover:text-brand-600 p-1"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {dialogueLoading && (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 p-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                <span>Учитель отвечает...</span>
              </div>
            )}
          </div>

          {/* Quick dialogue input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dialogueInput}
              onChange={(e) => setDialogueInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (e.nativeEvent.isComposing || (e as any).keyCode === 229) return;
                  e.preventDefault();
                  if (dialogueInput.trim()) {
                    handleSendDialogueReply(dialogueInput);
                  }
                }
              }}
              placeholder="Ответьте по-английски или по-русски..."
              className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={() => handleSendDialogueReply(dialogueInput)}
              disabled={dialogueLoading || !dialogueInput.trim()}
              className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold disabled:opacity-50 transition-all active:scale-95"
            >
              Ответить
            </button>
          </div>

          <button
            onClick={handleCompleteLesson}
            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <span>Завершить урок и подвести итоги</span>
          </button>
        </div>
      )}

      {/* --- STEP 4: LESSON COMPLETED SUMMARY --- */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Урок успешно пройден!
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Отличная работа сегодня!
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Ты освоил тему «{topic.title}», потренировал произношение и провёл диалог.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <div>
              <div className="text-2xl font-extrabold text-brand-600">5</div>
              <div className="text-[11px] font-medium text-slate-500">Новых фраз</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-600">+10</div>
              <div className="text-[11px] font-medium text-slate-500">Минут практики</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-500">🔥 +1</div>
              <div className="text-[11px] font-medium text-slate-500">К серии дней</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (currentTopicIndex < CURRICULUM.length - 1) {
                  setCurrentTopicIndex((prev) => prev + 1);
                }
                setStep(1);
                setShadowScores({});
              }}
              className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-500/25 transition-all active:scale-98"
            >
              Следующая тема
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-semibold transition-all"
            >
              Повторить этот урок
            </button>
          </div>
        </div>
      )}

      {/* Shadowing Modal for Step 2 */}
      {showShadowModal && (
        <ShadowingModal
          targetPhrase={topic.phrases[shadowPhraseIndex].english}
          targetRussian={topic.phrases[shadowPhraseIndex].russian}
          transcription={topic.phrases[shadowPhraseIndex].transcription}
          onClose={() => setShowShadowModal(false)}
          onSuccess={(score) => {
            setShadowScores((prev) => ({
              ...prev,
              [shadowPhraseIndex]: score
            }));
          }}
        />
      )}
    </div>
  );
}
