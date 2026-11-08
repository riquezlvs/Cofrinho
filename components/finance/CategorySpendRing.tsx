import React from "react";
import { CategorySpend } from "@/types/finance";

interface CategorySpendRingProps {
  month: string;
  monthShort?: string;
  limitPlanned: number;
  totalSpent: number;
  percentageConsumed: number;
  categories: CategorySpend[];
}

export function CategorySpendRing({
  month,
  monthShort = "OUT",
  limitPlanned,
  totalSpent,
  percentageConsumed,
  categories,
}: CategorySpendRingProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);

  const formatExactCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);

  return (
    <section className="pb-4">
      <div className="rounded-3xl bg-[#121215] border border-[#232328] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white text-base font-bold tracking-tight">
              Gastos em {month}
            </h3>
            <p className="text-gray-400 text-xs">
              Limite planejado: {formatExactCurrency(limitPlanned)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-white text-base font-bold font-mono">
              {formatExactCurrency(totalSpent)}
            </span>
            <span className="block text-[11px] text-[#ccff00] font-semibold">
              {percentageConsumed}% consumido
            </span>
          </div>
        </div>

        {/* Visual Progress Ring & Breakdown Container */}
        <div className="flex items-center gap-4 py-1">
          {/* SVG Donut Chart with Neon Lime & Refined Palette */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                fill="none"
                r="38"
                stroke="#1c1c20"
                strokeWidth="8"
              />
              {categories.map((cat) => (
                <circle
                  key={cat.name}
                  cx="50"
                  cy="50"
                  fill="none"
                  r="38"
                  stroke={cat.color}
                  strokeDasharray={cat.dashArray}
                  strokeDashoffset={cat.dashOffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                {monthShort}
              </span>
            </div>
          </div>

          {/* Categories Legend Breakdown */}
          <div className="flex-1 space-y-1.5">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-white text-xs">{cat.name}</span>
                </div>
                <span className="text-gray-300 font-mono text-[11px]">
                  {formatCurrency(cat.amount)} ({cat.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
