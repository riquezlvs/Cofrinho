export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryIcon?: "cart" | "pix" | "music" | "car" | "pill" | "food" | "heart" | "dumbbell" | "tag" | string;
  categoryName?: string;
  categoryColor?: string;
  transactionDate?: string;
  formattedDate?: string;
  accountId?: string;
  accountName?: string;
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
  closingDay?: number;
  dueDay?: number;
  color?: string;
  isDefault?: boolean;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingDay: number;
  nextBillingDate: string;
  daysUntilNext: number;
  lastPaidDate?: string;
  status: "paid" | "pending";
  paymentMethod?: string;
  accountOrCardName?: string;
  categoryIcon?: string;
  domain?: string;
  initial: string;
  bgColor: string;
}

export interface SubscriptionSummary {
  monthlyAmount: number;
  thisMonthAmount?: number;
  activeCount: number;
  nextBillingDays?: number | null;
  services: {
    name?: string;
    domain?: string;
    initial: string;
    bgColor: string;
  }[];
  items?: SubscriptionItem[];
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
  logoType?: "santander" | "nubank" | "vr" | "cofrinho" | "other";
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

export interface InstallmentScheduleItem {
  number: number;
  total: number;
  date: string;
  formattedDate: string;
  amount: number;
  status: "paid" | "current" | "pending";
}

export interface TransactionSplit {
  personId: string;
  amountOwed: number;
  percentage?: number;
  personName?: string;
  pixKey?: string;
  personPixKey?: string;
  phone?: string;
  isPaid?: boolean;
  direction?: "receivable" | "payable";
}

export interface ExtratoTransaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  originalTotalAmount?: number;
  type: "income" | "expense";
  categoryId?: string;
  categoryIcon?: string;
  categoryName?: string;
  categoryColor?: string;
  paymentMethod?: string;
  accountOrCard?: string;
  accountType?: string;
  accountName?: string;
  installmentGroupId?: string;
  installmentNumber?: number;
  installmentTotal?: number;
  installmentSchedule?: InstallmentScheduleItem[];
  transactionDate: string;
  formattedDate?: string;
  dateGroup?: string;
  status?: "paid" | "pending";
  isFixed?: boolean;
  splits?: TransactionSplit[];
  splitWith?: string[];
  accountId?: string;
  creditCardId?: string;
  origin?: "open_finance" | "manual";
  isHidden?: boolean;
}

export interface ExtratoCategory {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  subcategories?: ExtratoCategory[];
}

export interface ExtratoAccount {
  id: string;
  name: string;
  type: string;
}

export interface ExtratoCreditCard {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
  pixKey?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface SplitPayload {
  personId: string;
  personName: string;
  amountOwed: number;
  percentage: number;
  direction?: "receivable" | "payable";
}

export interface FixedIncomeRule {
  dayOfMonth: number;
  adjustBusinessDay: boolean;
  shiftDirection: "anticipate" | "postpone";
}

export interface ExtratoData {
  userName: string;
  transactions: ExtratoTransaction[];
  categories?: ExtratoCategory[];
  accounts?: ExtratoAccount[];
  creditCards?: ExtratoCreditCard[];
  people?: Person[];
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
