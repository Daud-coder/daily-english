"use client";

import React, { useEffect, useState } from "react";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "happy" | "encouraging";

interface AlexAvatarProps {
  state?: AvatarState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AlexAvatar({ state = "idle", size = "md", className = "" }: AlexAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [mouthFrame, setMouthFrame] = useState(0);

  // Natural blinking effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Speaking mouth movement animation
  useEffect(() => {
    if (state !== "speaking") {
      setMouthFrame(0);
      return;
    }
    const interval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4);
    }, 140);
    return () => clearInterval(interval);
  }, [state]);

  const sizeDimensions = {
    sm: "w-9 h-9",
    md: "w-14 h-14",
    lg: "w-24 h-24",
    xl: "w-44 h-44 sm:w-52 sm:h-52"
  }[size];

  return (
    <div className={`relative select-none flex items-center justify-center ${sizeDimensions} ${className}`}>
      {/* Listening pulse rings for call mode */}
      {state === "listening" && (
        <>
          <div className="absolute inset-0 rounded-full bg-brand-400/25 animate-ping duration-1000 pointer-events-none" />
          <div className="absolute -inset-2 rounded-full bg-brand-500/15 animate-pulse pointer-events-none" />
        </>
      )}

      {/* Speaking subtle glow */}
      {state === "speaking" && (
        <div className="absolute -inset-2 rounded-full bg-emerald-400/20 blur-sm animate-pulse pointer-events-none" />
      )}

      {/* Thinking floating sparkles */}
      {state === "thinking" && (
        <div className="absolute -top-2 -right-1 flex gap-0.5 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-amber-400 opacity-80" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 opacity-60" />
        </div>
      )}

      {/* SVG Character Avatar "Alex" */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-md transition-transform duration-300"
      >
        <defs>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE0B2" />
            <stop offset="100%" stopColor="#FFCC80" />
          </linearGradient>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4E342E" />
            <stop offset="100%" stopColor="#2E1C14" />
          </linearGradient>
          <linearGradient id="tshirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>

        {/* Head background shadow / circular frame */}
        <circle cx="50" cy="50" r="48" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2.5" />

        {/* T-Shirt Collar / Shoulders */}
        <path d="M 24 94 Q 50 82 76 94 L 76 100 L 24 100 Z" fill="url(#tshirtGrad)" />
        <path d="M 42 86 Q 50 92 58 86" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <rect x="44" y="68" width="12" height="15" rx="3" fill="#FFCC80" />

        {/* Head / Face */}
        <ellipse cx="50" cy="52" rx="28" ry="29" fill="url(#skinGrad)" />

        {/* Hair - Back & Top */}
        <path
          d="M 23 48 C 22 30 35 18 50 18 C 65 18 78 30 77 48 C 77 34 68 24 50 24 C 32 24 23 34 23 48 Z"
          fill="url(#hairGrad)"
        />
        {/* Stylish Modern Quiff */}
        <path
          d="M 30 30 Q 42 14 62 20 Q 52 24 45 28 Z"
          fill="#3E2723"
        />

        {/* Ears */}
        <circle cx="22" cy="53" r="5.5" fill="#FFCC80" />
        <circle cx="78" cy="53" r="5.5" fill="#FFCC80" />

        {/* Eyebrows */}
        {state === "thinking" ? (
          <>
            <path d="M 33 40 Q 40 37 45 42" stroke="#3E2723" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M 55 42 Q 60 38 67 41" stroke="#3E2723" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        ) : state === "happy" ? (
          <>
            <path d="M 33 39 Q 40 35 45 38" stroke="#3E2723" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            <path d="M 55 38 Q 60 35 67 39" stroke="#3E2723" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <path d="M 33 41 Q 40 38 45 40" stroke="#3E2723" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M 55 40 Q 60 38 67 41" stroke="#3E2723" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Eyes */}
        {blink ? (
          <>
            <path d="M 34 49 Q 40 52 46 49" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 54 49 Q 60 52 66 49" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        ) : state === "happy" ? (
          <>
            {/* Happy laughing / winking curved eyes */}
            <path d="M 33 50 Q 40 45 47 50" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M 53 50 Q 60 45 67 50" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        ) : state === "thinking" ? (
          <>
            {/* Looking slightly upward */}
            <ellipse cx="40" cy="47" rx="4.5" ry="5" fill="#0F172A" />
            <ellipse cx="60" cy="47" rx="4.5" ry="5" fill="#0F172A" />
            <circle cx="41.5" cy="45.5" r="1.5" fill="#FFFFFF" />
            <circle cx="61.5" cy="45.5" r="1.5" fill="#FFFFFF" />
          </>
        ) : (
          <>
            {/* Regular friendly eyes */}
            <ellipse cx="40" cy="49" rx="4.5" ry="5" fill="#0F172A" />
            <ellipse cx="60" cy="49" rx="4.5" ry="5" fill="#0F172A" />
            {/* Eye reflections */}
            <circle cx="41.5" cy="47.5" r="1.5" fill="#FFFFFF" />
            <circle cx="61.5" cy="47.5" r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Cheeks - friendly blush */}
        <circle cx="30" cy="56" r="4.5" fill="#F43F5E" opacity="0.18" />
        <circle cx="70" cy="56" r="4.5" fill="#F43F5E" opacity="0.18" />

        {/* Nose */}
        <path d="M 49 53 Q 50 56 52 56" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />

        {/* Mouth */}
        {state === "speaking" ? (
          mouthFrame === 0 ? (
            <ellipse cx="50" cy="65" rx="5" ry="4" fill="#991B1B" />
          ) : mouthFrame === 1 ? (
            <ellipse cx="50" cy="66" rx="7" ry="6" fill="#991B1B" />
          ) : mouthFrame === 2 ? (
            <path d="M 43 64 Q 50 71 57 64 Z" fill="#991B1B" />
          ) : (
            <path d="M 44 65 Q 50 68 56 65" stroke="#991B1B" strokeWidth="3" strokeLinecap="round" fill="none" />
          )
        ) : state === "happy" ? (
          <path d="M 40 63 Q 50 74 60 63 Z" fill="#DC2626" />
        ) : state === "thinking" ? (
          <path d="M 46 66 Q 50 66 54 65" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          /* Warm gentle smile */
          <path d="M 42 63 Q 50 70 58 63" stroke="#991B1B" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        )}
      </svg>
    </div>
  );
}
