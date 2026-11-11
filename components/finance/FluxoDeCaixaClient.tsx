"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowLeft, Eye, EyeOff, RotateCcw } from "lucide-react";
import { ExtratoData, ExtratoTransaction } from "@/types/finance";
import { TransactionIcon } from "@/components/finance/TransactionIcon";

export interface FluxoDeCaixaClientProps {
  initialExtratoData: ExtratoData;
  isPrivacyHidden?: boolean;
  onTogglePrivacy?: () => void;
  onNavigateHome: () => void;
  onNavigateToExtrato?: () => void;
}

type TabType = "geral" | "entradas" | "saidas";
type PeriodType = "mes" | "3m" | "6m" | "1a";

interface TimelinePoint {
  id: string;
  label: string; // "01", "02" para dias; "SET", "OUT" para meses
  fullLabel: string; // "08 de novembro" ou "Outubro de 2026"
  dateKey: string; // "2026-11-08" ou "2026-10"
  income: number;
  expense: number;
  net: number;
  hasActivity: boolean;
  transactions: ExtratoTransaction[];
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

export function FluxoDeCaixaClient({
  initialExtratoData,
  isPrivacyHidden = false,
  onTogglePrivacy,
  onNavigateHome,
  onNavigateToExtrato,
}: FluxoDeCaixaClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("geral");
  const [activePeriod, setActivePeriod] = useState<PeriodType>("mes");
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  // Estado do arraste de dedo (Touch Scrubbing)
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Dados reais de transações vindos do Supabase ou fallback
  const transactions = useMemo(() => {
    return initialExtratoData.transactions || [];
  }, [initialExtratoData.transactions]);

  // Formatação de Moeda
  const formatCurrency = (val: number) =>
    Math.abs(val).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const now = useMemo(() => new Date(), []);
  const currentMonthName = MONTH_NAMES[now.getMonth()];

  // Montagem da Linha do Tempo conforme o período selecionado (Este mês, 3m, 6m, 1a)
  const timelineData: TimelinePoint[] = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();

    if (activePeriod === "mes") {
      // Dias do mês atual (ex: 01 a 30 de Novembro)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const points: TimelinePoint[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = String(d).padStart(2, "0");
        const monthStr = String(month + 1).padStart(2, "0");
        const dateStr = `${year}-${monthStr}-${dayStr}`;

        const dayTxs = transactions.filter((t) => {
          if (!t.transactionDate) return false;
          return t.transactionDate.startsWith(dateStr);
        });

        const dayIncome = dayTxs
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const dayExpense = dayTxs
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        points.push({
          id: `day-${d}`,
          label: dayStr,
          fullLabel: `${dayStr} de ${MONTH_NAMES[month].toLowerCase()}`,
          dateKey: dateStr,
          income: dayIncome,
          expense: dayExpense,
          net: dayIncome - dayExpense,
          hasActivity: dayIncome > 0 || dayExpense > 0,
          transactions: dayTxs,
        });
      }

      return points;
    }

    // Se activePeriod for "3m", "6m" ou "1a": agrupa mensalmente
    const monthsCount = activePeriod === "3m" ? 3 : activePeriod === "6m" ? 6 : 12;
    const points: TimelinePoint[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth();
      const monthStr = String(targetMonth + 1).padStart(2, "0");
      const prefix = `${targetYear}-${monthStr}`;

      const monthTxs = transactions.filter((t) => {
        if (!t.transactionDate) return false;
        return t.transactionDate.startsWith(prefix);
      });

      const mIncome = monthTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const mExpense = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      points.push({
        id: `month-${prefix}`,
        label: MONTH_SHORTS[targetMonth],
        fullLabel: `${MONTH_NAMES[targetMonth]} de ${targetYear}`,
        dateKey: prefix,
        income: mIncome,
        expense: mExpense,
        net: mIncome - mExpense,
        hasActivity: mIncome > 0 || mExpense > 0,
        transactions: monthTxs,
      });
    }

