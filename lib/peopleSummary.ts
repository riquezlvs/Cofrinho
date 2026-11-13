import { ExtratoTransaction, Person } from "@/types/finance";

export interface PersonSplitItem {
  transactionId: string;
  title: string;
  transactionDate: string;
  formattedDate: string;
  amountOwed: number;
  direction: "receivable" | "payable";
  isPaid: boolean;
}

export interface PersonDebtSummary {
  person: Person;
  /** Valor líquido pendente que a pessoa deve a você (positivo = deve a você). */
  totalOwed: number;
  /** Total já quitado em rateios com esta pessoa. */
  totalPaid: number;
  pendingCount: number;
  splits: PersonSplitItem[];
}

const AVATAR_PALETTE = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#38bdf8",
  "#a855f7",
  "#f43f5e",
  "#14b8a6",
];

/** Retorna uma cor determinística da paleta com base no nome da pessoa. */
export function getPersonAvatarColor(name: string): string {
  const normalized = (name || "").trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/** Retorna até 2 iniciais maiúsculas a partir do nome da pessoa. */
export function getPersonInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Consolida o quanto cada pessoa cadastrada está devendo a partir das transações com rateio. */
export function computePeopleDebtSummary(
  people: Person[],
  transactions: ExtratoTransaction[] = []
): {
  summaries: PersonDebtSummary[];
  totalOwed: number;
  debtorsCount: number;
} {
  const map = new Map<string, PersonDebtSummary>();

  for (const person of people) {
    map.set(person.id, {
      person,
      totalOwed: 0,
      totalPaid: 0,
      pendingCount: 0,
      splits: [],
    });
  }

  for (const tx of transactions) {
    if (tx.isHidden || !tx.splits || tx.splits.length === 0) continue;

    for (const sp of tx.splits) {
      let entry = map.get(sp.personId);
      if (!entry) {
        entry = {
          person: {
            id: sp.personId,
            name: sp.personName || "Amigo",
            pixKey: sp.pixKey || sp.personPixKey,
            phone: sp.phone,
          },
          totalOwed: 0,
          totalPaid: 0,
          pendingCount: 0,
          splits: [],
        };
        map.set(sp.personId, entry);
      }

      const direction = sp.direction === "payable" ? "payable" : "receivable";
      const isPaid = Boolean(sp.isPaid);
      const amount = Number(sp.amountOwed || 0);

      entry.splits.push({
        transactionId: tx.id,
        title: tx.title,
        transactionDate: tx.transactionDate,
        formattedDate: tx.formattedDate || tx.transactionDate,
        amountOwed: amount,
        direction,
        isPaid,
      });

      if (isPaid) {
        entry.totalPaid += amount;
      } else {
        entry.pendingCount += 1;
        entry.totalOwed += direction === "payable" ? -amount : amount;
      }
    }
  }

  const summaries = Array.from(map.values())
    .map((entry) => ({
      ...entry,
      totalOwed: Number(entry.totalOwed.toFixed(2)),
      totalPaid: Number(entry.totalPaid.toFixed(2)),
    }))
    .sort((a, b) => {
      if (b.totalOwed !== a.totalOwed) return b.totalOwed - a.totalOwed;
      return a.person.name.localeCompare(b.person.name, "pt-BR");
    });

  const totalOwed = Number(
    summaries.reduce((sum, s) => sum + Math.max(0, s.totalOwed), 0).toFixed(2)
  );
  const debtorsCount = summaries.filter((s) => s.totalOwed > 0).length;

  return { summaries, totalOwed, debtorsCount };
}
