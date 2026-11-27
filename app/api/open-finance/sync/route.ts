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
      console.error("Erro ao salvar conexão:", connError);
      return NextResponse.json(
        { error: `Erro ao salvar conexão: ${connError.message}` },
        { status: 500 }
      );
    }

    // 2. Busca contas e transações na Pluggy
    const accounts = await fetchPluggyAccounts(itemId);
    console.log(
      "Pluggy accounts:",
      accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, subtype: a.subtype }))
    );
    let syncedTransactions = 0;

    for (const acc of accounts) {
      const isCreditCard = acc.type === "CREDIT";
      let accountIdForTx: string | null = null;
      let creditCardIdForTx: string | null = null;

      if (isCreditCard) {
        const closingDay = acc.creditData?.balanceCloseDate
          ? new Date(acc.creditData.balanceCloseDate).getUTCDate() || 1
          : 1;
        const dueDay = acc.creditData?.balanceDueDate
          ? new Date(acc.creditData.balanceDueDate).getUTCDate() || 10
          : 10;

        const { data: existingCard } = await supabase
          .from("credit_cards")
          .select("id")
          .eq("user_id", userId)
          .eq("name", acc.name)
          .maybeSingle();

        let upsertedCardId = existingCard?.id ?? null;
        let cardError: { message: string } | null = null;

        if (upsertedCardId) {
          const { error } = await supabase
            .from("credit_cards")
            .update({
              credit_limit: acc.creditData?.creditLimit ?? 0,
              closing_day: closingDay,
              due_day: dueDay,
            })
            .eq("id", upsertedCardId);
          cardError = error;
        } else {
          const { data: insertedCard, error } = await supabase
            .from("credit_cards")
            .insert({
              user_id: userId,
              name: acc.name,
              credit_limit: acc.creditData?.creditLimit ?? 0,
              closing_day: closingDay,
              due_day: dueDay,
            })
            .select("id")
            .single();
          upsertedCardId = insertedCard?.id ?? null;
          cardError = error;
        }

        if (cardError) {
          console.error(`Erro ao salvar cartão ${acc.name}:`, cardError);
          return NextResponse.json(
            { error: `Erro ao salvar cartão ${acc.name}: ${cardError.message}` },
            { status: 500 }
          );
        }

        creditCardIdForTx = upsertedCardId;
      } else {
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
          console.error(`Erro ao salvar conta ${acc.name}:`, accError);
          return NextResponse.json(
            { error: `Erro ao salvar conta ${acc.name}: ${accError.message}` },
            { status: 500 }
          );
        }

        accountIdForTx = upsertedAccount?.id ?? null;
      }

      const txs = await fetchPluggyTransactions(acc.id);
      if (txs.length > 0 && (accountIdForTx || creditCardIdForTx)) {
        const rows = txs.map((tx) => ({
          user_id: userId,
          account_id: accountIdForTx,
          credit_card_id: creditCardIdForTx,
          description: tx.description,
          amount: Math.abs(tx.amount),
          type: tx.type === "DEBIT" ? "expense" : "income",
          payment_method: isCreditCard
            ? "credit"
            : tx.description.toUpperCase().includes("PIX")
            ? "pix"
            : "debit",
          transaction_date: tx.date.slice(0, 10),
          status: "paid",
          external_id: tx.id,
        }));

        const { error: txError } = await supabase
          .from("transactions")
          .upsert(rows, { onConflict: "external_id" });

        if (txError) {
          console.error("Erro ao salvar transações:", txError);
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
