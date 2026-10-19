// ── Tehran-timezone helpers (client-safe, SSR-guarded in components) ────
export const TEHRAN_TZ = "Asia/Tehran";

const EN_US = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TEHRAN_TZ, ...opts });

/** "Saturday" | "Sunday" | ... in Tehran right now */
export function tehranDayName(date: Date = new Date()): string {
  return EN_US({ weekday: "long" }).format(date);
}

/** minutes since midnight in Tehran right now */
export function tehranMinutes(date: Date = new Date()): number {
  const parts = EN_US({ hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return (h % 24) * 60 + m;
}

/** "HH:MM:SS" wall clock in Tehran */
export function tehranClock(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TEHRAN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/** "YYYY-MM-DD" in Tehran */
export function tehranDateISO(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEHRAN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Full Jalali (Persian) date, e.g. "پنج‌شنبه ۳۰ دی ۱۴۰۴" */
export function jalaliDate(date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: TEHRAN_TZ,
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/** Gregorian date in Tehran, e.g. "Thu 19 Oct 2026" */
export function gregorianDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TEHRAN_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
