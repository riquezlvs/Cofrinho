import React from "react";
import { Transaction } from "@/types/finance";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
}: RecentTransactionsProps) {
  const renderIcon = (type: Transaction["categoryIcon"]) => {
    switch (type) {
      case "cart":
        return (
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        );
      case "pix":
        return (
          <svg
            className="w-5 h-5 stroke-[2] text-[#52e374]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M17 7L7 17M7 17H17M7 17V7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "music":
        return (
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
        );
      case "car":
        return (
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        );
      case "pill":
        return (
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
            <path d="m8.5 8.5 7 7" />
          </svg>
        );
    }
  };

  const formatAmount = (tx: Transaction) => {
    const formatted = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(tx.amount);

    if (tx.type === "income") {
      return `+${formatted}`;
    }
    return `-${formatted}`;
  };

  return (
    <section className="pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white text-base font-bold tracking-tight">
          Atividades Recentes
        </h3>
        <button
          onClick={onViewAll}
          className="text-[#ccff00] text-xs font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
          type="button"
        >
          Ver extrato
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3 pb-8">
        {transactions.map((tx) => {
          const isIncome = tx.type === "income";
          const isRecurringExpense = tx.categoryIcon === "music";

          let amountColorClass = "text-white";
          if (isIncome) {
            amountColorClass = "text-[#52e374]";
          } else if (isRecurringExpense) {
            amountColorClass = "text-[#f2545b]";
          }

          return (
            <article
              key={tx.id}
              className={`flex items-center justify-between py-2 px-3 rounded-2xl bg-[#121215] border border-[#232328] transition ${
                isIncome
                  ? "hover:border-[#52e374]/40"
                  : "hover:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[#1e1f24] border border-[#26262a] flex items-center justify-center shrink-0">
                  {renderIcon(tx.categoryIcon)}
                </div>
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-white tracking-wide truncate">
                    {tx.title}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {tx.description}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right pl-2">
                <span
                  className={`text-xs sm:text-[13px] font-bold tracking-tight font-mono ${amountColorClass}`}
                >
                  {formatAmount(tx)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
