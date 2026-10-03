"use client";

import React, { useState, useEffect } from "react";
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
  RefreshCw
} from "lucide-react";
import { getStorage, UserProgress } from "@/lib/storage/storageAdapter";
import { CURRICULUM } from "@/lib/topics/curriculum";

export function ProgressScreen() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [reminderEnabled, setReminderEnabled] = useState(false);

  const loadData = async () => {
    const data = await getStorage().getProgress();
    setProgress(data);

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
      setReminderEnabled(Notification.permission === "granted");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Мой прогресс</h2>
        <p className="text-xs text-slate-500 font-medium">
          Ваша ежедневная статистика и работа над ошибками
        </p>
      </div>

      {/* Streak Hero Card */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-100 bg-white/20 px-3 py-1 rounded-full inline-block mb-2 backdrop-blur-sm">
              Серия занятий
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black">{progress?.streak || 1}</span>
              <span className="text-xl font-bold text-amber-100">
                {(progress?.streak || 1) % 10 === 1 && (progress?.streak || 1) !== 11
                  ? "день подряд"
                  : (progress?.streak || 1) % 10 >= 2 && (progress?.streak || 1) % 10 <= 4
                  ? "дня подряд"
                  : "дней подряд"}
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-2 font-medium">
              Каждый день делает вашу речь увереннее!
            </p>
          </div>

          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm text-amber-100">
            <Flame className="w-12 h-12 fill-current" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {progress?.totalPracticeMinutes || 0} мин
            </div>
            <div className="text-xs text-slate-500 font-medium">Время в диалоге</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {progress?.learnedWordsCount || 5}
            </div>
            <div className="text-xs text-slate-500 font-medium">Слов в словаре</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">
              {progress?.completedTopicsCount || 0} / {CURRICULUM.length}
            </div>
            <div className="text-xs text-slate-500 font-medium">Пройдено тем</div>
          </div>
        </div>
      </div>

      {/* Frequent Mistakes Block */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">
            Мои частые ошибки и подсказки
          </h3>
        </div>

        {progress?.frequentMistakes && progress.frequentMistakes.length > 0 ? (
          <div className="space-y-2">
            {progress.frequentMistakes.map((mistake, idx) => (
              <div
                key={idx}
                className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 text-xs text-amber-950 font-medium flex items-start gap-2"
              >
                <span className="font-bold text-amber-700 shrink-0">#{idx + 1}</span>
                <span>{mistake}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-4 text-center text-xs text-slate-500">
            Здесь будут появляться подсказки от учителя при разборе ошибок в разговоре.
          </div>
        )}
      </div>

      {/* Reminder & PWA block */}
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
                {reminderEnabled
                  ? "Уведомления включены"
                  : "Получать напоминание в 10:00"}
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
    </div>
  );
}
