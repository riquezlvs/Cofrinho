"use client";

import React, { useState } from "react";

interface FloatingPierreDockProps {
  onAskPierre?: () => void;
  onNavigateHome?: () => void;
  onTransfer?: () => void;
  onOpenMascot?: () => void;
}

export function FloatingPierreDock({
  onAskPierre,
  onNavigateHome,
  onTransfer,
  onOpenMascot,
}: FloatingPierreDockProps) {
  const [prompt, setPrompt] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && prompt.trim()) {
      onAskPierre?.();
      setPrompt("");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-[420px] mx-auto px-4 pb-4 pt-2 z-40 pointer-events-none flex flex-col gap-2">
      {/* 1. Pierre Quick Query Pill */}
      <div className="pointer-events-auto w-full liquid-glass rounded-2xl px-3.5 py-2.5 flex items-center gap-3 shadow-2xl backdrop-blur-2xl">
        {/* Scanner / QR / Search Icon */}
        <div className="text-lime-400 shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6M12 9v6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte ao Pierre"
          className="w-full bg-transparent text-sm text-white placeholder-zinc-400 focus:outline-none"
        />

        {prompt.trim() && (
          <button
            type="button"
            onClick={() => {
              onAskPierre?.();
              setPrompt("");
            }}
            className="w-7 h-7 rounded-full bg-[#ccff00] text-black flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* 2. Glass Capsule Navigation Bar + Mascot Winged Circle */}
      <div className="pointer-events-auto relative w-full flex items-center justify-between">
        {/* Main Glass Nav Dock */}
        <nav className="flex-1 mr-3 h-14 rounded-full liquid-glass-dock px-5 flex items-center justify-between shadow-2xl">
          {/* Home Icon */}
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Início"
            className="p-2 text-lime-400 hover:text-lime-300 transition-colors active:scale-90 cursor-pointer"
          >
            <svg
              className="w-6 h-6 stroke-[2.2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 01-1.5 1.5H15a1 1 0 01-1-1v-4.5h-4V20a1 1 0 01-1 1.5H4.5A1.5 1.5 0 013 20v-9.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Central Mini Avatar or Mascot */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-gradient-to-tr from-purple-800 to-indigo-600 flex items-center justify-center text-xs shadow-inner cursor-pointer hover:scale-105 transition-transform">
            👾
          </div>

          {/* Transfer Double Arrow Icon */}
          <button
            type="button"
            onClick={onTransfer}
            aria-label="Transferências"
            className="p-2 text-zinc-300 hover:text-white transition-colors active:scale-90 cursor-pointer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 16h11m0 0l-3.5-3.5M18 16l-3.5 3.5M17 8H6m0 0l3.5-3.5M6 8l3.5 3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>

        {/* Floating Mascot Button with Glowing Wings & Stack */}
        <button
          type="button"
          onClick={onOpenMascot}
          aria-label="Assistente Pierre"
          className="relative w-14 h-14 rounded-full liquid-glass flex items-center justify-center group active:scale-95 transition-transform cursor-pointer shrink-0 shadow-[0_8px_25px_rgba(204,255,0,0.25)]"
        >
          {/* Wings Effect behind mascot */}
          <div className="absolute -inset-1 bg-gradient-to-r from-lime-400/30 to-purple-400/30 rounded-full blur-sm group-hover:blur-md transition-all pointer-events-none" />
          
          <div className="relative text-2xl select-none animate-pulse">
            🐱
          </div>

          {/* Money Stack badge at bottom */}
          <span className="absolute -bottom-1 -right-1 text-xs">
            💵
          </span>
        </button>
      </div>
    </div>
  );
}
