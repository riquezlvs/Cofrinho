"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopHeader, SegmentedFilterPills, SegmentType } from "@/components/finance/TopHeader";
import { BankCardsCarousel } from "@/components/finance/BankCardsCarousel";
import { AccountsOverviewCard } from "@/components/finance/AccountsOverviewCard";
import { AccountsDetailsScreen } from "@/components/finance/AccountsDetailsScreen";
import { MonthlySpendingCard } from "@/components/finance/MonthlySpendingCard";
import { BentoDashboardGrid } from "@/components/finance/BentoDashboardGrid";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";
import { CardsTabClient } from "@/components/finance/CardsTabClient";
import { DashboardData, CreditCardSummary, AccountSummary } from "@/types/finance";
import { TrendingUp } from "lucide-react";

export interface DashboardClientProps {
  initialData: DashboardData;
  embedded?: boolean;
  isPrivacyHidden?: boolean;
  onTogglePrivacy?: () => void;
  onNavigateToExtrato?: () => void;
  onNavigateToFluxo?: () => void;
  onAskCofrinho?: () => void;
  onOpenMascot?: () => void;
}

export function DashboardClient({
  initialData,
  embedded = false,
  isPrivacyHidden: externalPrivacy,
  onTogglePrivacy: externalTogglePrivacy,
  onNavigateToExtrato,
  onNavigateToFluxo,
  onAskCofrinho,
  onOpenMascot,
}: DashboardClientProps) {
  const router = useRouter();
  const [internalPrivacy, setInternalPrivacy] = useState(false);
  const isPrivacyHidden = externalPrivacy !== undefined ? externalPrivacy : internalPrivacy;
  const [selectedSegment, setSelectedSegment] = useState<SegmentType>("contas");
  const [cards, setCards] = useState<CreditCardSummary[]>(initialData.creditCards || []);
  const [extraAccounts, setExtraAccounts] = useState<AccountSummary[]>([]);
  const [isAccountsDetailsOpen, setIsAccountsDetailsOpen] = useState(false);
  const [isGreetingScrolledOut, setIsGreetingScrolledOut] = useState(false);

  const greetingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const userName = initialData.userName || "João";

  const accounts = [
    ...(initialData.accounts || []),
    ...extraAccounts.filter(
      (extra) => !(initialData.accounts || []).some((a) => a.id === extra.id)
    ),
  ];

  const totalAccountsBalance = accounts.reduce((sum, a) => sum + Number(a.amount || 0), 0);
  const totalAbsAccountsBalance = accounts.reduce(
    (sum, a) => sum + Math.abs(Number(a.amount || 0)),
    0
  );
  const accountsWithPercentages: AccountSummary[] = accounts.map((a) => ({
    ...a,
    percentage:
      totalAbsAccountsBalance > 0
        ? Math.round((Math.abs(Number(a.amount || 0)) / totalAbsAccountsBalance) * 100)
        : 0,
  }));

  const totalInvoices = cards.reduce((acc, c) => acc + (c.spent || 0), 0);
  const activeDefaultCard =
    cards.find((c) => c.isDefault) || cards[0] || initialData.creditCard;

  const handleTogglePrivacy = () => {
    if (externalTogglePrivacy) {
      externalTogglePrivacy();
    } else {
      setInternalPrivacy((prev) => !prev);
    }
  };

  const handleAskCofrinho = () => {
    if (onAskCofrinho) {
      onAskCofrinho();
    } else {
      console.log("Acionar assistente IA Pierre");
    }
  };

  const handleNavigateExtrato = () => {
    if (onNavigateToExtrato) {
      onNavigateToExtrato();
    } else {
      router.push("/extrato");
    }
  };

  const handleNavigateFluxo = () => {
    if (onNavigateToFluxo) {
      onNavigateToFluxo();
    } else {
      router.push("/fluxo");
    }
  };

  const handleWidgetClick = (widgetName: string) => {
    if (widgetName === "fluxo" || widgetName === "fluxo-de-caixa") {
      handleNavigateFluxo();
      return;
    }
    if (widgetName === "transacoes" || widgetName === "fatura" || widgetName === "extrato") {
      handleNavigateExtrato();
      return;
    }
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

  // Detecta rolagem para a animação do nome no header
  useEffect(() => {
    const checkScrollPosition = () => {
      const windowScroll = window.scrollY || document.documentElement.scrollTop || 0;
      const containerScroll = scrollContainerRef.current?.scrollTop || 0;
      const effectiveScroll = Math.max(windowScroll, containerScroll);

      // O nome "João" só aparece ao lado da foto quando o título "Boa tarde, João" passar pelo header
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

  const content = (
    <>
      {/* Header Fixo: Com gradiente sombreado permanente e nome animado ao rolar */}
      <TopHeader
        userName={userName}
        showNameInHeader={isGreetingScrolledOut}
        isPrivacyHidden={isPrivacyHidden}
        onTogglePrivacy={handleTogglePrivacy}
        onOpenProfile={() => console.log("Abrir perfil")}
      />

      {/* Main Content Area com scroll nativo e espaçamento otimizado para celulares reais */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 px-4 sm:px-5 pt-2 pb-44 z-10 flex flex-col gap-6"
      >
        {/* Filtros de Segmento (Contas, Cartões, Investimentos) com altura e toque aumentados */}
        <SegmentedFilterPills
          selectedSegment={selectedSegment}
          onSelectSegment={setSelectedSegment}
        />

        {/* ABA 1: CARTÕES - Onde aparece todas as informações de todos os cartões e pode adicionar/editar */}
        {selectedSegment === "cartoes" || selectedSegment === "cartao" ? (
          <CardsTabClient
            cards={cards}
            userName={userName}
            isPrivacyHidden={isPrivacyHidden}
            onCardsChange={(newCards) => setCards(newCards)}
            onOpenExtratoWithCard={() => handleNavigateExtrato()}
          />
        ) : selectedSegment === "investimentos" ? (
          /* ABA 2: INVESTIMENTOS (Placeholder Elegante) */
          <div className="w-full rounded-[30px] liquid-glass p-8 text-center flex flex-col items-center justify-center gap-3 border border-white/10 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lime-400">
              <TrendingUp className="w-7 h-7 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Investimentos & Metas</h3>
              <p className="text-xs text-zinc-400 max-w-[260px] mx-auto">
                Em breve: acompanhe rendimentos automáticos de cofrinhos, reservas de emergência e fundos.
              </p>
            </div>
          </div>
        ) : (
          /* ABA 3: CONTAS (Visão Inicial Padrão) */
          <>
            {/* Saudação Personalizada - Elemento monitorado para a animação do header fixo */}
            <div ref={greetingRef} className="pt-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Boa tarde, {userName}
              </h1>
            </div>

            {/* 1. Cartão com Conectar Bancos + Total em Faturas (Refletindo dados do Supabase) */}
            <BankCardsCarousel
              totalInvoices={totalInvoices}
              creditCard={activeDefaultCard}
              cards={cards}
              isPrivacyHidden={isPrivacyHidden}
              onConnectBank={() => setSelectedSegment("cartoes")}
              onOpenInvoices={() => setSelectedSegment("cartoes")}
            />

            {/* 2. Cartão de Saldo em Contas (Refletindo contas reais do Supabase) */}
            <AccountsOverviewCard
              totalBalance={totalAccountsBalance}
              accounts={accountsWithPercentages}
              isPrivacyHidden={isPrivacyHidden}
              onOpenDetails={() => setIsAccountsDetailsOpen(true)}
            />

            {/* 3. Cartão Largura Total: Gastos do Mês com barra verde neon e marcador dinâmico */}
            <MonthlySpendingCard
              totalSpent={initialData.monthOverview.totalSpent}
              limitPlanned={initialData.monthOverview.limitPlanned}
              percentageConsumed={initialData.monthOverview.percentageConsumed}
              isPrivacyHidden={isPrivacyHidden}
              onOpenDetails={handleNavigateExtrato}
            />

            {/* 4. Grid Bento de Widgets (Categorias, Fluxo de Caixa, Limite Usado, Parcelamentos, Fatura, Assinaturas) */}
            <BentoDashboardGrid
              isPrivacyHidden={isPrivacyHidden}
              creditCard={activeDefaultCard}
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
                R$ {formatCurrency(totalAccountsBalance)} parado poderia render mais em um cofrinho
              </span>
            </div>
          </>
        )}
      </div>

      {/* Tela de Detalhes de Saldos em Contas */}
      <AccountsDetailsScreen
        isOpen={isAccountsDetailsOpen}
        onClose={() => setIsAccountsDetailsOpen(false)}
        accounts={accountsWithPercentages}
        totalBalance={totalAccountsBalance}
        recentTransactions={initialData.recentTransactions || []}
        isPrivacyHidden={isPrivacyHidden}
        onTogglePrivacy={handleTogglePrivacy}
        onViewAllTransactions={handleNavigateExtrato}
        onAccountAdded={(newAcc) => {
          setExtraAccounts((prev) => [...prev, newAcc]);
          router.refresh();
        }}
      />
    </>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col relative" data-purpose="cofrinho-dashboard-view">
        {content}
      </div>
    );
  }

  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-liquid-glass-view"
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

      {content}

      {/* Floating Liquid Glass Dock (Search bar + Bottom capsule navigation + Mascot) com alturas aumentadas */}
      <FloatingCofrinhoDock
        activeTab="home"
        onAskCofrinho={handleAskCofrinho}
        onNavigateHome={() => console.log("Já está na home")}
        onTransfer={handleNavigateExtrato}
        onOpenMascot={onOpenMascot}
      />
    </main>
  );
}
