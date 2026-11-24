import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  fetchPluggyAccounts,
  fetchPluggyTransactions,
  isPluggyConfigured,
} from "@/lib/openFinance";

export async function POST(req: Request) {
  try {
    if (!isPluggyConfigured()) {
      return NextResponse.json(
        { error: "Credenciais Pluggy não configuradas." },
        { status: 503 }
      );
    }

    const { itemId, institutionName } = (await req.json()) as {
      itemId?: string;
      institutionName?: string;
    };

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId é obrigatório." },
        { status: 400 }
      );
    }

    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    const supabase = createAdminClient();
    let userId = user?.id;
    if (!userId) {
      const { data: usersData } = await supabase.auth.admin.listUsers();
      userId = usersData?.users?.[0]?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Usuário não autenticado e nenhum usuário padrão encontrado." },
        { status: 401 }
      );
    }

    // 1. Registra/atualiza a conexão Open Finance
    const { error: connError } = await supabase
      .from("open_finance_connections")
      .upsert(
        {
          user_id: userId,
          provider: "pluggy",
          item_id: itemId,
          institution_name: institutionName ?? "Banco conectado",
          status: "UPDATED",
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "item_id" }
      );

    if (connError) {
      return NextResponse.json(
        { error: `Erro ao salvar conexão: ${connError.message}` },
        { status: 500 }
      );
    }

    // 2. Busca contas e transações na Pluggy
    const accounts = await fetchPluggyAccounts(itemId);
    let syncedTransactions = 0;

    for (const acc of accounts) {
      const { data: upsertedAccount, error: accError } = await supabase
        .from("accounts")
        .upsert(
          {
            user_id: userId,
            name: acc.name,
            balance: acc.balance,
            external_id: acc.id,
          },
          { onConflict: "external_id" }
        )
        .select("id")
        .single();

      if (accError) {
        return NextResponse.json(
          { error: `Erro ao salvar conta ${acc.name}: ${accError.message}` },
          { status: 500 }
        );
      }

      const txs = await fetchPluggyTransactions(acc.id);
      if (txs.length > 0 && upsertedAccount?.id) {
        const rows = txs.map((tx) => ({
          user_id: userId,
          account_id: upsertedAccount.id,
          description: tx.description,
          amount: tx.type === "DEBIT" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
          date: tx.date,
          category: tx.category ?? "Outros",
          external_id: tx.id,
        }));

        const { error: txError } = await supabase
          .from("transactions")
          .upsert(rows, { onConflict: "external_id" });

        if (txError) {
          return NextResponse.json(
            { error: `Erro ao salvar transações: ${txError.message}` },
            { status: 500 }
          );
        }

        syncedTransactions += rows.length;
      }
    }

    return NextResponse.json({
      success: true,
      accountsCount: accounts.length,
      transactionsCount: syncedTransactions,
    });
  } catch (err) {
    console.error("Open Finance sync error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Erro ao sincronizar dados.",
      },
      { status: 500 }
    );
  }
}
