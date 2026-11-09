export function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return dateStr;
  const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = dateOnly.split("-");
  if (parts.length !== 3) return dateStr;

  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10) - 1; // 0 a 11
  const day = parseInt(parts[2], 10);

  month += months;
  year += Math.floor(month / 12);
  month = ((month % 12) + 12) % 12;

  const maxDays = new Date(year, month + 1, 0).getDate();
  const adjustedDay = Math.min(day, maxDays);

  const finalMonth = String(month + 1).padStart(2, "0");
  const finalDay = String(adjustedDay).padStart(2, "0");
  return `${year}-${finalMonth}-${finalDay}`;
}
