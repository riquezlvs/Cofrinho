"use client";

import React from "react";
import { CreditCardSummary, SubscriptionSummary, CategorySpend } from "@/types/finance";

interface BentoDashboardGridProps {
  isPrivacyHidden: boolean;
  creditCard: CreditCardSummary;
  subscriptions: SubscriptionSummary;
  categories: CategorySpend[];
  topCategoryName?: string;
  cashFlow?: {
    income: number;
    expense: number;
    balance: number;
  };
  installments?: {
    totalRemaining: number;
    activeCount: number;
    nextBillAmount: number;
  };
  investments?: {
    total: number;
    profitability: number;
  };
  onWidgetClick?: (widgetName: string) => void;
  onAddWidgets?: () => void;
}

export function BentoDashboardGrid({
  isPrivacyHidden,
  creditCard,
  subscriptions,
  categories,
  topCategoryName = "Alimentação",
  cashFlow = {
    income: 1250.0,
    expense: 2539.9,
    balance: -1289.9,
  },
  installments = {
    totalRemaining: 2510.5,
    activeCount: 1,
    nextBillAmount: 251.05,
  },
  investments = {
    total: 12450.0,
    profitability: 1.15,
  },
  onWidgetClick,
  onAddWidgets,
}: BentoDashboardGridProps) {
  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const cashTotal = (cashFlow.income + cashFlow.expense) || 1;
  const incomePercent = Math.min(100, Math.max(15, Math.round((cashFlow.income / cashTotal) * 100)));
  const expensePercent = Math.min(100, Math.max(15, Math.round((cashFlow.expense / cashTotal) * 100)));

  return (
    <section className="w-full flex flex-col gap-4">
      {/* 2-Column Bento Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Widget 1: Transações / Gastos Recentes por Categoria (Top Left) */}
        <div
          onClick={() => onWidgetClick?.("transacoes")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            {/* Category / Signal Icon */}
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-lime-400 group-hover:bg-lime-400/10 transition-colors shadow-inner">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-1 pt-2">
            <span className="text-[11px] font-medium text-zinc-400">Transações</span>
            <span className={`text-base font-bold text-white tracking-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              {categories.length > 0 ? `${categories.length} categorias` : "5 novas"}
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-zinc-400">{topCategoryName} maior</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Fluxo de Caixa (Top Right) */}
        <div
          onClick={() => onWidgetClick?.("fluxo")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-zinc-400">Fluxo de caixa</span>
              <span className={`text-lg font-bold text-white tracking-tight mt-0.5 ${isPrivacyHidden ? "balance-blur" : ""}`}>
                {cashFlow.balance >= 0 ? "+" : ""}R$ {formatCurrency(cashFlow.balance)}
              </span>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Mini Bar Chart / Cashflow bars */}
          <div className="pt-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="text-emerald-400 font-semibold">Entradas</span>
              <span className={isPrivacyHidden ? "balance-blur" : ""}>R$ {formatCurrency(cashFlow.income)}</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${incomePercent}%` }} />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5">
              <span className="text-rose-400 font-semibold">Saídas</span>
              <span className={isPrivacyHidden ? "balance-blur" : ""}>R$ {formatCurrency(cashFlow.expense)}</span>
            </div>
            <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden flex">
              <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${expensePercent}%` }} />
            </div>
          </div>
        </div>

        {/* Widget 3: Limite Usado com Donut Ring (Middle Left) */}
        <div
          onClick={() => onWidgetClick?.("limite")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            {/* Circular Gauge / Donut */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-white/10"
                  strokeWidth="3.5"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-lime-400"
                  strokeWidth="3.5"
                  strokeDasharray={`${(creditCard.percentage / 100) * 88} 88`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-white">
                {creditCard.percentage}%
              </span>
            </div>

            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-0.5 pt-2">
            <span className="text-[11px] font-medium text-zinc-400">Limite usado</span>
            <span className={`text-base font-bold text-white tracking-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              R$ {formatCurrency(creditCard.spent)}
            </span>
            <span className={`text-[10px] text-zinc-400 ${isPrivacyHidden ? "balance-blur" : ""}`}>
              Disp: R$ {formatCurrency(Math.max(0, creditCard.limit - creditCard.spent))}
            </span>
          </div>
        </div>

        {/* Widget 4: Parcelamentos (Middle Right) */}
        <div
          onClick={() => onWidgetClick?.("parcelamentos")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors shadow-inner">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 10h16M4 14h8M4 18h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-0.5 pt-2">
            <span className="text-[11px] font-medium text-zinc-400">Parcelamentos</span>
            <span className={`text-base font-bold text-white tracking-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              R$ {formatCurrency(installments.totalRemaining)}
            </span>
            <span className="text-[10px] text-zinc-400">
              {installments.activeCount} compras em andamento
            </span>
          </div>
        </div>

        {/* Widget 5: Fatura Atual (Bottom Left) */}
        <div
          onClick={() => onWidgetClick?.("fatura")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors shadow-inner">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-0.5 pt-2">
            <span className="text-[11px] font-medium text-zinc-400">Fatura Atual</span>
            <span className={`text-base font-bold text-white tracking-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              R$ {formatCurrency(creditCard.spent)}
            </span>
            <span className="text-[10px] text-zinc-400">
              Fecha em {creditCard.closingDays} dias
            </span>
          </div>
        </div>

        {/* Widget 6: Assinaturas (Bottom Right) */}
        <div
          onClick={() => onWidgetClick?.("assinaturas")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors shadow-inner">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-0.5 pt-2">
            <span className="text-[11px] font-medium text-zinc-400">Assinaturas</span>
            <span className={`text-base font-bold text-white tracking-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              R$ {formatCurrency(subscriptions.monthlyAmount)}
            </span>
            {/* Badges de Serviços Ativos */}
            <div className="flex items-center gap-1 pt-1">
              {subscriptions.services.slice(0, 3).map((s, idx) => (
                <div
                  key={idx}
                  style={{ backgroundColor: s.bgColor }}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                >
                  {s.initial}
                </div>
              ))}
              <span className="text-[10px] text-zinc-400 ml-0.5">
                {subscriptions.activeCount} ativas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botão + Adicionar widgets exatamente como na referência */}
      <div className="w-full flex justify-center pt-2 pb-4">
        <button
          type="button"
          onClick={onAddWidgets}
          className="flex items-center gap-2 px-6 py-3 rounded-full liquid-glass-pill liquid-glass-interactive text-xs sm:text-sm font-semibold text-white/95 hover:text-white shadow-lg cursor-pointer min-h-[44px]"
        >
          <span className="text-base leading-none font-light">＋</span>
          <span>Adicionar widgets</span>
        </button>
      </div>
    </section>
  );
}
