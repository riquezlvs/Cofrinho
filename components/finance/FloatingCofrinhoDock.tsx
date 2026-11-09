"use client";

import React, { useState } from "react";

export interface FloatingCofrinhoDockProps {
  activeTab?: "home" | "extrato";
  onAskCofrinho?: () => void;
  onNavigateHome?: () => void;
  onTransfer?: () => void;
  onOpenMascot?: () => void;
  placeholder?: string;
  hidden?: boolean;
}

export function FloatingCofrinhoDock({
  activeTab = "home",
  onAskCofrinho,
  onNavigateHome,
  onTransfer,
  onOpenMascot,
  placeholder = "Pergunte ao Pierre",
  hidden = false,
}: FloatingCofrinhoDockProps) {
  const [prompt, setPrompt] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && prompt.trim()) {
      onAskCofrinho?.();
      setPrompt("");
    }
  };

  if (hidden) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 w-full max-w-full sm:max-w-[440px] md:max-w-[460px] mx-auto px-4 pb-5 sm:pb-6 pt-2 z-40 pointer-events-none flex flex-col gap-2.5"
      data-purpose="floating-bottom-dock"
    >
      {/* 1. Cofrinho / Pierre Quick Query Pill */}
      <div className="pointer-events-auto w-full liquid-glass rounded-2xl px-4 py-3 sm:py-3.5 min-h-[48px] flex items-center gap-3 shadow-2xl backdrop-blur-2xl border border-white/[0.14]">
        {/* Scanner / QR / Search Icon */}
        <div className="text-lime-400 shrink-0">
          <svg
            className="w-5 h-5 sm:w-5.5 sm:h-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
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
          placeholder={placeholder}
          className="w-full bg-transparent text-sm sm:text-[15px] text-white placeholder-zinc-400 focus:outline-none"
        />

        {prompt.trim() && (
          <button
            type="button"
            onClick={() => {
              onAskCofrinho?.();
              setPrompt("");
            }}
            className="w-8 h-8 rounded-full bg-[#ccff00] text-black flex items-center justify-center shrink-0 active:scale-95 transition-transform cursor-pointer shadow-md"
            aria-label="Enviar pergunta"
          >
            <svg
              className="w-4 h-4"
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

      {/* 2. Glass Capsule Navigation Bar + Mascot */}
      <div className="pointer-events-auto relative w-full flex items-center justify-between">
        {/* Main Glass Nav Dock */}
        <nav className="flex-1 mr-3 h-16 rounded-full liquid-glass-dock px-6 flex items-center justify-between shadow-2xl border border-white/[0.18]">
          {/* Home Icon */}
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Início"
            className={`transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center ${
              activeTab === "home"
                ? "bg-[#1f2026] text-lime-400 px-4 py-2 rounded-full border border-white/10 shadow-inner"
                : "p-2.5 text-zinc-400 hover:text-white rounded-full"
            }`}
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

          {/* Central Mini Avatar or Pierre Team */}
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-gradient-to-tr from-purple-900 via-indigo-900 to-zinc-900 flex items-center justify-center shadow-inner cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none">
            <div className="flex -space-x-1.5 items-center">
              <span className="text-[11px]">🐺</span>
              <span className="text-[11px]">🐷</span>
            </div>
          </div>

          {/* Transfer / Extrato Double Arrow Icon (Setinhas) */}
          <button
            type="button"
            onClick={onTransfer}
            aria-label="Extrato e atividades"
            className={`transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center ${
              activeTab === "extrato"
                ? "bg-[#1f2026] text-lime-400 px-4 py-2 rounded-full border border-white/10 shadow-inner"
                : "p-2.5 text-zinc-300 hover:text-white rounded-full"
            }`}
          >
            <svg
              className="w-5.5 h-5.5 stroke-[2.4]"
              fill="none"
              stroke="currentColor"
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

        {/* Floating Mascot Button with Shades */}
        <button
          type="button"
          onClick={onOpenMascot}
          aria-label="Assistente Pierre"
          className="relative w-16 h-16 rounded-full liquid-glass flex items-center justify-center group active:scale-95 transition-transform cursor-pointer shrink-0 shadow-[0_8px_25px_rgba(204,255,0,0.2)] border border-white/[0.18]"
        >
          {/* Subtle glow behind mascot */}
          <div className="absolute -inset-1 bg-gradient-to-r from-lime-400/20 to-purple-400/20 rounded-full blur-sm group-hover:blur-md transition-all pointer-events-none" />

          {/* Pierre Mascot Vector with Sunglasses */}
          <svg
            className="w-8 h-8 text-white relative z-10"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Ears and face outline */}
            <path d="M7 13 L6 6 L12 9.5 C13.3 9.2 14.6 9 16 9 C17.4 9 18.7 9.2 20 9.5 L26 6 L25 13 C26.3 15 27 17.4 27 20 C27 25 22 28 16 28 C10 28 5 25 5 20 C5 17.4 5.7 15 7 13 Z" />
            {/* Sunglasses left lens */}
            <path d="M8 17 H14 V20 C14 21.1 13.1 22 12 22 H10 C8.9 22 8 21.1 8 20 V17 Z" fill="white" />
            {/* Sunglasses right lens */}
            <path d="M18 17 H24 V20 C24 21.1 23.1 22 22 22 H20 C18.9 22 18 21.1 18 20 V17 Z" fill="white" />
            {/* Sunglasses bridge */}
            <path d="M14 18.5 H18" strokeWidth="2" />
            {/* Cat mouth :3 */}
            <path d="M13.5 24.5 C14.5 25.4 15.3 25.4 16 24.8 C16.7 25.4 17.5 25.4 18.5 24.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
