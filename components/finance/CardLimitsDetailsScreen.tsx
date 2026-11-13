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

  // Transações no cartão de crédito no mês atual
  const creditTransactions = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    return allTransactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          !tx.isHidden &&
          (tx.paymentMethod === "credit" || Boolean(tx.creditCardId)) &&
          (tx.dateGroup || tx.transactionDate || "").startsWith(prefix)
      )
      .slice(0, 15);
  }, [allTransactions]);

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
                                    {viewMode === "calendar"
                                      ? `Fecha dia ${card.closingDay || 24} • Vence dia ${
                                          card.dueDay || 1
                                        }`
                                      : `${pct}% do limite usado`}
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

            {activeTab === "faturas" && (
              <>
                {cards.length === 0 ? (
                  <div className="flex justify-center pt-2">
                    <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-sm text-zinc-400">
                      <CreditCard className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>Nenhuma fatura encontrada</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cards.map((card, idx) => (
                      <div
                        key={card.id || `${card.cardName}-${idx}`}
                        className="rounded-[22px] bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between"
                      >
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
                              {viewMode === "calendar"
                                ? `Fecha em ${card.closingDays} dias • Vence dia ${
                                    card.dueDay || 1
                                  }`
                                : `Fecha em ${card.closingDays} dias`}
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
                    ))}

                    {creditTransactions.length > 0 && (
                      <div className="pt-2 flex flex-col gap-2.5">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                          Lançamentos no crédito este mês
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
                )}
              </>
            )}

            {activeTab === "parcelas" && (
              <div className="flex flex-col gap-6 pt-1">
                {/* Resumo Comprometido no Mês */}
                <div>
                  <p className="text-sm font-medium text-zinc-400">
                    Comprometido em {currentMonthName}
                  </p>
                  <p
                    className={`text-3xl font-extrabold tracking-tight text-white mt-0.5 ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(committedThisMonth)}
                  </p>
                  <p
                    className={`text-sm text-zinc-400 mt-0.5 ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    Restam R$ {formatCurrency(totalRemainingInstallments)}
                  </p>
                </div>

                {/* Linha de 6 meses (Círculos tracejados ou ativos) */}
                <div className="grid grid-cols-6 gap-2 py-6">
                  {sixMonthForecast.map((m) => {
                    const hasAmount = m.amount > 0;
                    return (
                      <div
                        key={m.prefix}
                        className="flex flex-col items-center gap-2"
                        title={`${m.label}: R$ ${formatCurrency(m.amount)}`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            hasAmount
                              ? "border-2 border-purple-400 bg-purple-500/20 text-purple-300"
                              : "border-2 border-dashed border-zinc-700/80"
                          }`}
                        >
                          {hasAmount && (
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                          )}
                        </div>
                        <span className="text-[11px] font-medium text-zinc-400 truncate max-w-full">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Lista de Parcelas ou Estado Vazio */}
                {activeInstallmentGroups.length === 0 ? (
                  <div className="w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-4 py-3.5 flex items-center gap-3 text-sm text-zinc-400">
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span>Nenhuma parcela em andamento</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {activeInstallmentGroups.map((grp) => (
                      <div
                        key={grp.key}
                        className="rounded-[22px] bg-white/[0.04] border border-white/[0.08] p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <TransactionIcon
                            title={grp.title}
                            categoryIcon={grp.categoryIcon}
                            type="expense"
                            size={40}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-white truncate">
                              {grp.title}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {grp.paidParcels}/{grp.totalParcels} pagas • R${" "}
                              {formatCurrency(grp.amountPerParcel)}/mês
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-bold text-white shrink-0 ml-3 ${
                            isPrivacyHidden ? "balance-blur" : ""
                          }`}
                        >
                          R$ {formatCurrency(grp.remainingAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
