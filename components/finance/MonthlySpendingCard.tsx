"use client";

import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { ExtratoTransaction } from "@/types/finance";

interface MonthlySpendingCardProps {
  totalSpent: number;
  limitPlanned?: number;
  percentageConsumed?: number;
  allTransactions?: ExtratoTransaction[];
  isPrivacyHidden: boolean;
  onOpenDetails?: () => void;
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX.toFixed(2)} ${p0.y.toFixed(2)}, ${midX.toFixed(2)} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }
  return d;
}

export function MonthlySpendingCard({
  totalSpent,
  allTransactions = [],
  isPrivacyHidden,
  onOpenDetails,
}: MonthlySpendingCardProps) {
  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    const currentDay = Math.max(2, now.getDate());

    const dailyTotals = new Array(currentDay).fill(0);
    for (const tx of allTransactions) {
      if (tx.type !== "expense" || tx.isHidden) continue;
      const dateStr = (tx.dateGroup || tx.transactionDate || "").split("T")[0];
      if (!dateStr.startsWith(prefix)) continue;
      const dayPart = parseInt(dateStr.split("-")[2] || "1", 10);
      const idx = Math.min(Math.max(0, dayPart - 1), currentDay - 1);
      dailyTotals[idx] += Number(tx.amount || 0);
    }

    // Curva acumulada ao longo do mês
    const cumulative: number[] = [];
    let acc = 0;
    for (let i = 0; i < dailyTotals.length; i++) {
      acc += dailyTotals[i];
      cumulative.push(acc);
    }

    // Caso não haja transações no mês atual mas totalSpent > 0, simula subida suave no final
    if (acc === 0 && totalSpent > 0) {
      const mid = Math.floor(cumulative.length * 0.55);
      for (let i = mid; i < cumulative.length; i++) {
        cumulative[i] = totalSpent;
      }
    }

    const width = 320;
    const height = 64;
    const padTop = 8;
    const padBottom = 6;
    const usableH = height - padTop - padBottom;
    const maxVal = Math.max(...cumulative, 1);

    // Amostra no máximo 14 pontos para uma curva limpa e orgânica
    const sampleCount = Math.min(14, cumulative.length);
    const points: { x: number; y: number }[] = [];
    for (let s = 0; s < sampleCount; s++) {
      const idx =
        sampleCount === 1
          ? 0
          : Math.round((s / (sampleCount - 1)) * (cumulative.length - 1));
      const val = cumulative[idx];
      const x = sampleCount === 1 ? width - 6 : (s / (sampleCount - 1)) * (width - 6);
      const y = height - padBottom - (val / maxVal) * usableH;
      points.push({ x, y });
    }

    const path = buildSmoothPath(points);
    const last = points[points.length - 1] || { x: width - 6, y: height - padBottom };
    const first = points[0] || { x: 0, y: height - padBottom };
    const area = `${path} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;

    return { linePath: path, areaPath: area, lastPoint: last };
  }, [allTransactions, totalSpent]);

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
      {/* Top Header: Gastos do mês > */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs sm:text-[13px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
            Gastos do mês
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
        </div>

        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors mt-0.5" />
      </div>

      {/* Gráfico de Linha Suave Verde Neon com Área Gradiente e Ponto Final */}
      <div className="pt-3 w-full">
        <svg
          className="w-full h-16 overflow-visible"
          viewBox="0 0 320 64"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="monthlySpendingAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#monthlySpendingAreaGrad)" />
          <path
            d={linePath}
            fill="none"
            stroke="#b4ff00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="4.5"
            fill="#ccff00"
            className="drop-shadow-[0_0_8px_rgba(204,255,0,0.9)]"
          />
        </svg>
      </div>
    </div>
  );
}
