"use client";

import React from "react";
import { Calendar, Bot, BookOpen, TrendingUp } from "lucide-react";

export type NavTab = "today" | "teacher" | "words" | "progress";

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "today" as NavTab, label: "Сегодня", icon: Calendar },
    { id: "teacher" as NavTab, label: "Учитель", icon: Bot, isCenter: true },
    { id: "words" as NavTab, label: "Слова", icon: BookOpen },
    { id: "progress" as NavTab, label: "Прогресс", icon: TrendingUp },
  ];

  return (
    <nav className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="max-w-2xl mx-auto grid grid-cols-4 items-center px-1 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-2xl transition-all active:scale-95 group focus:outline-none"
            >
              <div
                className={`p-1.5 rounded-xl transition-all shrink-0 ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-105"
                    : "text-slate-400 group-hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[11px] font-bold transition-colors truncate max-w-full ${
                  isActive ? "text-brand-600" : "text-slate-500 group-hover:text-slate-700"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
