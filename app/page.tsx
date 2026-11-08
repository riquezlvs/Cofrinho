import { Suspense } from "react";
import { getDashboardData } from "@/lib/finance";
import { DashboardClient } from "@/components/finance/DashboardClient";

function DashboardSkeleton() {
  return (
    <main
      className="w-full max-w-[420px] min-h-screen bg-black text-white flex flex-col justify-between relative shadow-2xl sm:my-4 sm:rounded-[42px] sm:border sm:border-zinc-800/80 overflow-hidden"
      data-purpose="pierre-finance-skeleton"
    >
      <div className="px-5 pt-3 pb-2 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 animate-pulse" />
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
            <div className="w-24 h-9 rounded-full bg-[#ccff00]/30 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-20 h-7 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-20 h-7 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-7 rounded-full bg-zinc-800 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-6">
        <div className="w-48 h-8 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="h-44 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
        <div className="h-56 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
      </div>
    </main>
  );
}

async function DashboardDataLoader() {
  const data = await getDashboardData();
  return <DashboardClient initialData={data} />;
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}
