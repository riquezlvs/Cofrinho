"use client";

import React, { useState } from "react";

interface BankCardsCarouselProps {
  isPrivacyHidden: boolean;
  onConnectBank?: () => void;
}

export function BankCardsCarousel({
  isPrivacyHidden,
  onConnectBank,
}: BankCardsCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Main Glass Card with internal demarkation lines */}
      <div className="relative w-full rounded-[28px] liquid-glass-card p-5 overflow-hidden flex flex-col justify-between min-h-[168px] border border-white/[0.12] shadow-2xl">
        {/* Subtle glass reflection highlight */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />

        {/* Top Centered Action: + Conectar bancos */}
        <div className="w-full flex justify-center pb-3 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={onConnectBank}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-white/90 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer border border-white/10 bg-white/[0.04] hover:bg-white/[0.09] shadow-sm"
          >
            <span className="text-base leading-none font-light">＋</span>
            <span>Conectar bancos</span>
          </button>
        </div>

        {/* Bottom Info: Total em faturas e valor */}
        <div className="pt-3 pb-2 flex flex-col gap-0.5">
          <span className="text-[11px] font-medium text-zinc-400 tracking-tight">
            Total em faturas
          </span>
          <span
            className={`text-2xl font-bold tracking-tight text-white ${
              isPrivacyHidden ? "balance-blur" : ""
            }`}
          >
            R$ 0,00
          </span>
        </div>

        {/* Pagination Dots with demarkation line above */}
        <div className="w-full flex justify-center items-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            aria-label="Slide 1"
            onClick={() => setActiveSlide(0)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === 0 ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
          <button
            type="button"
            aria-label="Slide 2"
            onClick={() => setActiveSlide(1)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === 1 ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
