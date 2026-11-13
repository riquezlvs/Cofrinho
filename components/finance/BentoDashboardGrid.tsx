"use client";

import React, { useState } from "react";
import {
  CreditCardSummary,
  SubscriptionSummary,
  CategorySpend,
  Person,
  ExtratoTransaction,
} from "@/types/finance";
import { getGoogleFaviconUrl, detectBrand } from "@/lib/brands";
import { Users } from "lucide-react";
import {
  computePeopleDebtSummary,
  getPersonAvatarColor,
  getPersonInitials,
} from "@/lib/peopleSummary";

interface BentoDashboardGridProps {
  isPrivacyHidden: boolean;
  creditCard: CreditCardSummary;
  creditCards?: CreditCardSummary[];
  subscriptions: SubscriptionSummary;
  categories: CategorySpend[];
  people?: Person[];
  allTransactions?: ExtratoTransaction[];
  totalMonthSpent?: number;
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

function SubscriptionLogo({
  service,
  sizeClass = "w-9 h-9 text-sm",
}: {
  service: { name?: string; domain?: string; initial: string; bgColor: string };
  sizeClass?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const getDomain = (): string | null => {
    if (service.domain) return service.domain;
    if (service.name) {
      const b = detectBrand(service.name);
      if (b) return b.domain;
    }
    return null;
  };

  const domain = getDomain();

  if (domain && !imgError) {
    const faviconUrl = getGoogleFaviconUrl(domain, 64);
    return (
      <div
        className={`${sizeClass} rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm ring-2 ring-[#14141a]`}
        title={service.name || domain}
      >
        <img
          src={faviconUrl}
          alt={service.name || domain}
          className="w-full h-full object-cover rounded-full"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: service.bgColor || "#27272a" }}
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-zinc-200 shadow-sm ring-2 ring-[#14141a] border border-white/10 shrink-0`}
      title={service.name}
    >
      {service.initial}
    </div>
  );
}

function CardWidgetIcon({ cardName }: { cardName: string }) {
  const [imgError, setImgError] = useState(false);
  const n = (cardName || "").toLowerCase();

  const getDomain = (): string | null => {
    if (n.includes("santander")) return "santander.com.br";
    if (n.includes("nubank") || n.includes("roxinho") || n.includes("nu")) return "nubank.com.br";
    if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
    if (n.includes("inter")) return "inter.co";
    if (n.includes("bradesco")) return "bradesco.com.br";
    if (n.includes("c6")) return "c6bank.com.br";
    const detected = detectBrand(cardName);
    return detected?.domain || null;
  };

  const domain = getDomain();

  if (domain && !imgError) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#1b1c22] border border-white/15 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
        <img
          src={getGoogleFaviconUrl(domain, 64)}
          alt={cardName}
          className="w-full h-full object-cover rounded-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-rose-400 group-hover:bg-rose-500/10 transition-colors shadow-inner shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function BentoDashboardGrid({
  isPrivacyHidden,
  creditCard,
  creditCards,
  subscriptions,
  categories,
  people = [],
  allTransactions = [],
  totalMonthSpent,
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
  investments: _investments = {
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

  const maxCashVal = Math.max(cashFlow.income, cashFlow.expense, 1);
  const incomeBarWidth = Math.max(12, Math.min(100, Math.round((cashFlow.income / maxCashVal) * 100)));
  const expenseBarWidth = Math.max(12, Math.min(100, Math.round((cashFlow.expense / maxCashVal) * 100)));

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

        {/* Widget 2: Fluxo de Caixa (Top Right) - Idêntico à referência visual com proporção e barras reais */}
        <div
          onClick={() => onWidgetClick?.("fluxo")}
          className="rounded-[28px] liquid-glass-card p-4 sm:p-5 min-h-[168px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
        >
          {/* Top: Título e Valores (Entrada Branca e Saída Vermelha) */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] sm:text-sm font-medium text-zinc-400">Fluxo de caixa</span>
            <span
              className={`text-2xl sm:text-[26px] font-black tracking-tight text-white mt-1 leading-tight ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              R$ {formatCurrency(cashFlow.income)}
            </span>
            <span
              className={`text-lg sm:text-xl font-bold tracking-tight text-[#ff5252] leading-tight ${
                isPrivacyHidden ? "balance-blur" : ""
              }`}
            >
              -R$ {formatCurrency(cashFlow.expense)}
            </span>
          </div>

          {/* Bottom: Gráficos de Barras com Larguras Reais proporcionais (Neon Lime e Coral Red) */}
          <div className="pt-4 flex flex-col gap-2">
            {/* Barra Verde Neon de Entradas */}
            <div
              className="h-2 sm:h-2.5 bg-[#ccff00] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${incomeBarWidth}%` }}
              title={`Entradas: R$ ${formatCurrency(cashFlow.income)}`}
            />
            {/* Barra Vermelha de Saídas */}
            <div
              className="h-2 sm:h-2.5 bg-[#ff5252] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${expenseBarWidth}%` }}
              title={`Saídas: R$ ${formatCurrency(cashFlow.expense)}`}
            />
          </div>
        </div>

        {/* Widget 3: Limite Usado com Donut Ring espesso (Middle Left) */}
        {(() => {
          const cardList =
            creditCards && creditCards.length > 0 ? creditCards : [creditCard];
          const totalUsed = cardList.reduce((s, c) => s + Number(c.spent || 0), 0);
          const totalLim = cardList.reduce((s, c) => s + Number(c.limit || 0), 0);
          const totalDisp = Math.max(0, totalLim - totalUsed);
          const pct =
            totalLim > 0 ? Math.min(100, Math.round((totalUsed / totalLim) * 100)) : 0;
          const ringRadius = 17;
          const ringCirc = 2 * Math.PI * ringRadius;
          const arcLen = (pct / 100) * ringCirc;

          return (
            <div
              onClick={() => onWidgetClick?.("limite")}
              className="rounded-[28px] liquid-glass-card p-4 sm:p-5 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
            >
              <div className="flex items-start justify-between">
                {/* Circular Gauge / Donut espesso sem texto interno */}
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r={ringRadius}
                      fill="none"
                      className="stroke-white/[0.12]"
                      strokeWidth="6"
                    />
                    {pct > 0 && (
                      <circle
                        cx="22"
                        cy="22"
                        r={ringRadius}
                        fill="none"
                        className="stroke-[#ccff00] transition-all duration-500"
                        strokeWidth="6"
                        strokeDasharray={`${arcLen.toFixed(2)} ${ringCirc.toFixed(2)}`}
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                </div>

                <svg
                  className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex flex-col gap-0.5 pt-2">
                <span className="text-xs sm:text-[13px] font-medium text-zinc-400">
                  Limite usado
                </span>
                <span
                  className={`text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  R$ {formatCurrency(totalUsed)}
                </span>
                <span
                  className={`text-xs sm:text-[13px] font-medium text-zinc-400 mt-0.5 ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  Disp: R$ {formatCurrency(totalDisp)}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Widget 4: Parcelamentos (Middle Right) */}
        {(() => {
          const hasData = installments.totalRemaining > 0 && installments.activeCount > 0;
          return (
            <div
              onClick={() => onWidgetClick?.("parcelamentos")}
              className="rounded-[28px] liquid-glass-card p-4 sm:p-5 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
            >
              <div className="flex items-start justify-end">
                <svg
                  className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {hasData ? (
                <>
                  <div className="py-2 flex items-end gap-1.5 h-10">
                    {[100, 82, 68, 52, 38, 24].map((h, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-full bg-purple-400/75 group-hover:bg-purple-400 transition-all duration-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-xs sm:text-[13px] font-medium text-zinc-400">
                      Parcelamentos
                    </span>
                    <span
                      className={`text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      R$ {formatCurrency(installments.totalRemaining)}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                      {installments.activeCount}{" "}
                      {installments.activeCount === 1 ? "compra" : "compras"} em andamento
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center gap-1.5 py-2 text-center">
                    <svg
                      className="w-5 h-5 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.17-2.69M19 13a10 10 0 0 0-3.17-2.12M12 20h.01"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs font-medium text-zinc-400 leading-tight">
                      Sem dados disponíveis
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-xs sm:text-[13px] font-medium text-zinc-400">
                      Parcelamentos
                    </span>
                    <span className="text-xl font-extrabold text-white leading-tight">
                      —
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Widget 5: Fatura Atual com Logo Oficial do Banco do Cartão (Bottom Left) */}
        <div
          onClick={() => onWidgetClick?.("fatura")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300"
        >
          <div className="flex items-start justify-between pb-2 border-b border-white/[0.08]">
            <CardWidgetIcon cardName={creditCard.cardName} />
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
              {creditCard.cardName} • Fecha em {creditCard.closingDays} dias
            </span>
          </div>
        </div>

        {/* Widget 6: Assinaturas (Template Anexo 1 com dados reais) */}
        <div
          onClick={() => onWidgetClick?.("assinaturas")}
          className="rounded-[28px] liquid-glass-card p-4 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
        >
          <div className="flex items-start justify-between">
            {subscriptions.services.length > 0 ? (
              <div className="flex items-center -space-x-2.5">
                {subscriptions.services.slice(0, 3).map((s, idx) => (
                  <SubscriptionLogo
                    key={`${s.name || s.initial}-${idx}`}
                    service={s}
                    sizeClass={
                      subscriptions.services.length === 1
                        ? "w-10 h-10 text-sm"
                        : "w-9 h-9 text-xs"
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
            )}
            <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex flex-col gap-0.5 pt-2">
            <span className="text-xs font-medium text-zinc-400">Assinaturas</span>
            <span className={`text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight ${isPrivacyHidden ? "balance-blur" : ""}`}>
              R$ {formatCurrency(subscriptions.monthlyAmount)}
            </span>
            <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
              {subscriptions.activeCount === 0
                ? "Nenhuma assinatura"
                : subscriptions.nextBillingDays === 0
                ? "Próxima hoje"
                : subscriptions.nextBillingDays === 1
                ? "Próxima em 1 dia"
                : subscriptions.nextBillingDays !== null && subscriptions.nextBillingDays !== undefined
                ? `Próxima em ${subscriptions.nextBillingDays} dias`
                : `${subscriptions.activeCount} ${subscriptions.activeCount === 1 ? "ativa" : "ativas"}`}
            </span>
          </div>
        </div>

        {/* Widget 7: Gastos por Categoria (Gastos • este mês com barra segmentada) */}
        {(() => {
          const activeCats = categories.filter((c) => c.amount > 0);
          const totalCatAmt = activeCats.reduce((sum, c) => sum + c.amount, 0);
          const displaySpent = totalMonthSpent !== undefined ? totalMonthSpent : totalCatAmt;
          const fallbackColors = ["#ff6b00", "#ccff00", "#38bdf8", "#a855f7", "#ec4899"];

          return (
            <div
              onClick={() => onWidgetClick?.("gastos-categorias")}
              className="rounded-[28px] liquid-glass-card p-4 sm:p-5 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
            >
              <div className="flex items-center justify-end">
                <svg
                  className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="py-2">
                {activeCats.length > 0 && totalCatAmt > 0 ? (
                  <div className="w-full h-4 sm:h-5 flex items-center gap-1">
                    {activeCats.map((cat, idx) => {
                      const pct = (cat.amount / totalCatAmt) * 100;
                      const barColor =
                        cat.color || fallbackColors[idx % fallbackColors.length];
                      return (
                        <div
                          key={`${cat.name}-${idx}`}
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(6, pct)}%`,
                            backgroundColor: barColor,
                          }}
                          title={`${cat.name}: R$ ${formatCurrency(cat.amount)}`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-4 sm:h-5 rounded-full bg-white/[0.08]" />
                )}
              </div>

              <div className="flex flex-col gap-0.5 pt-1">
                <span className="text-[11px] sm:text-xs font-medium text-zinc-400">
                  Gastos • este mês
                </span>
                <span
                  className={`text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  R$ {formatCurrency(displaySpent)}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                  {activeCats.length === 0
                    ? "Nenhuma categoria"
                    : activeCats.length === 1
                    ? "1 categoria"
                    : `${activeCats.length} categorias`}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Widget 8: Pessoas (Cadastro e quanto cada um está devendo) */}
        {(() => {
          const { summaries, totalOwed, debtorsCount } = computePeopleDebtSummary(
            people,
            allTransactions
          );
          const previewPeople = summaries.slice(0, 3);

          return (
            <div
              onClick={() => onWidgetClick?.("pessoas")}
              className="rounded-[28px] liquid-glass-card p-4 sm:p-5 min-h-[164px] flex flex-col justify-between cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.98] select-none"
            >
              <div className="flex items-start justify-between">
                {previewPeople.length > 0 ? (
                  <div className="flex items-center -space-x-2.5">
                    {previewPeople.map((entry) => (
                      <div
                        key={entry.person.id}
                        style={{
                          backgroundColor: getPersonAvatarColor(entry.person.name),
                        }}
                        className={`${
                          previewPeople.length === 1
                            ? "w-10 h-10 text-sm"
                            : "w-9 h-9 text-xs"
                        } rounded-full flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-[#14141a] border border-white/10 shrink-0`}
                        title={`${entry.person.name}${
                          entry.totalOwed > 0
                            ? `: R$ ${formatCurrency(entry.totalOwed)}`
                            : ""
                        }`}
                      >
                        {getPersonInitials(entry.person.name)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-zinc-300 group-hover:text-[#ccff00] group-hover:bg-[#ccff00]/10 transition-colors shadow-inner">
                    <Users className="w-4 h-4" />
                  </div>
                )}

                <svg
                  className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors mt-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex flex-col gap-0.5 pt-2">
                <span className="text-xs font-medium text-zinc-400">Pessoas</span>
                <span
                  className={`text-xl sm:text-[22px] font-extrabold text-white tracking-tight leading-tight ${
                    isPrivacyHidden ? "balance-blur" : ""
                  }`}
                >
                  R$ {formatCurrency(totalOwed)}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 mt-0.5">
                  {summaries.length === 0
                    ? "Nenhuma cadastrada"
                    : debtorsCount > 0
                    ? `${summaries.length} ${
                        summaries.length === 1 ? "pessoa" : "pessoas"
                      } • ${debtorsCount} devendo`
                    : `${summaries.length} ${
                        summaries.length === 1 ? "cadastrada" : "cadastradas"
                      } • Tudo quitado`}
                </span>
              </div>
            </div>
          );
        })()}
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
