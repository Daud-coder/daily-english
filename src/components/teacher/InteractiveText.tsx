"use client";

import React from "react";

interface InteractiveTextProps {
  text: string;
  onWordClick: (word: string) => void;
  className?: string;
}

export function InteractiveText({ text, onWordClick, className = "" }: InteractiveTextProps) {
  // Match words (letters, apostrophes, hyphens) and the spaces/punctuation between them
  const regex = /([a-zA-Z'’-]+)|([^a-zA-Z'’-]+)/g;
  const parts: Array<{ text: string; isWord: boolean }> = [];

  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      parts.push({ text: match[1], isWord: true });
    } else if (match[2]) {
      parts.push({ text: match[2], isWord: false });
    }
  }

  return (
    <span className={`inline leading-relaxed ${className}`}>
      {parts.map((part, idx) => {
        if (!part.isWord) {
          return <span key={idx}>{part.text}</span>;
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(part.text);
            }}
            className="inline px-1 py-0.5 rounded text-left font-bold transition-colors hover:bg-brand-100 hover:text-brand-900 active:bg-brand-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-300"
            title="Нажмите, чтобы узнать перевод и произношение"
          >
            {part.text}
          </button>
        );
      })}
    </span>
  );
}
