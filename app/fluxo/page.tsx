import { Suspense } from "react";
import { getDashboardData, getExtratoData } from "@/lib/finance";
import { CofrinhoAppShell } from "@/components/finance/CofrinhoAppShell";
import { fallbackDashboardData, fallbackExtratoData } from "@/lib/fallbackData";

function FluxoSkeleton() {
  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col justify-between relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="cofrinho-fluxo-skeleton"
    >
      <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
        <div className="w-48 h-9 rounded-full bg-zinc-900 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
      </div>

      <div className="flex-1 px-4 sm:px-5 pt-4 space-y-4 pb-20">
        <div className="w-40 h-4 rounded bg-zinc-800 animate-pulse" />
        <div className="w-56 h-10 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="w-36 h-4 rounded bg-zinc-800 animate-pulse" />
        <div className="w-36 h-4 rounded bg-zinc-800 animate-pulse" />
        <div className="w-full h-24 rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse mt-4" />
        <div className="w-full h-40 rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse mt-6" />
      </div>
    </main>
  );
}

async function FluxoDataLoader() {
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
      initialTab="fluxo"
      initialDashboardData={dashboardData || fallbackDashboardData}
      initialExtratoData={extratoData || fallbackExtratoData}
    />
  );
}

export default function FluxoPage() {
  return (
    <Suspense fallback={<FluxoSkeleton />}>
      <FluxoDataLoader />
    </Suspense>
  );
}
