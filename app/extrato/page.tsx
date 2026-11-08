import { Suspense } from "react";
import { getExtratoData } from "@/lib/finance";
import { ExtratoClient } from "@/components/finance/ExtratoClient";
import { ExtratoData } from "@/types/finance";

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

      <div className="flex-1 px-4 sm:px-5 pt-3 space-y-4">
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
    </main>
  );
}

async function ExtratoDataLoader() {
  let data: ExtratoData;
  try {
    data = await getExtratoData();
  } catch (error) {
    console.error("Erro ao carregar dados do extrato no Supabase:", error);
    // Fallback gracioso com lista inicial vazia (reproduzindo fielmente a imagem)
    data = {
      userName: "João",
      transactions: [],
      categories: [
        { id: "cat-1", name: "Alimentação", type: "expense", color: "#ccff00", icon: "cart" },
        { id: "cat-2", name: "Moradia & Contas", type: "expense", color: "#f59e0b", icon: "home" },
        { id: "cat-3", name: "Transporte", type: "expense", color: "#38bdf8", icon: "car" },
        { id: "cat-4", name: "Lazer & Streaming", type: "expense", color: "#a855f7", icon: "music" },
        { id: "cat-5", name: "Saúde", type: "expense", color: "#ec4899", icon: "pill" },
        { id: "cat-6", name: "Salário & Freelance", type: "income", color: "#52e374", icon: "pix" },
        { id: "cat-7", name: "Investimentos", type: "income", color: "#3b82f6", icon: "trending-up" },
        { id: "cat-8", name: "Outros", type: "expense", color: "#71717a", icon: "tag" },
      ],
      accounts: [
        { id: "acc-nubank", name: "Conta Nubank", type: "checking" },
        { id: "acc-vr", name: "Vale Refeição (VR)", type: "vr" },
      ],
      creditCards: [
        { id: "card-santander", name: "Cartão Santander" },
      ],
      people: [
        { id: "p-1", name: "Mariana", pixKey: "mariana@pix.com" },
        { id: "p-2", name: "Carlos", phone: "(11) 98765-4321" },
        { id: "p-3", name: "Lucas", pixKey: "lucas@email.com" },
      ],
    };
  }

  return <ExtratoClient initialData={data} />;
}

export default function ExtratoPage() {
  return (
    <Suspense fallback={<ExtratoSkeleton />}>
      <ExtratoDataLoader />
    </Suspense>
  );
}
