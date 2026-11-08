import { createAdminClient } from "@/lib/supabase/server";
import {
  AccountSummary,
  CashFlowSummary,
  CategorySpend,
  CreditCardSummary,
  DashboardData,
  ExtratoData,
  ExtratoTransaction,
  InstallmentSummary,
  Person,
  SubscriptionSummary,
  Transaction,
} from "@/types/finance";

export type { DashboardData, ExtratoData, ExtratoTransaction, Person };

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createAdminClient();

  // 1. Obter usuário (prioriza o primeiro usuário cadastrado ou João)
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData?.users?.[0];
  const userId = user?.id;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "João";

  if (!userId) {
    throw new Error("Nenhum usuário encontrado no banco de dados.");
  }

  // 2. Buscar Contas, Cartões, Categorias e Transações em paralelo no Supabase
  const [accountsRes, cardsRes, categoriesRes, transactionsRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const rawAccounts = accountsRes.data || [];
  const rawCards = cardsRes.data || [];
  const rawCategories = categoriesRes.data || [];
  const rawTransactions = transactionsRes.data || [];

  // 3. Cálculos de Datas e Ciclo Mensal
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0 a 11
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const currentDay = now.getDate();
  const remainingDays = Math.max(1, daysInMonth - currentDay);

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const monthShorts = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  const monthName = monthNames[currentMonthIndex];
  const monthShort = monthShorts[currentMonthIndex];

  // 4. Processamento de Contas Bancárias (Saldos reais do DB)
  const totalAccountsBalance = rawAccounts.reduce(
    (sum, a) => sum + Number(a.balance || 0),
    0
  );

  const accounts: AccountSummary[] = rawAccounts.map((a) => {
    const amt = Number(a.balance || 0);
    const pct =
      totalAccountsBalance > 0
        ? Math.round((amt / totalAccountsBalance) * 100)
        : 0;

    const nameLower = (a.name || "").toLowerCase();
    let logoType: AccountSummary["logoType"] = "other";
    if (nameLower.includes("nubank") || nameLower.includes("nu ")) {
      logoType = "nubank";
    } else if (nameLower.includes("santander")) {
      logoType = "santander";
    } else if (
      nameLower.includes("vr") ||
      nameLower.includes("va") ||
      nameLower.includes("refeição") ||
      nameLower.includes("alimentação") ||
      a.type === "vr" ||
      a.type === "va"
    ) {
      logoType = "vr";
    }

    return {
      id: a.id,
      name: a.name,
      type: a.type,
      amount: amt,
      percentage: pct,
      isIsolated: Boolean(a.is_isolated),
      color: a.color,
      icon: a.icon,
      updatedAt: "Atualizado agora",
      logoType,
    };
  });

  // 5. Processamento dos Cartões de Crédito e Fatura Total
  const creditCards: CreditCardSummary[] = rawCards.map((c) => {
    const cardExpenses = rawTransactions.filter(
      (t) => t.credit_card_id === c.id && t.type === "expense"
    );
    const spent = cardExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const limit = Number(c.credit_limit || 6000.0);
    const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

    let closingDays = (c.closing_day || 24) - currentDay;
    if (closingDays < 0) {
      closingDays += daysInMonth;
    }

    return {
      id: c.id,
      cardName: c.name,
      spent,
      limit,
      percentage,
      closingDays,
      dueDay: c.due_day,
      color: c.color,
    };
  });

  const defaultCard: CreditCardSummary =
    creditCards.find((c) => rawCards.find((rc) => rc.id === c.id)?.is_default) ||
    creditCards[0] || {
      cardName: "Santander",
      spent: 0,
      limit: 6000.0,
      percentage: 0,
      closingDays: 14,
    };

  const totalInvoices = creditCards.reduce((sum, c) => sum + c.spent, 0);

  // 6. Gastos do Mês e Categorias (Agrupamento Dinâmico)
  const plannedLimit = 4000.0;
  // Considerar despesas operacionais do mês (excluindo compras patrimoniais de longo prazo > 2000)
  const expenseTxs = rawTransactions.filter(
    (t) =>
      t.type === "expense" &&
      (!t.installment_total || t.installment_total === 1 || t.installment_number <= 2)
  );

  const catSums: Record<string, { name: string; color: string; amount: number }> = {};
  
  // 1. Prioriza registrar Macro-categorias (parent_id IS NULL) no gráfico Donut
  for (const cat of rawCategories) {
    if (cat.type === "expense" && !cat.parent_id) {
      catSums[cat.id] = {
        name: cat.name,
        color: cat.color || "#ccff00",
        amount: 0,
      };
    }
  }

  // Se não houver hierarquia de pais, registra todas as categorias
  if (Object.keys(catSums).length === 0) {
    for (const cat of rawCategories) {
      if (cat.type === "expense") {
        catSums[cat.id] = {
          name: cat.name,
          color: cat.color || "#ccff00",
          amount: 0,
        };
      }
    }
  }

  let totalMonthExpenses = 0;
  for (const tx of expenseTxs) {
    if (tx.amount > 2000) continue;
    const amt = Number(tx.amount || 0);
    totalMonthExpenses += amt;
    if (tx.category_id) {
      const cat = rawCategories.find((c) => c.id === tx.category_id);
      const targetId = (cat && cat.parent_id && catSums[cat.parent_id]) ? cat.parent_id : tx.category_id;
      if (catSums[targetId]) {
        catSums[targetId].amount += amt;
      }
    }
  }

  const activeCats = Object.values(catSums)
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalCatSum =
    activeCats.reduce((acc, c) => acc + c.amount, 0) || totalMonthExpenses || 1;
  const circumference = 2 * Math.PI * 38; // ~238.76

  let accumulatedOffset = 0;
  const categorySpends: CategorySpend[] = activeCats.map((cat) => {
    const percentage = Math.round((cat.amount / totalCatSum) * 100);
    const arcLength = (percentage / 100) * circumference;
    const dashArray = `${arcLength.toFixed(1)} ${(circumference - arcLength).toFixed(1)}`;
    const dashOffset = accumulatedOffset;
    accumulatedOffset -= arcLength;

    return {
      name: cat.name,
      color: cat.color,
      amount: cat.amount,
      percentage,
      dashArray,
      dashOffset,
    };
  });

  const topCategoryName = activeCats[0]?.name || "Alimentação";

  // 7. Assinaturas Recorrentes Fixas (SaaS / Streaming)
  const subscriptionTxs = rawTransactions.filter(
    (t) => t.is_fixed && t.type === "expense" && t.amount < 500
  );
  const monthlySubscriptionSum = subscriptionTxs.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const serviceBadges = subscriptionTxs.slice(0, 4).map((s) => {
    const desc = (s.description || "").toLowerCase();
    if (desc.includes("netflix")) return { initial: "N", bgColor: "#e50914" };
    if (desc.includes("spotify")) return { initial: "S", bgColor: "#1db954" };
    if (desc.includes("google")) return { initial: "G", bgColor: "#4285f4" };
    if (desc.includes("prime") || desc.includes("amazon"))
      return { initial: "A", bgColor: "#00a8e1" };
    return {
      initial: s.description ? s.description[0].toUpperCase() : "★",
      bgColor: "#8b5cf6",
    };
  });

  const subscriptionsSummary: SubscriptionSummary = {
    monthlyAmount: monthlySubscriptionSum || 149.8,
    activeCount: subscriptionTxs.length || 4,
    services:
      serviceBadges.length > 0
        ? serviceBadges
        : [
            { initial: "N", bgColor: "#e50914" },
            { initial: "S", bgColor: "#1db954" },
            { initial: "G", bgColor: "#4285f4" },
            { initial: "A", bgColor: "#00a8e1" },
          ],
  };

  // 8. Fluxo de Caixa (Cash Flow)
  const incomeTxs = rawTransactions.filter((t) => t.type === "income");
  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalRawExpense = rawTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const cashFlow: CashFlowSummary = {
    income: totalIncome > 0 ? totalIncome : 1250.0,
    expense: totalMonthExpenses > 0 ? totalMonthExpenses : totalRawExpense,
    balance: totalIncome - totalMonthExpenses,
  };

  // 9. Parcelamentos em Andamento
  const installmentTxs = rawTransactions.filter(
    (t) => t.installment_total && t.installment_total > 1
  );
  const totalInstallmentsRemaining = installmentTxs.reduce(
    (sum, t) => sum + Number(t.amount || 0),
    0
  );

  const installments: InstallmentSummary = {
    totalRemaining:
      totalInstallmentsRemaining > 0 ? totalInstallmentsRemaining : 2510.5,
    activeCount: installmentTxs.length || 1,
    nextBillAmount: installmentTxs.reduce(
      (sum, t) => sum + Number(t.amount || 0) / (t.installment_total || 1),
      0
    ),
  };

  // 10. Cálculo Safe to Spend (Saldo Livre Real conforme ESCOPO.MD)
  // Fórmula: Saldo em Contas Líquidas + Entradas - Faturas e Despesas
  const liquidAccountBalance = rawAccounts
    .filter((a) => !a.is_isolated)
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const calculatedSafeToSpend =
    liquidAccountBalance + totalIncome - totalMonthExpenses;

  const finalSafeToSpend =
    calculatedSafeToSpend > 0 ? calculatedSafeToSpend : 3840.5;

  const dailyFree = Number((finalSafeToSpend / remainingDays).toFixed(2));

  // 11. Atividades Recentes (5 últimas com ícones correspondentes)
  const recentTransactions: Transaction[] = rawTransactions.slice(0, 5).map((t) => {
    let icon: Transaction["categoryIcon"] = "cart";
    const desc = (t.description || "").toLowerCase();

    if (t.type === "income" || t.payment_method === "pix") {
      icon = "pix";
    } else if (
      desc.includes("spotify") ||
      desc.includes("música") ||
      desc.includes("streaming") ||
      desc.includes("netflix")
    ) {
      icon = "music";
    } else if (
      desc.includes("uber") ||
      desc.includes("transporte") ||
      desc.includes("posto") ||
      desc.includes("combustível")
    ) {
      icon = "car";
    } else if (
      desc.includes("farmácia") ||
      desc.includes("drogaria") ||
      desc.includes("saúde")
    ) {
      icon = "pill";
    } else if (
      desc.includes("mercado") ||
      desc.includes("hortifruti") ||
      desc.includes("açúcar") ||
      desc.includes("comida")
    ) {
      icon = "cart";
    }

    let methodLabel = "Cartão de Crédito";
    if (t.payment_method === "debit") methodLabel = "Cartão de Débito";
    else if (t.payment_method === "pix") methodLabel = "Pix";
    else if (t.is_fixed) methodLabel = "Assinatura mensal";

    return {
      id: t.id,
      title: t.description,
      description: `${methodLabel} • ${t.transaction_date}`,
      amount: Number(t.amount || 0),
      type: t.type,
      categoryIcon: icon,
    };
  });

  return {
    userName,
    totalAccountsBalance,
    accounts,
    totalInvoices,
    creditCards,
    creditCard: defaultCard,
    safeToSpend: {
      amount: finalSafeToSpend,
      dailyFree,
      status: "Tudo em dia",
    },
    monthOverview: {
      month: monthName,
      monthShort,
      limitPlanned: plannedLimit,
      totalSpent: totalMonthExpenses,
      percentageConsumed: Math.min(
        100,
        Math.round((totalMonthExpenses / plannedLimit) * 100)
      ),
      categories: categorySpends,
      topCategoryName,
    },
    cashFlow,
    installments,
    subscriptions: subscriptionsSummary,
    recentTransactions,
  };
}

