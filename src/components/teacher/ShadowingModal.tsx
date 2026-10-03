"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, RotateCcw, CheckCircle2, X, Sparkles } from "lucide-react";
import { voiceSpeaker } from "@/lib/speech/speechSynthesis";
import { VoiceRecognizer } from "@/lib/speech/speechRecognition";
import { comparePronunciation, DiffReport } from "@/lib/diff/wordDiff";

interface ShadowingModalProps {
  targetPhrase: string;
  targetRussian?: string;
  transcription?: string;
  onClose: () => void;
  onSuccess?: (score: number) => void;
}

export function ShadowingModal({
  targetPhrase,
  targetRussian,
  transcription,
  onClose,
  onSuccess
}: ShadowingModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [diffReport, setDiffReport] = useState<DiffReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognizerRef = useRef<VoiceRecognizer | null>(null);

  // Play target audio on mount
  useEffect(() => {
    voiceSpeaker.speak(targetPhrase, { slow: false });
  }, [targetPhrase]);

  const handleStartListening = () => {
    setErrorMsg(null);
    setSpokenText("");
    setDiffReport(null);

    const recognizer = new VoiceRecognizer(
      {
        onStart: () => setIsRecording(true),
        onResult: (transcript, isFinal) => {
          setSpokenText(transcript);
          if (isFinal) {
            const report = comparePronunciation(targetPhrase, transcript);
            setDiffReport(report);
            if (report.allPassed) {
              onSuccess?.(report.score);
            }
          }
        },
        onError: (err) => {
          setErrorMsg(err);
          setIsRecording(false);
        },
        onEnd: () => {
          setIsRecording(false);
        }
      },
      "en-US"
    );

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsRecording(false);
    if (spokenText) {
      const report = comparePronunciation(targetPhrase, spokenText);
      setDiffReport(report);
      if (report.allPassed) {
        onSuccess?.(report.score);
      }
    }
  };

  const playTarget = (slow = false) => {
    voiceSpeaker.speak(targetPhrase, { slow });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-brand-50 text-brand-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-slate-800">
              Режим «Повтори за мной»
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Phrase Box */}
        <div className="bg-gradient-to-br from-brand-50/70 to-indigo-50/50 border border-brand-100/60 rounded-3xl p-5 text-center relative overflow-hidden">
          <span className="text-xs uppercase tracking-wider text-brand-600 font-semibold mb-2 block">
            Образец фразы
          </span>
          <p className="text-2xl font-bold text-slate-900 leading-snug">
            {targetPhrase}
          </p>
          {transcription && (
            <p className="text-sm text-slate-500 font-medium mt-1">
              {transcription}
            </p>
          )}
          {targetRussian && (
            <p className="text-sm text-slate-600 mt-2 bg-white/70 py-1.5 px-3 rounded-xl inline-block border border-slate-200/50">
              {targetRussian}
            </p>
          )}

          {/* Sound buttons */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => playTarget(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>Послушать</span>
            </button>
            <button
              onClick={() => playTarget(true)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all"
            >
              <span>Медленнее (0.6x)</span>
            </button>
          </div>
        </div>

        {/* Comparison Result / Word Diff */}
        {diffReport ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-500">
                Результат произношения:
              </span>
              <span
                className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${
                  diffReport.score >= 80
                    ? "bg-emerald-100 text-emerald-800"
                    : diffReport.score >= 50
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {diffReport.score}% совпадение
              </span>
            </div>

            {/* Word Chips */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap gap-2 justify-center">
              {diffReport.words.map((item, index) => {
                let badgeStyle = "bg-rose-100 text-rose-800 border-rose-200";
                if (item.status === "correct") {
                  badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold";
                } else if (item.status === "close") {
                  badgeStyle = "bg-amber-100 text-amber-800 border-amber-300";
                }

                return (
                  <span
                    key={index}
                    className={`px-3 py-1.5 rounded-xl text-base border transition-all ${badgeStyle}`}
                  >
                    {item.word}
                  </span>
                );
              })}
            </div>

            {/* Legend / Feedback */}
            <p className="text-xs text-center text-slate-500">
              <span className="text-emerald-700 font-medium">● Зелёный</span>: отлично &nbsp;
              <span className="text-amber-700 font-medium">● Жёлтый</span>: близко &nbsp;
              <span className="text-rose-700 font-medium">● Красный</span>: не распознано
            </p>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500">
              {isRecording
                ? "Слушаю вас... Говорите фразу вслух!"
                : "Нажмите на кнопку микрофона и повторите фразу вслух"}
            </p>
            {spokenText && (
              <p className="text-sm font-medium text-slate-800 italic mt-2">
                «{spokenText}»
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 border border-rose-200 p-3 rounded-xl text-xs text-center">
            {errorMsg}
          </div>
        )}

        {/* Large Microphone Action */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <button
            onClick={isRecording ? handleStopListening : handleStartListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 ${
              isRecording
                ? "bg-rose-500 ring-8 ring-rose-100 animate-pulse"
                : "bg-brand-600 hover:bg-brand-700 ring-8 ring-brand-50"
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <span className="text-xs font-semibold text-slate-600">
            {isRecording ? "Нажмите, чтобы остановить" : "Нажмите и говорите"}
          </span>
        </div>

        {/* Bottom Actions */}
        {diffReport && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleStartListening}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Попробовать снова</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Готово</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
