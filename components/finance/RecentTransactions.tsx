import React from "react";
import { Transaction } from "@/types/finance";
import { TransactionIcon } from "./TransactionIcon";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onViewAll?: () => void;
}

export function RecentTransactions({
  transactions,
  onViewAll,
}: RecentTransactionsProps) {
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
                <TransactionIcon
                  title={tx.title}
                  categoryIcon={tx.categoryIcon}
                  domain={tx.domain}
                  type={tx.type}
                  size={42}
                />
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