    return points;
  }, [transactions, now, activePeriod]);

  // Totais do período ativo
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const p of timelineData) {
      income += p.income;
      expense += p.expense;
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [timelineData]);

  // Título dinâmico do período (ex: "em Novembro", "nos últimos 3 meses", etc.)
  const periodTitle = useMemo(() => {
    if (activePeriod === "mes") return `em ${currentMonthName}`;
    if (activePeriod === "3m") return "nos últimos 3 meses";
    if (activePeriod === "6m") return "nos últimos 6 meses";
    return "no último ano";
  }, [activePeriod, currentMonthName]);

  // Ponto atualmente selecionado pelo dedo (scrubbed)
  const currentPoint = selectedDayIndex !== null ? timelineData[selectedDayIndex] : null;

  // Valor a ser exibido no Hero dependendo da aba e do ponto selecionado
  const displayValues = useMemo(() => {
    if (currentPoint) {
      if (activeTab === "entradas") {
        return {
          title: `Entradas em ${currentPoint.fullLabel}`,
          amountText: `R$ ${formatCurrency(currentPoint.income)}`,
          isPositive: true,
          income: currentPoint.income,
          expense: 0,
        };
      }
      if (activeTab === "saidas") {
        return {
          title: `Saídas em ${currentPoint.fullLabel}`,
          amountText: `-R$ ${formatCurrency(currentPoint.expense)}`,
          isPositive: false,
          income: 0,
          expense: currentPoint.expense,
        };
      }
      // Geral
      return {
        title: `Fluxo em ${currentPoint.fullLabel}`,
        amountText: `${currentPoint.net < 0 ? "-" : ""}R$ ${formatCurrency(currentPoint.net)}`,
        isPositive: currentPoint.net >= 0,
        income: currentPoint.income,
        expense: currentPoint.expense,
      };
    }

    // Visão Geral do Período
    if (activeTab === "entradas") {
      return {
        title: `Entradas ${periodTitle}`,
        amountText: `R$ ${formatCurrency(totals.income)}`,
        isPositive: true,
        income: totals.income,
        expense: 0,
      };
    }
    if (activeTab === "saidas") {
      return {
        title: `Saídas ${periodTitle}`,
        amountText: `-R$ ${formatCurrency(totals.expense)}`,
        isPositive: false,
        income: 0,
        expense: totals.expense,
      };
    }
    return {
      title: `Fluxo geral ${periodTitle}`,
      amountText: `${totals.balance < 0 ? "-" : ""}R$ ${formatCurrency(totals.balance)}`,
      isPositive: totals.balance >= 0,
      income: totals.income,
      expense: totals.expense,
    };
  }, [currentPoint, activeTab, periodTitle, totals]);

  // Lista de transações filtradas conforme a aba ativa, período e o ponto selecionado
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    // Se houver um ponto selecionado via gráfico, prioriza apenas aquele ponto
    if (currentPoint) {
      list = currentPoint.transactions;
    } else {
      // Se nenhum ponto selecionado, filtra pelo período ativo (mes, 3m, 6m, 1a)
      const validDateKeys = new Set(timelineData.map((p) => p.dateKey));
      list = list.filter((t) => {
        if (!t.transactionDate) return false;
        if (activePeriod === "mes") {
          return validDateKeys.has(t.transactionDate.substring(0, 10));
        }
        return validDateKeys.has(t.transactionDate.substring(0, 7));
      });
    }

    // Filtrar por aba
    if (activeTab === "entradas") {
      list = list.filter((t) => t.type === "income");
    } else if (activeTab === "saidas") {
      list = list.filter((t) => t.type === "expense");
    }

    return list;
  }, [transactions, currentPoint, activeTab, activePeriod, timelineData]);

  // Troca de Período com reset do ponto selecionado
  const handleSelectPeriod = (newPeriod: PeriodType) => {
    setActivePeriod(newPeriod);
    setSelectedDayIndex(null);
  };

  // Scroll listener para animação do header colapsável
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsHeaderScrolled(scrollY > 55);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Centralizar o scroll da linha do tempo nos pontos que possuem atividade ou no final do período
  useEffect(() => {
    // Reseta referências de itens ao trocar período
    itemRefs.current = itemRefs.current.slice(0, timelineData.length);

    const activeIdx = timelineData.findIndex((p) => p.hasActivity);
    const targetIdx = activeIdx !== -1 ? activeIdx : timelineData.length - 1;

    if (itemRefs.current[targetIdx] && chartScrollRef.current) {
      const el = itemRefs.current[targetIdx];
      const container = chartScrollRef.current;
      const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [timelineData, activePeriod]);

  // Touch Scrubbing Engine: Calcula qual barra está sob o ponteiro em tempo real
  const handlePointerScrub = useCallback(
    (clientX: number) => {
      if (!chartScrollRef.current) return;
      let closestIdx = 0;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const dist = Math.abs(centerX - clientX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      setSelectedDayIndex(closestIdx);
    },
    []
  );

  const onTouchStartChart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handlePointerScrub(e.touches[0].clientX);
    }
  };

  const onTouchMoveChart = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches[0]) {
      handlePointerScrub(e.touches[0].clientX);
    }
  };

  const onTouchEndChart = () => {
    setIsDragging(false);
  };

  const onPointerDownChart = (e: React.PointerEvent) => {
    setIsDragging(true);
    handlePointerScrub(e.clientX);
  };

  const onPointerMoveChart = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handlePointerScrub(e.clientX);
  };

  const onPointerUpChart = () => {
    setIsDragging(false);
  };

  const maxTimelineVal = useMemo(() => {
    return Math.max(
      ...timelineData.map((p) =>
        Math.abs(activeTab === "entradas" ? p.income : activeTab === "saidas" ? p.expense : p.net)
      ),
      1
    );
  }, [timelineData, activeTab]);

  return (
    <div className="w-full flex-1 flex flex-col relative min-h-screen text-white select-none">
      {/* 1. Header Fixo & Dinâmico (Transforma-se ao rolar como na Imagem 3) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-black/70 border-b border-white/[0.08] px-4 py-3 transition-all duration-300">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          {/* Botão Voltar */}
          <button
            type="button"
            onClick={onNavigateHome}
            aria-label="Voltar para a página inicial"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Centro: Alterna entre Abas Segmentadas (Topo) ou Saldo Condensado (Scrolled) */}
          <div className="flex-1 flex justify-center items-center overflow-hidden">
            {isHeaderScrolled ? (
              <span
                className={`text-lg font-bold text-white tracking-tight transition-all duration-200 animate-fadeIn ${
                  isPrivacyHidden ? "balance-blur" : ""
                }`}
              >
                {displayValues.amountText}
              </span>
            ) : (
              <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-full border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab("geral")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "geral"
                      ? "bg-white text-black shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Geral
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("entradas")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "entradas"
                      ? "bg-white text-black shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Entradas
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("saidas")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "saidas"
                      ? "bg-white text-black shadow-md"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Saídas
                </button>
              </div>
            )}
          </div>

          {/* Botão de Privacidade (Ícone Olho) */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            aria-label="Ocultar ou mostrar saldos"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-sm"
          >
            {isPrivacyHidden ? (
              <EyeOff className="w-5 h-5 text-lime-400 stroke-[2]" />
            ) : (
              <Eye className="w-5 h-5 stroke-[2]" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Área de Conteúdo Principal */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 px-4 sm:px-5 pt-4 pb-44 flex flex-col gap-6"
      >
        {/* Hero Section: Saldo em Destaque e Legendas como na Foto 2 */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-zinc-400 transition-colors">
              {displayValues.title}
            </span>
            {selectedDayIndex !== null && (
              <button
                type="button"
                onClick={() => setSelectedDayIndex(null)}
                className="flex items-center gap-1 text-[11px] font-semibold text-lime-400 hover:text-lime-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{activePeriod === "mes" ? "Ver mês todo" : "Ver período todo"}</span>
              </button>
            )}
          </div>

          {/* Saldo Principal */}
          <h1
            className={`text-4xl sm:text-[42px] font-black tracking-tight text-white leading-none ${
              isPrivacyHidden ? "balance-blur" : ""
            }`}
          >
            {displayValues.amountText}
          </h1>

          {/* Legenda com Marcadores Verde e Vermelho */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] shadow-[0_0_6px_rgba(204,255,0,0.6)]" />
              <span>Entradas R$ {formatCurrency(displayValues.income)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#ff5252] shadow-[0_0_6px_rgba(255,82,82,0.6)]" />
              <span>Saídas R$ {formatCurrency(displayValues.expense)}</span>
            </div>
          </div>

          {/* Nota Explicativa Idêntica à Foto 2 */}
          <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed pt-2">
            Considera só o dinheiro que entrou e saiu da conta. Compras no cartão entram quando a fatura é paga.
          </p>
        </div>

        {/* 3. Gráfico Interativo com Arraste do Dedo (Timeline Touch Scrubbing) */}
        <div className="w-full flex flex-col gap-3 pt-2">
          {/* Instrução visual e feedback de dia ativo */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <span className="text-zinc-400">
              {isDragging ? "Arraste para navegar pelos dias" : "Toque ou deslize o dedo sobre as datas"}
            </span>
            {currentPoint && (
              <span className="text-white font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                {currentPoint.fullLabel}
              </span>
            )}
          </div>

          {/* Carrossel de Barras com Suporte a Toque (Dias no Mês ou Meses nos períodos 3m, 6m, 1a) */}
          <div
            ref={chartScrollRef}
            onTouchStart={onTouchStartChart}
            onTouchMove={onTouchMoveChart}
            onTouchEnd={onTouchEndChart}
            onPointerDown={onPointerDownChart}
            onPointerMove={onPointerMoveChart}
            onPointerUp={onPointerUpChart}
            className={`w-full overflow-x-auto pb-3 pt-4 px-2 flex items-end ${
              activePeriod === "3m"
                ? "justify-around gap-6"
                : activePeriod === "6m"
                ? "justify-around gap-3"
                : "gap-3"
            } scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing border-y border-white/[0.06] bg-zinc-950/40 rounded-2xl`}
          >
            {timelineData.map((point, index) => {
              const isSelected = selectedDayIndex === index;
              const hasActivity = point.hasActivity;

              const isPositive = point.net >= 0;
              const isExpenseOnly = point.expense > 0 && point.income === 0;

              // Largura da barra conforme o período selecionado
              const barWidthClass =
                activePeriod === "3m"
                  ? "w-8 sm:w-10"
                  : activePeriod === "6m"
                  ? "w-6 sm:w-7"
                  : activePeriod === "1a"
                  ? "w-4 sm:w-5"
                  : "w-3.5";

              // Altura proporcional para períodos de 3m, 6m, 1a ou altura padrão no mês
              const val = Math.abs(
                activeTab === "entradas"
                  ? point.income
                  : activeTab === "saidas"
                  ? point.expense
                  : point.net
              );
              const customHeightPx =
                activePeriod === "mes"
                  ? isExpenseOnly || (!isPositive && activeTab !== "entradas")
                    ? 28
                    : 32
                  : Math.max(22, Math.min(52, Math.round((val / maxTimelineVal) * 52)));

              return (
                <div
                  key={point.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => setSelectedDayIndex(index)}
                  className={`flex flex-col items-center gap-2 transition-transform duration-150 cursor-pointer ${
                    isSelected ? "scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* Cápsula de Indicador / Barra */}
                  <div className="h-14 flex items-end justify-center relative">
                    {/* Tooltip Dinâmico acima da barra ativa */}
                    {isSelected && (
                      <div className="absolute -top-7 px-2 py-0.5 bg-white text-black font-bold text-[9px] rounded-full whitespace-nowrap shadow-lg pointer-events-none animate-fadeIn">
                        {activeTab === "entradas"
                          ? `+R$ ${formatCurrency(point.income)}`
                          : activeTab === "saidas"
                          ? `-R$ ${formatCurrency(point.expense)}`
                          : point.hasActivity
                          ? `${point.net >= 0 ? "+" : "-"}R$ ${formatCurrency(point.net)}`
                          : "R$ 0,00"}
                      </div>
                    )}

                    {!hasActivity ? (
                      /* Período/Dia Vazio: Cápsula Tracejada Cinza como na Foto 2 */
                      <div
                        className={`${barWidthClass} h-5 rounded-full border border-dashed flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-white bg-white/10"
                            : "border-zinc-700/60 bg-transparent text-zinc-600"
                        }`}
                      >
                        <span className="text-[7px] leading-none text-zinc-600 font-mono">00</span>
                      </div>
                    ) : isExpenseOnly || (!isPositive && activeTab !== "entradas") ? (
                      /* Barra Vermelha Sólida (Saída / Déficit) */
                      <div
                        className={`${barWidthClass} bg-[#ff5252] rounded-full shadow-[0_0_8px_rgba(255,82,82,0.5)] transition-all ${
                          isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""
                        }`}
                        style={{ height: `${customHeightPx}px` }}
                        title={`Saída: R$ ${formatCurrency(point.expense)}`}
                      />
                    ) : (
                      /* Barra Verde Neon Sólida (Entrada / Superávit) */
                      <div
                        className={`${barWidthClass} bg-[#ccff00] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.5)] transition-all ${
                          isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""
                        }`}
                        style={{ height: `${customHeightPx}px` }}
                        title={`Entrada: R$ ${formatCurrency(point.income)}`}
                      />
                    )}
                  </div>

                  {/* Rótulo do Dia (01, 02...) ou do Mês (SET, OUT, NOV...) */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold transition-colors ${
                      isSelected
                        ? "text-white font-bold"
                        : hasActivity
                        ? "text-zinc-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filtros de Período (Este mês, 3m, 6m, 1a) com recálculo em tempo real */}
          <div className="w-full flex justify-center pt-2">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-full border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => handleSelectPeriod("mes")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activePeriod === "mes"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Este mês
              </button>
              <button
                type="button"
                onClick={() => handleSelectPeriod("3m")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activePeriod === "3m"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                3m
              </button>
              <button
                type="button"
                onClick={() => handleSelectPeriod("6m")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activePeriod === "6m"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                6m
              </button>
              <button
                type="button"
                onClick={() => handleSelectPeriod("1a")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  activePeriod === "1a"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                1a
              </button>
            </div>
          </div>
        </div>

        {/* 4. Seção "Últimos lançamentos" Idêntica às Fotos 2 e 3 */}
        <section className="w-full flex flex-col gap-3 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              {currentPoint
                ? `Lançamentos de ${currentPoint.fullLabel}`
                : "Últimos lançamentos"}
            </h2>
            <span className="text-[11px] text-zinc-500 font-medium">
              {filteredTransactions.length}{" "}
              {filteredTransactions.length === 1 ? "item" : "itens"}
            </span>
          </div>

          {/* Lista de Transações (Exibe apenas os 5 lançamentos mais recentes para manter a tela limpa) */}
          {filteredTransactions.length === 0 ? (
            <div className="w-full rounded-2xl liquid-glass p-6 text-center text-zinc-400 text-xs border border-white/5">
              Nenhum lançamento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredTransactions.slice(0, 5).map((tx) => {
                const isIncome = tx.type === "income";

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass border border-white/[0.08] hover:border-white/20 transition-all duration-200 group"
                  >
                    {/* Ícone e Textos de Detalhes */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <TransactionIcon
                          title={tx.title}
                          categoryIcon={tx.categoryIcon}
                          type={tx.type}
                          size={40}
                        />
                        {/* Selo do Banco (ex: Santander Vermelho na Foto 2) */}
                        {tx.accountOrCard?.toLowerCase().includes("santander") && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#ec0000] border-2 border-black flex items-center justify-center shadow-sm"
                            title="Santander"
                          >
                            <span className="text-[7px] text-white font-bold">S</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white/95">
                          {tx.title}
                        </span>
                        <span className="text-[11px] text-zinc-400 truncate">
                          {tx.description || tx.formattedDate || tx.transactionDate}
                        </span>
                      </div>
                    </div>

                    {/* Valor Colorido (Verde para entrada, Vermelho para saída) */}
                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`text-xs sm:text-sm font-bold tracking-tight ${
                          isIncome ? "text-[#52e374]" : "text-[#ff5252]"
                        } ${isPrivacyHidden ? "balance-blur" : ""}`}
                      >
                        {isIncome ? "+" : "-"}R$ {formatCurrency(Number(tx.amount || 0))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 5. Botão "Ver todos os lançamentos" logo após os 5 lançamentos de exemplo */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateToExtrato}
              className="w-full py-3.5 px-4 rounded-full bg-zinc-900/90 border border-white/10 hover:bg-zinc-800 text-sm font-semibold text-white tracking-wide active:scale-[0.99] transition-all cursor-pointer shadow-lg text-center"
            >
              Ver todos os lançamentos
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
