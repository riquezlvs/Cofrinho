"use client";

import React, { useState } from "react";
import { CreditCardSummary } from "@/types/finance";

interface BankCardsCarouselProps {
  totalInvoices?: number;
  creditCard?: CreditCardSummary;
  cards?: CreditCardSummary[];
  isPrivacyHidden: boolean;
  onConnectBank?: () => void;
  onOpenInvoices?: () => void;
}

export function BankCardsCarousel({
  totalInvoices = 0,
  creditCard,
  cards,
  isPrivacyHidden,
  onConnectBank,
  onOpenInvoices,
}: BankCardsCarouselProps) {
  const [activeSlide, setActiveSlide] = useState(0);

  const activeCard = creditCard || cards?.[0] || {
    cardName: "Santander",
    spent: totalInvoices,
    limit: 6000.0,
    percentage: 0,
    closingDays: 14,
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Main Glass Card with internal demarkation lines */}
      <div className="relative w-full rounded-[28px] liquid-glass-card p-5 overflow-hidden flex flex-col justify-between min-h-[174px] border border-white/[0.12] shadow-2xl transition-all duration-300">
        {/* Subtle glass reflection highlight */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />

        {activeSlide === 0 ? (
          <>
            {/* Top Centered Action: + Conectar bancos */}
            <div className="w-full flex justify-center pb-3 border-b border-white/[0.08]">
              <button
                type="button"
                onClick={onConnectBank}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white/90 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] shadow-sm min-h-[42px]"
              >
                <span className="text-base leading-none font-light">＋</span>
                <span>Conectar bancos</span>
              </button>
            </div>

            {/* Bottom Info: Total em faturas e valor */}
            <div
              onClick={onOpenInvoices}
              className="pt-3 pb-2 flex flex-col gap-0.5 cursor-pointer group/inv"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 tracking-tight group-hover/inv:text-zinc-200 transition-colors">
                  Total em faturas
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {activeCard.cardName} • Fecha em {activeCard.closingDays} dias
                </span>
              </div>
              <span
                className={`text-2xl font-bold tracking-tight text-white ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(totalInvoices)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Slide 1: Detalhe do Cartão Principal */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#ec0000] flex items-center justify-center text-white text-[10px] font-bold">
                  S
                </div>
                <span className="text-xs font-semibold text-white">
                  Cartão {activeCard.cardName}
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">
                Limite R$ {formatCurrency(activeCard.limit)}
              </span>
            </div>

            {/* Bottom Info: Usado vs Disponível */}
            <div className="pt-3 pb-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 tracking-tight">
                  Fatura Atual
                </span>
                <span
                  className={`text-[11px] text-zinc-300 ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  Disp: R$ {formatCurrency(Math.max(0, activeCard.limit - activeCard.spent))}
                </span>
              </div>

              <span
                className={`text-2xl font-bold tracking-tight text-white ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(activeCard.spent)}
              </span>

              {/* Barra de Progresso de Limite */}
              <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, activeCard.percentage)}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Pagination Dots with demarkation line above */}
        <div className="w-full flex justify-center items-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            aria-label="Slide 1"
            onClick={() => setActiveSlide(0)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === 0 ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
          <button
            type="button"
            aria-label="Slide 2"
            onClick={() => setActiveSlide(1)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === 1 ? "w-5 bg-white" : "w-1.5 bg-white/30"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
