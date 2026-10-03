"use client";

import React, { useState, useEffect } from "react";
import { Flame, User, Settings } from "lucide-react";
import { getStorage } from "@/lib/storage/storageAdapter";
import { SettingsModal } from "./SettingsModal";

interface HeaderProps {
  onNameChange?: (name: string) => void;
}

export function Header({ onNameChange }: HeaderProps) {
  const [streak, setStreak] = useState(1);
  const [studentName, setStudentName] = useState("Daud");
  const [showSettings, setShowSettings] = useState(false);

  const loadData = () => {
    getStorage().getProgress().then((p) => {
      setStreak(p.streak || 1);
      setStudentName(p.studentName || "Daud");
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavedName = (newName: string) => {
    setStudentName(newName);
    onNameChange?.(newName);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20">
              DE
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Daily English
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
                Ученик: {studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Student name / settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all active:scale-95"
              title="Настройки профиля"
            >
              <User className="w-3.5 h-3.5 text-brand-600" />
              <span>{studentName}</span>
            </button>

            {/* Streak pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-full text-amber-900 text-xs font-bold shadow-sm">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>{streak} дн.</span>
            </div>
          </div>
        </div>
      </header>

      {showSettings && (
        <SettingsModal
          currentName={studentName}
          onClose={() => setShowSettings(false)}
          onSave={handleSavedName}
        />
      )}
    </>
  );
}
