"use client";

import React, { useState, useEffect } from "react";
import {
  Headphones,
  Puzzle,
  Mic,
  Zap,
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Trophy,
  Timer
} from "lucide-react";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import confetti from "canvas-confetti";
import { awardXP, unlockBadge } from "@/lib/gamification/xpSystem";

interface MinigamesScreenProps {
  onAddXP?: (amount: number) => void;
  studentName?: string;
}

type ActiveGame = "menu" | "listening" | "scramble" | "pronunciation" | "blitz";

export function MinigamesScreen({ onAddXP, studentName = "Daud" }: MinigamesScreenProps) {
  const [activeGame, setActiveGame] = useState<ActiveGame>("menu");
  const [score, setScore] = useState(0);

  // 1. "Угадай на слух" questions
  const listeningCards = [
    { en: "Fresh beef", ru: "Свежая говядина", options: ["Свежая говядина", "Горячий чай", "Два билета", "Вкусная рыба"], correct: 0 },
    { en: "How much is one kilo?", ru: "Сколько стоит килограмм?", options: ["Где здесь выход?", "Сколько стоит килограмм?", "Как вас зовут?", "Который час?"], correct: 1 },
    { en: "Coffee with milk", ru: "Кофе с молоком", options: ["Стакан воды", "Кофе с молоком", "Яблочный сок", "Черный хлеб"], correct: 1 },
    { en: "Where do you live?", ru: "Где ты живёшь?", options: ["Что ты делаешь?", "Куда мы едем?", "Где ты живёшь?", "Как дела?"], correct: 2 },
    { en: "Nice to meet you", ru: "Приятно познакомиться", options: ["Приятного аппетита", "До свидания", "Доброе утро", "Приятно познакомиться"], correct: 3 }
  ];
  const [listenIdx, setListenIdx] = useState(0);
  const [listenSelected, setListenSelected] = useState<number | null>(null);

  // 2. "Собери фразу" questions
  const scrambleCards = [
    { enWords: ["I", "live", "in", "Kyiv"], target: "I live in Kyiv", ru: "Я живу в Киеве" },
    { enWords: ["I", "work", "with", "meat"], target: "I work with meat", ru: "Я работаю с мясом" },
    { enWords: ["One", "coffee", "please"], target: "One coffee please", ru: "Один кофе, пожалуйста" },
    { enWords: ["How", "are", "you", "today"], target: "How are you today", ru: "Как твои дела сегодня" }
  ];
  const [scrambleIdx, setScrambleIdx] = useState(0);
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);

  // 3. "Скажи правильно" (Pronunciation check)
  const pronunciationCards = [
    { phrase: "I live in Kyiv", ru: "Я живу в Киеве" },
    { phrase: "I work with meat", ru: "Я работаю с мясом" },
    { phrase: "Nice to meet you", ru: "Приятно познакомиться" },
    { phrase: "Fresh beef please", ru: "Свежую говядину, пожалуйста" }
  ];
  const [pronounceIdx, setPronounceIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [pronounceResult, setPronounceResult] = useState<{
    words: Array<{ word: string; status: "good" | "close" | "miss" }>;
    score: number;
  } | null>(null);

  // 4. "Быстрые ответы" (10s blitz)
  const blitzQuestions = [
    { qEn: "What is your name?", qRu: "Как тебя зовут?", options: ["My name is Daud", "I am fine", "In Kyiv"], correct: 0 },
    { qEn: "Where do you live?", qRu: "Где ты живёшь?", options: ["With meat", "I live in Kyiv", "Yes, please"], correct: 1 },
    { qEn: "Do you like coffee?", qRu: "Ты любишь кофе?", options: ["Yes, I do!", "No, I am Daud", "Two kilos"], correct: 0 },
    { qEn: "How are you today?", qRu: "Как ты сегодня?", options: ["In Kyiv", "I am very good!", "Three children"], correct: 1 },
    { qEn: "What do you work with?", qRu: "С чем ты работаешь?", options: ["I work with meat", "At ten o'clock", "Tomorrow"], correct: 0 }
  ];
  const [blitzIdx, setBlitzIdx] = useState(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(10);
  const [blitzActive, setBlitzActive] = useState(false);

  // Blitz countdown
  useEffect(() => {
    if (activeGame !== "blitz" || !blitzActive) return;
    if (blitzTimeLeft <= 0) {
      handleBlitzAnswer(-1); // timeout
      return;
    }
    const timer = setInterval(() => setBlitzTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [activeGame, blitzActive, blitzTimeLeft]);

  // Start Scramble Game
  const initScramble = (idx: number) => {
    setScrambleIdx(idx);
    setAssembledWords([]);
    const shuffled = [...scrambleCards[idx].enWords].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
  };

  const handleScrambleWordClick = (word: string, index: number) => {
    setAvailableWords((prev) => prev.filter((_, i) => i !== index));
    setAssembledWords((prev) => [...prev, word]);
  };

  const handleScrambleReset = () => {
    initScramble(scrambleIdx);
  };

  const checkScrambleSuccess = () => {
    const assembledStr = assembledWords.join(" ");
    const isCorrect = assembledStr.toLowerCase() === scrambleCards[scrambleIdx].target.toLowerCase();
    if (isCorrect) {
      awardXP(20);
      unlockBadge("b8"); // Мастер фразы
      onAddXP?.(30);
      confetti({ particleCount: 40, spread: 50 });
      voiceSpeaker.speak(assembledStr);
      if (scrambleIdx < scrambleCards.length - 1) {
        setTimeout(() => initScramble(scrambleIdx + 1), 1200);
      } else {
        setTimeout(() => setActiveGame("menu"), 1600);
      }
    }
  };

  useEffect(() => {
    if (availableWords.length === 0 && assembledWords.length > 0) {
      checkScrambleSuccess();
    }
  }, [assembledWords, availableWords]);

  // Handle Blitz Answer
  const handleBlitzAnswer = (chosenIdx: number) => {
    const q = blitzQuestions[blitzIdx];
    if (chosenIdx === q.correct) {
      setScore((s) => s + 20);
      awardXP(20);
      unlockBadge("b9"); // Быстрый ответ
      onAddXP?.(20);
    }
    if (blitzIdx < blitzQuestions.length - 1) {
      setBlitzIdx((i) => i + 1);
      setBlitzTimeLeft(10);
    } else {
      setBlitzActive(false);
      confetti({ particleCount: 60, spread: 60 });
      setTimeout(() => setActiveGame("menu"), 2000);
    }
  };

  // Handle Speech Recognition for "Скажи правильно"
  const startPronounceRecording = () => {
    if (typeof window === "undefined") return;
    const Recognizer = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognizer) {
      alert("Распознавание речи поддерживается в Chrome или Safari.");
      return;
    }
    setIsRecording(true);
    setPronounceResult(null);

    const rec = new Recognizer();
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      setIsRecording(false);
      evaluatePronunciation(transcript);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    rec.start();
  };

  const evaluatePronunciation = (transcript: string) => {
    const target = pronunciationCards[pronounceIdx].phrase.toLowerCase().split(" ");
    const heard = transcript.split(" ");

    let matchCount = 0;
    const evaluatedWords = target.map((word) => {
      if (heard.includes(word)) {
        matchCount++;
        return { word, status: "good" as const };
      }
      return { word, status: "miss" as const };
    });

    const percent = Math.round((matchCount / target.length) * 100);
    setPronounceResult({ words: evaluatedWords, score: percent });
    awardXP(percent >= 70 ? 25 : 10);
    onAddXP?.(percent >= 70 ? 40 : 15);
    if (percent >= 70) {
      unlockBadge("b3"); // Голосовой герой
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  // ---------------- Render Games ----------------

  // 1. Game Menu
  if (activeGame === "menu") {
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-2xl w-full mx-auto overflow-y-auto p-4 pb-20">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Мини-игры</h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
              4 режима
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Тренируйте слух, произношение и быструю реакцию за 5 минут в день!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Game 1 */}
          <div
            onClick={() => {
              setActiveGame("listening");
              setListenIdx(0);
              setListenSelected(null);
              voiceSpeaker.speak(listeningCards[0].en);
            }}
            className="p-4 bg-white rounded-3xl border border-slate-200/90 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
              🎧
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-brand-600">
              Угадай на слух
            </h3>
            <p className="text-xs text-slate-500">
              Слушайте фразу Алекса и выбирайте верный перевод из 4 вариантов.
            </p>
          </div>

          {/* Game 2 */}
          <div
            onClick={() => {
              setActiveGame("scramble");
              initScramble(0);
            }}
            className="p-4 bg-white rounded-3xl border border-slate-200/90 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
              🧩
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-amber-600">
              Собери фразу
            </h3>
            <p className="text-xs text-slate-500">
              Перетаскивайте и тапайте слова в правильном порядке английского предложения.
            </p>
          </div>

          {/* Game 3 */}
          <div
            onClick={() => {
              setActiveGame("pronunciation");
              setPronounceIdx(0);
              setPronounceResult(null);
            }}
            className="p-4 bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
              🎯
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-emerald-600">
              Скажи правильно
            </h3>
            <p className="text-xs text-slate-500">
              Произносите фразу в микрофон, получайте подсветку слов и оценку в процентах.
            </p>
          </div>

          {/* Game 4 */}
          <div
            onClick={() => {
              setActiveGame("blitz");
              setBlitzIdx(0);
              setScore(0);
              setBlitzTimeLeft(10);
              setBlitzActive(true);
            }}
            className="p-4 bg-white rounded-3xl border border-slate-200/90 hover:border-rose-500 hover:shadow-md cursor-pointer transition-all active:scale-98 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 group-hover:text-rose-600">
              Быстрые ответы (10 сек)
            </h3>
            <p className="text-xs text-slate-500">
              Блиц-раунд с таймером: успейте ответить на 5 простых вопросов Алекса!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. "Угадай на слух" View
  if (activeGame === "listening") {
    const card = listeningCards[listenIdx];
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-lg w-full mx-auto p-4 justify-between">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame("menu")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Меню</span>
          </button>
          <span className="text-xs font-bold text-brand-600">
            Вопрос {listenIdx + 1} из {listeningCards.length}
          </span>
        </div>

        <div className="my-auto text-center py-6">
          <button
            onClick={() => voiceSpeaker.speak(card.en)}
            className="w-24 h-24 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-brand-500/30 active:scale-90 transition-all mb-4"
          >
            <Volume2 className="w-10 h-10 animate-pulse" />
          </button>
          <p className="text-xs font-semibold text-slate-400">Нажмите, чтобы прослушать фразу</p>
        </div>

        <div className="space-y-2 mb-6">
          {card.options.map((opt, i) => {
            const isCorrect = i === card.correct;
            const isSelected = listenSelected === i;
            let btnStyle = "bg-white border-slate-200 text-slate-800";
            if (listenSelected !== null) {
              if (isCorrect) btnStyle = "bg-emerald-500 border-emerald-600 text-white font-bold";
              else if (isSelected) btnStyle = "bg-rose-500 border-rose-600 text-white";
            }

            return (
              <button
                key={i}
                disabled={listenSelected !== null}
                onClick={() => {
                  setListenSelected(i);
                  if (isCorrect) {
                    awardXP(20);
                    unlockBadge("b7"); // Суперслух
                    onAddXP?.(20);
                    confetti({ particleCount: 30, spread: 50 });
                  }
                  setTimeout(() => {
                    if (listenIdx < listeningCards.length - 1) {
                      setListenIdx((idx) => idx + 1);
                      setListenSelected(null);
                      voiceSpeaker.speak(listeningCards[listenIdx + 1].en);
                    } else {
                      setActiveGame("menu");
                    }
                  }, 1200);
                }}
                className={`w-full p-4 rounded-2xl border text-sm sm:text-base font-semibold text-left transition-all active:scale-98 shadow-sm flex items-center justify-between ${btnStyle}`}
              >
                <span>{opt}</span>
                {listenSelected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                {listenSelected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. "Собери фразу" View
  if (activeGame === "scramble") {
    const card = scrambleCards[scrambleIdx];
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-lg w-full mx-auto p-4 justify-between">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame("menu")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Меню</span>
          </button>
          <span className="text-xs font-bold text-amber-600">
            Фраза {scrambleIdx + 1} из {scrambleCards.length}
          </span>
        </div>

        <div className="my-auto text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Переведите на английский:
          </span>
          <h3 className="text-2xl font-black text-slate-900 mb-6">{card.ru}</h3>

          {/* Assembled sentence area */}
          <div className="min-h-16 p-3 bg-white border-2 border-dashed border-amber-300 rounded-3xl flex flex-wrap items-center justify-center gap-2 mb-6">
            {assembledWords.length === 0 ? (
              <span className="text-xs text-slate-400">Нажимайте на слова внизу по порядку</span>
            ) : (
              assembledWords.map((word, i) => (
                <span
                  key={i}
                  className="px-3.5 py-2 bg-amber-500 text-white font-bold rounded-2xl text-base shadow-sm animate-in zoom-in-95"
                >
                  {word}
                </span>
              ))
            )}
          </div>

          {/* Available Words */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {availableWords.map((word, i) => (
              <button
                key={i}
                onClick={() => handleScrambleWordClick(word, i)}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-2xl text-base font-bold text-slate-800 shadow-sm active:scale-95 transition-all"
              >
                {word}
              </button>
            ))}
          </div>

          {assembledWords.length > 0 && (
            <button
              onClick={handleScrambleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          )}
        </div>

        <div className="text-center text-xs text-slate-400 pb-2">
          Соберите всю цепочку слов, чтобы завершить фразу
        </div>
      </div>
    );
  }

  // 4. "Скажи правильно" (Pronunciation) View
  if (activeGame === "pronunciation") {
    const card = pronunciationCards[pronounceIdx];
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-lg w-full mx-auto p-4 justify-between">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame("menu")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Меню</span>
          </button>
          <span className="text-xs font-bold text-emerald-600">
            Тренировка {pronounceIdx + 1} из {pronunciationCards.length}
          </span>
        </div>

        <div className="my-auto text-center py-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {card.ru}
          </span>
          <h3 className="text-3xl font-black text-slate-900 mb-2">{card.phrase}</h3>

          <button
            onClick={() => voiceSpeaker.speak(card.phrase)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold mb-6"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Послушать образец</span>
          </button>

          {/* Pronunciation Results with Colorized Words */}
          {pronounceResult && (
            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-3xl shadow-sm text-center">
              <div className="text-3xl font-black text-emerald-600 mb-2">
                {pronounceResult.score}%
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                {pronounceResult.words.map((w, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-xl text-sm font-bold ${
                      w.status === "good"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {pronounceResult.score >= 70
                  ? "Отличное произношение! Так держать."
                  : "Попробуй ещё раз медленнее и четче."}
              </p>
            </div>
          )}

          {/* Record Button */}
          <button
            onClick={startPronounceRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-xl active:scale-95 transition-all ${
              isRecording
                ? "bg-rose-500 animate-pulse ring-4 ring-rose-200"
                : "bg-emerald-600 hover:bg-emerald-500 ring-4 ring-emerald-200 shadow-emerald-500/30"
            }`}
          >
            <Mic className="w-8 h-8" />
          </button>
          <span className="text-xs font-semibold text-slate-400 block mt-2">
            {isRecording ? "Слушаю..." : "Нажмите и произнесите фразу"}
          </span>
        </div>

        {pronounceIdx < pronunciationCards.length - 1 && (
          <button
            onClick={() => {
              setPronounceIdx((i) => i + 1);
              setPronounceResult(null);
            }}
            className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs"
          >
            Следующая фраза →
          </button>
        )}
      </div>
    );
  }

  // 5. "Быстрые ответы" (Blitz) View
  if (activeGame === "blitz") {
    const q = blitzQuestions[blitzIdx];
    return (
      <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50 max-w-lg w-full mx-auto p-4 justify-between">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveGame("menu")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Выход</span>
          </button>
          <div className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span>Осталось: {blitzTimeLeft}с</span>
          </div>
        </div>

        <div className="my-auto text-center py-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {q.qRu}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6">{q.qEn}</h3>

          {/* Answer Options */}
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleBlitzAnswer(i)}
                className="w-full p-4 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-400 rounded-2xl text-left font-bold text-slate-800 hover:text-rose-700 transition-all active:scale-98 shadow-sm flex items-center justify-between"
              >
                <span>{opt}</span>
                <span className="text-xs text-slate-400">Быстрый ответ</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs font-semibold text-slate-400">
          Счет: {score} XP • Вопрос {blitzIdx + 1} из {blitzQuestions.length}
        </div>
      </div>
    );
  }

  return null;
}
