"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardClient } from "@/components/finance/DashboardClient";
import { ExtratoClient } from "@/components/finance/ExtratoClient";
import { FluxoDeCaixaClient } from "@/components/finance/FluxoDeCaixaClient";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";
import { DashboardData, ExtratoData } from "@/types/finance";

export interface CofrinhoAppShellProps {
  initialTab?: "home" | "extrato" | "fluxo";
  initialDashboardData: DashboardData;
  initialExtratoData: ExtratoData;
}

export function CofrinhoAppShell({
  initialTab = "home",
  initialDashboardData,
  initialExtratoData,
}: CofrinhoAppShellProps) {
  const [currentTab, setCurrentTab] = useState<"home" | "extrato" | "fluxo">(initialTab);
  const [isPrivacyHidden, setIsPrivacyHidden] = useState(false);
  const [isExtratoOverlayOpen, setIsExtratoOverlayOpen] = useState(false);

  // Armazena a posição de rolagem de cada aba para manter o contexto do usuário
  const homeScrollRef = useRef(0);
  const extratoScrollRef = useRef(0);
  const fluxoScrollRef = useRef(0);

  const handleSwitchTab = (newTab: "home" | "extrato" | "fluxo") => {
    if (newTab === currentTab) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Salva scroll da aba atual
    if (currentTab === "home") {
      homeScrollRef.current = window.scrollY;
    } else if (currentTab === "extrato") {
      extratoScrollRef.current = window.scrollY;
    } else {
      fluxoScrollRef.current = window.scrollY;
    }

    setCurrentTab(newTab);

    // Atualiza a URL no navegador sem acionar desmontagem ou reload de página
    const targetPath =
      newTab === "extrato" ? "/extrato" : newTab === "fluxo" ? "/fluxo" : "/";
    window.history.pushState({ tab: newTab }, "", targetPath);

    // Restaura o scroll salvo da nova aba suavemente
    const targetScroll =
      newTab === "home"
        ? homeScrollRef.current
        : newTab === "extrato"
        ? extratoScrollRef.current
        : fluxoScrollRef.current;
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: "instant" });
    });
  };

  // Suporte a voltar/avançar no histórico do navegador
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const targetTab = path.includes("fluxo")
        ? "fluxo"
        : path.includes("extrato") || path.includes("atividades")
        ? "extrato"
        : "home";
      setCurrentTab(targetTab);

      // Garante o desbloqueio do scroll da página
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      // Se voltar para a home ou fluxo, reseta a flag de overlay
      if (targetTab !== "extrato") {
        setIsExtratoOverlayOpen(false);
      }

      // Restaura o scroll salvo da aba correspondente
      const targetScroll =
        targetTab === "home"
          ? homeScrollRef.current
          : targetTab === "extrato"
          ? extratoScrollRef.current
          : fluxoScrollRef.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetScroll, behavior: "instant" });
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip selection:bg-lime-400 selection:text-black"
      data-purpose="cofrinho-main-shell"
    >
      {/* Dynamic Glowing Mesh Aurora Gradient FIXO no viewport do container com transição suave entre abas */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-full sm:max-w-[440px] md:max-w-[460px] h-screen pointer-events-none overflow-hidden z-0">
        {/* Glows da Tela Inicial (Aurora Vibrante Neon) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            currentTab === "home" ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Glow Top Left (Magenta / Violeta / Indigo) */}
          <div className="absolute -top-[120px] -left-[100px] w-[360px] h-[360px] bg-gradient-to-br from-indigo-600/70 via-purple-600/55 to-pink-600/60 rounded-full blur-[85px]" />

          {/* Glow Top Right (Rosa Neon / Laranja / Âmbar) */}
          <div className="absolute -top-[130px] -right-[80px] w-[360px] h-[360px] bg-gradient-to-bl from-rose-500/80 via-orange-500/45 to-amber-500/35 rounded-full blur-[90px]" />

          {/* Glow Central Meio (Ciano / Turquesa / Esmeralda) */}
          <div className="absolute top-[220px] left-[15%] w-[300px] h-[280px] bg-gradient-to-b from-cyan-500/25 via-teal-500/20 to-transparent rounded-full blur-[80px]" />

          {/* Glow Inferior Suave (Azul Profundo / Roxo) */}
          <div className="absolute bottom-10 left-[10%] w-[320px] h-[260px] bg-gradient-to-t from-purple-900/30 via-indigo-800/20 to-transparent rounded-full blur-[90px]" />
        </div>

        {/* Glows da Tela de Extrato (Ambient Dark Emerald Glass) */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            currentTab === "extrato" ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Glow Superior Suave Esmeralda/Lime */}
          <div className="absolute -top-[100px] left-[15%] w-[340px] h-[320px] bg-gradient-to-b from-lime-500/15 via-emerald-600/10 to-transparent rounded-full blur-[90px]" />

          {/* Glow Inferior Suave Roxo Profundo */}
          <div className="absolute bottom-16 right-[5%] w-[320px] h-[300px] bg-gradient-to-t from-purple-900/20 via-zinc-900/30 to-transparent rounded-full blur-[85px]" />
        </div>
      </div>

      {/* Área de Conteúdo com Transição Suave (Cross-Fade e Leve Deslizamento) */}
      <div className="relative w-full flex-1">
        {/* View da Tela Inicial */}
        <div
          className={`w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            currentTab === "home"
              ? "opacity-100 transform-none visible relative"
              : "opacity-0 translate-y-2 pointer-events-none absolute top-0 left-0 w-full invisible h-0 overflow-hidden"
          }`}
        >
          <DashboardClient
            embedded
            initialData={initialDashboardData}
            allTransactions={initialExtratoData.transactions}
            allCategories={initialExtratoData.categories || []}
            isPrivacyHidden={isPrivacyHidden}
            onTogglePrivacy={() => setIsPrivacyHidden((prev) => !prev)}
            onNavigateToExtrato={() => handleSwitchTab("extrato")}
            onNavigateToFluxo={() => handleSwitchTab("fluxo")}
            onAskCofrinho={() => console.log("Pergunte ao Pierre")}
            onOpenMascot={() => console.log("Mascote Pierre")}
          />
        </div>

        {/* View da Tela de Extrato */}
        <div
          className={`w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            currentTab === "extrato"
              ? "opacity-100 transform-none visible relative"
              : "opacity-0 translate-y-2 pointer-events-none absolute top-0 left-0 w-full invisible h-0 overflow-hidden"
          }`}
        >
          <ExtratoClient
            embedded
            initialData={initialExtratoData}
            isPrivacyHidden={isPrivacyHidden}
            onTogglePrivacy={() => setIsPrivacyHidden((prev) => !prev)}
            onNavigateToHome={() => handleSwitchTab("home")}
            onAskCofrinho={() => console.log("Pergunte ao Pierre")}
            onOpenMascot={() => console.log("Mascote Pierre")}
            onOverlayChange={setIsExtratoOverlayOpen}
          />
        </div>

        {/* View da Tela de Fluxo de Caixa */}
        <div
          className={`w-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            currentTab === "fluxo"
              ? "opacity-100 transform-none visible relative"
              : "opacity-0 translate-y-2 pointer-events-none absolute top-0 left-0 w-full invisible h-0 overflow-hidden"
          }`}
        >
          <FluxoDeCaixaClient
            initialExtratoData={initialExtratoData}
            isPrivacyHidden={isPrivacyHidden}
            onTogglePrivacy={() => setIsPrivacyHidden((prev) => !prev)}
            onNavigateHome={() => handleSwitchTab("home")}
            onNavigateToExtrato={() => handleSwitchTab("extrato")}
          />
        </div>
      </div>

      {/* Floating Liquid Glass Dock FIXO e PERMANENTE (oculto na aba de fluxo e quando modal estiver aberto na aba de extrato) */}
      <FloatingCofrinhoDock
        hidden={currentTab === "fluxo" || (currentTab === "extrato" && isExtratoOverlayOpen)}
        activeTab={currentTab === "fluxo" ? "home" : currentTab}
        onNavigateHome={() => handleSwitchTab("home")}
        onTransfer={() => handleSwitchTab("extrato")}
        onAskCofrinho={() => console.log("Pergunte ao Pierre")}
        onOpenMascot={() => console.log("Mascote Pierre")}
      />
    </main>
  );
}
