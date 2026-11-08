"use client";

import React from "react";

interface TopHeaderProps {
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  selectedSegment: "contas" | "cartao" | "investimentos";
  onSelectSegment: (segment: "contas" | "cartao" | "investimentos") => void;
}

export function TopHeader({
  isPrivacyHidden,
  onTogglePrivacy,
  selectedSegment,
  onSelectSegment,
}: TopHeaderProps) {
  return (
    <header className="px-5 pt-3 pb-2 flex flex-col gap-5 shrink-0 z-20">
      {/* Top Bar: Avatar, Eye privacy, and Pierre Pro badge */}
      <div className="flex items-center justify-between">
        {/* Avatar with circular liquid glass rim */}
        <div className="relative group cursor-pointer">
          <div className="w-12 h-12 rounded-full p-0.5 liquid-glass flex items-center justify-center overflow-hidden shadow-lg">
            {/* Visual avatar resembling the image */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-900 via-purple-700 to-pink-500 flex items-center justify-center text-lg font-black text-white shadow-inner">
              🐺
            </div>
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-black" />
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center gap-2">
          {/* Privacy Eye Button with Liquid Glass */}
          <button
            onClick={onTogglePrivacy}
            aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
            className="w-10 h-10 rounded-full liquid-glass liquid-glass-interactive flex items-center justify-center text-white/80 hover:text-white"
            type="button"
          >
            {isPrivacyHidden ? (
              <svg
                className="w-5 h-5 text-white/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-white/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
              >
                <path d="M2 12s3.5-6.5 10-6.5 10 6.5 10 6.5-3.5 6.5-10 6.5-10-6.5z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>

          {/* Pierre Pro Badge - High visibility pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#ccff00] text-black font-semibold text-xs tracking-tight shadow-[0_4px_20px_rgba(204,255,0,0.35)] hover:brightness-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>Pierre Pro</span>
            <span className="text-sm">✪</span>
          </button>
        </div>
      </div>

      {/* Segmented Filter Pills (Contas, Cartão, Investimentos) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => onSelectSegment("contas")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
            selectedSegment === "contas"
              ? "bg-white text-black shadow-md shadow-white/20"
              : "liquid-glass-pill text-white/80 hover:text-white"
          }`}
        >
          Contas
        </button>

        <button
          type="button"
          onClick={() => onSelectSegment("cartao")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-200 cursor-pointer ${
            selectedSegment === "cartao"
              ? "bg-white text-black shadow-md shadow-white/20"
              : "liquid-glass-pill text-white/80 hover:text-white"
          }`}
        >
          Cartão
        </button>

        <button
          type="button"
          onClick={() => onSelectSegment("investimentos")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all duration-200 cursor-pointer ${
            selectedSegment === "investimentos"
              ? "bg-white text-black shadow-md shadow-white/20"
              : "liquid-glass-pill text-white/80 hover:text-white"
          }`}
        >
          Investimentos
        </button>
      </div>
    </header>
  );
}
