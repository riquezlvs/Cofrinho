"use client";

import React, { useState, useEffect, useRef } from "react";
import { TopHeader, SegmentedFilterPills, SegmentType } from "@/components/finance/TopHeader";
import { BankCardsCarousel } from "@/components/finance/BankCardsCarousel";
import { AccountsOverviewCard } from "@/components/finance/AccountsOverviewCard";
import { MonthlySpendingCard } from "@/components/finance/MonthlySpendingCard";
import { BentoDashboardGrid } from "@/components/finance/BentoDashboardGrid";
import { FloatingPierreDock } from "@/components/finance/FloatingPierreDock";
import { DashboardData } from "@/types/finance";

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [isPrivacyHidden, setIsPrivacyHidden] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>("contas");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isGreetingScrolledOut, setIsGreetingScrolledOut] = useState(false);

  const greetingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const userName = initialData.userName || "João";

  const handleTogglePrivacy = () => {
    setIsPrivacyHidden((prev) => !prev);
  };

  const handleConnectBank = () => {
    console.log("Conectar novos bancos ou instituições");
  };

  const handleAskPierre = () => {
    console.log("Acionar assistente IA Pierre");
  };

  const handleWidgetClick = (widgetName: string) => {
    console.log("Widget clicado:", widgetName);
  };

  const handleAddWidgets = () => {
    console.log("Abrir modal de seleção de novos widgets");
  };

  const formatCurrency = (val: number) =>
    val.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Detecta rolagem para ativar o gradiente sombreado e a animação do nome
  useEffect(() => {
    const checkScrollPosition = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const containerScroll = scrollContainerRef.current?.scrollTop || 0;
      const effectiveScroll = Math.max(windowScroll, containerScroll);

      // 1. O gradiente sombreado do header fica invisível no topo e surge suavemente ao rolar (> 8px)
      setIsScrolled(effectiveScroll > 8);

      // 2. O nome "João" só aparece ao lado da foto quando o título "Boa tarde, João" passar pelo header
      if (greetingRef.current) {
        const rect = greetingRef.current.getBoundingClientRect();
        setIsGreetingScrolledOut(rect.bottom <= 64);
      } else {
        setIsGreetingScrolledOut(effectiveScroll > 60);
      }
    };

    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition, { passive: true });
    }

    // IntersectionObserver para precisão adicional
    let observer: IntersectionObserver | null = null;
    if (greetingRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting && entry.boundingClientRect.bottom <= 64) {
            setIsGreetingScrolledOut(true);
          } else if (entry.isIntersecting) {
            setIsGreetingScrolledOut(false);
          }
        },
        {
          root: null,
          rootMargin: "-64px 0px 0px 0px",
          threshold: [0, 0.2, 0.8, 1],
        }
      );
      observer.observe(greetingRef.current);
    }

    checkScrollPosition();

    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
      if (container) {
        container.removeEventListener("scroll", checkScrollPosition);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="pierre-finance-liquid-glass-view"
    >
      {/* Dynamic Glowing Mesh Aurora Gradient FIXO no viewport do container */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-screen pointer-events-none overflow-hidden z-0">
        {/* Glow Top Left (Magenta / Violeta / Indigo) */}
        <div className="absolute -top-[120px] -left-[100px] w-[360px] h-[360px] bg-gradient-to-br from-indigo-600/70 via-purple-600/55 to-pink-600/60 rounded-full blur-[85px]" />
        
        {/* Glow Top Right (Rosa Neon / Laranja / Âmbar) */}
        <div className="absolute -top-[130px] -right-[80px] w-[360px] h-[360px] bg-gradient-to-bl from-rose-500/80 via-orange-500/45 to-amber-500/35 rounded-full blur-[90px]" />
        
        {/* Glow Central Meio (Ciano / Turquesa / Esmeralda) */}
        <div className="absolute top-[220px] left-[15%] w-[300px] h-[280px] bg-gradient-to-b from-cyan-500/25 via-teal-500/20 to-transparent rounded-full blur-[80px]" />

        {/* Glow Inferior Suave (Azul Profundo / Roxo) para realçar o dock ao rolar */}
        <div className="absolute bottom-10 left-[10%] w-[320px] h-[260px] bg-gradient-to-t from-purple-900/30 via-indigo-800/20 to-transparent rounded-full blur-[90px]" />
      </div>

      {/* Header Fixo: Invisível no topo e com tom gradiente sombreado ao rolar */}
      <TopHeader
        userName={userName}
        showNameInHeader={isGreetingScrolledOut}
        isScrolled={isScrolled}
        isPrivacyHidden={isPrivacyHidden}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenProfile={() => console.log("Abrir perfil")}
        onOpenPro={() => console.log("Abrir Pierre Pro")}
      />

      {/* Main Content Area com scroll nativo e espaçamento otimizado para celulares reais */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 px-4 sm:px-5 pt-2 pb-44 z-10 flex flex-col gap-6"
      >
        {/* Filtros de Segmento (Contas, Cartão, Investimentos) com altura e toque aumentados */}
        <SegmentedFilterPills
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
        />

        {/* Saudação Personalizada - Elemento monitorado para a animação do header fixo */}
        <div ref={greetingRef} className="pt-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Boa tarde, {userName}
          </h1>
        </div>

        {/* 1. Cartão com Conectar Bancos + Total em Faturas (Refletindo dados do Supabase) */}
        <BankCardsCarousel
          totalInvoices={initialData.totalInvoices}
          creditCard={initialData.creditCard}
          cards={initialData.creditCards}
          isPrivacyHidden={isPrivacyHidden}
          onConnectBank={handleConnectBank}
        />

        {/* 2. Cartão de Saldo em Contas (Refletindo contas reais do Supabase: Nubank, VR, etc.) */}
        <AccountsOverviewCard
          totalBalance={initialData.totalAccountsBalance}
          accounts={initialData.accounts}
          isPrivacyHidden={isPrivacyHidden}
          onOpenDetails={() => console.log("Abrir detalhes de contas")}
        />

        {/* 3. Cartão Largura Total: Gastos do Mês com barra verde neon e marcador dinâmico */}
        <MonthlySpendingCard
          totalSpent={initialData.monthOverview.totalSpent}
          limitPlanned={initialData.monthOverview.limitPlanned}
          percentageConsumed={initialData.monthOverview.percentageConsumed}
          isPrivacyHidden={isPrivacyHidden}
          onOpenDetails={() => console.log("Abrir detalhes de gastos do mês")}
        />

        {/* 4. Grid Bento de Widgets (Categorias, Fluxo de Caixa, Limite Usado, Parcelamentos, Fatura, Assinaturas) */}
        <BentoDashboardGrid
          isPrivacyHidden={isPrivacyHidden}
          creditCard={initialData.creditCard}
          subscriptions={initialData.subscriptions}
          categories={initialData.monthOverview.categories}
          topCategoryName={initialData.monthOverview.topCategoryName}
          cashFlow={initialData.cashFlow}
          installments={initialData.installments}
          onWidgetClick={handleWidgetClick}
          onAddWidgets={handleAddWidgets}
        />

        {/* Insight / Notificação sutil com efeito Liquid Glass */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl liquid-glass border border-white/[0.08] text-xs text-zinc-300 font-medium pb-2 shadow-sm min-h-[44px]">
          <span className="text-base">💡</span>
          <span className={isPrivacyHidden ? "balance-blur" : ""}>
            R$ {formatCurrency(initialData.totalAccountsBalance)} parado poderia render mais em um cofrinho
          </span>
        </div>
      </div>

      {/* Floating Liquid Glass Dock (Search bar + Bottom capsule navigation + Mascot) com alturas aumentadas */}
      <FloatingPierreDock
        onAskPierre={handleAskPierre}
        onNavigateHome={() => console.log("Ir para home")}
        onTransfer={() => console.log("Abrir transferências")}
        onOpenMascot={() => console.log("Abrir mascote")}
      />
    </main>
  );
}
