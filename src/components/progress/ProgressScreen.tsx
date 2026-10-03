"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Flame,
  Clock,
  BookOpen,
  Trophy,
  Bell,
  BellRing,
  AlertTriangle,
  Smartphone,
  CheckCircle,
  HelpCircle,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Award,
  Zap,
  Check,
  X,
  MessageSquare
} from "lucide-react";
import { getStorage, UserProgress } from "@/lib/storage/storageAdapter";
import { CURRICULUM } from "@/lib/topics/curriculum";
import {
  calculateLevel,
  getStoredXP,
  awardXP,
  getStoredFacts,
  saveFact,
  removeFact,
  getStoredBadges,
  unlockBadge,
  AchievementBadge,
  StudentMemoryFact,
  DailyQuest,
  INITIAL_DAILY_QUESTS,
  ROADMAP_STEPS,
  INITIAL_WEEKLY_REPORT
} from "@/lib/gamification/xpSystem";
import { Vocabulary } from "../words/Vocabulary";

export function ProgressScreen() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [xp, setXp] = useState(260);
  const [facts, setFacts] = useState<StudentMemoryFact[]>([]);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>(INITIAL_DAILY_QUESTS);
  
  // Modals
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [showAddFactModal, setShowAddFactModal] = useState(false);
  const [newFactText, setNewFactText] = useState("");
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    const data = await getStorage().getProgress();
    setProgress(data);
    setXp(getStoredXP());
    setFacts(getStoredFacts());
    setBadges(getStoredBadges());

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      setReminderEnabled(Notification.permission === "granted");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuestToggle = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const nextCompleted = !q.completed;
          if (nextCompleted) {
            confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
            const result = awardXP(q.xpReward);
            setXp(result.newXP);
            showToast(`Квест выполнен! +${q.xpReward} XP`);
          }
          return {
            ...q,
            completed: nextCompleted,
            current: nextCompleted ? q.target : 0
          };
        }
        return q;
      })
    );
  };

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFactText.trim()) return;
    const updated = saveFact(newFactText.trim(), "custom");
    setFacts(updated);
    setNewFactText("");
    setShowAddFactModal(false);
    awardXP(15);
    setXp(getStoredXP());
    confetti({ particleCount: 25, spread: 45 });
    showToast("Факт добавлен в память Алекса! +15 XP");
  };

  const handleRemoveFact = (id: string) => {
    const updated = removeFact(id);
    setFacts(updated);
    showToast("Факт удалён");
  };

  const handleBadgeClick = (badge: AchievementBadge) => {
    setSelectedBadge(badge);
    if (badge.unlocked) {
      confetti({ particleCount: 40, spread: 60 });
    }
  };

  const handleToggleReminder = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Уведомления не поддерживаются в этом браузере.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Daily English 🎓", {
        body: "Напоминание включено! 10 минут английского сегодня ждут вас.",
        icon: "/icons/icon-192.png"
      });
      setReminderEnabled(true);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        setReminderEnabled(true);
        new Notification("Daily English 🎓", {
          body: "Отлично! Мы будем мягко напоминать вам о 10 минутах практики.",
          icon: "/icons/icon-192.png"
        });
      }
    } catch (e) {
      console.error("Notification permission error:", e);
    }
  };

  const levelInfo = calculateLevel(xp);
  const streakDays = progress?.streak || 1;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Мой прогресс</h2>
          <p className="text-xs text-slate-500 font-medium">
            Опыт, серия дней, цели и память учителя
          </p>
        </div>
        <button
          onClick={() => setShowVocabModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200/80 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Словарь</span>
        </button>
      </div>

      {/* 1. LEVEL & XP HERO CARD */}
      <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-brand-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-100 bg-white/15 px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Уровень {levelInfo.levelNumber}
            </span>
            <span className="text-xs font-bold text-brand-100">
              {xp} / {levelInfo.nextLevelXp} XP
            </span>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black leading-tight text-white">
              {levelInfo.title}
            </h3>
            <p className="text-xs text-brand-100/90 mt-1">
              До следующего ранга осталось {Math.max(0, levelInfo.nextLevelXp - xp)} XP
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-black/25 rounded-full overflow-hidden p-0.5 backdrop-blur-sm">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-300 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-brand-200/80 font-semibold">
              <span>{levelInfo.currentLevelThreshold} XP</span>
              <span>{levelInfo.progressPercent}%</span>
              <span>{levelInfo.nextLevelXp} XP</span>
            </div>
          </div>

          {/* XP Rewards hint */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] text-brand-100/90 font-medium">
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <span className="font-bold text-amber-300 block">+10 XP</span>
              за сообщение
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <span className="font-bold text-amber-300 block">+100 XP</span>
              за сценку
            </div>
            <div className="bg-white/10 rounded-xl py-1.5 px-1">
              <span className="font-bold text-amber-300 block">+20 XP</span>
              за игру
            </div>
          </div>
        </div>
      </div>

      {/* 2. STREAK CARD WITH ANIMATED FIRE */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-100 bg-white/20 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
                Серия дней
              </span>
              <span className="text-[11px] font-bold bg-emerald-500/80 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 backdrop-blur-sm">
                <ShieldCheck className="w-3 h-3" />
                Заморозка активна
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-4xl sm:text-5xl font-black">{streakDays}</span>
              <span className="text-lg sm:text-xl font-bold text-amber-100">
                {streakDays % 10 === 1 && streakDays !== 11
                  ? "день подряд"
                  : streakDays % 10 >= 2 && streakDays % 10 <= 4
                  ? "дня подряд"
                  : "дней подряд"}
              </span>
            </div>

            <p className="text-xs text-amber-100 font-medium">
              {streakDays >= 3
                ? "Ты настоящий огонь! Продолжай каждый день."
                : "Отличный старт! Занимайся завтра, чтобы дойти до 3 дней."}
            </p>
          </div>

          <div className="w-18 h-18 sm:w-20 sm:h-20 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm text-amber-100 shrink-0 animate-pulse">
            <Flame className="w-12 h-12 fill-amber-300 text-amber-200" />
          </div>
        </div>

        {/* Milestone milestones */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-center text-[10px] text-amber-100">
          <div className={`flex flex-col items-center gap-1 ${streakDays >= 3 ? "font-bold text-white" : "opacity-75"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {streakDays >= 3 ? "✓" : "3"}
            </span>
            <span>3 дня</span>
          </div>
          <div className="flex-1 h-0.5 bg-white/20 mx-1" />
          <div className={`flex flex-col items-center gap-1 ${streakDays >= 7 ? "font-bold text-white" : "opacity-75"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {streakDays >= 7 ? "✓" : "7"}
            </span>
            <span>7 дней</span>
          </div>
          <div className="flex-1 h-0.5 bg-white/20 mx-1" />
          <div className={`flex flex-col items-center gap-1 ${streakDays >= 14 ? "font-bold text-white" : "opacity-75"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {streakDays >= 14 ? "✓" : "14"}
            </span>
            <span>14 дней</span>
          </div>
          <div className="flex-1 h-0.5 bg-white/20 mx-1" />
          <div className={`flex flex-col items-center gap-1 ${streakDays >= 30 ? "font-bold text-white" : "opacity-75"}`}>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {streakDays >= 30 ? "✓" : "30"}
            </span>
            <span>30 дней</span>
          </div>
        </div>
      </div>

      {/* 3. DAILY QUESTS (3 ЦЕЛИ НА ДЕНЬ) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Ежедневные цели
              </h3>
              <p className="text-[11px] text-slate-500">
                Выполняй каждый день и забирай бонусный опыт
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {quests.filter((q) => q.completed).length} / {quests.length}
          </span>
        </div>

        <div className="space-y-2">
          {quests.map((quest) => (
            <div
              key={quest.id}
              onClick={() => handleQuestToggle(quest.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                quest.completed
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-slate-50 border-slate-200/80 text-slate-800 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                    quest.completed
                      ? "bg-emerald-600 text-white"
                      : "border-2 border-slate-300 text-transparent hover:border-brand-500"
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${quest.completed ? "line-through opacity-80" : ""}`}>
                    {quest.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Прогресс: {quest.current} / {quest.target}
                  </div>
                </div>
              </div>

              <span
                className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                  quest.completed
                    ? "bg-emerald-200 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                +{quest.xpReward} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. STUDENT MEMORY CARD ("ЧТО АЛЕКС ЗНАЕТ О ТЕБЕ") */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Что Алекс помнит о тебе
              </h3>
              <p className="text-[11px] text-slate-500">
                Используется в диалогах, чтобы не переспрашивать
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddFactModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {facts.map((item) => (
            <div
              key={item.id}
              className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3 flex items-start justify-between gap-2 group"
            >
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                  {item.category === "city" && "🏙️ Город"}
                  {item.category === "job" && "🥩 Работа"}
                  {item.category === "family" && "👨‍👩‍👧‍👦 Семья"}
                  {item.category === "goal" && "🎯 Цель"}
                  {item.category === "custom" && "💡 Факт"}
                </span>
                <p className="text-xs font-bold text-slate-800 leading-snug">{item.fact}</p>
              </div>

              {item.category === "custom" && (
                <button
                  onClick={() => handleRemoveFact(item.id)}
                  className="opacity-60 hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-opacity"
                  title="Удалить факт"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 text-[11px] text-slate-600 flex items-center gap-2 border border-slate-100">
          <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
          <span>Алекс никогда не будет переспрашивать твоё имя, город или работу!</span>
        </div>
      </div>

      {/* 5. INTERACTIVE ROADMAP (КАРТА ПУТИ) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Карта обучения (Roadmap)
            </h3>
            <p className="text-[11px] text-slate-500">
              Твой путь от первого слова до свободного разговора
            </p>
          </div>
          <span className="text-xs font-extrabold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
            Урок 3 из 10
          </span>
        </div>

        <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
          {ROADMAP_STEPS.map((step, idx) => (
            <div key={step.id} className="relative flex items-center gap-3.5 group">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold relative z-10 shrink-0 shadow-sm transition-transform ${
                  step.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : step.status === "current"
                    ? "bg-brand-600 text-white ring-4 ring-brand-100 animate-pulse"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {step.status === "completed" ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : step.status === "current" ? (
                  <span>{step.icon}</span>
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>

              <div
                className={`flex-1 p-3 rounded-2xl border transition-all ${
                  step.status === "completed"
                    ? "bg-emerald-50/50 border-emerald-100"
                    : step.status === "current"
                    ? "bg-brand-50/80 border-brand-200 shadow-sm"
                    : "bg-slate-50/60 border-slate-100 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900">
                    {step.title}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">
                    +{step.xpReward} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">{step.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. WEEKLY REPORT CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-slate-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-brand-300 bg-brand-900/50 px-3 py-1 rounded-full border border-brand-500/30">
            Отчёт за неделю
          </span>
          <span className="text-xs text-slate-400">Пн — Вс</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="text-xl font-black text-brand-400">
              {INITIAL_WEEKLY_REPORT.practiceMinutes} мин
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Практика</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="text-xl font-black text-emerald-400">
              {INITIAL_WEEKLY_REPORT.wordsLearned}
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Новых слов</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-sm">
            <div className="text-xl font-black text-amber-400">
              {INITIAL_WEEKLY_REPORT.dialoguesCount}
            </div>
            <div className="text-[10px] text-slate-300 font-medium">Диалогов</div>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-3.5 border border-white/10 space-y-2">
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            Главная победа недели
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {INITIAL_WEEKLY_REPORT.topOvercomeMistake}
          </p>
        </div>

        <div className="bg-brand-950/60 rounded-2xl p-3.5 border border-brand-800/50 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-400">
            Совет от учителя Алекса
          </span>
          <p className="text-xs text-brand-100 font-medium leading-relaxed">
            «{INITIAL_WEEKLY_REPORT.alexRecommendation}»
          </p>
        </div>
      </div>

      {/* 7. ACHIEVEMENTS GRID (12 BADGES) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Достижения и бейджи
            </h3>
            <p className="text-[11px] text-slate-500">
              Открывай награды за активные разговоры и игры
            </p>
          </div>
          <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
            {badges.filter((b) => b.unlocked).length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {badges.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBadgeClick(b)}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 active:scale-95 ${
                b.unlocked
                  ? "bg-gradient-to-b from-amber-50/80 to-white border-amber-200 shadow-sm hover:border-amber-400"
                  : "bg-slate-50 border-slate-200/70 opacity-50 grayscale hover:opacity-75"
              }`}
            >
              <div className="text-2xl sm:text-3xl">{b.icon}</div>
              <span className="text-[10px] font-extrabold text-slate-800 line-clamp-1">
                {b.title}
              </span>
              {b.unlocked ? (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  Открыто
                </span>
              ) : (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 8. REMINDERS & PWA BLOCK */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-brand-50 text-brand-600 rounded-2xl">
              {reminderEnabled ? (
                <BellRing className="w-5 h-5 text-brand-600" />
              ) : (
                <Bell className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Напоминание о занятии</h4>
              <p className="text-xs text-slate-500">
                {reminderEnabled ? "Уведомления включены" : "Получать напоминание в 10:00"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleReminder}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
              reminderEnabled
                ? "bg-emerald-100 text-emerald-800"
                : "bg-brand-600 text-white shadow-sm"
            }`}
          >
            {reminderEnabled ? "Включено" : "Включить"}
          </button>
        </div>

        {/* PWA Phone installation hint */}
        <div className="bg-slate-50 rounded-2xl p-4 flex items-start gap-3 border border-slate-100">
          <Smartphone className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">
              Как установить на телефон как приложение:
            </span>
            <p>
              • <strong>iPhone (Safari)</strong>: Нажмите кнопку «Поделиться» ⎋ и выберите «На экран „Домой“».
            </p>
            <p>
              • <strong>Android (Chrome)</strong>: Нажмите на три точки ⋮ и выберите «Установить приложение».
            </p>
          </div>
        </div>
      </div>

      {/* BADGE DETAIL MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl shadow-inner">
              {selectedBadge.icon}
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                {selectedBadge.unlocked ? "Награда разблокирована" : "Заблокировано"}
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {selectedBadge.title}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedBadge.description}
              </p>
            </div>

            {selectedBadge.unlocked && (
              <div className="text-[11px] text-slate-500 font-medium">
                Получено: {selectedBadge.unlockedAt || "Недавно"}
              </div>
            )}

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs transition-all active:scale-95"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* ADD FACT MODAL */}
      {showAddFactModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Новый факт для Алекса
              </h3>
              <button
                onClick={() => setShowAddFactModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Расскажи что-то о себе (хобби, планы, любимая еда). Алекс будет использовать это в беседах!
            </p>

            <form onSubmit={handleAddFact} className="space-y-3">
              <input
                type="text"
                value={newFactText}
                onChange={(e) => setNewFactText(e.target.value)}
                placeholder="Например: Люблю готовить стейк рибай"
                autoFocus
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFactModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!newFactText.trim()}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-purple-500/20"
                >
                  Сохранить (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOCABULARY MODAL */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
          <div className="bg-slate-50 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-base text-slate-900">Мой словарь</h3>
              </div>
              <button
                onClick={() => setShowVocabModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Vocabulary />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
