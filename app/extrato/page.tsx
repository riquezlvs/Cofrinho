import { Suspense } from "react";
import { getDashboardData, getExtratoData } from "@/lib/finance";
import { CofrinhoAppShell } from "@/components/finance/CofrinhoAppShell";
import { fallbackDashboardData, fallbackExtratoData } from "@/lib/fallbackData";
import { FloatingCofrinhoDock } from "@/components/finance/FloatingCofrinhoDock";

function ExtratoSkeleton() {
  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-[#09090b] text-white flex flex-col justify-between relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-extrato-skeleton"
    >
      <div className="px-4 sm:px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="w-11 h-11 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-11 h-11 rounded-full bg-[#ccff00]/30 animate-pulse" />
      </div>

      <div className="flex-1 px-4 sm:px-5 pt-3 space-y-4 pb-44">
        <div className="w-40 h-9 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="w-full h-11 rounded-full bg-zinc-900 animate-pulse" />
        <div className="flex gap-2">
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-28 h-9 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="h-64 flex flex-col items-center justify-center space-y-3 pt-12">
          <div className="w-48 h-5 rounded-md bg-zinc-800 animate-pulse" />
          <div className="w-64 h-4 rounded-md bg-zinc-900 animate-pulse" />
        </div>
      </div>

      <FloatingCofrinhoDock activeTab="extrato" />
    </main>
  );
}

async function ExtratoDataLoader() {
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
      initialTab="extrato"
      initialDashboardData={dashboardData || fallbackDashboardData}
      initialExtratoData={extratoData || fallbackExtratoData}
    />
  );
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={<ExtratoSkeleton />}>
      <ExtratoDataLoader />
    </Suspense>
  );
}
