"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Eye,
  EyeOff,
  List,
} from "lucide-react";
import {
  CreditCardSummary,
  ExtratoTransaction,
  InstallmentSummary,
} from "@/types/finance";
import { Portal } from "@/components/ui/Portal";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { detectBrand, getGoogleFaviconUrl } from "@/lib/brands";
import { doesTransactionBelongToCycle, getBillingCycleByOffset } from "@/lib/billingCycle";

export type CardLimitsTab = "faturas" | "parcelas" | "limites";

interface CardLimitsDetailsScreenProps {
  isOpen: boolean;
  initialTab?: CardLimitsTab;
  onClose: () => void;
  cards: CreditCardSummary[];
  installments?: InstallmentSummary;
  allTransactions?: ExtratoTransaction[];
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
}

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CardBankBadge({ cardName, color }: { cardName: string; color?: string }) {
  const [imgError, setImgError] = useState(false);
  const n = (cardName || "").toLowerCase();

  const domain = useMemo(() => {
    if (n.includes("santander")) return "santander.com.br";
    if (n.includes("nubank") || n.includes("roxinho") || n.includes("nu"))
      return "nubank.com.br";
    if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
    if (n.includes("inter")) return "inter.co";
    if (n.includes("bradesco")) return "bradesco.com.br";
    if (n.includes("c6")) return "c6bank.com.br";
    return detectBrand(cardName)?.domain || null;
  }, [cardName, n]);

  if (domain && !imgError) {
    return (
      <div className="w-10 h-10 rounded-full bg-[#1b1c22] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
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
    <div
      className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white shrink-0"
      style={{ backgroundColor: color || "#27272a" }}
    >
      <CreditCard className="w-4 h-4" />
    </div>
  );
}

export function CardLimitsDetailsScreen({
  isOpen,
  initialTab = "limites",
  onClose,
  cards,
  installments,
  allTransactions = [],
  isPrivacyHidden,
  onTogglePrivacy,
}: CardLimitsDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<CardLimitsTab>(initialTab);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarMode, setCalendarMode] = useState<"mensal" | "diaria">("mensal");
  const [selectedInvoiceMonthIdx, setSelectedInvoiceMonthIdx] = useState<number>(7);
  const [selectedParcelMonthIdx, setSelectedParcelMonthIdx] = useState<number>(0);
  const [selectedCardId, setSelectedCardId] = useState<string>("all");

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const cardsWithLimits = useMemo(
    () => cards.filter((c) => Number(c.limit || 0) > 0),
    [cards]
  );

  const totalSpent = useMemo(
    () => cards.reduce((s, c) => s + Number(c.spent || 0), 0),
    [cards]
  );
  const totalLimit = useMemo(
    () => cards.reduce((s, c) => s + Number(c.limit || 0), 0),
    [cards]
  );
  const totalAvailable = Math.max(0, totalLimit - totalSpent);
  const totalPercentage =
    totalLimit > 0 ? Math.min(100, Math.round((totalSpent / totalLimit) * 100)) : 0;

  // Transações no cartão de crédito no ciclo de fatura selecionado
  const selectedInvoiceOffset = selectedInvoiceMonthIdx - 7;

  const creditTransactions = useMemo(() => {
    const now = new Date();
    return allTransactions
      .filter((tx) => {
        if (tx.type !== "expense" || tx.isHidden) return false;
        if (tx.paymentMethod !== "credit" && !tx.creditCardId) return false;
        const txCardName = (tx.accountOrCard || tx.accountName || "").toLowerCase();
        const card =
          cards.find((c) => c.id && c.id === tx.creditCardId) ||
          cards.find((c) => txCardName && txCardName.includes(c.cardName.toLowerCase())) ||
          cards[0];
        if (
          selectedCardId !== "all" &&
          card &&
          (card.id || card.cardName) !== selectedCardId
        ) {
          return false;
        }
        const cycle = getBillingCycleByOffset(
          card?.closingDay || 24,
          card?.dueDay || 1,
          selectedInvoiceOffset,
          now
        );
        return doesTransactionBelongToCycle(tx.dateGroup || tx.transactionDate, cycle);
      });
  }, [allTransactions, cards, selectedCardId, selectedInvoiceOffset]);

  // Parcelamentos ativos agrupados
  const activeInstallmentGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        title: string;
        amountPerParcel: number;
        totalParcels: number;
        paidParcels: number;
        remainingAmount: number;
        nextDate?: string;
        categoryIcon?: string;
        cardName?: string;
      }
    >();

    for (const tx of allTransactions) {
      if (tx.type !== "expense" || tx.isHidden) continue;
      if (!tx.installmentTotal || tx.installmentTotal <= 1) continue;

      const key = tx.installmentGroupId || tx.title.toLowerCase();
      const existing = groups.get(key);
      const isPending = tx.status === "pending";

      if (existing) {
        if (isPending) {
          existing.remainingAmount = Number(
            (existing.remainingAmount + Number(tx.amount || 0)).toFixed(2)
          );
          if (
            !existing.nextDate ||
            (tx.dateGroup && tx.dateGroup < existing.nextDate)
          ) {
            existing.nextDate = tx.dateGroup;
          }
        } else {
          existing.paidParcels = Math.max(
            existing.paidParcels,
            tx.installmentNumber || 1
          );
        }
      } else {
        groups.set(key, {
          key,
          title: tx.title,
          amountPerParcel: Number(tx.amount || 0),
          totalParcels: tx.installmentTotal,
          paidParcels: isPending ? Math.max(0, (tx.installmentNumber || 1) - 1) : tx.installmentNumber || 1,
          remainingAmount: isPending ? Number(tx.amount || 0) : 0,
          nextDate: isPending ? tx.dateGroup : undefined,
          categoryIcon: tx.categoryIcon,
          cardName: tx.accountOrCard,
        });
      }
    }

    return Array.from(groups.values()).sort(
      (a, b) => b.remainingAmount - a.remainingAmount
    );
  }, [allTransactions]);

  // Previsão de parcelas dos próximos 6 meses
  const { currentMonthName, committedThisMonth, totalRemainingInstallments, sixMonthForecast } =
    useMemo(() => {
      const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
      ];
      const monthShorts = [
        "JAN",
        "FEV",
        "MAR",
        "ABR",
        "MAI",
        "JUN",
        "JUL",
        "AGO",
        "SET",
        "OUT",
        "NOV",
        "DEZ",
      ];
      const now = new Date();
      const baseYear = now.getFullYear();
      const baseMonth = now.getMonth();

      const forecast: { prefix: string; label: string; amount: number }[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(baseYear, baseMonth + i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const prefix = `${y}-${String(m + 1).padStart(2, "0")}`;
        const label =
          y === baseYear
            ? monthShorts[m]
            : `${monthShorts[m]}/${String(y).slice(-2)}`;

        const amount = allTransactions
          .filter(
            (tx) =>
              tx.type === "expense" &&
              !tx.isHidden &&
              tx.installmentTotal &&
              tx.installmentTotal > 1 &&
              (tx.dateGroup || tx.transactionDate || "").startsWith(prefix)
          )
          .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

        forecast.push({
          prefix,
          label,
          amount: Number(amount.toFixed(2)),
        });
      }

      const txRemaining = activeInstallmentGroups.reduce(
        (s, g) => s + g.remainingAmount,
        0
      );
      const effectiveRemaining =
        txRemaining > 0
          ? txRemaining
          : installments?.totalRemaining || 0;

      return {
        currentMonthName: monthNames[baseMonth],
        committedThisMonth: forecast[0]?.amount || 0,
        totalRemainingInstallments: effectiveRemaining,
        sixMonthForecast: forecast,
      };
    }, [allTransactions, activeInstallmentGroups, installments]);

  // Gráfico de Faturas (7 meses anteriores + mês atual = 8 meses)
  const invoiceHistory = useMemo(() => {
    const now = new Date();
    const shortToFullMonth: Record<string, string> = {
      JAN: "Janeiro",
      FEV: "Fevereiro",
      MAR: "Março",
      ABR: "Abril",
      MAI: "Maio",
      JUN: "Junho",
      JUL: "Julho",
      AGO: "Agosto",
      SET: "Setembro",
      OUT: "Outubro",
      NOV: "Novembro",
      DEZ: "Dezembro",
    };

    const items = [];
    for (let offset = -7; offset <= 0; offset++) {
      const refCard =
        selectedCardId !== "all"
          ? cards.find((c) => (c.id || c.cardName) === selectedCardId) || cards[0]
          : cards[0];
      const refCycle = getBillingCycleByOffset(
        refCard?.closingDay || 24,
        refCard?.dueDay || 1,
        offset,
        now
      );
      const shortUpper = refCycle.shortLabel.toUpperCase();
      const fullMonthName = shortToFullMonth[shortUpper] || refCycle.shortLabel;

      let amount = allTransactions
        .filter((tx) => {
          if (tx.type !== "expense" || tx.isHidden) return false;
          if (tx.paymentMethod !== "credit" && !tx.creditCardId) return false;
          const txCardName = (tx.accountOrCard || tx.accountName || "").toLowerCase();
          const card =
            cards.find((c) => c.id && c.id === tx.creditCardId) ||
            cards.find((c) => txCardName && txCardName.includes(c.cardName.toLowerCase())) ||
            refCard;
          if (
            selectedCardId !== "all" &&
            card &&
            (card.id || card.cardName) !== selectedCardId
          ) {
            return false;
          }
          const cycle = getBillingCycleByOffset(
            card?.closingDay || 24,
            card?.dueDay || 1,
            offset,
            now
          );
          return doesTransactionBelongToCycle(tx.dateGroup || tx.transactionDate, cycle);
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      // Para o mês atual, prioriza o total consolidado das faturas caso não haja lançamentos filtrados
      if (offset === 0 && amount === 0 && selectedCardId === "all" && totalSpent > 0) {
        amount = totalSpent;
      }

      items.push({
        prefix: refCycle.cycleKey,
        label: refCycle.shortLabel.toUpperCase(),
        fullMonthName,
        amount: Number(amount.toFixed(2)),
        isCurrent: offset === 0,
      });
    }

    const maxAmount = Math.max(...items.map((i) => i.amount), 1);
    return items.map((i) => ({
      ...i,
      heightPct: i.amount > 0 ? Math.max(12, Math.round((i.amount / maxAmount) * 100)) : 6,
    }));
  }, [allTransactions, cards, selectedCardId, totalSpent]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Faturas, parcelas e limites"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full sm:h-[94vh] sm:my-auto sm:rounded-[40px] sm:border sm:border-zinc-800/80 bg-[#050507] text-white flex flex-col overflow-hidden relative shadow-2xl">
          {/* Header */}
          <header className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onTogglePrivacy}
                aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
                className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
              >
                {isPrivacyHidden ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center p-1 rounded-full bg-white/[0.08] border border-white/[0.12]">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="Visualização em lista"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white/[0.16] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  aria-label="Visualização em calendário"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    viewMode === "calendar"
                      ? "bg-white/[0.16] text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {viewMode === "calendar" ? (
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-10 flex flex-col gap-4">
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const monthIdx = now.getMonth();
                const monthNames = [
                  "Janeiro",
                  "Fevereiro",
                  "Março",
                  "Abril",
                  "Maio",
                  "Junho",
                  "Julho",
                  "Agosto",
                  "Setembro",
                  "Outubro",
                  "Novembro",
                  "Dezembro",
                ];
                const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
                const firstDay = new Date(year, monthIdx, 1).getDay(); // 0=Dom..6=Sab
                const startOffset = (firstDay + 6) % 7; // Seg=0..Dom=6
                const monthPrefix = `${year}-${String(monthIdx + 1).padStart(2, "0")}`;

                const dayTxMap = new Map<number, ExtratoTransaction[]>();
                for (const tx of allTransactions) {
                  if (tx.type !== "expense" || tx.isHidden) continue;
                  if (tx.paymentMethod !== "credit" && !tx.creditCardId) continue;
                  const dateStr = (tx.dateGroup || tx.transactionDate || "").split("T")[0];
                  if (!dateStr.startsWith(monthPrefix)) continue;
                  const d = Number(dateStr.split("-")[2]);
                  if (!Number.isNaN(d)) {
                    const list = dayTxMap.get(d) || [];
                    list.push(tx);
                    dayTxMap.set(d, list);
                  }
                }

                return (
                  <>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white">
                      {monthNames[monthIdx]}
                    </h2>

                    {/* Segmented Control: Mensal | Diária */}
                    <div className="w-full p-1 rounded-full bg-white/[0.07] border border-white/[0.1] grid grid-cols-2 gap-1">
                      {(
                        [
                          { id: "mensal", label: "Mensal" },
                          { id: "diaria", label: "Diária" },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setCalendarMode(m.id)}
                          className={`py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                            calendarMode === m.id
                              ? "bg-white text-black font-semibold shadow-sm"
                              : "text-zinc-300 hover:text-white font-medium"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Cabeçalho dos dias da semana */}
                    <div className="grid grid-cols-7 gap-1.5 pt-2 text-center">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((wd) => (
                        <span key={wd} className="text-xs font-medium text-zinc-400">
                          {wd}
                        </span>
                      ))}
                    </div>

                    {/* Grade do Calendário */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[68px]" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const txs = dayTxMap.get(day) || [];
                        return (
                          <div
                            key={day}
                            className="min-h-[68px] rounded-xl bg-white/[0.06] border border-white/[0.08] p-1.5 flex flex-col justify-between"
                          >
                            <span className="text-xs font-medium text-zinc-300">
                              {day}
                            </span>
                            {txs.length > 0 && (
                              <div className="flex items-center justify-center pb-1">
                                <TransactionIcon
                                  title={txs[0].title}
                                  categoryIcon={txs[0].categoryIcon}
                                  type="expense"
                                  size={22}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <>
              {/* Segmented Control: Faturas | Parcelas | Limites */}
          <div className="px-4 sm:px-5 pb-4 shrink-0">
            <div className="w-full p-1 rounded-full bg-white/[0.07] border border-white/[0.1] grid grid-cols-3 gap-1">
              {(
                [
                  { id: "faturas", label: "Faturas" },
                  { id: "parcelas", label: "Parcelas" },
                  { id: "limites", label: "Limites" },
                ] as { id: CardLimitsTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-300 hover:text-white font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-10 flex flex-col gap-4">
            {activeTab === "limites" && (
              <>
                {cardsWithLimits.length === 0 ? (
                  <div className="flex justify-center pt-2">
                    <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-400">
                      <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Nenhum limite de cartão encontrado</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Resumo Geral de Limite */}
                    <div className="rounded-[24px] bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium text-zinc-400">
                            Limite total utilizado
                          </span>
                          <p
                            className={`text-2xl font-extrabold text-white mt-0.5 ${
                              isPrivacyHidden ? "balance-blur" : ""
                            }`}
                          >
                            R$ {formatCurrency(totalSpent)}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white/[0.08] text-xs font-bold text-[#ccff00]">
                          {totalPercentage}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ccff00] transition-all duration-500"
                          style={{ width: `${Math.max(2, totalPercentage)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span className={isPrivacyHidden ? "balance-blur" : ""}>
                          Disponível: R$ {formatCurrency(totalAvailable)}
                        </span>
                        <span className={isPrivacyHidden ? "balance-blur" : ""}>
                          Total: R$ {formatCurrency(totalLimit)}
                        </span>
                      </div>
                    </div>

                    {/* Limite por Cartão */}
                    <div className="flex flex-col gap-3">
                      {cardsWithLimits.map((card, idx) => {
                        const available = Math.max(0, card.limit - card.spent);
                        const pct =
                          card.limit > 0
                            ? Math.min(100, Math.round((card.spent / card.limit) * 100))
                            : 0;
                        return (
                          <div
                            key={card.id || `${card.cardName}-${idx}`}
                            className="rounded-[22px] bg-white/[0.04] border border-white/[0.08] p-4 flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <CardBankBadge
                                  cardName={card.cardName}
                                  color={card.color}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-semibold text-white truncate">
                                    {card.cardName}
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    {pct}% do limite usado
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`text-sm font-bold text-white shrink-0 ${
                                  isPrivacyHidden ? "balance-blur" : ""
                                }`}
                              >
                                R$ {formatCurrency(card.spent)}
                              </span>
                            </div>

                            <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.max(pct > 0 ? 3 : 0, pct)}%`,
                                  backgroundColor: card.color || "#ccff00",
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-400">
                              <span className={isPrivacyHidden ? "balance-blur" : ""}>
                                Disp: R$ {formatCurrency(available)}
                              </span>
                              <span className={isPrivacyHidden ? "balance-blur" : ""}>
                                Limite: R$ {formatCurrency(card.limit)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === "faturas" && (() => {
              const selectedMonthItem = invoiceHistory[selectedInvoiceMonthIdx];
              const filteredCards =
                selectedCardId === "all"
                  ? cards
                  : cards.filter((c) => (c.id || c.cardName) === selectedCardId);
              const selectedCardObj = cards.find(
                (c) => (c.id || c.cardName) === selectedCardId
              );
              const handleCycleCardFilter = () => {
                if (cards.length === 0) return;
                if (selectedCardId === "all") {
                  setSelectedCardId(cards[0].id || cards[0].cardName);
                } else {
                  const currentIdx = cards.findIndex(
                    (c) => (c.id || c.cardName) === selectedCardId
                  );
                  if (currentIdx === -1 || currentIdx === cards.length - 1) {
                    setSelectedCardId("all");
                  } else {
                    setSelectedCardId(
                      cards[currentIdx + 1].id || cards[currentIdx + 1].cardName
                    );
                  }
                }
              };

              return (
                <div className="flex flex-col gap-6 pt-1">
                  {/* Resumo limpo sem card */}
                  <div>
                    <p className="text-sm font-medium text-zinc-400">
                      Total em faturas em {selectedMonthItem?.fullMonthName || "Novembro"}
                    </p>
                    <p
                      className={`text-3xl font-extrabold tracking-tight text-white mt-0.5 ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      R${" "}
                      {formatCurrency(
                        selectedMonthItem?.amount ?? totalSpent
                      )}
                    </p>
                  </div>

                  {/* Linha do tempo de 8 meses: círculos tracejados que crescem para cima como gráfico */}
                  <div className="grid grid-cols-8 gap-1.5 py-4 items-end h-36">
                    {invoiceHistory.map((item, idx) => {
                      const isSelected = selectedInvoiceMonthIdx === idx;
                      const hasAmount = item.amount > 0;
                      const barHeight = hasAmount
                        ? Math.max(32, Math.round((item.heightPct / 100) * 96))
                        : 32;
                      return (
                        <button
                          key={item.prefix}
                          type="button"
                          onClick={() => setSelectedInvoiceMonthIdx(idx)}
                          className="flex flex-col items-center justify-end gap-2 h-full cursor-pointer group"
                          title={`${item.label}: R$ ${formatCurrency(item.amount)}`}
                        >
                          <div className="w-full flex-1 flex items-end justify-center">
                            <div
                              style={{ height: `${barHeight}px` }}
                              className={`w-8 rounded-full flex items-end justify-center pb-2.5 transition-all duration-300 ${
                                hasAmount
                                  ? isSelected
                                    ? "border-2 border-[#ccff00] bg-[#ccff00]/20 shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                                    : "border-2 border-purple-400 bg-purple-500/20 group-hover:bg-purple-500/30"
                                  : isSelected
                                  ? "border-2 border-dashed border-zinc-400"
                                  : "border-2 border-dashed border-zinc-700/80 group-hover:border-zinc-500"
                              }`}
                            >
                              {hasAmount && (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isSelected ? "bg-[#ccff00]" : "bg-purple-400"
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-medium truncate max-w-full ${
                              isSelected ? "text-white" : "text-zinc-400"
                            }`}
                          >
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pílulas de filtro: Todos os cartões + cada cartão cadastrado */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedCardId("all")}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                        selectedCardId === "all"
                          ? "bg-white text-black shadow-sm"
                          : "bg-white/[0.08] border border-white/[0.12] text-zinc-300 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Todos os cartões</span>
                    </button>

                    {cards.map((card, idx) => {
                      const cardKey = card.id || card.cardName;
                      const isSelected = selectedCardId === cardKey;
                      return (
                        <button
                          key={`${cardKey}-${idx}`}
                          type="button"
                          onClick={() => setSelectedCardId(cardKey)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? "bg-white text-black shadow-sm"
                              : "bg-white/[0.08] border border-white/[0.12] text-zinc-300 hover:text-white"
                          }`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>{card.cardName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {creditTransactions.length === 0 ? (
                    <div className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 flex items-center gap-3 text-sm text-zinc-400">
                      <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Nenhuma fatura encontrada</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                        {selectedInvoiceOffset === 0
                          ? "Lançamentos na fatura atual"
                          : `Lançamentos na fatura de ${selectedMonthItem?.label || ""}`}
                      </h3>
                      {creditTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between px-2 py-2 rounded-2xl hover:bg-white/[0.03]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <TransactionIcon
                              title={tx.title}
                              categoryIcon={tx.categoryIcon}
                              type="expense"
                              size={38}
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-white truncate">
                                {tx.title}
                              </span>
                              <span className="text-xs text-zinc-400 truncate">
                                {tx.accountOrCard || "Cartão"} • {tx.formattedDate}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-semibold text-white shrink-0 ml-3 ${
                              isPrivacyHidden ? "balance-blur" : ""
                            }`}
                          >
                            R$ {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "parcelas" && (() => {
              const selectedParcelMonth = sixMonthForecast[selectedParcelMonthIdx];
              const maxForecast = Math.max(...sixMonthForecast.map((m) => m.amount), 1);

              return (
                <div className="flex flex-col gap-6 pt-1">
                  {/* Resumo Comprometido no Mês */}
                  <div>
                    <p className="text-sm font-medium text-zinc-400">
                      Comprometido em {selectedParcelMonth?.label || currentMonthName}
                    </p>
                    <p
                      className={`text-3xl font-extrabold tracking-tight text-white mt-0.5 ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      R$ {formatCurrency(selectedParcelMonth?.amount ?? committedThisMonth)}
                    </p>
                    <p
                      className={`text-sm text-zinc-400 mt-0.5 ${
                        isPrivacyHidden ? "balance-blur" : ""
                      }`}
                    >
                      Restam R$ {formatCurrency(totalRemainingInstallments)}
                    </p>
                  </div>

                  {/* Linha de 6 meses: círculos tracejados que crescem para cima e permitem selecionar o mês */}
                  <div className="grid grid-cols-6 gap-2 py-4 items-end h-36">
                    {sixMonthForecast.map((m, idx) => {
                      const isSelected = selectedParcelMonthIdx === idx;
                      const hasAmount = m.amount > 0;
                      const heightPct = hasAmount
                        ? Math.max(12, Math.round((m.amount / maxForecast) * 100))
                        : 0;
                      const barHeight = hasAmount
                        ? Math.max(32, Math.round((heightPct / 100) * 96))
                        : 32;
                      return (
                        <button
                          key={m.prefix}
                          type="button"
                          onClick={() => setSelectedParcelMonthIdx(idx)}
                          className="flex flex-col items-center justify-end gap-2 h-full cursor-pointer group"
                          title={`${m.label}: R$ ${formatCurrency(m.amount)}`}
                        >
                          <div className="w-full flex-1 flex items-end justify-center">
                            <div
                              style={{ height: `${barHeight}px` }}
                              className={`w-8 rounded-full flex items-end justify-center pb-2.5 transition-all duration-300 ${
                                hasAmount
                                  ? isSelected
                                    ? "border-2 border-[#ccff00] bg-[#ccff00]/20 shadow-[0_0_12px_rgba(204,255,0,0.25)]"
                                    : "border-2 border-purple-400 bg-purple-500/20 group-hover:bg-purple-500/30"
                                  : isSelected
                                  ? "border-2 border-dashed border-zinc-400"
                                  : "border-2 border-dashed border-zinc-700/80 group-hover:border-zinc-500"
                              }`}
                            >
                              {hasAmount && (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isSelected ? "bg-[#ccff00]" : "bg-purple-400"
                                  }`}
                                />
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-medium truncate max-w-full uppercase ${
                              isSelected ? "text-white" : "text-zinc-400"
                            }`}
                          >
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Pílulas de filtro: Todos os cartões + cada cartão cadastrado */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setSelectedCardId("all")}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                        selectedCardId === "all"
                          ? "bg-white text-black shadow-sm"
                          : "bg-white/[0.08] border border-white/[0.12] text-zinc-300 hover:text-white"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Todos os cartões</span>
                    </button>

                    {cards.map((card, idx) => {
                      const cardKey = card.id || card.cardName;
                      const isSelected = selectedCardId === cardKey;
                      return (
                        <button
                          key={`${cardKey}-${idx}`}
                          type="button"
                          onClick={() => setSelectedCardId(cardKey)}
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                            isSelected
                              ? "bg-white text-black shadow-sm"
                              : "bg-white/[0.08] border border-white/[0.12] text-zinc-300 hover:text-white"
                          }`}
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span>{card.cardName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista de Parcelas do mês selecionado ou Estado Vazio */}
                  {(() => {
                    const selectedPrefix = selectedParcelMonth?.prefix || "";
                    const monthTransactions = allTransactions
                      .filter(
                        (tx) =>
                          tx.type === "expense" &&
                          !tx.isHidden &&
                          tx.installmentTotal &&
                          tx.installmentTotal > 1 &&
                          (tx.dateGroup || tx.transactionDate || "").startsWith(selectedPrefix)
                      )
                      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));

                    if (monthTransactions.length === 0) {
                      return (
                        <div className="w-full rounded-2xl bg-white/[0.06] border border-white/[0.08] px-4 py-3.5 flex items-center gap-3 text-sm text-zinc-400">
                          <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span>Nenhuma parcela em andamento</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col gap-2.5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                          Parcelas de {selectedParcelMonth?.label || currentMonthName}
                        </h3>
                        {monthTransactions.map((tx) => {
                          const groupKey = tx.installmentGroupId || tx.title.toLowerCase();
                          const grp = activeInstallmentGroups.find((g) => g.key === groupKey);
                          const remaining = grp?.remainingAmount ?? Number(tx.amount || 0);
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between px-2 py-2 rounded-2xl hover:bg-white/[0.03]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <TransactionIcon
                                  title={tx.title}
                                  categoryIcon={tx.categoryIcon}
                                  type="expense"
                                  size={38}
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium text-white truncate">
                                    {tx.title}
                                  </span>
                                  <span className="text-xs text-zinc-400 truncate">
                                    Parcela {tx.installmentNumber || 1}/{tx.installmentTotal} • Restam{" "}
                                    {formatCurrency(remaining)}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`text-sm font-semibold text-white shrink-0 ml-3 ${
                                  isPrivacyHidden ? "balance-blur" : ""
                                }`}
                              >
                                R$ {formatCurrency(Number(tx.amount || 0))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}
          </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
