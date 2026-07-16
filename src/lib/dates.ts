// Date helpers anchored to a fixed application timezone (default Europe/Paris)
// so "today" and day arithmetic are identical on the server (UTC container) and
// in the browser, and never drift by a day around midnight / DST.

const APP_TIMEZONE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_TIMEZONE) || "Europe/Paris";

const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})/;

type Ymd = { y: number; m: number; d: number };

function partsInZone(date: Date): Ymd {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

function toIso({ y, m, d }: Ymd): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Calendar arithmetic anchored at UTC noon so DST transitions never shift the day.
function addDays({ y, m, d }: Ymd, days: number): Ymd {
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);
  return { y: base.getUTCFullYear(), m: base.getUTCMonth() + 1, d: base.getUTCDate() };
}

function ymdFrom(value: Date | string): Ymd {
  if (typeof value === "string") {
    const match = isoDateOnly.exec(value);
    if (match) return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
    return partsInZone(new Date(value));
  }
  return partsInZone(value);
}

export function todayIso(): string {
  return toIso(partsInZone(new Date()));
}

export function toDateOnly(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string") {
    const match = isoDateOnly.exec(value);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : toIso(partsInZone(parsed));
  }
  return Number.isNaN(value.getTime()) ? "" : toIso(partsInZone(value));
}

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = isoDateOnly.exec(value);
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function addDaysIso(days: number, from: Date | string = new Date()): string {
  return toIso(addDays(ymdFrom(from), days));
}

export function weekDaysIso(from: Date | string = new Date(), length = 7): string[] {
  const start = ymdFrom(from);
  const dayOfWeek = new Date(Date.UTC(start.y, start.m - 1, start.d, 12)).getUTCDay(); // 0=Sun
  const monday = addDays(start, -((dayOfWeek + 6) % 7));
  return Array.from({ length }, (_, index) => toIso(addDays(monday, index)));
}
