export interface Transaction {
  id: string;
  title: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  categoryIcon: "cart" | "pix" | "music" | "car" | "pill";
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
  cardName: string;
  spent: number;
  limit: number;
  percentage: number;
  closingDays: number;
}

export interface SubscriptionSummary {
  monthlyAmount: number;
  activeCount: number;
  services: {
    initial: string;
    bgColor: string;
  }[];
}
