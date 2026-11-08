"use client";

import React from "react";

interface MonthlySpendingCardProps {
  totalSpent: number;
  limitPlanned?: number;
  percentageConsumed?: number;
  isPrivacyHidden: boolean;
  onOpenDetails?: () => void;
}

export function MonthlySpendingCard({
  totalSpent,
  limitPlanned = 4000.0,
  percentageConsumed,
  isPrivacyHidden,
  onOpenDetails,
}: MonthlySpendingCardProps) {
  const percentage =
    percentageConsumed !== undefined
      ? percentageConsumed
      : limitPlanned > 0
      ? Math.min(100, Math.round((totalSpent / limitPlanned) * 100))
      : 0;

  // Garante que haja um indicador visual mesmo com 0 gastos ou gastos iniciais
  const displayProgress = Math.max(2, Math.min(100, percentage));

  return (
    <div
      onClick={onOpenDetails}
      className="w-full rounded-[28px] liquid-glass-card p-5 border border-white/[0.12] flex flex-col justify-between min-h-[148px] shadow-2xl cursor-pointer group hover:border-white/30 transition-all duration-300"
    >
      {/* Top Header: Gastos do mês > */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
          Gastos do mês
        </span>
        <svg
          className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Valor do Gasto */}
      <div className="py-2 flex flex-col">
        <span
          className={`text-3xl font-extrabold tracking-tight text-white ${
            isPrivacyHidden ? "balance-blur" : ""
          }`}
        >
          R${" "}
          {totalSpent.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* Barra de Progresso Verde Neon com Ponto Marcador na Ponta */}
      <div className="pt-2">
        <div className="relative w-full h-1.5 bg-white/[0.08] rounded-full flex items-center">
          {/* Trilha Verde Neon preenchida */}
          <div
            className="h-full bg-[#a6e22e] rounded-full transition-all duration-500"
            style={{ width: `${displayProgress}%` }}
          />

          {/* Marcador circular luminoso na extremidade */}
          <div
            className="absolute -top-[3px] w-3 h-3 rounded-full bg-[#ccff00] border-2 border-zinc-900 shadow-[0_0_8px_#ccff00] transition-all duration-500 -ml-1.5"
            style={{ left: `${displayProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
