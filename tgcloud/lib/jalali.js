// WEEKLY//UNI — Jalali calendar + Tehran date helpers for the Telegram runtime.
// Pure JS port of src/lib/jalali.ts (+ holidays.ts) — no Intl, no deps:
// Iran stays at UTC+3:30 year-round (DST abolished in 2022).

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند',
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(input) {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

function div(a, b) {
  return Math.trunc(a / b);
}

/** Gregorian → Jalali */
export function gregorianToJalali(gy, gm, gd) {
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

/** Jalali → Gregorian → [gy, gm, gd] */
export function jalaliToGregorian(jy, jm, jd) {
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
  let gm = 1;
  for (gm = 1; gm <= 12; gm++) {
    if (gd <= sal_a[gm]) break;
    gd -= sal_a[gm];
  }
  return [gy, gm, gd];
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// Tehran "now" — fixed +3:30 offset, computed on the UTC clock
// ---------------------------------------------------------------------------

/** Current Tehran clock parts { y, mo, d, h, m, s, dow } — dow: 1=Sat … 7=Fri */
export function tehranNow() {
  const t = new Date(Date.now() + 210 * 60 * 1000); // +3:30
  const dow = ((t.getUTCDay() + 1) % 7) + 1; // Sat=1 … Fri=7
  return {
    y: t.getUTCFullYear(),
    mo: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    h: t.getUTCHours(),
    m: t.getUTCMinutes(),
    s: t.getUTCSeconds(),
    dow,
  };
}

/** ISO date (YYYY-MM-DD) for "today" in Tehran */
export function tehranISODate() {
  const p = tehranNow();
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}`;
}

/** English weekday name stored in DB for today, e.g. "Monday" */
export function tehranDayName() {
  return DOW_NAMES[tehranNow().dow];
}

/** Date math: ISO date + N days → ISO date */
export function isoPlusDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** ISO date → { dow: 1=Sat…7=Fri } */
export function isoDow(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return ((new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 1) % 7) + 1;
}

/** ISO date → Jalali [jy, jm, jd] */
export function isoToJalali(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return gregorianToJalali(y, m, d);
}

/** ISO → «۱۴۰۵/۰۹/۰۲» (Persian digits) */
export function isoToJalaliSlash(iso) {
  const [jy, jm, jd] = isoToJalali(iso);
  return `${toPersianDigits(jy)}/${toPersianDigits(pad(jm))}/${toPersianDigits(pad(jd))}`;
}

/** ISO → «۲ آذر ۱۴۰۵» (Persian digits, long month) */
export function isoToJalaliLong(iso) {
  const [jy, jm, jd] = isoToJalali(iso);
  return `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]} ${toPersianDigits(jy)}`;
}

// ---------------------------------------------------------------------------
// Weekday names (DB stores English keys)
// ---------------------------------------------------------------------------

export const DOW_NAMES = {
  1: 'Saturday',
  2: 'Sunday',
  3: 'Monday',
  4: 'Tuesday',
  5: 'Wednesday',
  6: 'Thursday',
  7: 'Friday',
};

export const DAY_FA = {
  Saturday: 'شنبه',
  Sunday: 'یکشنبه',
  Monday: 'دوشنبه',
  Tuesday: 'سه‌شنبه',
  Wednesday: 'چهارشنبه',
  Thursday: 'پنجشنبه',
  Friday: 'جمعه',
};

export function dayNameFa(day) {
  return DAY_FA[day] ?? day;
}

/** «HH:MM» with Persian digits (from "13:00 - 15:55" takes the start) */
export function startTimeFa(time) {
  if (!time || time === 'N/A') return null;
  const m = time.match(/(\d{1,2}):(\d{2})/);
  return m ? `${toPersianDigits(m[1])}:${toPersianDigits(m[2])}` : null;
}

// ---------------------------------------------------------------------------
// Official Iranian holidays (port of src/lib/holidays.ts)
// ---------------------------------------------------------------------------

const FIXED_SOLAR = {
  '01-01': 'نوروز',
  '01-02': 'نوروز',
  '01-03': 'نوروز',
  '01-04': 'نوروز',
  '01-12': 'روز جمهوری اسلامی',
  '01-13': 'سیزده‌بدر',
  '03-14': 'رحلت امام خمینی',
  '03-15': 'قیام ۱۵ خرداد',
  '11-22': 'پیروزی انقلاب اسلامی',
  '12-29': 'ملی شدن صنعت نفت',
};

/** Lunar + year-specific official holidays, keyed "jy" → "MM-DD" */
const JALALI_HOLIDAYS = {
  1404: {},
  1405: {
    '08-13': 'روز ملی مبارزه با استکبار',
    '08-22': 'شهادت حضرت فاطمه (س)',
    '10-01': 'ولادت حضرت امام علی (ع)',
    '10-04': 'ولادت حضرت عیسی مسیح',
    '10-15': 'مبعث حضرت رسول اکرم (ص)',
    '11-03': 'ولادت حضرت قائم (عج)',
    '12-09': 'شهادت حضرت امام علی (ع)',
    '12-18': 'عید سعید فطر',
    '12-19': 'عید سعید فطر',
  },
};

/** Official holiday name for the ISO date, or null */
export function holidayForISO(iso) {
  const [jy, jm, jd] = isoToJalali(iso);
  const md = `${pad(jm)}-${pad(jd)}`;
  return FIXED_SOLAR[md] ?? JALALI_HOLIDAYS[String(jy)]?.[md] ?? null;
}

/** Days between ISO dates (target - today-in-Tehran) */
export function daysUntilISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return NaN;
  const target = Date.UTC(y, m - 1, d);
  const p = tehranNow();
  const now = Date.UTC(p.y, p.mo - 1, p.d);
  return Math.round((target - now) / 86400000);
}
