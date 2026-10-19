// WEEKLY//UNI — Gregorian ↔ Jalali conversion + Persian digits (no deps)

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند",
] as const;

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function fromPersianDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

/** Gregorian → Jalali */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400) -
    80 + gd + g_d_m[gm - 1];
  jy += 33 * div(days, 12053);
  days %= 12053;
  jy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    jy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

/** Jalali → Gregorian */
export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy + div(jy, 33) * 8 + div((jy % 33) + 3, 4) +
    78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * div(days, 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * div(--days, 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * div(days, 1461);
  days %= 1461;
  if (days > 365) {
    gy += div(days - 1, 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 1; gm <= 12; gm++) {
    if (gd <= sal_a[gm]) break;
    gd -= sal_a[gm];
  }
  return [gy, gm, gd];
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand: leap check via 33-year cycle approximation
  const g = jalaliToGregorian(jy, 12, 30);
  const j = gregorianToJalali(g[0], g[1], g[2]);
  return j[2] === 30 ? 30 : 29;
}

export function jalaliToday(): [number, number, number] {
  const p = new Intl.DateTimeFormat("en-u-ca-persian", {
    timeZone: "Asia/Tehran", year: "numeric", month: "numeric", day: "numeric",
  }).formatToParts(new Date());
  const get = (t: string) => Number((p.find((x) => x.type === t)?.value ?? "0").replace(/[^\d]/g, ""));
  return [get("year"), get("month"), get("day")];
}

/** ISO (YYYY-MM-DD) → "۳۰ تیر ۱۴۰۴" */
export function isoToJalaliLabel(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const [jy, jm, jd] = gregorianToJalali(y, m, d);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

/** ISO (YYYY-MM-DD) → Jalali parts */
export function isoToJalaliParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return gregorianToJalali(y || 2025, m || 1, d || 1);
}

/** Jalali parts → ISO (YYYY-MM-DD) */
export function jalaliPartsToISO(jy: number, jm: number, jd: number): string {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

/** ISO of Jalali today */
export function jalaliTodayISO(): string {
  const [jy, jm, jd] = jalaliToday();
  return jalaliPartsToISO(jy, jm, jd);
}

/** Days between ISO dates */
export function daysUntilISO(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  const target = Date.UTC(y, m - 1, d);
  const [ty, tm, td] = jalaliToday().length ? [0, 0, 0] : [0, 0, 0];
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? "0");
  const now = Date.UTC(get("year"), get("month") - 1, get("day"));
  return Math.round((target - now) / 86400000);
}
