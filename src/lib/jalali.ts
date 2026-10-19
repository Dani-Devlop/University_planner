// ── Jalali (Persian solar Hijri) ⇄ Gregorian conversion ──────────────────
// Port of the well-known jalaali-js algorithm (Behrooz Kamali & Kazimierz M. Borkowski).
// Valid for AP years 1178–1633 (Gregorian 1799–2254). Zero dependencies.

export interface JalaliParts {
  jy: number; // Jalali year, e.g. 1404
  jm: number; // Jalali month 1..12 (1 = فروردین)
  jd: number; // Jalali day 1..31
}

export const JALALI_MONTHS_FA = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const WEEKDAYS_FA = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
] as const;

const breaks = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
  2262, 2324, 2394, 2456, 3178,
];

function div(a: number, b: number): number {
  return ~~(a / b);
}
function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  if (jy < jp || jy >= breaks[bl - 1]) throw new Error("Invalid Jalali year " + jy);
  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

/** Gregorian date → JDN (Julian day number) */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** JDN → Gregorian date */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

/** Jalali date → JDN */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  );
}

/** JDN → Jalali date */
function d2j(jdn: number): JalaliParts {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function toJalaali(gy: number, gm: number, gd: number): JalaliParts {
  return d2j(g2d(gy, gm, gd));
}

export function toGregorian(jy: number, jm: number, jd: number): {
  gy: number;
  gm: number;
  gd: number;
} {
  return d2g(j2d(jy, jm, jd));
}

export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

// ── Persian digits ───────────────────────────────────────────────────────
const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

// ── Date helpers (timezone-safe: operate on local-noon Dates) ────────────

/** "YYYY-MM-DD" → local-noon Date (avoids TZ day-shift) */
export function isoToDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

/** Date (any time) → "YYYY-MM-DD" of its LOCAL calendar date */
export function dateToISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Gregorian ISO "YYYY-MM-DD" → Jalali parts */
export function isoToJalali(iso: string): JalaliParts | null {
  const d = isoToDate(iso);
  if (!d) return null;
  return toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Jalali parts → Gregorian ISO "YYYY-MM-DD" */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${g.gy}-${p(g.gm)}-${p(g.gd)}`;
}

/** Persian weekday name of a Gregorian ISO date */
export function isoWeekdayFa(iso: string): string {
  const d = isoToDate(iso);
  if (!d) return "";
  return WEEKDAYS_FA[d.getDay()];
}

/**
 * Full Persian rendering of an event date, e.g.
 * «پنج‌شنبه ۳۰ دی ۱۴۰۴» (+ optional " · 14:00" kept latin-monospace upstream).
 */
export function formatJalaliEventDate(iso: string): string {
  const j = isoToJalali(iso);
  if (!j) return iso;
  return `${isoWeekdayFa(iso)} ${toFaDigits(j.jd)} ${JALALI_MONTHS_FA[j.jm - 1]} ${toFaDigits(j.jy)}`;
}

/** Short Persian rendering, e.g. «۳۰ دی ۱۴۰۴» */
export function formatJalaliShort(iso: string): string {
  const j = isoToJalali(iso);
  if (!j) return iso;
  return `${toFaDigits(j.jd)} ${JALALI_MONTHS_FA[j.jm - 1]} ${toFaDigits(j.jy)}`;
}

/** Today's Jalali parts in the LOCAL timezone (picker default) */
export function todayJalali(): JalaliParts {
  const now = new Date();
  return toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
