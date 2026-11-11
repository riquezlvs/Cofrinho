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

export function formatLongPortugueseDate(dateStr?: string): string {
  if (!dateStr) return "Domingo, 8 de novembro de 2026";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = raw.split("-");
  if (parts.length !== 3) return "Hoje";

  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, monthIndex, day);
  const daysOfWeek = [
    "Domingo",
    "Segunda-feira",
    "Terça-feira",
    "Quarta-feira",
    "Quinta-feira",
    "Sexta-feira",
    "Sábado",
  ];
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const dayOfWeek = daysOfWeek[d.getDay()] || "Domingo";
  const monthName = months[monthIndex] || "novembro";
  return `${dayOfWeek}, ${day} de ${monthName} de ${year}`;
}

export function formatMediumPortugueseDate(dateStr?: string): string {
  if (!dateStr) return "8 de novembro de 2026";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = raw.split("-");
  if (parts.length !== 3) return dateStr;

  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const monthName = months[monthIndex] || "novembro";
  return `${day} de ${monthName} de ${year}`;
}
