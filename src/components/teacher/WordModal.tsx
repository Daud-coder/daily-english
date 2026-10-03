"use client";

import React, { useState, useEffect } from "react";
import { Volume2, Bookmark, Check, X, Loader2 } from "lucide-react";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { getStorage } from "@/lib/storage/storageAdapter";

interface WordModalProps {
  word: string | null;
  sentenceContext?: string;
  onClose: () => void;
  onWordSaved?: () => void;
}

export function WordModal({ word, sentenceContext, onClose, onWordSaved }: WordModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ english: string; russian: string; transcription: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!word) return;

    let isMounted = true;
    setLoading(true);
    setIsSaved(false);

    // Check if word already in vocabulary
    getStorage().getWords().then((words) => {
      if (!isMounted) return;
      const found = words.some((w) => w.english.toLowerCase() === word.toLowerCase());
      setIsSaved(found);
    });

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sentence: sentenceContext })
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        setData(resData);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setData({
          english: word,
          russian: "Перевод слова",
          transcription: `[${word}]`
        });
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [word, sentenceContext]);

  if (!word) return null;

  const handlePronounce = (slow = false) => {
    voiceSpeaker.speak(word, { slow });
  };

  const handleSaveWord = async () => {
    if (!data || isSaved || saving) return;
    setSaving(true);
    try {
      await getStorage().saveWord({
        english: data.english,
        russian: data.russian,
        transcription: data.transcription,
        contextSentence: sentenceContext
      });
      setIsSaved(true);
      onWordSaved?.();
    } catch (err) {
      console.error("Failed to save word:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider bg-brand-50 px-2.5 py-1 rounded-full">
            Слово в контексте
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <span className="text-sm">Ищу перевод...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 capitalize">{data?.english}</h3>
                {data?.transcription && (
                  <p className="text-sm font-medium text-slate-500 mt-0.5">
                    {data.transcription}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePronounce(false)}
                  className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center"
                  title="Озвучить"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePronounce(true)}
                  className="px-2.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all active:scale-95"
                  title="Медленнее"
                >
                  0.6x
                </button>
              </div>
            </div>

            {/* Russian translation */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-xs text-slate-400 font-medium block mb-1">Перевод на русский:</span>
              <p className="text-lg font-semibold text-slate-800">{data?.russian}</p>
            </div>

            {/* Action button */}
            <button
              onClick={handleSaveWord}
              disabled={isSaved || saving}
              className={`w-full py-3.5 px-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all ${
                isSaved
                  ? "bg-accent-50 text-accent-600 border border-accent-100 cursor-default"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-98"
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-5 h-5 text-accent-500" />
                  <span>Сохранено в словарь</span>
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Сохраняю...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-5 h-5" />
                  <span>Сохранить в мой словарь</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
