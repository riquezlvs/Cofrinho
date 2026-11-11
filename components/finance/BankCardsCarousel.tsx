"use client";

import React, { useState } from "react";
import { CreditCardSummary } from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";

interface BankCardsCarouselProps {
  totalInvoices?: number;
  creditCard?: CreditCardSummary;
  cards?: CreditCardSummary[];
  isPrivacyHidden: boolean;
  onConnectBank?: () => void;
  onOpenInvoices?: () => void;
}

function BankCardIcon({ cardName, size = 24 }: { cardName: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const n = (cardName || "").toLowerCase();

  const getDomain = (): string | null => {
    if (n.includes("santander")) return "santander.com.br";
    if (n.includes("nubank") || n.includes("roxinho") || n.includes("nu")) return "nubank.com.br";
    if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
    if (n.includes("inter")) return "inter.co";
    if (n.includes("bradesco")) return "bradesco.com.br";
    if (n.includes("c6")) return "c6bank.com.br";
    if (n.includes("caixa")) return "caixa.gov.br";
    if (n.includes("bb") || n.includes("brasil")) return "bb.com.br";
    if (n.includes("xp")) return "xpi.com.br";
    if (n.includes("btg")) return "btgpactual.com";

    const detected = detectBrand(cardName);
    return detected?.domain || null;
  };

  const domain = getDomain();

  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 64);
    return (
      <div
        className="rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-xs"
        style={{ width: size, height: size }}
        title={cardName}
      >
        <img
          src={faviconUrl}
          alt={cardName}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-[#ec0000] flex items-center justify-center text-white text-[10px] font-bold shrink-0"
    >
      {(cardName || "C")[0].toUpperCase()}
    </div>
  );
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
      {/* Main Glass Card with internal demarkation lines - Height Aumentado */}
      <div className="relative w-full rounded-[32px] liquid-glass p-6 overflow-hidden flex flex-col justify-between min-h-[210px] border border-white/[0.14] shadow-2xl transition-all duration-300">
        {/* Subtle glass reflection highlight */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />

        {activeSlide === 0 ? (
          <>
            {/* Top Centered Action: + Conectar bancos com botão arredondado e liquid glass */}
            <div className="w-full flex justify-center pb-3.5 border-b border-white/[0.08]">
              <button
                type="button"
                onClick={onConnectBank}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold text-white hover:text-white transition-all duration-200 active:scale-95 cursor-pointer liquid-glass-btn shadow-md min-h-[44px]"
              >
                <span className="text-base leading-none font-bold text-lime-400">＋</span>
                <span>Conectar bancos & cartões</span>
              </button>
            </div>

            {/* Bottom Info: Total em faturas e valor */}
            <div
              onClick={onOpenInvoices}
              className="pt-4 pb-2 flex flex-col gap-1 cursor-pointer group/inv"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 tracking-tight group-hover/inv:text-zinc-200 transition-colors">
                  Total em faturas
                </span>
                <span className="text-[11px] text-zinc-300 font-semibold flex items-center gap-2 px-2.5 py-1 rounded-full liquid-glass border border-white/10">
                  <BankCardIcon cardName={activeCard.cardName} size={16} />
                  <span>{activeCard.cardName} • Fecha em {activeCard.closingDays}d</span>
                </span>
              </div>
              <span
                className={`text-3xl font-black tracking-tight text-white mt-1 ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(totalInvoices)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* Slide 1: Detalhe do Cartão Principal com Ícone Original do Banco */}
            <div className="w-full flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <BankCardIcon cardName={activeCard.cardName} size={28} />
                <span className="text-sm font-extrabold text-white">
                  Cartão {activeCard.cardName}
                </span>
              </div>
              <span className="text-xs font-semibold text-zinc-400 px-3 py-1 rounded-full liquid-glass border border-white/10">
                Limite R$ {formatCurrency(activeCard.limit)}
              </span>
            </div>

            {/* Bottom Info: Usado vs Disponível */}
            <div className="pt-4 pb-2 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-400 tracking-tight">
                  Fatura Atual
                </span>
                <span
                  className={`text-xs font-bold text-lime-400 ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  Disp: R$ {formatCurrency(Math.max(0, activeCard.limit - activeCard.spent))}
                </span>
              </div>

              <span
                className={`text-3xl font-black tracking-tight text-white ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(activeCard.spent)}
              </span>

              {/* Barra de Progresso de Limite */}
              <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden flex mt-1">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, activeCard.percentage)}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Pagination Dots with demarkation line above */}
        <div className="w-full flex justify-center items-center gap-2 pt-3 border-t border-white/[0.06]">
          <button
            type="button"
            aria-label="Slide 1"
            onClick={() => setActiveSlide(0)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === 0 ? "w-7 bg-lime-400 shadow-[0_0_10px_rgba(204,255,0,0.5)]" : "w-2 bg-white/30"
            }`}
          />
          <button
            type="button"
            aria-label="Slide 2"
            onClick={() => setActiveSlide(1)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeSlide === 1 ? "w-7 bg-lime-400 shadow-[0_0_10px_rgba(204,255,0,0.5)]" : "w-2 bg-white/30"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
