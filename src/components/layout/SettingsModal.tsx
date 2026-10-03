"use client";

import React, { useState } from "react";
import { X, User, Check, Sparkles } from "lucide-react";
import { getStorage } from "@/lib/storage/storageAdapter";

interface SettingsModalProps {
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export function SettingsModal({ currentName, onClose, onSave }: SettingsModalProps) {
  const [name, setName] = useState(currentName || "Daud");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim() || "Daud";
    await getStorage().setStudentName(trimmed);
    setSaved(true);
    onSave(trimmed);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-50 text-brand-600 rounded-xl">
              <User className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">Настройки ученика</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Как тебя зовут? (Имя для учителя):
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Daud"
              className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Учитель будет обращаться к вам по этому имени в диалогах и примерах.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
