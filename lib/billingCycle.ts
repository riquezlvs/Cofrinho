export interface BillingCycleWindow {
  cycleKey: string; // YYYY-MM (mês de vencimento da fatura)
  startDate: string; // YYYY-MM-DD (inclusivo)
  endDate: string; // YYYY-MM-DD (inclusivo)
  closingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  label: string; // ex: "Fatura de Novembro"
  shortLabel: string; // ex: "NOV" ou "NOV/26"
  rangeLabel: string; // ex: "15 out – 14 nov"
  status: "closed" | "open" | "future";
  offset: number;
}

const MONTH_NAMES_PT = [
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

const MONTH_SHORTS_PT = [
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

const MONTH_SHORTS_LOWER_PT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export function clampDayToMonth(year: number, monthIndex0: number, day: number): number {
  const safeDay = Math.max(1, Math.round(day));
  const maxDays = new Date(year, monthIndex0 + 1, 0).getDate();
  return Math.min(safeDay, maxDays);
}

export function toIsoDate(year: number, monthIndex0: number, day: number): string {
  const m = String(monthIndex0 + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function addDaysToIso(dateStr: string, days: number): string {
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
  return toIsoDate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function formatShortDayMonth(dateStr: string): string {
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateStr;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const dayNum = parseInt(parts[2], 10);
  const monthShort = MONTH_SHORTS_LOWER_PT[monthIdx] || "";
  return `${dayNum} ${monthShort}`;
}

export function formatDayMonthNumeric(dateStr: string): string {
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

/**
 * Calcula a janela de fatura (ciclo de fechamento) para um cartão de crédito.
 * Regra padrão bancária: [fechamento_anterior, fechamento_atual),
 * ou seja, compras feitas no próprio dia do fechamento já entram na próxima fatura.
 */
export function getBillingCycleByOffset(
  closingDay: number = 24,
  dueDay: number = 1,
  offset: number = 0,
  refDate: Date = new Date()
): BillingCycleWindow {
  const safeClosing = Math.max(1, Math.min(31, Math.round(closingDay || 24)));
  const safeDue = Math.max(1, Math.min(31, Math.round(dueDay || 1)));

  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const refDay = refDate.getDate();

  const currentMonthClosingDay = clampDayToMonth(refYear, refMonth, safeClosing);
  // Se hoje já é >= dia do fechamento, a fatura aberta atual fecha apenas no próximo mês
  const baseCloseMonthOffset = refDay >= currentMonthClosingDay ? 1 : 0;

  const targetCloseDate = new Date(refYear, refMonth + baseCloseMonthOffset + offset, 1);
  const closeYear = targetCloseDate.getFullYear();
  const closeMonth = targetCloseDate.getMonth();
  const closeDayClamped = clampDayToMonth(closeYear, closeMonth, safeClosing);
  const closingDate = toIsoDate(closeYear, closeMonth, closeDayClamped);

  const prevCloseBase = new Date(closeYear, closeMonth - 1, 1);
  const prevCloseYear = prevCloseBase.getFullYear();
  const prevCloseMonth = prevCloseBase.getMonth();
  const prevCloseDayClamped = clampDayToMonth(prevCloseYear, prevCloseMonth, safeClosing);
  const startDate = toIsoDate(prevCloseYear, prevCloseMonth, prevCloseDayClamped);

  const endDate = addDaysToIso(closingDate, -1);

  // Se o dia de vencimento é menor que o dia de fechamento, vence no mês seguinte ao fechamento
  const dueMonthShift = safeDue < safeClosing ? 1 : 0;
  const targetDueBase = new Date(closeYear, closeMonth + dueMonthShift, 1);
  const dueYear = targetDueBase.getFullYear();
  const dueMonth = targetDueBase.getMonth();
  const dueDayClamped = clampDayToMonth(dueYear, dueMonth, safeDue);
  const dueDate = toIsoDate(dueYear, dueMonth, dueDayClamped);

  const cycleKey = `${dueYear}-${String(dueMonth + 1).padStart(2, "0")}`;
  const dueMonthName = MONTH_NAMES_PT[dueMonth] || "";
  const label =
    dueYear === refYear
      ? `Fatura de ${dueMonthName}`
      : `Fatura de ${dueMonthName}/${String(dueYear).slice(-2)}`;
  const shortLabel =
    dueYear === refYear
      ? MONTH_SHORTS_PT[dueMonth] || ""
      : `${MONTH_SHORTS_PT[dueMonth] || ""}/${String(dueYear).slice(-2)}`;

  const rangeLabel = `${formatShortDayMonth(startDate)} – ${formatShortDayMonth(endDate)}`;

  const status: BillingCycleWindow["status"] =
    offset < 0 ? "closed" : offset === 0 ? "open" : "future";

  return {
    cycleKey,
    startDate,
    endDate,
    closingDate,
    dueDate,
    label,
    shortLabel,
    rangeLabel,
    status,
    offset,
  };
}

export function doesTransactionBelongToCycle(
  txDateStr: string | undefined,
  cycle: BillingCycleWindow
): boolean {
  if (!txDateStr) return false;
  const dateOnly = txDateStr.includes("T") ? txDateStr.split("T")[0] : txDateStr;
  return dateOnly >= cycle.startDate && dateOnly <= cycle.endDate;
}
