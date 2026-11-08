import { CategorySpend, CreditCardSummary, SubscriptionSummary, Transaction } from "@/types/finance";

export const mockSafeToSpend = {
  userName: "João",
  amount: 3840.5,
  dailyFree: 128.0,
  status: "Tudo em dia",
};

export const mockMonthOverview = {
  month: "Outubro",
  limitPlanned: 4000.0,
  totalSpent: 2450.0,
  percentageConsumed: 61,
  categories: [
    {
      name: "Alimentação",
      color: "#ccff00",
      amount: 980,
      percentage: 40,
      dashArray: "95.5 143.2",
      dashOffset: 0,
    },
    {
      name: "Moradia & Contas",
      color: "#f59e0b",
      amount: 700,
      percentage: 29,
      dashArray: "69.2 169.5",
      dashOffset: -98.5,
    },
    {
      name: "Transporte",
      color: "#38bdf8",
      amount: 420,
      percentage: 17,
      dashArray: "40.5 198.2",
      dashOffset: -170.7,
    },
    {
      name: "Lazer & Streaming",
      color: "#a855f7",
      amount: 350,
      percentage: 14,
      dashArray: "29 209.7",
      dashOffset: -213.2,
    },
  ] as CategorySpend[],
};

export const mockCreditCard: CreditCardSummary = {
  cardName: "Santander",
  spent: 4080.0,
  limit: 6000.0,
  percentage: 68,
  closingDays: 6,
};

export const mockSubscriptions: SubscriptionSummary = {
  monthlyAmount: 149.8,
  activeCount: 4,
  services: [
    { initial: "N", bgColor: "#e50914" }, // Netflix
    { initial: "S", bgColor: "#1db954" }, // Spotify
    { initial: "G", bgColor: "#4285f4" }, // Google
    { initial: "+1", bgColor: "#201f24" },
  ],
};

export const mockRecentTransactions: Transaction[] = [
  {
    id: "tx-1",
    title: "99 Pop - Corrida Centro",
    description: "Transporte • Hoje, 14:20",
    amount: 28.5,
    type: "expense",
    categoryIcon: "car",
  },
  {
    id: "tx-2",
    title: "Wellhub (Gympass)",
    description: "Assinatura Bem-estar • Hoje, 09:15",
    amount: 119.9,
    type: "expense",
    categoryIcon: "dumbbell",
  },
  {
    id: "tx-3",
    title: "Tinder Gold",
    description: "Assinatura mensal • Ontem, 20:30",
    amount: 45.9,
    type: "expense",
    categoryIcon: "heart",
  },
  {
    id: "tx-4",
    title: "Drogaria São Paulo",
    description: "Farmácia & Saúde • Ontem, 16:40",
    amount: 67.8,
    type: "expense",
    categoryIcon: "pill",
  },
  {
    id: "tx-5",
    title: "Pix Recebido - Freelance Nubank",
    description: "Transferência Pix • 12 de out.",
    amount: 1250.0,
    type: "income",
    categoryIcon: "pix",
  },
  {
    id: "tx-6",
    title: "Supermercado Pão de Açúcar",
    description: "Mercado & Compras • 11 de out.",
    amount: 184.5,
    type: "expense",
    categoryIcon: "cart",
  },
  {
    id: "tx-7",
    title: "Padaria da Esquina",
    description: "Alimentação (Fallback Categoria) • 10 de out.",
    amount: 19.5,
    type: "expense",
    categoryIcon: "food",
  },
];
