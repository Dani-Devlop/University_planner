// WEEKLY//UNI — Tehran clock & date helpers (Asia/Tehran, Jalali via fa-IR-u-ca-persian)

const TZ = "Asia/Tehran";

export interface TehranParts {
  /** Hours 0-23 */
  h: number;
  m: number;
  s: number;
  /** 1 (Saturday) … 7 (Friday) — ISO-like weekday in Tehran */
  dow: number;
  /** Gregorian Y/M/D in Tehran */
  y: number;
  mo: number;
  d: number;
}

const dowMap: Record<string, number> = { Sat: 1, Sun: 2, Mon: 3, Tue: 4, Wed: 5, Thu: 6, Fri: 7 };

export function tehranParts(date: Date = new Date()): TehranParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  const h = Number(parts.hour === "24" ? "0" : parts.hour);
  return {
    h,
    m: Number(parts.minute),
    s: Number(parts.second),
    dow: dowMap[parts.weekday] ?? 1,
    y: Number(parts.year),
    mo: Number(parts.month),
    d: Number(parts.day),
  };
}

/** "13:05" — HH:MM in Tehran */
export function tehranHHMM(date: Date = new Date()): string {
  const p = tehranParts(date);
  return `${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}`;
}

/** "13:05:22" */
export function tehranClock(date: Date = new Date()): string {
  const p = tehranParts(date);
  return `${String(p.h).padStart(2, "0")}:${String(p.m).padStart(2, "0")}:${String(p.s).padStart(2, "0")}`;
}

/** Minutes since midnight in Tehran */
export function tehranMinutes(date: Date = new Date()): number {
  const p = tehranParts(date);
  return p.h * 60 + p.m;
}

/** ISO date (YYYY-MM-DD) for "today" in Tehran */
export function tehranISODate(date: Date = new Date()): string {
  const p = tehranParts(date);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Gregorian weekday name stored in DB for today (in Tehran) */
export function tehranDayName(date: Date = new Date()): string {
  const names: Record<number, string> = {
    1: "Saturday", 2: "Sunday", 3: "Monday",
    4: "Tuesday", 5: "Wednesday", 6: "Thursday", 7: "Friday",
  };
  return names[tehranParts(date).dow];
}

/** Long Jalali date, e.g. «یکشنبه ۳۰ تیر ۱۴۰۴» */
export function tehranJalaliLong(date: Date = new Date()): string {
  const s = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return s;
}

/** Short Jalali, e.g. «۳۰ تیر ۱۴۰۴» */
export function tehranJalaliShort(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Convert "HH:MM - HH:MM" → [startMin, endMin] or null when N/A */
export function parseRange(time: string): [number, number] | null {
  if (!time || time === "N/A") return null;
  const m = time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const a = Number(m[1]) * 60 + Number(m[2]);
  const b = Number(m[3]) * 60 + Number(m[4]);
  return [a, b];
}

/** Time until a class start/end relative to "now" in Tehran minutes */
export function minutesUntilClass(time: string, nowMin: number): number | null {
  const r = parseRange(time);
  if (!r) return null;
  return r[0] - nowMin;
}
