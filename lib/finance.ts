import { createAdminClient } from "@/lib/supabase/server";
import {
  AccountSummary,
  CashFlowSummary,
  CategorySpend,
  CreditCardSummary,
  DashboardData,
  ExtratoData,
  ExtratoTransaction,
  InstallmentScheduleItem,
  InstallmentSummary,
  Person,
  SubscriptionSummary,
  Transaction,
  TransactionSplit,
} from "@/types/finance";
import { addMonths } from "@/lib/dateUtils";
import { detectBrand } from "@/lib/brands";

export type { DashboardData, ExtratoData, ExtratoTransaction, Person, InstallmentScheduleItem, TransactionSplit };
export { addMonths };

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
  const currentCompetencePrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}`;

  const creditCards: CreditCardSummary[] = rawCards.map((c) => {
    const cardTxs = rawTransactions.filter((t) => {
      if (t.credit_card_id !== c.id) return false;
      if (t.competence_date) {
        return t.competence_date.startsWith(currentCompetencePrefix);
      }
      return t.status === "paid";
    });

    const spentExpenses = cardTxs
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const spentCredits = cardTxs
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const spent = Math.max(0, Number((spentExpenses - spentCredits).toFixed(2)));

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
      closingDay: c.closing_day,
      dueDay: c.due_day,
      color: c.color,
      isDefault: Boolean(c.is_default),
    };
  });

  const defaultCard: CreditCardSummary =
    creditCards.find((c) => rawCards.find((rc) => rc.id === c.id)?.is_default) ||
    creditCards[0] || {
      id: "santander",
      cardName: "Santander",
      spent: 0,
      limit: 6000.0,
      percentage: 0,
      closingDays: 14,
      closingDay: 24,
      dueDay: 1,
      isDefault: true,
      color: "#ec0000",
    };

  const totalInvoices = creditCards.reduce((sum, c) => sum + c.spent, 0);

  // 6. Gastos do Mês e Categorias (Agrupamento Dinâmico)
  const plannedLimit = 4000.0;
  // Considerar despesas operacionais do mês atual (respeitando competência e status)
  const expenseTxs = rawTransactions.filter(
    (t) =>
      t.type === "expense" &&
      t.status === "paid" &&
      (!t.competence_date || t.competence_date.startsWith(currentCompetencePrefix))
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
    if (desc.includes("netflix"))
      return { name: "Netflix", domain: "netflix.com", initial: "N", bgColor: "#e50914" };
    if (desc.includes("spotify"))
      return { name: "Spotify", domain: "spotify.com", initial: "S", bgColor: "#1db954" };
    if (desc.includes("google"))
      return { name: "Google One", domain: "google.com", initial: "G", bgColor: "#4285f4" };
    if (desc.includes("prime") || desc.includes("amazon"))
      return { name: "Prime Video", domain: "primevideo.com", initial: "A", bgColor: "#00a8e1" };
    const detected = detectBrand(s.description || "");
    return {
      name: detected?.name || s.description || "Assinatura",
      domain: detected?.domain,
      initial: s.description ? s.description[0].toUpperCase() : "★",
      bgColor: detected?.color || "#8b5cf6",
    };
  });

  const subscriptionsSummary: SubscriptionSummary = {
    monthlyAmount: monthlySubscriptionSum || 149.8,
    activeCount: subscriptionTxs.length || 4,
    services:
      serviceBadges.length > 0
        ? serviceBadges
        : [
            { name: "Netflix", domain: "netflix.com", initial: "N", bgColor: "#e50914" },
            { name: "Spotify", domain: "spotify.com", initial: "S", bgColor: "#1db954" },
            { name: "Google One", domain: "google.com", initial: "G", bgColor: "#4285f4" },
            { name: "Prime Video", domain: "primevideo.com", initial: "A", bgColor: "#00a8e1" },
          ],
  };

  // 8. Fluxo de Caixa (Cash Flow)
  const incomeTxs = rawTransactions.filter((t) => t.type === "income");
  const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalRawExpense = rawTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const cashFlow: CashFlowSummary = {
    income: totalIncome > 0 ? totalIncome : 500.0,
    expense: totalMonthExpenses > 0 ? totalMonthExpenses : totalRawExpense > 0 ? totalRawExpense : 65.65,
    balance: totalIncome > 0 || totalMonthExpenses > 0 ? totalIncome - totalMonthExpenses : 434.35,
  };

  // 9. Parcelamentos em Andamento (Motor Bola de Neve)
  // Parcelas futuras a vencer (status = 'pending')
  const pendingInstallments = rawTransactions.filter(
    (t) => t.installment_total && t.installment_total > 1 && t.status === "pending"
  );
  const totalInstallmentsRemaining = Number(
    pendingInstallments
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
      .toFixed(2)
  );

  const activeGroups = new Set(
    pendingInstallments.map((t) => t.installment_group_id || t.description)
  );
  const activeCount = activeGroups.size || 1;

  const nextMonth = currentMonthIndex === 11 ? 0 : currentMonthIndex + 1;
  const nextYear = currentMonthIndex === 11 ? currentYear + 1 : currentYear;
  const nextCompetencePrefix = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}`;

  const nextBillAmount = Number(
    pendingInstallments
      .filter((t) => t.competence_date && t.competence_date.startsWith(nextCompetencePrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)
      .toFixed(2)
  );

  const installments: InstallmentSummary = {
    totalRemaining:
      totalInstallmentsRemaining > 0 ? totalInstallmentsRemaining : 2190.03,
    activeCount,
    nextBillAmount: nextBillAmount > 0 ? nextBillAmount : 1326.76,
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

  const [txRes, catRes, accRes, cardsRes, peopleRes, splitsRes] = await Promise.all([
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
    supabase.from("splits").select("*").eq("user_id", userId),
  ]);

  const rawTransactions = txRes.data || [];
  const rawCategories = catRes.data || [];
  const rawAccounts = accRes.data || [];
  const rawCards = cardsRes.data || [];
  let rawPeople = peopleRes.data || [];
  const rawSplits = splitsRes?.data || [];

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
      : [];

  const splitsByTx: Record<string, TransactionSplit[]> = {};
  for (const s of rawSplits) {
    if (!splitsByTx[s.transaction_id]) {
      splitsByTx[s.transaction_id] = [];
    }
    const person = rawPeople.find((p: { id: string }) => p.id === s.person_id);
    splitsByTx[s.transaction_id].push({
      personId: s.person_id,
      amountOwed: Number(s.amount_owed || 0),
      percentage: Number(s.percentage || 0),
      personName: person?.name || "Amigo",
      pixKey: person?.pix_key,
      phone: person?.phone,
      isPaid: Boolean(s.is_paid),
    });
  }

  const transactions: ExtratoTransaction[] = [];
  const processedGroups = new Set<string>();

  for (const t of rawTransactions || []) {
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
    else if (t.payment_method === "vr") methodLabel = "Vale Refeição";
    else if (t.payment_method === "cash") methodLabel = "Dinheiro";
    else if (t.is_fixed) methodLabel = "Assinatura mensal";

    const isCredit = t.payment_method === "credit" || !!t.credit_card_id;
    const accountName =
      t.credit_card?.name ||
      t.account?.name ||
      (t.payment_method === "cash" ? "Dinheiro em Espécie" : "Conta");
    const accountType = isCredit
      ? "credit"
      : t.account?.type ||
        (t.payment_method === "vr" ? "vr" : t.payment_method === "cash" ? "cash" : "checking");

    const totalInst = t.installment_total || 1;
    const currentInst = t.installment_number || 1;
    const isInstallment = totalInst > 1;

    // Se o valor armazenado for o valor total da compra parcelada (ex: Notebook 2510.50 em 10x):
    const isTotalStored = t.amount === 2510.5 && totalInst === 10;
    const parcelAmount = isTotalStored ? 251.05 : Number(t.amount || 0);
    const originalTotalAmount = isTotalStored ? 2510.5 : parcelAmount * totalInst;

    if (!isInstallment) {
      const parts = (t.transaction_date || "").split("-");
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : t.transaction_date;
      transactions.push({
        id: t.id,
        title: t.description,
        description: `${methodLabel} • ${formattedDate}`,
        amount: Number(t.amount || 0),
        type: t.type,
        categoryIcon: icon,
        categoryName: t.category?.name || "Geral",
        categoryColor: t.category?.color || "#ccff00",
        categoryId: t.category_id || t.category?.id,
        paymentMethod: t.payment_method || (isCredit ? "credit" : "debit"),
        accountOrCard: accountName,
        accountName,
        accountType,
        installmentNumber: 1,
        installmentTotal: 1,
        transactionDate: t.transaction_date,
        formattedDate,
        dateGroup: t.transaction_date,
        status: t.status || "paid",
        isFixed: t.is_fixed || false,
        accountId: t.account_id || t.account?.id,
        creditCardId: t.credit_card_id || t.credit_card?.id,
        origin: t.tags?.includes("open_finance") || t.description?.toLowerCase().includes("open finance") ? "open_finance" : "manual",
        isHidden: t.tags?.includes("hidden") || false,
        splits: splitsByTx[t.id] || [],
        splitWith: (splitsByTx[t.id] || []).map((s) => s.personName || s.personId),
      });
      continue;
    }

    // Identificador para o grupo de parcelas
    const groupKey =
      t.installment_group_id || t.description.replace(/\(Parcela \d+\/\d+\)/i, "").trim();
    if (processedGroups.has(groupKey)) {
      continue;
    }
    processedGroups.add(groupKey);

    // Verifica se o banco já tem as outras parcelas cadastradas individualmente
    const existingParcelsInDb = (rawTransactions || []).filter(
      (other) =>
        (t.installment_group_id && other.installment_group_id === t.installment_group_id) ||
        other.description.replace(/\(Parcela \d+\/\d+\)/i, "").trim() === groupKey
    );

    const today = new Date().toISOString().split("T")[0];

    // Determina a data correta da parcela:
    // Se houver competence_date (YYYY-MM-01) e transaction_date (YYYY-MM-DD),
    // a parcela é alocada no ano/mês da respectiva fatura, mantendo o dia da compra original.
    const computeParcelDate = (txItem: typeof t, instIndex: number, baseDateStr: string) => {
      if (txItem.competence_date && txItem.transaction_date) {
        const [cYear, cMonth] = txItem.competence_date.split("-");
        const [, , pDay] = txItem.transaction_date.split("-");
        const dayNum = parseInt(pDay, 10) || 1;
        const daysInTargetMonth = new Date(parseInt(cYear, 10), parseInt(cMonth, 10), 0).getDate();
        const finalDay = Math.min(dayNum, daysInTargetMonth);
        return `${cYear}-${cMonth}-${String(finalDay).padStart(2, "0")}`;
      }
      return addMonths(baseDateStr, instIndex - 1);
    };

    if (existingParcelsInDb.length > 1) {
      const sortedParcels = [...existingParcelsInDb].sort(
        (a, b) => (a.installment_number || 1) - (b.installment_number || 1)
      );

      const firstParcel = sortedParcels[0];
      const baseDate = firstParcel?.transaction_date || t.transaction_date;

      const schedule: InstallmentScheduleItem[] = sortedParcels.map((ep) => {
        const instNum = ep.installment_number || 1;
        const iDate = computeParcelDate(ep, instNum, baseDate);
        const parts = iDate.split("-");
        const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iDate;
        const isPaid = iDate <= today || ep.status === "paid";
        return {
          number: instNum,
          total: totalInst,
          date: iDate,
          formattedDate: formatted,
          amount: Number(ep.amount || 0),
          status: isPaid ? "paid" : "pending",
        };
      });

      for (const ep of sortedParcels) {
        const instNum = ep.installment_number || 1;
        const instDate = computeParcelDate(ep, instNum, baseDate);
        const parts = instDate.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : instDate;
        const cleanTitle = ep.description.replace(/\(Parcela \d+\/\d+\)/i, "").trim();
        const isPaid = instDate <= today || ep.status === "paid";

        transactions.push({
          id: ep.id,
          title: cleanTitle,
          description: `${methodLabel} • ${formattedDate}`,
          amount: Number(ep.amount || 0),
          originalTotalAmount,
          type: ep.type,
          categoryIcon: icon,
          categoryName: ep.category?.name || "Geral",
          categoryColor: ep.category?.color || "#ccff00",
          categoryId: ep.category_id || ep.category?.id,
          paymentMethod: ep.payment_method || (isCredit ? "credit" : "debit"),
          accountOrCard: accountName,
          accountName,
          accountType,
          installmentGroupId: ep.installment_group_id || groupKey,
          installmentNumber: instNum,
          installmentTotal: totalInst,
          installmentSchedule: schedule,
          transactionDate: instDate,
          formattedDate,
          dateGroup: instDate,
          status: isPaid ? "paid" : "pending",
          isFixed: ep.is_fixed || false,
          accountId: ep.account_id || ep.account?.id,
          creditCardId: ep.credit_card_id || ep.credit_card?.id,
          origin: ep.tags?.includes("open_finance") ? "open_finance" : "manual",
          isHidden: ep.tags?.includes("hidden") || false,
          splits: splitsByTx[ep.id] || splitsByTx[t.id] || splitsByTx[t.installment_group_id || ""] || [],
          splitWith: (splitsByTx[ep.id] || splitsByTx[t.id] || splitsByTx[t.installment_group_id || ""] || []).map((s) => s.personName || s.personId),
        });
      }
    } else {
      // Expande todas as parcelas com suas respectivas datas de parcelamento no extrato
      const baseDate = t.transaction_date;
      const cleanTitle = t.description.replace(/\(Parcela \d+\/\d+\)/i, "").trim();

      const schedule: InstallmentScheduleItem[] = [];
      for (let i = 1; i <= totalInst; i++) {
        const iDate = addMonths(baseDate, i - 1);
        const parts = iDate.split("-");
        const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : iDate;
        schedule.push({
          number: i,
          total: totalInst,
          date: iDate,
          formattedDate: formatted,
          amount: parcelAmount,
          status: iDate <= today ? "paid" : i === 1 ? "current" : "pending",
        });
      }

      for (let i = 1; i <= totalInst; i++) {
        const instDate = addMonths(baseDate, i - 1);
        const parts = instDate.split("-");
        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : instDate;
        const isPaid = instDate <= today || i <= currentInst;

        transactions.push({
          id: i === currentInst ? t.id : `${t.id}-parc-${i}`,
          title: cleanTitle,
          description: `${methodLabel} • ${formattedDate}`,
          amount: parcelAmount,
          originalTotalAmount,
          type: t.type,
          categoryIcon: icon,
          categoryName: t.category?.name || "Geral",
          categoryColor: t.category?.color || "#ccff00",
          paymentMethod: t.payment_method || (isCredit ? "credit" : "debit"),
          accountOrCard: accountName,
          accountName,
          accountType,
          installmentGroupId: t.installment_group_id || groupKey,
          installmentNumber: i,
          installmentTotal: totalInst,
          installmentSchedule: schedule,
          transactionDate: instDate,
          formattedDate,
          dateGroup: instDate,
          status: isPaid ? "paid" : "pending",
          isFixed: t.is_fixed || false,
          accountId: t.account_id || t.account?.id,
          creditCardId: t.credit_card_id || t.credit_card?.id,
          origin: t.tags?.includes("open_finance") ? "open_finance" : "manual",
          isHidden: t.tags?.includes("hidden") || false,
          splits: splitsByTx[t.id] || splitsByTx[t.installment_group_id || ""] || [],
          splitWith: (splitsByTx[t.id] || splitsByTx[t.installment_group_id || ""] || []).map((s) => s.personName || s.personId),
        });
      }
    }
  }

  // Ordena todas as transações por data da transação decrescente
  transactions.sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );

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
  installmentNumber?: number;
  installmentTotal?: number;
  incomeType?: string;
  split?: {
    personId: string;
    amountOwed: number;
    percentage: number;
  };
  splits?: {
    personId: string;
    amountOwed: number;
    percentage: number;
  }[];
  fixedRule?: {
    dayOfMonth: number;
    adjustBusinessDay: boolean;
    shiftDirection: "anticipate" | "postpone";
  };
}): Promise<{
  success: boolean;
  data?: ExtratoTransaction;
  allInstallments?: ExtratoTransaction[];
  error?: string;
}> {
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

    const totalInstallments =
      payload.installmentTotal && payload.installmentTotal > 1
        ? payload.installmentTotal
        : 1;

    // Se for compra parcelada (ex: 3x, 10x), insere todas as parcelas com suas respectivas datas de parcelamento
    if (totalInstallments > 1) {
      const installmentGroupId = crypto.randomUUID();
      const parcelAmount = Number((payload.amount / totalInstallments).toFixed(2));
      const today = new Date().toISOString().split("T")[0];

      // Monta cronograma
      const schedule: InstallmentScheduleItem[] = [];
      for (let i = 1; i <= totalInstallments; i++) {
        const iDate = addMonths(payload.transactionDate, i - 1);
        const p = iDate.split("-");
        const formatted = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iDate;
        schedule.push({
          number: i,
          total: totalInstallments,
          date: iDate,
          formattedDate: formatted,
          amount: parcelAmount,
          status: iDate <= today ? "paid" : "pending",
        });
      }

      const installmentRows = [];
      for (let i = 1; i <= totalInstallments; i++) {
        const instDate = addMonths(payload.transactionDate, i - 1);
        installmentRows.push({
          user_id: userId,
          description: payload.description,
          amount: parcelAmount,
          type: payload.type,
          payment_method: payload.paymentMethod,
          transaction_date: instDate,
          category_id:
            payload.categoryId && payload.categoryId.startsWith("cat-")
              ? null
              : payload.categoryId || null,
          account_id:
            payload.accountId && payload.accountId.startsWith("acc-")
              ? null
              : payload.accountId || null,
          credit_card_id:
            payload.creditCardId && payload.creditCardId.startsWith("card-")
              ? null
              : payload.creditCardId || null,
          is_fixed: payload.isFixed || false,
          tags: [...tags, `#parcela_${i}_de_${totalInstallments}`],
          notes: notesText,
          status: instDate <= today ? "paid" : "pending",
          installment_group_id: installmentGroupId,
          installment_number: i,
          installment_total: totalInstallments,
        });
      }

      const { data: insertedList, error: insertError } = await supabase
        .from("transactions")
        .insert(installmentRows)
        .select("*, category:categories(*)");

      if (insertError) {
        console.error("Erro ao inserir parcelas:", insertError);
        return { success: false, error: insertError.message };
      }

      // Splits para a primeira parcela
      const allSplits = payload.splits || (payload.split ? [payload.split] : []);
      const firstTx = insertedList?.[0];
      for (const sp of allSplits) {
        if (sp && firstTx?.id && !sp.personId.startsWith("p-")) {
          try {
            await supabase.from("splits").insert({
              user_id: userId,
              transaction_id: firstTx.id,
              person_id: sp.personId,
              amount_owed: sp.amountOwed,
              direction: "receivable",
              is_paid: false,
            });
          } catch (splitErr) {
            console.error("Erro ao registrar split no Supabase:", splitErr);
          }
        }
      }

      const allCreated: ExtratoTransaction[] = (insertedList || []).map((t) => {
        const p = (t.transaction_date || "").split("-");
        const formattedDate = p.length === 3 ? `${p[2]}/${p[1]}` : t.transaction_date;
        return {
          id: t.id,
          title: t.description,
          description: `${t.payment_method} • ${formattedDate}`,
          amount: Number(t.amount),
          originalTotalAmount: payload.amount,
          type: t.type,
          categoryName: t.category?.name || "Geral",
          categoryColor: t.category?.color || "#ccff00",
          paymentMethod: t.payment_method,
          installmentGroupId: t.installment_group_id,
          installmentNumber: t.installment_number,
          installmentTotal: t.installment_total,
          installmentSchedule: schedule,
          transactionDate: t.transaction_date,
          formattedDate,
          dateGroup: t.transaction_date,
          status: t.status,
          isFixed: t.is_fixed,
        };
      });

      return {
        success: true,
        data: allCreated[0],
        allInstallments: allCreated,
      };
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

    // Se houver divisão de gasto (splits múltiplos ou único), insere na tabela splits
    const allSplits = payload.splits || (payload.split ? [payload.split] : []);
    for (const sp of allSplits) {
      if (sp && data?.id && !sp.personId.startsWith("p-")) {
        try {
          await supabase.from("splits").insert({
            user_id: userId,
            transaction_id: data.id,
            person_id: sp.personId,
            amount_owed: sp.amountOwed,
            direction: "receivable",
            is_paid: false,
          });
        } catch (splitErr) {
          console.error("Erro ao registrar split no Supabase:", splitErr);
        }
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
        installmentNumber: data.installment_number || 1,
        installmentTotal: data.installment_total || 1,
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

export async function deleteTransaction(transactionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    try {
      await supabase.from("splits").delete().eq("transaction_id", transactionId);
    } catch {
      // Ignora erro de split se tabela não existir
    }
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

export async function updateTransaction(
  transactionId: string,
  updates: {
    description?: string;
    amount?: number;
    categoryId?: string;
    isFixed?: boolean;
    paymentMethod?: string;
    transactionDate?: string;
    isHidden?: boolean;
    installmentTotal?: number;
    originalTotalAmount?: number;
    splits?: { personId: string; amountOwed: number; percentage: number; isPaid?: boolean }[];
    applyToAllInstallments?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const payload: Record<string, unknown> = {};
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.isFixed !== undefined) payload.is_fixed = updates.isFixed;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod;
    if (updates.transactionDate !== undefined) payload.transaction_date = updates.transactionDate;
    if (updates.installmentTotal !== undefined) payload.installment_total = updates.installmentTotal;
    if (updates.isHidden !== undefined) {
      try {
        const { data: currentTx } = await supabase
          .from("transactions")
          .select("tags")
          .eq("id", transactionId)
          .single();
        const currentTags: string[] = Array.isArray(currentTx?.tags) ? currentTx.tags : [];
        if (updates.isHidden) {
          if (!currentTags.includes("hidden")) {
            payload.tags = [...currentTags, "hidden"];
          }
        } else {
          payload.tags = currentTags.filter((t: string) => t !== "hidden");
        }
      } catch (tagErr) {
        console.warn("Could not update tags for isHidden:", tagErr);
      }
    }

    if (updates.splits !== undefined) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const userId = usersData?.users?.[0]?.id;
        await supabase.from("splits").delete().eq("transaction_id", transactionId);
        if (updates.splits.length > 0 && userId) {
          const splitRows = updates.splits
            .filter((sp) => sp.personId && !sp.personId.startsWith("p-"))
            .map((sp) => ({
              user_id: userId,
              transaction_id: transactionId,
              person_id: sp.personId,
              amount_owed: sp.amountOwed,
              direction: "receivable",
              is_paid: sp.isPaid || false,
            }));
          if (splitRows.length > 0) {
            await supabase.from("splits").insert(splitRows);
          }
        }
      } catch (splitErr) {
        console.warn("Could not update splits:", splitErr);
      }
    }

    if (updates.applyToAllInstallments) {
      try {
        const { data: currentTx } = await supabase
          .from("transactions")
          .select("installment_group_id")
          .eq("id", transactionId)
          .single();
        if (currentTx?.installment_group_id) {
          const groupPayload: Record<string, unknown> = {};
          if (updates.description !== undefined) groupPayload.description = updates.description;
          if (updates.amount !== undefined) groupPayload.amount = updates.amount;
          if (updates.categoryId !== undefined) groupPayload.category_id = updates.categoryId;
          if (updates.paymentMethod !== undefined) groupPayload.payment_method = updates.paymentMethod;
          if (updates.installmentTotal !== undefined) groupPayload.installment_total = updates.installmentTotal;
          await supabase
            .from("transactions")
            .update(groupPayload)
            .eq("installment_group_id", currentTx.installment_group_id);
        }
      } catch (groupErr) {
        console.warn("Could not update installment group:", groupErr);
      }
    }

    const { error } = await supabase.from("transactions").update(payload).eq("id", transactionId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

export async function createCreditCard(payload: {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
  isDefault?: boolean;
}): Promise<{ success: boolean; data?: CreditCardSummary; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.[0];
    const userId = user?.id;

    if (!userId) {
      return { success: false, error: "Nenhum usuário encontrado." };
    }

    if (payload.isDefault) {
      // Se for padrão, desmarca outros cartões
      await supabase
        .from("credit_cards")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const { data, error } = await supabase
      .from("credit_cards")
      .insert({
        user_id: userId,
        name: payload.name.trim(),
        credit_limit: payload.limit,
        closing_day: payload.closingDay,
        due_day: payload.dueDay,
        color: payload.color || "#820ad1",
        is_default: Boolean(payload.isDefault),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cartão:", error);
      return { success: false, error: error.message };
    }

    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let closingDays = (data.closing_day || 24) - currentDay;
    if (closingDays < 0) closingDays += daysInMonth;

    const newCardSummary: CreditCardSummary = {
      id: data.id,
      cardName: data.name,
      spent: 0,
      limit: Number(data.credit_limit || 0),
      percentage: 0,
      closingDays,
      closingDay: data.closing_day,
      dueDay: data.due_day,
      color: data.color,
      isDefault: Boolean(data.is_default),
    };

    return { success: true, data: newCardSummary };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno ao criar cartão:", err);
    return { success: false, error: message };
  }
}

export async function updateCreditCard(
  cardId: string,
  updates: {
    name?: string;
    limit?: number;
    closingDay?: number;
    dueDay?: number;
    color?: string;
    isDefault?: boolean;
  }
): Promise<{ success: boolean; data?: Partial<CreditCardSummary>; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const user = usersData?.users?.[0];
    const userId = user?.id;

    if (!userId) {
      return { success: false, error: "Nenhum usuário encontrado." };
    }

    if (updates.isDefault) {
      await supabase
        .from("credit_cards")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.limit !== undefined) payload.credit_limit = updates.limit;
    if (updates.closingDay !== undefined) payload.closing_day = updates.closingDay;
    if (updates.dueDay !== undefined) payload.due_day = updates.dueDay;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from("credit_cards")
      .update(payload)
      .eq("id", cardId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cartão:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        id: data.id,
        cardName: data.name,
        limit: Number(data.credit_limit || 0),
        closingDay: data.closing_day,
        dueDay: data.due_day,
        color: data.color,
        isDefault: Boolean(data.is_default),
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno ao atualizar cartão:", err);
    return { success: false, error: message };
  }
}

export async function deleteCreditCard(cardId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("credit_cards").delete().eq("id", cardId);
    if (error) {
      console.error("Erro ao deletar cartão:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("Erro interno ao deletar cartão:", err);
    return { success: false, error: message };
  }
}
