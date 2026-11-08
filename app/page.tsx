import { Suspense } from "react";
import { getDashboardData } from "@/lib/finance";
import { DashboardClient } from "@/components/finance/DashboardClient";

function DashboardSkeleton() {
  return (
    <main
      className="w-full max-w-full sm:max-w-[440px] md:max-w-[460px] min-h-screen bg-black text-white flex flex-col justify-between relative shadow-2xl sm:my-6 sm:rounded-[44px] sm:border sm:border-zinc-800/80 sm:overflow-clip"
      data-purpose="pierre-finance-skeleton"
    >
      <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-white/[0.06]">
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-800 animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-10 rounded-full bg-[#ccff00]/30 animate-pulse" />
        </div>
      </div>

      <div className="flex-1 px-4 sm:px-5 pt-4 space-y-6">
        <div className="flex gap-2">
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-20 h-9 rounded-full bg-zinc-800 animate-pulse" />
          <div className="w-24 h-9 rounded-full bg-zinc-800 animate-pulse" />
        </div>
        <div className="w-48 h-9 rounded-lg bg-zinc-800 animate-pulse" />
        <div className="h-48 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
        <div className="h-56 rounded-[28px] bg-zinc-900/80 border border-white/5 animate-pulse" />
      </div>
    </main>
  );
}

async function DashboardDataLoader() {
  let data;
  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Erro ao carregar dados do Supabase:", error);
    // Retorna fallback gracioso em caso de erro transitório de rede
    data = {
      userName: "João",
      totalAccountsBalance: 5850.0,
      accounts: [
        {
          id: "nubank",
          name: "Conta Corrente Nubank",
          type: "checking" as const,
          amount: 5200.0,
          percentage: 89,
          isIsolated: false,
          color: "#8a05be",
          icon: "account_balance",
          updatedAt: "Atualizado agora",
          logoType: "nubank" as const,
        },
        {
          id: "vr",
          name: "Vale Refeição (VR)",
          type: "vr" as const,
          amount: 650.0,
          percentage: 11,
          isIsolated: true,
          color: "#f59e0b",
          icon: "restaurant",
          updatedAt: "Atualizado agora",
          logoType: "vr" as const,
        },
      ],
      totalInvoices: 4110.9,
      creditCards: [
        {
          id: "santander",
          cardName: "Santander",
          spent: 4110.9,
          limit: 6000.0,
          percentage: 69,
          closingDays: 16,
        },
      ],
      creditCard: {
        id: "santander",
        cardName: "Santander",
        spent: 4110.9,
        limit: 6000.0,
        percentage: 69,
        closingDays: 16,
      },
      safeToSpend: {
        amount: 3840.5,
        dailyFree: 174.57,
        status: "Tudo em dia",
      },
      monthOverview: {
        month: "Novembro",
        monthShort: "NOV",
        limitPlanned: 4000.0,
        totalSpent: 2539.9,
        percentageConsumed: 63,
        categories: [
          {
            name: "Alimentação",
            color: "#ccff00",
            amount: 980.0,
            percentage: 39,
            dashArray: "93.1 145.7",
            dashOffset: 0,
          },
          {
            name: "Moradia & Contas",
            color: "#f59e0b",
            amount: 700.0,
            percentage: 28,
            dashArray: "66.9 171.9",
            dashOffset: -93.1,
          },
          {
            name: "Transporte",
            color: "#38bdf8",
            amount: 420.0,
            percentage: 17,
            dashArray: "40.6 198.2",
            dashOffset: -160.0,
          },
          {
            name: "Lazer & Streaming",
            color: "#a855f7",
            amount: 439.9,
            percentage: 16,
            dashArray: "38.2 200.6",
            dashOffset: -200.6,
          },
        ],
        topCategoryName: "Alimentação",
      },
      cashFlow: {
        income: 1250.0,
        expense: 2539.9,
        balance: -1289.9,
      },
      installments: {
        totalRemaining: 2510.5,
        activeCount: 1,
        nextBillAmount: 251.05,
      },
      subscriptions: {
        monthlyAmount: 149.8,
        activeCount: 4,
        services: [
          { initial: "N", bgColor: "#e50914" },
          { initial: "S", bgColor: "#1db954" },
          { initial: "G", bgColor: "#4285f4" },
          { initial: "A", bgColor: "#00a8e1" },
        ],
      },
      recentTransactions: [],
    };
  }

  return <DashboardClient initialData={data} />;
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}
