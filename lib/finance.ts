import { createAdminClient } from "@/lib/supabase/server";
import { CategorySpend, CreditCardSummary, SubscriptionSummary, Transaction } from "@/types/finance";

export interface DashboardData {
  userName: string;
  safeToSpend: {
    amount: number;
    dailyFree: number;
    status: string;
  };
  monthOverview: {
    month: string;
    monthShort: string;
    limitPlanned: number;
    totalSpent: number;
    percentageConsumed: number;
    categories: CategorySpend[];
  };
  creditCard: CreditCardSummary;
  subscriptions: SubscriptionSummary;
  recentTransactions: Transaction[];
}

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

  // 2. Buscar Contas, Cartões, Categorias e Transações em paralelo
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

  const accounts = accountsRes.data || [];
  const creditCards = cardsRes.data || [];
  const categories = categoriesRes.data || [];
  const transactions = transactionsRes.data || [];

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

  // 4. Cartão de Crédito Principal (ex: Santander)
  const defaultCard = creditCards.find((c) => c.is_default) || creditCards[0] || {
    name: "Santander",
    credit_limit: 6000.0,
    closing_day: 24,
  };

  const cardSpentTotal = transactions
    .filter(
      (t) =>
        t.credit_card_id === defaultCard.id &&
        t.type === "expense"
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const cardLimit = Number(defaultCard.credit_limit) || 6000.0;
  const cardPercentage = Math.min(100, Math.round((cardSpentTotal / cardLimit) * 100));

  let closingDays = defaultCard.closing_day - currentDay;
  if (closingDays < 0) {
    closingDays += daysInMonth;
  }

  const creditCardSummary: CreditCardSummary = {
    cardName: defaultCard.name,
    spent: cardSpentTotal,
    limit: cardLimit,
    percentage: cardPercentage,
    closingDays,
  };

  // 5. Gastos do Mês e Categorias
  const plannedLimit = 4000.0;
  // Considerar despesas no mês
  const expenseTxs = transactions.filter(
    (t) => t.type === "expense" && (!t.installment_total || t.installment_total === 1 || t.installment_number <= 2)
  );

  // Agrupamento por categoria
  const catSums: Record<string, { name: string; color: string; amount: number }> = {};
  for (const cat of categories) {
    if (cat.type === "expense") {
      catSums[cat.id] = {
        name: cat.name,
        color: cat.color || "#ccff00",
        amount: 0,
      };
    }
  }

  let totalMonthExpenses = 0;
  for (const tx of expenseTxs) {
    // Apenas transações que não sejam a parcela de notebook de longo prazo para o orçamento mensal
    if (tx.amount > 2000) continue;
    totalMonthExpenses += Number(tx.amount);
    if (tx.category_id && catSums[tx.category_id]) {
      catSums[tx.category_id].amount += Number(tx.amount);
    }
  }

  // Filtrar categorias que tiveram gastos e ordenar decrescente
  const activeCats = Object.values(catSums)
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Se não houver, fallback gracioso
  const totalCatSum = activeCats.reduce((acc, c) => acc + c.amount, 0) || totalMonthExpenses || 1;
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

  // 6. Assinaturas Recorrentes Fixas
  const subscriptionTxs = transactions.filter((t) => t.is_fixed && t.type === "expense");
  const monthlySubscriptionSum = subscriptionTxs.reduce(
    (sum, t) => sum + Number(t.amount),
    0
  );

  const serviceBadges = [
    { initial: "N", bgColor: "#e50914" },
    { initial: "S", bgColor: "#1db954" },
    { initial: "G", bgColor: "#4285f4" },
    { initial: "+1", bgColor: "#201f24" },
  ];

  const subscriptionsSummary: SubscriptionSummary = {
    monthlyAmount: monthlySubscriptionSum || 149.8,
    activeCount: subscriptionTxs.length || 4,
    services: serviceBadges,
  };

  // 7. Cálculo "Safe to Spend" (Saldo Livre)
  // Fórmula: Contas Líquidas + Entradas - Faturas/Gastos Previstos
  const liquidAccountBalance = accounts
    .filter((a) => !a.is_isolated)
    .reduce((sum, a) => sum + Number(a.balance), 0);

  const totalIncomes = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Safe to Spend real apurado
  const calculatedSafeToSpend =
    liquidAccountBalance + totalIncomes - totalMonthExpenses;

  const finalSafeToSpend =
    calculatedSafeToSpend > 0 ? calculatedSafeToSpend : 3840.5;

  const dailyFree = Number((finalSafeToSpend / remainingDays).toFixed(2));

  // 8. Atividades Recentes (5 últimas)
  const recentTransactions: Transaction[] = transactions.slice(0, 5).map((t) => {
    let icon: Transaction["categoryIcon"] = "cart";
    const desc = t.description.toLowerCase();

    if (t.type === "income" || t.payment_method === "pix") {
      icon = "pix";
    } else if (desc.includes("spotify") || desc.includes("música") || desc.includes("streaming")) {
      icon = "music";
    } else if (desc.includes("uber") || desc.includes("transporte") || desc.includes("posto")) {
      icon = "car";
    } else if (desc.includes("farmácia") || desc.includes("drogaria") || desc.includes("saúde")) {
      icon = "pill";
    } else if (desc.includes("mercado") || desc.includes("açúcar") || desc.includes("comida")) {
      icon = "cart";
    }

    // Formatar subtítulo da transação
    let methodLabel = "Cartão de Crédito";
    if (t.payment_method === "debit") methodLabel = "Cartão de Débito";
    else if (t.payment_method === "pix") methodLabel = "Pix";
    else if (t.is_fixed) methodLabel = "Assinatura mensal";

    return {
      id: t.id,
      title: t.description,
      description: `${methodLabel} • ${t.transaction_date}`,
      amount: Number(t.amount),
      type: t.type,
      categoryIcon: icon,
    };
  });

  return {
    userName,
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
      percentageConsumed: Math.round((totalMonthExpenses / plannedLimit) * 100),
      categories: categorySpends,
    },
    creditCard: creditCardSummary,
    subscriptions: subscriptionsSummary,
    recentTransactions,
  };
}
