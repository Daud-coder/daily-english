"use client";

import React, { useState, useEffect } from "react";
import {
  Volume2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Ear,
  Layers,
  ListFilter,
  Sparkles,
  BookOpen
} from "lucide-react";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { getStorage, WordItem } from "@/lib/storage/storageAdapter";
import { SRSGrade } from "@/lib/srs/sm2";

export function Vocabulary() {
  const [activeTab, setActiveTab] = useState<"cards" | "listening" | "list">("cards");
  const [words, setWords] = useState<WordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cards mode state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Listening quiz state
  const [quizWordIndex, setQuizWordIndex] = useState(0);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  // Add word modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEn, setNewEn] = useState("");
  const [newRu, setNewRu] = useState("");

  const loadWords = async () => {
    setLoading(true);
    const data = await getStorage().getWords();
    setWords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadWords();
  }, []);

  // Set up quiz options whenever quiz word changes
  useEffect(() => {
    if (words.length < 4 || quizWordIndex >= words.length) return;

    const current = words[quizWordIndex];
    voiceSpeaker.speak(current.english);

    // Pick 3 random wrong options
    const others = words.filter((w) => w.id !== current.id);
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [current.russian, ...shuffledOthers.map((w) => w.russian)].sort(
      () => 0.5 - Math.random()
    );

    setQuizOptions(options);
    setSelectedOption(null);
  }, [quizWordIndex, words]);

  // Flashcards: handle SRS rating
  const handleRateCard = async (grade: SRSGrade) => {
    if (currentCardIndex >= words.length) return;
    const word = words[currentCardIndex];
    await getStorage().updateWordSRS(word.id, grade);

    setIsFlipped(false);
    if (currentCardIndex < words.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // Finished deck
      setCurrentCardIndex(0);
      loadWords();
    }
  };

  // Listening quiz answer
  const handleSelectQuizOption = (option: string) => {
    if (selectedOption !== null || quizWordIndex >= words.length) return;
    setSelectedOption(option);

    const isCorrect = option === words[quizWordIndex].russian;
    setQuizScore((prev) => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    if (isCorrect) {
      getStorage().updateWordSRS(words[quizWordIndex].id, "good");
    } else {
      getStorage().updateWordSRS(words[quizWordIndex].id, "again");
    }

    setTimeout(() => {
      if (quizWordIndex < words.length - 1) {
        setQuizWordIndex((prev) => prev + 1);
      } else {
        setQuizWordIndex(0);
      }
    }, 1200);
  };

  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn.trim() || !newRu.trim()) return;

    await getStorage().saveWord({
      english: newEn.trim(),
      russian: newRu.trim(),
      transcription: `[${newEn.trim()}]`
    });

    setNewEn("");
    setNewRu("");
    setShowAddModal(false);
    loadWords();
  };

  const handleDeleteWord = async (id: string) => {
    if (confirm("Удалить слово из словаря?")) {
      await getStorage().deleteWord(id);
      loadWords();
    }
  };

  const currentCard = words[currentCardIndex];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
      {/* Header and Sub-tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Мои слова</h2>
          <p className="text-xs text-slate-500 font-medium">
            Интервальное повторение (SM-2) и тренировка на слух
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="p-2.5 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить</span>
        </button>
      </div>

      {/* Mode navigation */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        <button
          onClick={() => {
            setActiveTab("cards");
            setIsFlipped(false);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "cards"
              ? "bg-white text-brand-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Карточки</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("listening");
            setQuizWordIndex(0);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "listening"
              ? "bg-white text-brand-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Ear className="w-4 h-4" />
          <span>На слух</span>
        </button>

        <button
          onClick={() => setActiveTab("list")}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "list"
              ? "bg-white text-brand-600 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Список ({words.length})</span>
        </button>
      </div>

      {/* --- TAB 1: FLASHCARDS (SM-2) --- */}
      {activeTab === "cards" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {words.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-3">
              <Sparkles className="w-8 h-8 text-brand-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                В словаре пока нет слов
              </p>
              <p className="text-xs text-slate-500">
                Нажимайте на любые слова в сообщениях учителя или добавьте вручную.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                <span>Карточка {currentCardIndex + 1} из {words.length}</span>
                <span>Нажмите на карточку, чтобы перевернуть</span>
              </div>

              {/* The Flashcard */}
              <div
                onClick={() => {
                  setIsFlipped(!isFlipped);
                  if (!isFlipped && currentCard) {
                    voiceSpeaker.speak(currentCard.english);
                  }
                }}
                className="bg-white rounded-3xl p-8 min-h-[260px] shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-300 transition-all select-none relative group"
              >
                {!isFlipped ? (
                  // Front: English + Audio + Transcription
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
                      Английский
                    </span>
                    <h3 className="text-3xl font-extrabold text-slate-900">
                      {currentCard.english}
                    </h3>
                    {currentCard.transcription && (
                      <p className="text-sm font-medium text-slate-500">
                        {currentCard.transcription}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voiceSpeaker.speak(currentCard.english);
                      }}
                      className="mt-2 p-3 bg-brand-50 hover:bg-brand-100 text-brand-600 rounded-2xl inline-flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95"
                    >
                      <Volume2 className="w-5 h-5" />
                      <span>Послушать</span>
                    </button>
                    <p className="text-[11px] text-slate-400 mt-4 block">
                      Нажмите в любое место, чтобы увидеть перевод ▾
                    </p>
                  </div>
                ) : (
                  // Back: Russian Translation + Context
                  <div className="space-y-3 animate-in zoom-in-95 duration-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent-600 bg-accent-50 px-3 py-1 rounded-full">
                      Русский перевод
                    </span>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {currentCard.russian}
                    </h3>
                    {currentCard.contextSentence && (
                      <p className="text-xs text-slate-500 italic max-w-xs mx-auto">
                        «{currentCard.contextSentence}»
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        voiceSpeaker.speak(currentCard.english, { slow: true });
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <span>Медленно 0.6x</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SM-2 Rating Buttons (Shown when flipped) */}
              {isFlipped ? (
                <div className="grid grid-cols-4 gap-2 animate-in slide-in-from-bottom duration-200">
                  <button
                    onClick={() => handleRateCard("again")}
                    className="py-3 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold transition-all text-center active:scale-95"
                  >
                    Снова
                    <span className="block text-[10px] font-normal text-rose-600 mt-0.5">1 день</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("hard")}
                    className="py-3 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl text-xs font-bold transition-all text-center active:scale-95"
                  >
                    Трудно
                    <span className="block text-[10px] font-normal text-amber-600 mt-0.5">2 дня</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("good")}
                    className="py-3 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-2xl text-xs font-bold transition-all text-center active:scale-95"
                  >
                    Хорошо
                    <span className="block text-[10px] font-normal text-blue-600 mt-0.5">4 дня</span>
                  </button>
                  <button
                    onClick={() => handleRateCard("easy")}
                    className="py-3 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold transition-all text-center active:scale-95"
                  >
                    Легко
                    <span className="block text-[10px] font-normal text-emerald-600 mt-0.5">7 дней</span>
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400">
                  👆 Нажмите на карточку перед выбором сложности
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: LISTENING QUIZ («НА СЛУХ») --- */}
      {activeTab === "listening" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {words.length < 4 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Нужно хотя бы 4 слова для режима «На слух»
              </p>
              <p className="text-xs text-slate-500">
                Сохраните больше слов из диалогов или добавьте вручную.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                <span>Слово {quizWordIndex + 1} из {words.length}</span>
                <span className="text-brand-600 font-bold">
                  Правильно: {quizScore.correct} / {quizScore.total}
                </span>
              </div>

              {/* Big Sound Button */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center gap-3">
                <button
                  onClick={() => voiceSpeaker.speak(words[quizWordIndex]?.english)}
                  className="w-20 h-20 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
                >
                  <Volume2 className="w-10 h-10" />
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  Нажмите, чтобы прослушать слово
                </span>
              </div>

              {/* 4 Russian Choices */}
              <div className="grid grid-cols-2 gap-2.5">
                {quizOptions.map((opt, idx) => {
                  const isChosen = selectedOption === opt;
                  const isCorrect = opt === words[quizWordIndex]?.russian;

                  let style = "bg-white border-slate-200 text-slate-800 hover:border-brand-300";
                  if (selectedOption !== null) {
                    if (isCorrect) {
                      style = "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold";
                    } else if (isChosen && !isCorrect) {
                      style = "bg-rose-100 border-rose-300 text-rose-900 font-bold";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizOption(opt)}
                      disabled={selectedOption !== null}
                      className={`p-4 rounded-2xl border text-sm font-semibold transition-all active:scale-98 min-h-[64px] flex items-center justify-center text-center ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: WORDS LIST --- */}
      {activeTab === "list" && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {words.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 capitalize">
                    {item.english}
                  </h4>
                  {item.transcription && (
                    <span className="text-xs text-slate-400 font-medium">
                      {item.transcription}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {item.russian}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-medium">
                  <span>Повторений: {item.repetitions}</span>
                  <span>•</span>
                  <span>Интервал: {item.interval} дн.</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => voiceSpeaker.speak(item.english)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-brand-600 rounded-xl transition-all active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteWord(item.id)}
                  className="p-2.5 text-slate-300 hover:text-rose-500 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Word Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900">Добавить слово в словарь</h3>
            <form onSubmit={handleAddCustomWord} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Слово на английском:
                </label>
                <input
                  type="text"
                  required
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  placeholder="e.g. Apple"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Перевод на русский:
                </label>
                <input
                  type="text"
                  required
                  value={newRu}
                  onChange={(e) => setNewRu(e.target.value)}
                  placeholder="e.g. Яблоко"
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
