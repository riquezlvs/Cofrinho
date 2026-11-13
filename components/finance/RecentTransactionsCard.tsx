"use client";

import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { ExtratoTransaction, Transaction } from "@/types/finance";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { getGoogleFaviconUrl } from "@/lib/brands";

interface RecentTransactionsCardProps {
  allTransactions?: ExtratoTransaction[];
  recentTransactions?: Transaction[];
  isPrivacyHidden: boolean;
  onOpenExtrato?: () => void;
}

const MONTH_NAMES_LOWER = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLongDatePt(dateStr?: string): string {
  if (!dateStr) return "";
  const clean = dateStr.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return dateStr;
  const day = parts[2].padStart(2, "0");
  const monthIdx = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_LOWER[monthIdx] || "";
  return monthName ? `${day} de ${monthName}` : clean;
}

function getBankBadgeDomain(accountName?: string): string | null {
  const n = (accountName || "").toLowerCase();
  if (n.includes("santander")) return "santander.com.br";
  if (n.includes("nubank") || n.includes("roxinho") || n.includes("nu "))
    return "nubank.com.br";
  if (n.includes("itau") || n.includes("itaú")) return "itau.com.br";
  if (n.includes("inter")) return "inter.co";
  if (n.includes("bradesco")) return "bradesco.com.br";
  if (n.includes("c6")) return "c6bank.com.br";
  return null;
}

export function RecentTransactionsCard({
  allTransactions = [],
  recentTransactions = [],
  isPrivacyHidden,
  onOpenExtrato,
}: RecentTransactionsCardProps) {
  const latestThree = useMemo(() => {
    if (allTransactions.length > 0) {
      return allTransactions
        .filter((tx) => !tx.isHidden)
        .slice(0, 3)
        .map((tx) => {
          const dateLabel = formatLongDatePt(tx.dateGroup || tx.transactionDate);
          const subtitlePart = tx.categoryName || "Geral";
          return {
            id: tx.id,
            title: tx.title,
            dateAndCategory: dateLabel
              ? `${dateLabel} • ${subtitlePart}`
              : subtitlePart,
            accountLabel: tx.accountOrCard || tx.accountName || "Carteira",
            amount: Number(tx.amount || 0),
            type: tx.type,
            categoryIcon: tx.categoryIcon,
            bankDomain: getBankBadgeDomain(tx.accountOrCard || tx.accountName),
          };
        });
    }

    return recentTransactions.slice(0, 3).map((tx) => {
      const dateLabel = tx.formattedDate || formatLongDatePt(tx.transactionDate);
      const subtitlePart = tx.categoryName || "Geral";
      return {
        id: tx.id,
        title: tx.title,
        dateAndCategory: dateLabel
          ? `${dateLabel} • ${subtitlePart}`
          : subtitlePart,
        accountLabel: tx.accountName || "Carteira",
        amount: Number(tx.amount || 0),
        type: tx.type,
        categoryIcon: tx.categoryIcon,
        bankDomain: getBankBadgeDomain(tx.accountName),
      };
    });
  }, [allTransactions, recentTransactions]);

  return (
    <div
      onClick={onOpenExtrato}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenExtrato?.();
        }
      }}
      className="w-full rounded-[28px] liquid-glass-card p-5 border border-white/[0.12] flex flex-col gap-4 shadow-2xl cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.99] select-none"
    >
      {/* Header: Transações recentes > */}
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-[13px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
          Transações recentes
        </span>
        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
      </div>

      {/* Lista das 3 últimas transações */}
      {latestThree.length > 0 ? (
        <div className="flex flex-col gap-4">
          {latestThree.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <TransactionIcon
                    title={tx.title}
                    categoryIcon={tx.categoryIcon}
                    type={tx.type}
                    size={44}
                  />
                  {tx.bankDomain && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-zinc-900 border border-black overflow-hidden shadow-sm">
                      <img
                        src={getGoogleFaviconUrl(tx.bankDomain, 32)}
                        alt={tx.accountLabel}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-sm sm:text-[15px] font-bold text-white truncate leading-snug">
                    {tx.title}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {tx.dateAndCategory}
                  </span>
                  <span className="text-xs text-zinc-400 truncate">
                    {tx.accountLabel}
                  </span>
                </div>
              </div>

              <span
                className={`text-sm sm:text-[15px] font-bold shrink-0 ${
                  tx.type === "income" ? "text-[#a3e635]" : "text-[#f2545b]"
                } ${isPrivacyHidden ? "balance-blur" : ""}`}
              >
                {tx.type === "income" ? "+R$ " : "-R$ "}
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 py-3 text-center">
          Nenhuma transação recente encontrada.
        </p>
      )}
    </div>
  );
}
