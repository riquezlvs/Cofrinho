"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { ExtratoTransaction } from "@/types/finance";
import { TransactionIcon } from "@/components/finance/TransactionIcon";
import { Portal } from "@/components/ui/Portal";

interface MonthlySpendingDetailsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  allTransactions?: ExtratoTransaction[];
  fallbackTotalSpent?: number;
  isPrivacyHidden: boolean;
  onTogglePrivacy: () => void;
  onOpenCategorySpending?: () => void;
}

type PeriodKey = "1s" | "1m" | "6m" | "1a";

const MONTH_SHORTS = [
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

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

export function MonthlySpendingDetailsScreen({
  isOpen,
  onClose,
  allTransactions = [],
  fallbackTotalSpent = 0,
  isPrivacyHidden,
  onTogglePrivacy,
  onOpenCategorySpending,
}: MonthlySpendingDetailsScreenProps) {
  const [period, setPeriod] = useState<PeriodKey>("1a");
  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);

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

  const {
    periodLabel,
    periodTotal,
    series,
    topEstablishments,
    topCategories,
  } = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const expenses = allTransactions.filter(
      (tx) => tx.type === "expense" && !tx.isHidden
    );

    let startDate: Date;
    let label = "Gastos nos últimos 12 meses";

    if (period === "1s") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      label = "Gastos nos últimos 7 dias";
    } else if (period === "1m") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = "Gastos neste mês";
    } else if (period === "6m") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      label = "Gastos nos últimos 6 meses";
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      label = "Gastos nos últimos 12 meses";
    }

    const filtered = expenses.filter((tx) => {
      const dateStr = (tx.dateGroup || tx.transactionDate || "").split("T")[0];
      if (!dateStr) return false;
      const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
      if (!y || !m || !d) return false;
      const dt = new Date(y, m - 1, d);
      return dt >= startDate && dt <= todayEnd;
    });

    const total = Number(
      filtered.reduce((sum, tx) => sum + Number(tx.amount || 0), 0).toFixed(2)
    );

    // Série do gráfico
    const chartPoints: { label: string; value: number; showAxis: boolean }[] = [];

    if (period === "1s") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
        const val = filtered
          .filter((tx) => (tx.dateGroup || tx.transactionDate || "").startsWith(prefix))
          .reduce((s, tx) => s + Number(tx.amount || 0), 0);
        chartPoints.push({
          label: `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`,
          value: Number(val.toFixed(2)),
          showAxis: i === 6 || i === 3 || i === 0,
        });
      }
    } else if (period === "1m") {
      const daysInMonthSoFar = Math.max(1, now.getDate());
      const prefixMonth = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      for (let day = 1; day <= daysInMonthSoFar; day++) {
        const prefix = `${prefixMonth}-${String(day).padStart(2, "0")}`;
        const val = filtered
          .filter((tx) => (tx.dateGroup || tx.transactionDate || "").startsWith(prefix))
          .reduce((s, tx) => s + Number(tx.amount || 0), 0);
        chartPoints.push({
          label: `${String(day).padStart(2, "0")} ${MONTH_SHORTS[now.getMonth()]}`,
          value: Number(val.toFixed(2)),
          showAxis:
            day === 1 ||
            day === Math.ceil(daysInMonthSoFar / 2) ||
            day === daysInMonthSoFar,
        });
      }
    } else {
      const monthCount = period === "6m" ? 6 : 12;
      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const val = filtered
          .filter((tx) => (tx.dateGroup || tx.transactionDate || "").startsWith(prefix))
          .reduce((s, tx) => s + Number(tx.amount || 0), 0);
        const showAxis =
          period === "6m"
            ? i === 5 || i === 3 || i === 1 || i === 0
            : i === 11 || i === 8 || i === 5 || i === 2 || i === 0;
        chartPoints.push({
          label: MONTH_SHORTS[d.getMonth()],
          value: Number(val.toFixed(2)),
          showAxis,
        });
      }
    }

    // Principais estabelecimentos
    const estMap = new Map<
      string,
      {
        key: string;
        title: string;
        amount: number;
        count: number;
        categoryIcon?: string;
      }
    >();

    for (const tx of filtered) {
      const title = (tx.title || tx.description || "Despesa").trim();
      const key = title.toLowerCase();
      const existing = estMap.get(key);
      if (existing) {
        existing.amount = Number((existing.amount + Number(tx.amount || 0)).toFixed(2));
        existing.count += 1;
      } else {
        estMap.set(key, {
          key,
          title,
          amount: Number(Number(tx.amount || 0).toFixed(2)),
          count: 1,
          categoryIcon: tx.categoryIcon,
        });
      }
    }

    const sortedEst = Array.from(estMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Principais gastos por categoria
    const catMap = new Map<
      string,
      {
        name: string;
        amount: number;
        color: string;
        icon?: string;
      }
    >();

    for (const tx of filtered) {
      const catName = tx.categoryName || "Outros";
      const existing = catMap.get(catName);
      if (existing) {
        existing.amount = Number((existing.amount + Number(tx.amount || 0)).toFixed(2));
      } else {
        catMap.set(catName, {
          name: catName,
          amount: Number(Number(tx.amount || 0).toFixed(2)),
          color: tx.categoryColor || "#ff6b00",
          icon: tx.categoryIcon,
        });
      }
    }

    const effectiveTotal = total > 0 ? total : fallbackTotalSpent;
    const sortedCats = Array.from(catMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({
        ...c,
        percentage: effectiveTotal > 0 ? (c.amount / effectiveTotal) * 100 : 0,
      }));

    return {
      periodLabel: label,
      periodTotal: total > 0 ? total : period === "1m" ? fallbackTotalSpent : total,
      series: chartPoints,
      topEstablishments: sortedEst,
      topCategories: sortedCats,
    };
  }, [allTransactions, period, fallbackTotalSpent]);

  const { coords, linePath, areaPath } = useMemo(() => {
    const width = 340;
    const height = 130;
    const padX = 12;
    const padTop = 14;
    const padBottom = 10;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;
    const maxVal = Math.max(...series.map((s) => s.value), 1);

    const pts = series.map((s, idx) => {
      const x =
        series.length <= 1
          ? width - padX
          : padX + (idx / (series.length - 1)) * usableW;
      const y = height - padBottom - (s.value / maxVal) * usableH;
      return { x, y, ...s };
    });

    const path = buildSmoothPath(pts);
    const first = pts[0] || { x: padX, y: height - padBottom };
    const last = pts[pts.length - 1] || { x: width - padX, y: height - padBottom };
    const area = `${path} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;

    return { coords: pts, linePath: path, areaPath: area };
  }, [series]);

  if (!isOpen) return null;

  const focusedIdx =
    activePointIdx !== null && activePointIdx < coords.length
      ? activePointIdx
      : Math.max(0, coords.length - 1);
  const focusedPoint = coords[focusedIdx];

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex justify-center bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Gastos do mês e histórico"
      >
        <div className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-full sm:h-[94vh] sm:my-auto sm:rounded-[40px] sm:border sm:border-zinc-800/80 bg-[#050507] text-white flex flex-col overflow-hidden relative shadow-2xl">
          {/* Header */}
          <header className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              aria-label="Voltar"
              className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white hover:bg-white/[0.14] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

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
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-10 flex flex-col gap-6">
            {/* Resumo */}
            <div>
              <p className="text-sm font-medium text-zinc-400">{periodLabel}</p>
              <p
                className={`text-3xl sm:text-[34px] font-extrabold tracking-tight text-white mt-0.5 ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                R$ {formatCurrency(periodTotal)}
              </p>
            </div>

            {/* Gráfico de Área/Linha Verde Neon com Tooltip */}
            <div className="relative pt-10">
              {focusedPoint && (
                <div
                  className="absolute top-0 -translate-x-1/2 px-3 py-1.5 rounded-2xl bg-white/[0.08] border border-white/[0.12] backdrop-blur-md flex flex-col items-start pointer-events-none transition-all duration-200"
                  style={{
                    left: `${Math.min(82, Math.max(18, (focusedPoint.x / 340) * 100))}%`,
                  }}
                >
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    {focusedPoint.label}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-bold text-white whitespace-nowrap ${
                      isPrivacyHidden ? "balance-blur" : ""
                    }`}
                  >
                    R$ {formatCurrency(focusedPoint.value)}
                  </span>
                </div>
              )}

              <svg
                className="w-full h-[136px] overflow-visible"
                viewBox="0 0 340 130"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a3e635" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#trendAreaGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#b4ff00"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Linha base sutil */}
                <line
                  x1="8"
                  y1="122"
                  x2="332"
                  y2="122"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                />

                {focusedPoint && (
                  <circle
                    cx={focusedPoint.x}
                    cy={focusedPoint.y}
                    r="5"
                    fill="#ccff00"
                    className="drop-shadow-[0_0_8px_rgba(204,255,0,0.95)]"
                  />
                )}

                {/* Áreas clicáveis/hover para inspecionar pontos */}
                {coords.map((pt, idx) => (
                  <circle
                    key={`${pt.label}-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="16"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActivePointIdx(idx)}
                    onClick={() => setActivePointIdx(idx)}
                  />
                ))}
              </svg>

              {/* Rótulos do Eixo X */}
              <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] font-medium text-zinc-400">
                {coords
                  .filter((c) => c.showAxis)
                  .map((c, idx) => (
                    <span key={`${c.label}-${idx}`}>{c.label}</span>
                  ))}
              </div>
            </div>

            {/* Seletor de Período: 1s | 1m | 6m | 1a */}
            <div className="w-full p-1 rounded-full bg-white/[0.07] border border-white/[0.1] grid grid-cols-4 gap-1">
              {(["1s", "1m", "6m", "1a"] as PeriodKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setPeriod(key);
                    setActivePointIdx(null);
                  }}
                  className={`py-2.5 rounded-full text-sm transition-all cursor-pointer ${
                    period === key
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-zinc-300 hover:text-white font-medium"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Principais estabelecimentos */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-zinc-400">
                Principais estabelecimentos
              </h3>

              {topEstablishments.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                  {topEstablishments.map((est) => (
                    <div
                      key={est.key}
                      className="min-w-[132px] max-w-[144px] rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3.5 flex flex-col items-center text-center gap-2 shrink-0"
                    >
                      <TransactionIcon
                        title={est.title}
                        categoryIcon={est.categoryIcon}
                        type="expense"
                        size={40}
                      />
                      <span className="text-[11px] font-medium text-zinc-400 truncate w-full uppercase">
                        {est.title}
                      </span>
                      <span
                        className={`text-sm font-bold text-white ${
                          isPrivacyHidden ? "balance-blur" : ""
                        }`}
                      >
                        R$ {formatCurrency(est.amount)}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {est.count} {est.count === 1 ? "vez" : "vezes"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-2">
                  Nenhum estabelecimento registrado neste período.
                </p>
              )}
            </div>

            {/* Principais gastos por categoria */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-zinc-400">
                Principais gastos por categoria
              </h3>

              {topCategories.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {topCategories.map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center justify-between py-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TransactionIcon
                          title={cat.name}
                          categoryIcon={cat.icon || cat.name}
                          type="expense"
                          size={40}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold text-white truncate">
                            {cat.name}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {cat.percentage.toFixed(1)}% do período
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-sm font-semibold text-white shrink-0 ml-3 ${
                          isPrivacyHidden ? "balance-blur" : ""
                        }`}
                      >
                        R$ {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 py-2">
                  Nenhuma categoria registrada neste período.
                </p>
              )}
            </div>

            {/* Botão inferior: Ver gastos por categoria */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCategorySpending?.();
              }}
              className="w-full py-3.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-sm font-semibold text-white hover:bg-white/[0.14] transition-colors cursor-pointer mt-2"
            >
              Ver gastos por categoria
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
