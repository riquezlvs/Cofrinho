"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  List,
  Loader2,
  Plus,
  Repeat,
  Search,
  X,
} from "lucide-react";
import {
  ExtratoTransaction,
  SubscriptionItem,
  SubscriptionSummary,
  Transaction,
} from "@/types/finance";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { Portal } from "@/components/ui/Portal";
import { updateTransactionAction } from "@/app/actions/transactions";
import { detectBrand } from "@/lib/brands";

interface SubscriptionsDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: SubscriptionSummary;
  allTransactions?: ExtratoTransaction[];
  recentTransactions?: Transaction[];
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onSubscriptionAdded?: (newItem: SubscriptionItem) => void;
}

const MONTH_NAMES = [
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

const MONTH_SHORTS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const WEEKDAYS_MON_FIRST = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEKDAYS_SUN_FIRST = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length !== 3) return dateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${day} ${MONTH_SHORTS[monthIdx] || ""}`.trim();
}

export function SubscriptionsDetailsScreen({
  isOpen,
  onClose,
  subscriptions,
  allTransactions,
  recentTransactions = [],
  isPrivacyHidden,
  onTogglePrivacy,
  onSubscriptionAdded,
}: SubscriptionsDetailsScreenProps) {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [calendarSubMode, setCalendarSubMode] = useState<"mensal" | "diaria">("mensal");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search & selection state for "Adicionar assinatura"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isAddModalOpen, onClose]);

  const items = useMemo(
    () => subscriptions.items || [],
    [subscriptions.items]
  );
  const thisMonthAmount =
    subscriptions.thisMonthAmount !== undefined
      ? subscriptions.thisMonthAmount
      : subscriptions.monthlyAmount;

  // Calendar grid data for current month (Monday-first)
  const { calYear, calMonthIdx, calTodayDay, daysInCalMonth, firstMondayOffset } =
    useMemo(() => {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      const jsDay = new Date(y, m, 1).getDay(); // 0=Sun..6=Sat
      const mondayOffset = (jsDay + 6) % 7; // 0=Mon..6=Sun
      return {
        calYear: y,
        calMonthIdx: m,
        calTodayDay: today.getDate(),
        daysInCalMonth: new Date(y, m + 1, 0).getDate(),
        firstMondayOffset: mondayOffset,
      };
    }, []);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, SubscriptionItem[]>();
    for (const item of items) {
      const clampedDay = Math.min(Math.max(1, item.billingDay), daysInCalMonth);
      const list = map.get(clampedDay) || [];
      list.push(item);
      map.set(clampedDay, list);
    }
    return map;
  }, [items, daysInCalMonth]);

  // Sorted list of days that have subscriptions for "Diária" view
  const dailyGroups = useMemo(() => {
    const days = Array.from(itemsByDay.keys()).sort((a, b) => a - b);
    const filteredDays =
      selectedDay !== null ? days.filter((d) => d === selectedDay) : days;
    return filteredDays.map((day) => {
      const dayItems = itemsByDay.get(day) || [];
      const dayTotal = dayItems.reduce((sum, it) => sum + it.amount, 0);
      const weekdayIdx = new Date(calYear, calMonthIdx, day).getDay();
      return {
        day,
        weekdayShort: WEEKDAYS_SUN_FIRST[weekdayIdx],
        items: dayItems,
        total: dayTotal,
      };
    });
  }, [itemsByDay, selectedDay, calYear, calMonthIdx]);

  // Candidate expense transactions to mark as subscription
  const candidateTransactions = useMemo(() => {
    const existingNames = new Set(
      items.map((it) => it.name.trim().toLowerCase())
    );
    const source: Array<{
      id: string;
      title: string;
      amount: number;
      transactionDate: string;
      paymentMethod?: string;
      accountOrCard?: string;
      categoryIcon?: string;
      domain?: string;
      isFixed?: boolean;
    }> =
      allTransactions && allTransactions.length > 0
        ? allTransactions
            .filter((t) => t.type === "expense" && !t.isHidden)
            .map((t) => ({
              id: t.id,
              title: t.title,
              amount: t.amount,
              transactionDate: t.transactionDate,
              paymentMethod: t.paymentMethod,
              accountOrCard: t.accountOrCard || t.accountName,
              categoryIcon: t.categoryIcon,
              isFixed: t.isFixed,
            }))
        : recentTransactions
            .filter((t) => t.type === "expense")
            .map((t) => ({
              id: t.id,
              title: t.title,
              amount: t.amount,
              transactionDate: t.transactionDate || "",
              accountOrCard: t.accountName,
              categoryIcon: t.categoryIcon,
              domain: t.domain,
            }));

    const available = source.filter(
      (t) => !t.isFixed && !existingNames.has(t.title.trim().toLowerCase())
    );

    const q = searchQuery.trim().toLowerCase();
    if (!q) return available;
    return available.filter((t) => t.title.toLowerCase().includes(q));
  }, [allTransactions, recentTransactions, items, searchQuery]);

  if (!isOpen) return null;

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMarkAsSubscription = async () => {
    if (selectedTxIds.length === 0) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      for (const txId of selectedTxIds) {
        const tx = candidateTransactions.find((t) => t.id === txId);
        if (!tx) continue;

        const res = await updateTransactionAction(txId, { isFixed: true });
        if (!res.success) {
          setErrorMsg(res.error || "Não foi possível marcar como assinatura.");
          setIsSubmitting(false);
          return;
        }

        const dateStr = (tx.transactionDate || "").split("T")[0];
        const parts = dateStr.split("-");
        const billingDay =
          parts.length === 3 ? parseInt(parts[2], 10) : calTodayDay;
        const txYear = parts.length === 3 ? parseInt(parts[0], 10) : calYear;
        const txMonthIdx =
          parts.length === 3 ? parseInt(parts[1], 10) - 1 : calMonthIdx;
        const isCurrentMonth = txYear === calYear && txMonthIdx === calMonthIdx;

        let nextMonthIdx = isCurrentMonth ? calMonthIdx + 1 : calMonthIdx;
        let nextYear = calYear;
        if (nextMonthIdx > 11) {
          nextMonthIdx = 0;
          nextYear += 1;
        }
        const maxNextDay = new Date(nextYear, nextMonthIdx + 1, 0).getDate();
        const clampedDay = Math.min(billingDay, maxNextDay);
        const nextBillingDate = `${nextYear}-${String(
          nextMonthIdx + 1
        ).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
        const todayMs = Date.UTC(calYear, calMonthIdx, calTodayDay);
        const nextMs = Date.UTC(nextYear, nextMonthIdx, clampedDay);
        const daysUntilNext = Math.max(
          0,
          Math.round((nextMs - todayMs) / (1000 * 60 * 60 * 24))
        );

        const detected = detectBrand(tx.title);
        const newItem: SubscriptionItem = {
          id: tx.id,
          name: tx.title,
          amount: tx.amount,
          billingDay,
          nextBillingDate,
          daysUntilNext,
          lastPaidDate: dateStr || undefined,
          status: isCurrentMonth ? "paid" : "pending",
          paymentMethod: tx.paymentMethod,
          accountOrCardName: tx.accountOrCard,
          categoryIcon: tx.categoryIcon,
          domain: tx.domain || detected?.domain,
          initial: tx.title ? tx.title[0].toUpperCase() : "A",
          bgColor: detected?.color || "#27272a",
        };

        onSubscriptionAdded?.(newItem);
      }

      setSelectedTxIds([]);
      setSearchQuery("");
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Erro ao marcar assinatura:", err);
      setErrorMsg("Erro inesperado ao marcar transação como assinatura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSubscriptionRow = (item: SubscriptionItem) => {
    const dateLabel =
      item.status === "paid"
        ? formatShortDate(item.lastPaidDate || item.nextBillingDate)
        : formatShortDate(item.nextBillingDate);

    const statusText =
      item.status === "paid"
        ? `${dateLabel} • Pago`
        : item.daysUntilNext === 0
        ? `${dateLabel} • Hoje`
        : item.daysUntilNext === 1
        ? `${dateLabel} • Amanhã`
        : `${dateLabel} • Em ${item.daysUntilNext} dias`;

    return (
      <div
        key={item.id}
        className="flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <TransactionIcon
              title={item.name}
              categoryIcon={item.categoryIcon || "cart"}
              domain={item.domain}
              type="expense"
              size={44}
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#18181b] border border-white/15 flex items-center justify-center text-zinc-300 shadow"
              title={item.accountOrCardName || "Assinatura mensal"}
            >
              {item.paymentMethod === "credit" ? (
                <CreditCard className="w-2.5 h-2.5" />
              ) : (
                <Repeat className="w-2.5 h-2.5" />
              )}
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {item.name}
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                item.status === "paid" ? "text-[#a3e635]" : "text-amber-400"
              }`}
            >
              {statusText}
            </p>
          </div>
        </div>

        <span
          className={`text-sm font-bold text-white shrink-0 ml-3 ${
            isPrivacyHidden ? "balance-blur" : ""
          }`}
        >
          R$ {formatCurrency(item.amount)}
        </span>
      </div>
    );
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Assinaturas"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full bg-[#09090b] text-white flex flex-col relative sm:my-6 sm:h-[calc(100vh-3rem)] sm:rounded-[44px] sm:border sm:border-zinc-800/80 overflow-hidden shadow-2xl">
          {/* Top Bar */}
          <header className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onTogglePrivacy}
                aria-label={isPrivacyHidden ? "Mostrar valores" : "Ocultar valores"}
                className="w-11 h-11 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                {isPrivacyHidden ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>

              <div className="h-11 p-1 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center">
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 pb-10 flex flex-col">
            {viewMode === "list" ? (
              <>
                {/* Hero Summary */}
                <div className="pt-3 pb-6">
                  <p className="text-xs font-medium text-zinc-400">
                    Compromisso Mensal
                  </p>
                  <h2
                    className={`text-[34px] font-extrabold tracking-tight text-white mt-0.5 leading-tight ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(subscriptions.monthlyAmount)}
                  </h2>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setIsAddModalOpen(true);
                    }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-sm font-semibold text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar assinatura</span>
                  </button>
                </div>

                {/* Count & Month Summary Row */}
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs font-medium text-zinc-400">
                  <span>
                    {subscriptions.activeCount}{" "}
                    {subscriptions.activeCount === 1 ? "assinatura" : "assinaturas"}
                  </span>
                  <span className={isPrivacyHidden ? "balance-blur" : ""}>
                    R$ {formatCurrency(thisMonthAmount)} esse mês
                  </span>
                </div>

                {/* List View */}
                <div className="pt-2 flex flex-col gap-1">
                  {items.length > 0 ? (
                    items.map(renderSubscriptionRow)
                  ) : (
                    <div className="py-12 text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-400">
                        <Repeat className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-white mt-1">
                        Nenhuma assinatura cadastrada
                      </p>
                      <p className="text-xs text-zinc-400 max-w-[240px]">
                        Toque em &ldquo;Adicionar assinatura&rdquo; para marcar uma transação recorrente.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Calendar View (Mensal / Diária) */
              <div className="pt-2 flex flex-col gap-5">
                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  {MONTH_NAMES[calMonthIdx]}
                </h2>

                {/* Segmented Pill: Mensal | Diária */}
                <div className="w-full p-1 rounded-full bg-[#18181c] border border-white/[0.08] grid grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarSubMode("mensal");
                      setSelectedDay(null);
                    }}
                    className={`py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      calendarSubMode === "mensal"
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarSubMode("diaria")}
                    className={`py-2.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      calendarSubMode === "diaria"
                        ? "bg-white text-black shadow-sm"
                        : "text-zinc-300 hover:text-white"
                    }`}
                  >
                    Diária
                  </button>
                </div>

                {calendarSubMode === "mensal" ? (
                  <div className="flex flex-col gap-2">
                    {/* Monday-first weekday headers */}
                    <div className="grid grid-cols-7 gap-1.5 text-center pb-1">
                      {WEEKDAYS_MON_FIRST.map((wd) => (
                        <span
                          key={wd}
                          className="text-xs font-medium text-zinc-400"
                        >
                          {wd}
                        </span>
                      ))}
                    </div>

                    {/* Grid of rounded day cards */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: firstMondayOffset }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="min-h-[62px]" />
                      ))}
                      {Array.from({ length: daysInCalMonth }).map((_, idx) => {
                        const day = idx + 1;
                        const daySubs = itemsByDay.get(day) || [];
                        const isToday = day === calTodayDay;

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (daySubs.length > 0) {
                                setSelectedDay(day);
                                setCalendarSubMode("diaria");
                              }
                            }}
                            className={`min-h-[62px] rounded-xl bg-[#18181c] border p-1.5 flex flex-col justify-between items-start transition-colors ${
                              daySubs.length > 0
                                ? "border-white/15 hover:border-white/30 cursor-pointer"
                                : isToday
                                ? "border-white/25 cursor-default"
                                : "border-white/[0.04] cursor-default"
                            }`}
                          >
                            <span
                              className={`text-[11px] font-medium leading-none ${
                                isToday ? "text-[#ccff00] font-bold" : "text-zinc-200"
                              }`}
                            >
                              {day}
                            </span>

                            {daySubs.length > 0 && (
                              <div className="w-full flex items-center justify-center pt-1 -space-x-1.5">
                                {daySubs.slice(0, 2).map((sub) => (
                                  <TransactionIcon
                                    key={sub.id}
                                    title={sub.name}
                                    categoryIcon={sub.categoryIcon || "cart"}
                                    domain={sub.domain}
                                    type="expense"
                                    size={22}
                                  />
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Diária View */
                  <div className="flex flex-col gap-5 border-t border-white/[0.08] pt-4">
                    {selectedDay !== null && (
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>
                          Exibindo dia {String(selectedDay).padStart(2, "0")}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDay(null)}
                          className="text-white hover:underline font-medium cursor-pointer"
                        >
                          Ver todos os dias
                        </button>
                      </div>
                    )}

                    {dailyGroups.length > 0 ? (
                      dailyGroups.map((group) => (
                        <div key={group.day} className="flex items-start gap-4">
                          {/* Left: Weekday + White Day Circle */}
                          <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
                            <span className="text-xs font-medium text-zinc-400">
                              {group.weekdayShort}
                            </span>
                            <div className="w-9 h-9 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center">
                              {String(group.day).padStart(2, "0")}
                            </div>
                          </div>

                          {/* Right: Subscriptions for this day + Total */}
                          <div className="flex-1 min-w-0 flex flex-col gap-3 pt-4">
                            {group.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-3 min-w-0"
                              >
                                <TransactionIcon
                                  title={item.name}
                                  categoryIcon={item.categoryIcon || "cart"}
                                  domain={item.domain}
                                  type="expense"
                                  size={38}
                                />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">
                                    {item.name}
                                  </p>
                                  <p
                                    className={`text-xs font-medium text-zinc-400 ${
                                      isPrivacyHidden ? "balance-blur" : ""
                                    }`}
                                  >
                                    R$ {formatCurrency(item.amount)}
                                  </p>
                                </div>
                              </div>
                            ))}

                            <p className="text-xs text-zinc-400 pt-1">
                              Total a ser pago no dia:{" "}
                              <span
                                className={`font-bold text-white ${
                                  isPrivacyHidden ? "balance-blur" : ""
                                }`}
                              >
                                R$ {formatCurrency(group.total)}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-8">
                        Nenhuma assinatura prevista para {MONTH_NAMES[calMonthIdx].toLowerCase()}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal: Encontre uma transação recorrente para definir como assinatura */}
          {isAddModalOpen && (
            <div className="absolute inset-0 z-20 bg-[#09090b] flex flex-col animate-in fade-in duration-150">
              {/* Top Bar */}
              <header className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
                <div className="w-10" />
                <h3 className="text-sm font-semibold text-white">
                  Assinaturas
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setSelectedTxIds([]);
                    setSearchQuery("");
                  }}
                  aria-label="Fechar"
                  className="w-10 h-10 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              {/* Heading + Search */}
              <div className="px-5 pt-2 pb-4 shrink-0">
                <p className="text-lg font-medium text-white leading-snug">
                  Encontre uma transação recorrente para definir como assinatura
                </p>

                <div className="mt-5 relative">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar transação"
                    className="w-full rounded-full bg-[#141418] border border-white/[0.12] pl-11 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              {/* Candidate Transactions List */}
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1.5">
                {candidateTransactions.length > 0 ? (
                  candidateTransactions.map((tx) => {
                    const isSelected = selectedTxIds.includes(tx.id);
                    return (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => toggleSelectTx(tx.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-colors text-left cursor-pointer ${
                          isSelected
                            ? "bg-white/[0.1] border-white/30"
                            : "bg-transparent border-transparent hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <TransactionIcon
                            title={tx.title}
                            categoryIcon={tx.categoryIcon || "cart"}
                            domain={tx.domain}
                            type="expense"
                            size={40}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {tx.title}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {formatShortDate(tx.transactionDate)}
                              {tx.accountOrCard ? ` • ${tx.accountOrCard}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span
                            className={`text-sm font-bold text-white ${
                              isPrivacyHidden ? "balance-blur" : ""
                            }`}
                          >
                            R$ {formatCurrency(tx.amount)}
                          </span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-white border-white text-black"
                                : "border-zinc-600 text-transparent"
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-zinc-500 text-center py-8">
                    Nenhuma transação encontrada para marcar como assinatura.
                  </p>
                )}
              </div>

              {/* Footer CTA */}
              <div className="px-5 pt-2 pb-7 shrink-0">
                {errorMsg && (
                  <p className="text-xs text-rose-400 font-medium mb-2 text-center">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="button"
                  disabled={selectedTxIds.length === 0 || isSubmitting}
                  onClick={handleMarkAsSubscription}
                  className="w-full py-3.5 rounded-full bg-white hover:bg-zinc-200 disabled:bg-white/25 disabled:text-white/50 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Marcar como assinatura</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
