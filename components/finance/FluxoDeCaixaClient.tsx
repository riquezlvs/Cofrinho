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

interface DailyPoint {
  dayNumber: number;
  formattedDay: string; // "01", "02", ...
  dateStr: string; // "YYYY-MM-DD"
  formattedDate: string; // "08 de novembro"
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

  // Montagem da Linha do Tempo diária para "Este mês"
  const dailyData: DailyPoint[] = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const points: DailyPoint[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const monthStr = String(month + 1).padStart(2, "0");
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      // Filtrar transações deste dia
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
        dayNumber: d,
        formattedDay: dayStr,
        dateStr,
        formattedDate: `${dayStr} de ${MONTH_NAMES[month].toLowerCase()}`,
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
        hasActivity: dayIncome > 0 || dayExpense > 0,
        transactions: dayTxs,
      });
    }

    return points;
  }, [transactions, now]);

  // Totais do período
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    for (const p of dailyData) {
      income += p.income;
      expense += p.expense;
    }

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [dailyData]);

  // Ponto atualmente selecionado pelo dedo (scrubbed)
  const currentPoint = selectedDayIndex !== null ? dailyData[selectedDayIndex] : null;

  // Valor a ser exibido no Hero dependendo da aba e do dia selecionado
  const displayValues = useMemo(() => {
    if (currentPoint) {
      if (activeTab === "entradas") {
        return {
          title: `Entradas em ${currentPoint.formattedDate}`,
          amountText: `R$ ${formatCurrency(currentPoint.income)}`,
          isPositive: true,
          income: currentPoint.income,
          expense: 0,
        };
      }
      if (activeTab === "saidas") {
        return {
          title: `Saídas em ${currentPoint.formattedDate}`,
          amountText: `-R$ ${formatCurrency(currentPoint.expense)}`,
          isPositive: false,
          income: 0,
          expense: currentPoint.expense,
        };
      }
      // Geral
      return {
        title: `Fluxo em ${currentPoint.formattedDate}`,
        amountText: `${currentPoint.net < 0 ? "-" : ""}R$ ${formatCurrency(currentPoint.net)}`,
        isPositive: currentPoint.net >= 0,
        income: currentPoint.income,
        expense: currentPoint.expense,
      };
    }

    // Visão Geral do Mês
    if (activeTab === "entradas") {
      return {
        title: `Entradas em ${currentMonthName}`,
        amountText: `R$ ${formatCurrency(totals.income)}`,
        isPositive: true,
        income: totals.income,
        expense: 0,
      };
    }
    if (activeTab === "saidas") {
      return {
        title: `Saídas em ${currentMonthName}`,
        amountText: `-R$ ${formatCurrency(totals.expense)}`,
        isPositive: false,
        income: 0,
        expense: totals.expense,
      };
    }
    return {
      title: `Fluxo geral em ${currentMonthName}`,
      amountText: `${totals.balance < 0 ? "-" : ""}R$ ${formatCurrency(totals.balance)}`,
      isPositive: totals.balance >= 0,
      income: totals.income,
      expense: totals.expense,
    };
  }, [currentPoint, activeTab, currentMonthName, totals]);

  // Lista de transações filtradas conforme a aba ativa e o dia selecionado
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    // Se houver um dia selecionado via gráfico, prioriza apenas aquele dia
    if (currentPoint) {
      list = currentPoint.transactions;
    }

    // Filtrar por aba
    if (activeTab === "entradas") {
      list = list.filter((t) => t.type === "income");
    } else if (activeTab === "saidas") {
      list = list.filter((t) => t.type === "expense");
    }

    return list;
  }, [transactions, currentPoint, activeTab]);

  // Scroll listener para animação do header colapsável
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      setIsHeaderScrolled(scrollY > 55);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Centralizar o scroll da linha do tempo nos dias que possuem atividade no carregamento
  useEffect(() => {
    const activeIdx = dailyData.findIndex((p) => p.hasActivity);
    if (activeIdx !== -1 && itemRefs.current[activeIdx] && chartScrollRef.current) {
      const el = itemRefs.current[activeIdx];
      const container = chartScrollRef.current;
      const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    }
  }, [dailyData]);

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
                <span>Ver mês todo</span>
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
                {currentPoint.formattedDate}
              </span>
            )}
          </div>

          {/* Carrossel de Barras Diárias com Suporte a Toque */}
          <div
            ref={chartScrollRef}
            onTouchStart={onTouchStartChart}
            onTouchMove={onTouchMoveChart}
            onTouchEnd={onTouchEndChart}
            onPointerDown={onPointerDownChart}
            onPointerMove={onPointerMoveChart}
            onPointerUp={onPointerUpChart}
            className="w-full overflow-x-auto pb-3 pt-4 px-2 flex items-end gap-3 scrollbar-none touch-pan-x cursor-grab active:cursor-grabbing border-y border-white/[0.06] bg-zinc-950/40 rounded-2xl"
          >
            {dailyData.map((point, index) => {
              const isSelected = selectedDayIndex === index;
              const hasActivity = point.hasActivity;

              // Determinar aparência da barra
              const isPositive = point.net >= 0;
              const isExpenseOnly = point.expense > 0 && point.income === 0;

              return (
                <div
                  key={point.dayNumber}
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
                      /* Dias Vazios: Cápsula Tracejada Cinza como na Foto 2 */
                      <div
                        className={`w-3.5 h-5 rounded-full border border-dashed flex items-center justify-center transition-colors ${
                          isSelected
                            ? "border-white bg-white/10"
                            : "border-zinc-700/60 bg-transparent text-zinc-600"
                        }`}
                      >
                        <span className="text-[7px] leading-none text-zinc-600 font-mono">00</span>
                      </div>
                    ) : isExpenseOnly || (!isPositive && activeTab !== "entradas") ? (
                      /* Dia com Saída: Barra Vermelha Sólida como o dia 08 na Foto 2 */
                      <div
                        className={`w-3.5 h-7 bg-[#ff5252] rounded-full shadow-[0_0_8px_rgba(255,82,82,0.5)] transition-all ${
                          isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""
                        }`}
                        title={`Saída: R$ ${formatCurrency(point.expense)}`}
                      />
                    ) : (
                      /* Dia com Entrada: Barra Verde Neon Sólida */
                      <div
                        className={`w-3.5 h-8 bg-[#ccff00] rounded-full shadow-[0_0_8px_rgba(204,255,0,0.5)] transition-all ${
                          isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-black" : ""
                        }`}
                        title={`Entrada: R$ ${formatCurrency(point.income)}`}
                      />
                    )}
                  </div>

                  {/* Número do Dia */}
                  <span
                    className={`text-[11px] font-semibold transition-colors ${
                      isSelected
                        ? "text-white font-bold"
                        : hasActivity
                        ? "text-zinc-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {point.formattedDay}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filtros de Período (Este mês, 3m, 6m, 1a) exatamente como na Foto 2 */}
          <div className="w-full flex justify-center pt-2">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-full border border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setActivePeriod("mes")}
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
                onClick={() => setActivePeriod("3m")}
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
                onClick={() => setActivePeriod("6m")}
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
                onClick={() => setActivePeriod("1a")}
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
                ? `Lançamentos de ${currentPoint.formattedDate}`
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