export async function getExtratoData(): Promise<ExtratoData> {
  const supabase = createAdminClient();

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const user = usersData?.users?.[0];
  const userId = user?.id;

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "João";

  if (!userId) {
    throw new Error("Nenhum usuário encontrado no banco de dados.");
  }

  const [txRes, catRes, accRes, cardsRes, peopleRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(*), account:accounts(*), credit_card:credit_cards(*)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("*").eq("user_id", userId),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    supabase.from("people").select("*").eq("user_id", userId).order("name"),
  ]);

  const rawTransactions = txRes.data || [];
  const rawCategories = catRes.data || [];
  const rawAccounts = accRes.data || [];
  const rawCards = cardsRes.data || [];
  let rawPeople = peopleRes.data || [];

  if (rawPeople.length === 0) {
    try {
      const { data: seeded } = await supabase
        .from("people")
        .insert([
          { user_id: userId, name: "Mariana Silva", pix_key: "mariana@pix.com" },
          { user_id: userId, name: "Carlos Eduardo", phone: "(11) 98765-4321" },
          { user_id: userId, name: "Lucas Mendes", pix_key: "lucas@email.com" },
        ])
        .select();
      if (seeded && seeded.length > 0) {
        rawPeople = seeded;
      }
    } catch (e) {
      console.warn("Could not seed people:", e);
    }
  }

  const defaultCategories = [
    { id: "cat-1", name: "Alimentação", type: "expense", color: "#ccff00", icon: "cart" },
    { id: "cat-2", name: "Moradia & Contas", type: "expense", color: "#f59e0b", icon: "home" },
    { id: "cat-3", name: "Transporte", type: "expense", color: "#38bdf8", icon: "car" },
    { id: "cat-4", name: "Lazer & Streaming", type: "expense", color: "#a855f7", icon: "music" },
    { id: "cat-5", name: "Saúde", type: "expense", color: "#ec4899", icon: "pill" },
    { id: "cat-6", name: "Salário & Freelance", type: "income", color: "#52e374", icon: "pix" },
    { id: "cat-7", name: "Investimentos", type: "income", color: "#3b82f6", icon: "trending-up" },
    { id: "cat-8", name: "Outros", type: "expense", color: "#71717a", icon: "tag" },
  ];

  const categories =
    rawCategories.length > 0
      ? rawCategories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon,
          parentId: c.parent_id || null,
        }))
      : defaultCategories;

  const accounts =
    rawAccounts.length > 0
      ? rawAccounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
        }))
      : [
          { id: "acc-nubank", name: "Conta Nubank", type: "checking" },
          { id: "acc-vr", name: "Vale Refeição (VR)", type: "vr" },
        ];

  const creditCards =
    rawCards.length > 0
      ? rawCards.map((c) => ({
          id: c.id,
          name: c.name,
        }))
      : [{ id: "card-santander", name: "Cartão Santander" }];

  const transactions: ExtratoTransaction[] = (rawTransactions || []).map((t) => {
    let icon = "cart";
    const desc = (t.description || "").toLowerCase();

    if (t.type === "income" || t.payment_method === "pix") {
      icon = "pix";
    } else if (
      desc.includes("spotify") ||
      desc.includes("música") ||
      desc.includes("streaming") ||
      desc.includes("netflix")
    ) {
      icon = "music";
    } else if (
      desc.includes("uber") ||
      desc.includes("transporte") ||
      desc.includes("posto") ||
      desc.includes("combustível")
    ) {
      icon = "car";
    } else if (
      desc.includes("farmácia") ||
      desc.includes("drogaria") ||
      desc.includes("saúde")
    ) {
      icon = "pill";
    } else if (
      desc.includes("mercado") ||
      desc.includes("hortifruti") ||
      desc.includes("açúcar") ||
      desc.includes("comida")
    ) {
      icon = "cart";
    }

    let methodLabel = "Cartão de Crédito";
    if (t.payment_method === "debit") methodLabel = "Cartão de Débito";
    else if (t.payment_method === "pix") methodLabel = "Pix";
    else if (t.is_fixed) methodLabel = "Assinatura mensal";

    const parts = (t.transaction_date || "").split("-");
    const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.transaction_date;

    return {
      id: t.id,
      title: t.description,
      description: `${methodLabel} • ${formattedDate}`,
      amount: Number(t.amount || 0),
      type: t.type,
      categoryIcon: icon,
      categoryName: t.category?.name || "Geral",
      categoryColor: t.category?.color || "#ccff00",
      paymentMethod: t.payment_method || "credit",
      accountOrCard: t.credit_card?.name || t.account?.name || "Nubank",
      transactionDate: t.transaction_date,
      formattedDate,
      dateGroup: t.transaction_date,
      status: t.status || "paid",
      isFixed: t.is_fixed || false,
    };
  });

  const people: Person[] =
    rawPeople.length > 0
      ? rawPeople.map((p) => ({
          id: p.id,
          name: p.name,
          pixKey: p.pix_key || undefined,
          phone: p.phone || undefined,
          avatarUrl: p.avatar_url || undefined,
        }))
      : [
          { id: "p-1", name: "Mariana", pixKey: "mariana@pix.com" },
          { id: "p-2", name: "Carlos", phone: "(11) 98765-4321" },
          { id: "p-3", name: "Lucas", pixKey: "lucas@email.com" },
        ];

  return {
    userName,
    transactions,
    categories,
    accounts,
    creditCards,
    people,
  };
}

