import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log("Iniciando seed no Supabase...");

  // 1. Obter ou criar usuário João
  let userId: string;
  const { data: usersData, error: userListErr } = await supabase.auth.admin.listUsers();
  if (userListErr) {
    console.error("Erro ao listar usuários:", userListErr);
    process.exit(1);
  }

  const existing = usersData.users.find((u) => u.email === "joao@pierre.finance");
  if (existing) {
    userId = existing.id;
    console.log("Usuário existente encontrado:", userId);
  } else {
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email: "joao@pierre.finance",
      password: "Password123!",
      email_confirm: true,
      user_metadata: { full_name: "João", name: "João" },
    });
    if (createErr || !newUser.user) {
      console.error("Erro ao criar usuário:", createErr);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log("Novo usuário criado:", userId);
  }

  // Limpar tabelas para re-seed limpo
  await supabase.from("splits").delete().eq("user_id", userId);
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("categories").delete().eq("user_id", userId);
  await supabase.from("credit_cards").delete().eq("user_id", userId);
  await supabase.from("accounts").delete().eq("user_id", userId);

  // 2. Criar Contas
  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .insert([
      {
        user_id: userId,
        name: "Conta Corrente Nubank",
        type: "checking",
        balance: 5200.0,
        is_isolated: false,
        color: "#8a05be",
        icon: "account_balance",
      },
      {
        user_id: userId,
        name: "Vale Refeição (VR)",
        type: "vr",
        balance: 650.0,
        is_isolated: true,
        color: "#f59e0b",
        icon: "restaurant",
      },
    ])
    .select();

  if (accErr) {
    console.error("Erro ao criar contas:", accErr);
    process.exit(1);
  }
  console.log("Contas criadas:", accounts.length);
  const mainAccount = accounts.find((a) => !a.is_isolated)!;

  // 3. Criar Cartão de Crédito Santander
  const { data: creditCards, error: cardErr } = await supabase
    .from("credit_cards")
    .insert([
      {
        user_id: userId,
        name: "Santander",
        credit_limit: 6000.0,
        closing_day: 24,
        due_day: 1,
        is_default: true,
        color: "#ec0000",
      },
    ])
    .select();

  if (cardErr) {
    console.error("Erro ao criar cartão de crédito:", cardErr);
    process.exit(1);
  }
  console.log("Cartão de crédito criado:", creditCards[0].name);
  const santanderCard = creditCards[0];

  // 4. Criar Categorias
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .insert([
      {
        user_id: userId,
        name: "Alimentação",
        type: "expense",
        color: "#ccff00",
        icon: "cart",
        is_fixed: false,
      },
      {
        user_id: userId,
        name: "Moradia & Contas",
        type: "expense",
        color: "#f59e0b",
        icon: "home",
        is_fixed: true,
      },
      {
        user_id: userId,
        name: "Transporte",
        type: "expense",
        color: "#38bdf8",
        icon: "car",
        is_fixed: false,
      },
      {
        user_id: userId,
        name: "Lazer & Streaming",
        type: "expense",
        color: "#a855f7",
        icon: "music",
        is_fixed: false,
      },
      {
        user_id: userId,
        name: "Saúde",
        type: "expense",
        color: "#ec4899",
        icon: "pill",
        is_fixed: false,
      },
      {
        user_id: userId,
        name: "Freelance",
        type: "income",
        color: "#52e374",
        icon: "pix",
        is_fixed: false,
      },
    ])
    .select();

  if (catErr) {
    console.error("Erro ao criar categorias:", catErr);
    process.exit(1);
  }
  console.log("Categorias criadas:", categories.length);

  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // 5. Inserir Transações
  const today = new Date().toISOString().split("T")[0];
  const txPayload = [
    // 5 Atividades Recentes
    {
      user_id: userId,
      description: "Supermercado Pão de Açúcar",
      amount: 184.5,
      type: "expense",
      payment_method: "debit",
      status: "paid",
      transaction_date: today,
      account_id: mainAccount.id,
      category_id: catMap["Alimentação"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    {
      user_id: userId,
      description: "Pix Recebido - Freelance Nubank",
      amount: 1250.0,
      type: "income",
      payment_method: "pix",
      status: "paid",
      transaction_date: "2026-10-17",
      account_id: mainAccount.id,
      category_id: catMap["Freelance"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    {
      user_id: userId,
      description: "Spotify Brasil",
      amount: 21.9,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-12",
      credit_card_id: santanderCard.id,
      category_id: catMap["Lazer & Streaming"],
      installment_number: 1,
      installment_total: 1,
      is_fixed: true,
      tags: ["#spotify", "#musica"],
    },
    {
      user_id: userId,
      description: "Uber Viagem",
      amount: 34.8,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-11",
      credit_card_id: santanderCard.id,
      category_id: catMap["Transporte"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    {
      user_id: userId,
      description: "Farmácia Raia",
      amount: 89.9,
      type: "expense",
      payment_method: "debit",
      status: "paid",
      transaction_date: "2026-10-10",
      account_id: mainAccount.id,
      category_id: catMap["Saúde"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    // Assinaturas Recorrentes Fixas (compondo R$ 149,80/mês)
    {
      user_id: userId,
      description: "Netflix Premium",
      amount: 55.9,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-05",
      credit_card_id: santanderCard.id,
      category_id: catMap["Lazer & Streaming"],
      installment_number: 1,
      installment_total: 1,
      is_fixed: true,
      tags: ["#netflix", "#streaming"],
    },
    {
      user_id: userId,
      description: "Google One 2TB",
      amount: 34.9,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-08",
      credit_card_id: santanderCard.id,
      category_id: catMap["Moradia & Contas"],
      installment_number: 1,
      installment_total: 1,
      is_fixed: true,
      tags: ["#google", "#cloud"],
    },
    {
      user_id: userId,
      description: "Amazon Prime Video",
      amount: 37.1,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-09",
      credit_card_id: santanderCard.id,
      category_id: catMap["Lazer & Streaming"],
      installment_number: 1,
      installment_total: 1,
      is_fixed: true,
      tags: ["#prime"],
    },
    // Gastos que completam o gráfico de Outubro
    // Alimentação: 184.50 + 795.50 = 980 (40%)
    {
      user_id: userId,
      description: "Supermercado Hortifruti",
      amount: 795.5,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-06",
      credit_card_id: santanderCard.id,
      category_id: catMap["Alimentação"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    // Moradia & Contas: 34.90 + 665.10 = 700 (29%)
    {
      user_id: userId,
      description: "Conta de Energia Enel",
      amount: 665.1,
      type: "expense",
      payment_method: "pix",
      status: "paid",
      transaction_date: "2026-10-04",
      account_id: mainAccount.id,
      category_id: catMap["Moradia & Contas"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: true,
    },
    // Transporte: 34.80 + 385.20 = 420 (17%)
    {
      user_id: userId,
      description: "Posto Shell Combustível",
      amount: 385.2,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-03",
      credit_card_id: santanderCard.id,
      category_id: catMap["Transporte"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    // Lazer: 21.90 (Spotify) + 55.90 (Netflix) + 37.10 (Prime) + 235.10 = 350 (14%)
    {
      user_id: userId,
      description: "Ingressos Cinema IMAX",
      amount: 235.1,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-13",
      credit_card_id: santanderCard.id,
      category_id: catMap["Lazer & Streaming"],
      installment_number: 1,
      installment_total: 1,
      tags: [],
      is_fixed: false,
    },
    // Parcela adicional no cartão Santander para totalizar os R$ 4.080 de limite consumido
    {
      user_id: userId,
      description: "Notebook Dell (Parcela 2/10)",
      amount: 2510.5,
      type: "expense",
      payment_method: "credit",
      status: "paid",
      transaction_date: "2026-10-01",
      credit_card_id: santanderCard.id,
      category_id: catMap["Lazer & Streaming"],
      installment_number: 2,
      installment_total: 10,
      tags: ["#notebook", "#dell"],
      is_fixed: false,
    },
  ];

  const { data: insertedTxs, error: txErr } = await supabase
    .from("transactions")
    .insert(txPayload)
    .select();

  if (txErr) {
    console.error("Erro ao inserir transações:", txErr);
    process.exit(1);
  }

  console.log("Transações inseridas com sucesso:", insertedTxs.length);
  console.log("Seed concluído com sucesso!");
}

runSeed();
