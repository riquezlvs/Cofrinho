export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryIcon?: "cart" | "pix" | "music" | "car" | "pill" | "food" | "heart" | "dumbbell" | "tag" | string;
  domain?: string;
}

export interface CategorySpend {
  name: string;
  color: string;
  amount: number;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

export interface CreditCardSummary {
  id?: string;
  cardName: string;
  spent: number;
  limit: number;
  percentage: number;
  closingDays: number;
  dueDay?: number;
  color?: string;
}

export interface SubscriptionSummary {
  monthlyAmount: number;
  activeCount: number;
  services: {
    initial: string;
    bgColor: string;
  }[];
}

export interface AccountSummary {
  id: string;
  name: string;
  type: "checking" | "savings" | "vr" | "va" | "cash";
  amount: number;
  percentage: number;
  isIsolated: boolean;
  color?: string;
  icon?: string;
  updatedAt: string;
  logoType?: "santander" | "nubank" | "vr" | "pierre" | "other";
}

export interface CashFlowSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface InstallmentSummary {
  totalRemaining: number;
  activeCount: number;
  nextBillAmount: number;
}

export interface DashboardData {
  userName: string;
  totalAccountsBalance: number;
  accounts: AccountSummary[];
  totalInvoices: number;
  creditCards: CreditCardSummary[];
  creditCard: CreditCardSummary;
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
    topCategoryName?: string;
  };
  cashFlow: CashFlowSummary;
  installments: InstallmentSummary;
  subscriptions: SubscriptionSummary;
  recentTransactions: Transaction[];
}