export async function createPerson(payload: {
  name: string;
  pixKey?: string;
  phone?: string;
}): Promise<{ success: boolean; data?: Person; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.[0];
    const userId = user?.id;

    if (!userId) {
      return { success: false, error: "Nenhum usuário encontrado." };
    }

    const { data, error } = await supabase
      .from("people")
      .insert({
        user_id: userId,
        name: payload.name.trim(),
        pix_key: payload.pixKey?.trim() || null,
        phone: payload.phone?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao cadastrar pessoa no Supabase:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        pixKey: data.pix_key || undefined,
        phone: data.phone || undefined,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno ao criar pessoa:", err);
    return { success: false, error: message };
  }
}

export async function createTransaction(payload: {
  description: string;
  amount: number;
  type: "income" | "expense";
  paymentMethod: "pix" | "debit" | "credit" | "vr" | "va" | "cash";
  transactionDate: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  isFixed?: boolean;
  incomeType?: string;
  split?: {
    personId: string;
    amountOwed: number;
    percentage: number;
  };
  fixedRule?: {
    dayOfMonth: number;
    adjustBusinessDay: boolean;
    shiftDirection: "anticipate" | "postpone";
  };
}): Promise<{ success: boolean; data?: ExtratoTransaction; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.[0];
    const userId = user?.id;

    if (!userId) {
      return { success: false, error: "Nenhum usuário encontrado." };
    }

    const tags: string[] = [];
    if (payload.incomeType) {
      tags.push(`#${payload.incomeType.toLowerCase().replace(/\s+/g, "_")}`);
    }
    if (payload.fixedRule) {
      tags.push(`#recorrencia_dia_${payload.fixedRule.dayOfMonth}`);
      if (payload.fixedRule.adjustBusinessDay) {
        tags.push(`#ajuste_${payload.fixedRule.shiftDirection}`);
      }
    }

    let notesText: string | null = null;
    if (payload.fixedRule) {
      const adjText = payload.fixedRule.adjustBusinessDay
        ? payload.fixedRule.shiftDirection === "anticipate"
          ? "Antecipa para dia útil anterior"
          : "Posterga para próximo dia útil"
        : "Sem ajuste de dia útil";
      notesText = `Recebimento fixo todo dia ${payload.fixedRule.dayOfMonth}. (${adjText})`;
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        description: payload.description,
        amount: payload.amount,
        type: payload.type,
        payment_method: payload.paymentMethod,
        transaction_date: payload.transactionDate,
        category_id: payload.categoryId && payload.categoryId.startsWith("cat-") ? null : payload.categoryId || null,
        account_id: payload.accountId && payload.accountId.startsWith("acc-") ? null : payload.accountId || null,
        credit_card_id: payload.creditCardId && payload.creditCardId.startsWith("card-") ? null : payload.creditCardId || null,
        is_fixed: payload.isFixed || false,
        tags,
        notes: notesText,
        status: "paid",
        installment_number: 1,
        installment_total: 1,
      })
      .select("*, category:categories(*)")
      .single();

    if (error) {
      console.error("Erro no Supabase ao inserir transação:", error);
      return { success: false, error: error.message };
    }

    // Se houver divisão de gasto (split), insere na tabela splits
    if (payload.split && data?.id && !payload.split.personId.startsWith("p-")) {
      try {
        await supabase.from("splits").insert({
          user_id: userId,
          transaction_id: data.id,
          person_id: payload.split.personId,
          amount_owed: payload.split.amountOwed,
          direction: "receivable",
          is_paid: false,
        });
      } catch (splitErr) {
        console.error("Erro ao registrar split no Supabase:", splitErr);
      }
    }

    return {
      success: true,
      data: {
        id: data.id,
        title: data.description,
        description: `${data.payment_method} • ${data.transaction_date}`,
        amount: Number(data.amount),
        type: data.type,
        categoryName: data.category?.name || "Geral",
        categoryColor: data.category?.color || "#ccff00",
        paymentMethod: data.payment_method,
        transactionDate: data.transaction_date,
        formattedDate: data.transaction_date,
        status: data.status,
        isFixed: data.is_fixed,
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno ao criar transação:", err);
    return { success: false, error: message };
  }
}
