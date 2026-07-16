export function toDateOnly(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(days: number, from: Date | string = new Date()) {
  const date = from instanceof Date ? new Date(from) : new Date(`${from}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekDaysIso(from = new Date(), length = 7) {
  const start = new Date(from);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  return Array.from({ length }, (_, index) => addDaysIso(index, start));
}
