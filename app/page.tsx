import { Suspense } from "react";
import { getDashboardData, getExtratoData } from "@/lib/finance";
import { CofrinhoAppShell } from "@/components/finance/CofrinhoAppShell";
import { fallbackDashboardData, fallbackExtratoData } from "@/lib/fallbackData";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";

function DashboardSkeleton() {
  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col justify-between relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-skeleton"
    >
      <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06]">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-800 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-10 rounded-full bg-[#ccff00]/30 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-5 pt-4 space-y-6 pb-44">
        <div className="flex gap-2">
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-9 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="w-48 h-9 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="h-48 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
        <div className="h-56 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
      </div>

      <FloatingCofrinhoDock activeTab="home" />
    </main>
  );
}

async function DashboardDataLoader() {
  const [dashboardData, extratoData] = await Promise.all([
    getDashboardData().catch((error) => {
      console.error("Erro ao carregar dados do Supabase:", error);
      return fallbackDashboardData;
    }),
    getExtratoData().catch((error) => {
      console.error("Erro ao carregar extrato do Supabase:", error);
      return fallbackExtratoData;
    }),
  ]);

  return (
    <CofrinhoAppShell
      initialTab="home"
      initialDashboardData={dashboardData || fallbackDashboardData}
      initialExtratoData={extratoData || fallbackExtratoData}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}
