"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { CategorySpend } from "@/types/finance";

interface MonthlySpendingCardProps {
  totalSpent: number;
  limitPlanned?: number;
  percentageConsumed?: number;
  categories?: CategorySpend[];
  isPrivacyHidden: boolean;
  onOpenDetails?: () => void;
}

const DEFAULT_SEGMENT_COLORS = [
  "#ff6b00",
  "#ccff00",
  "#38bdf8",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
];

export function MonthlySpendingCard({
  totalSpent,
  categories = [],
  isPrivacyHidden,
  onOpenDetails,
}: MonthlySpendingCardProps) {
  const activeCategories = categories.filter((c) => c.amount > 0);
  const categoryCount = activeCategories.length;
  const totalCategoryAmount = activeCategories.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div
      onClick={onOpenDetails}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails?.();
        }
      }}
      className="w-full rounded-[28px] liquid-glass-card p-5 border border-white/[0.12] flex flex-col justify-between min-h-[164px] shadow-2xl cursor-pointer group hover:border-white/30 transition-all duration-300 active:scale-[0.99] select-none"
    >
      {/* Top Row: Chevron > */}
      <div className="flex items-center justify-end">
        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
      </div>

      {/* Middle Row: Barra horizontal segmentada por categorias */}
      <div className="py-3">
        {activeCategories.length > 0 && totalCategoryAmount > 0 ? (
          <div className="w-full h-5 sm:h-6 flex items-center gap-1.5">
            {activeCategories.map((cat, idx) => {
              const pct = (cat.amount / totalCategoryAmount) * 100;
              const barColor =
                cat.color || DEFAULT_SEGMENT_COLORS[idx % DEFAULT_SEGMENT_COLORS.length];
              return (
                <div
                  key={`${cat.name}-${idx}`}
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, pct)}%`,
                    backgroundColor: barColor,
                  }}
                  title={`${cat.name}: R$ ${cat.amount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="w-full h-5 sm:h-6 rounded-full bg-white/[0.08]" />
        )}
      </div>

      {/* Bottom Row: Gastos • este mês, Valor e Quantidade de categorias */}
      <div className="flex flex-col gap-0.5 pt-1">
        <span className="text-xs sm:text-[13px] font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
          Gastos • este mês
        </span>
        <span
          className={`text-2xl sm:text-[28px] font-extrabold tracking-tight text-white leading-tight ${
            isPrivacyHidden ? "balance-blur" : ""
          }`}
        >
          R${" "}
          {totalSpent.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-xs sm:text-[13px] font-medium text-zinc-400 mt-0.5">
          {categoryCount === 0
            ? "Nenhuma categoria"
            : categoryCount === 1
            ? "1 categoria"
            : `${categoryCount} categorias`}
        </span>
      </div>
    </div>
  );
}
