"use client";

import React from "react";

export type SegmentType = "contas" | "cartao" | "investimentos";

export interface TopHeaderProps {
  userName?: string;
  showNameInHeader?: boolean;
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onOpenProfile?: () => void;
}

export function TopHeader({
  userName = "João",
  showNameInHeader = false,
  isPrivacyHidden,
  onTogglePrivacy,
  onOpenProfile,
}: TopHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 w-full px-4 sm:px-5 pt-3 pb-4 transition-all duration-300 select-none"
      data-purpose="fixed-top-header"
    >
      {/* 
        Camada de Gradiente Sombreado Fixo:
        Gradiente permanente de cima para baixo bem transparente com desfoque fosco gradual e sem bordas duras.
      */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0, 0, 0, 0.94) 0%, rgba(0, 0, 0, 0.72) 48%, rgba(0, 0, 0, 0.32) 78%, rgba(0, 0, 0, 0) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          maskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 55%, rgba(0, 0, 0, 0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 1) 55%, rgba(0, 0, 0, 0) 100%)",
        }}
      />

      {/* Conteúdo do Header posicionado sobre a camada de gradiente */}
      <div className="relative z-10 flex items-center justify-between w-full">
        {/* Left Side: Avatar + Nome animado quando "Boa tarde, João" some ao rolar */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with circular liquid glass rim */}
          <div
            onClick={onOpenProfile}
            className="relative group cursor-pointer shrink-0"
            role="button"
            tabIndex={0}
            aria-label="Perfil do usuário"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full p-0.5 liquid-glass flex items-center justify-center overflow-hidden shadow-lg transition-transform active:scale-95">
              {/* Visual avatar */}
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-900 via-purple-700 to-pink-500 flex items-center justify-center text-lg font-black text-white shadow-inner select-none">
                🐺
              </div>
            </div>
            {/* Online status indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-black shadow-xs" />
          </div>

          {/* Nome revelado ao rolar (quando "Boa tarde, João" some da tela) */}
          <div
            className={`flex flex-col justify-center transition-all duration-300 ease-out overflow-hidden ${
              showNameInHeader
                ? "opacity-100 translate-x-0 max-w-[160px]"
                : "opacity-0 -translate-x-3 max-w-0 pointer-events-none"
            }`}
          >
            <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight">
              {userName}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium leading-tight mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
              Cofrinho
            </span>
          </div>
        </div>

        {/* Right Action: Ocultar números sensíveis */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Privacy Eye Button with Liquid Glass */}
          <button
            onClick={onTogglePrivacy}
            aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
            className="w-11 h-11 rounded-full liquid-glass liquid-glass-interactive flex items-center justify-center text-white/85 hover:text-white cursor-pointer active:scale-95 transition-all shadow-md"
            type="button"
          >
            {isPrivacyHidden ? (
              <svg
                className="w-5 h-5 text-white/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeWidth="1.9" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-white/90"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 12s3.5-6.5 10-6.5 10 6.5 10 6.5-3.5 6.5-10 6.5-10-6.5z"
                />
                <circle cx="12" cy="12" r="3" strokeWidth="1.9" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

interface SegmentedFilterPillsProps {
  selectedSegment: SegmentType;
  onSelectSegment: (segment: SegmentType) => void;
}

export function SegmentedFilterPills({
  selectedSegment,
  onSelectSegment,
}: SegmentedFilterPillsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <button
        type="button"
        onClick={() => onSelectSegment("contas")}
        className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer min-h-[38px] ${
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
        className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer min-h-[38px] ${
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
        className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 cursor-pointer min-h-[38px] ${
          selectedSegment === "investimentos"
            ? "bg-white text-black shadow-md shadow-white/20"
            : "liquid-glass-pill text-white/80 hover:text-white"
        }`}
      >
        Investimentos
      </button>
    </div>
  );
}
