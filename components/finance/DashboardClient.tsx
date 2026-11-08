"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/finance/TopHeader";
import { BankCardsCarousel } from "@/components/finance/BankCardsCarousel";
import { AccountsOverviewCard } from "@/components/finance/AccountsOverviewCard";
import { MonthlySpendingCard } from "@/components/finance/MonthlySpendingCard";
import { BentoDashboardGrid } from "@/components/finance/BentoDashboardGrid";
import { FloatingPierreDock } from "@/components/finance/FloatingPierreDock";
import { DashboardData } from "@/lib/finance";

interface DashboardClientProps {
  initialData: DashboardData;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const [isPrivacyHidden, setIsPrivacyHidden] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<"contas" | "cartao" | "investimentos">("contas");

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

  return (
    <main
      className="w-full max-w-[420px] min-h-screen bg-black text-white flex flex-col justify-between relative shadow-2xl sm:my-4 sm:rounded-[42px] sm:border sm:border-zinc-800/80 overflow-hidden"
      data-purpose="pierre-finance-liquid-glass-view"
    >
      {/* Dynamic Glowing Mesh Aurora Gradient FIXO no viewport do container */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] h-screen pointer-events-none overflow-hidden z-0">
        {/* Glow Top Left (Magenta / Violeta / Indigo) */}
        <div className="absolute -top-[120px] -left-[100px] w-[360px] h-[360px] bg-gradient-to-br from-indigo-600/70 via-purple-600/55 to-pink-600/60 rounded-full blur-[85px]" />
        
        {/* Glow Top Right (Rosa Neon / Laranja / Âmbar) */}
        <div className="absolute -top-[130px] -right-[80px] w-[360px] h-[360px] bg-gradient-to-bl from-rose-500/80 via-orange-500/45 to-amber-500/35 rounded-full blur-[90px]" />
        
        {/* Glow Central Meio (Ciano / Turquesa / Esmeralda) */}
        <div className="absolute top-[220px] left-[15%] w-[300px] h-[280px] bg-gradient-to-b from-cyan-500/25 via-teal-500/20 to-transparent rounded-full blur-[80px]" />

        {/* Glow Inferior Suave (Azul Profundo / Roxo) para realçar o dock ao rolar */}
        <div className="absolute bottom-10 left-[10%] w-[320px] h-[260px] bg-gradient-to-t from-purple-900/30 via-indigo-800/20 to-transparent rounded-full blur-[90px]" />
      </div>

      {/* Top Header com Avatar, Privacidade, Pierre Pro & Filtros de Pílula */}
      <TopHeader
        isPrivacyHidden={isPrivacyHidden}
        onTogglePrivacy={handleTogglePrivacy}
        selectedSegment={selectedSegment}
        onSelectSegment={setSelectedSegment}
      />

      {/* Scrollable Main Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-36 no-scrollbar z-10 flex flex-col gap-6">
        {/* Saudação Personalizada */}
        <div className="pt-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Boa tarde, {initialData.userName || "João"}
          </h1>
        </div>

        {/* 1. Cartão com Conectar Bancos + Total em Faturas */}
        <BankCardsCarousel
          isPrivacyHidden={isPrivacyHidden}
          onConnectBank={handleConnectBank}
        />

        {/* 2. Cartão de Saldo em Contas + Santander Item */}
        <AccountsOverviewCard
          totalBalance={4.71}
          isPrivacyHidden={isPrivacyHidden}
          accounts={[
            {
              id: "santander-main",
              name: "Santander",
              updatedAt: "Atualizado agora",
              amount: 4.71,
              percentage: 100,
              logoType: "santander",
            },
          ]}
        />

        {/* 3. Cartão Largura Total: Gastos do Mês com barra verde neon e marcador */}
        <MonthlySpendingCard
          totalSpent={0.0}
          limitPlanned={initialData.monthOverview?.limitPlanned || 4000.0}
          percentageConsumed={0}
          isPrivacyHidden={isPrivacyHidden}
          onOpenDetails={() => console.log("Abrir detalhes de gastos do mês")}
        />

        {/* 4. Grid Bento de Widgets de Finanças Pessoais (com base na referência) */}
        <BentoDashboardGrid
          isPrivacyHidden={isPrivacyHidden}
          creditCard={initialData.creditCard}
          subscriptions={initialData.subscriptions}
          categories={initialData.monthOverview.categories}
          onWidgetClick={handleWidgetClick}
          onAddWidgets={handleAddWidgets}
        />

        {/* Insight / Notificação sutil com efeito Liquid Glass */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl liquid-glass border border-white/[0.08] text-xs text-zinc-300 font-medium pb-2 shadow-sm">
          <span className="text-sm">💡</span>
          <span>R$ 4,71 parado poderia render mais em um cofrinho</span>
        </div>
      </div>

      {/* Floating Liquid Glass Dock (Search bar + Bottom capsule navigation + Mascot) */}
      <FloatingPierreDock
        onAskPierre={handleAskPierre}
        onNavigateHome={() => console.log("Ir para home")}
        onTransfer={() => console.log("Abrir transferências")}
        onOpenMascot={() => console.log("Abrir mascote")}
      />
    </main>
  );
}
