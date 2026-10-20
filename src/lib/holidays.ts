// WEEKLY//UNI — Iranian official holidays (تعطیلات رسمی)
//
// Fixed solar holidays apply to every Jalali year.
// Lunar/religious holidays are keyed per year (source: official Iranian calendar,
// cross-checked with the `date-holidays` IR dataset — 1448 AH dates for 1405).
// Add new years to JALALI_HOLIDAYS as the semesters advance.

/** reason shown in tooltips / future features (not rendered in the grid label) */
export type HolidayEntry = { name: string };

/** Fixed solar official holidays — same month/day every Jalali year */
const FIXED_SOLAR: Record<string, HolidayEntry> = {
  "01-01": { name: "نوروز" },
  "01-02": { name: "نوروز" },
  "01-03": { name: "نوروز" },
  "01-04": { name: "نوروز" },
  "01-12": { name: "روز جمهوری اسلامی" },
  "01-13": { name: "سیزده‌بدر" },
  "03-14": { name: "رحلت امام خمینی" },
  "03-15": { name: "قیام ۱۵ خرداد" },
  "11-22": { name: "پیروزی انقلاب اسلامی" },
  "12-29": { name: "ملی شدن صنعت نفت" },
};

/** Lunar + year-specific official holidays, keyed "jy-jm-jd" (padded) */
const JALALI_HOLIDAYS: Record<string, Record<string, HolidayEntry>> = {
  // 1404 (2025–2026)
  "1404": {},
  // 1405 (2026–2027) — religious dates per official calendar (1448 AH)
  "1405": {
    "08-13": { name: "روز ملی مبارزه با استکبار" },
    "08-22": { name: "شهادت حضرت فاطمه (س)" },
    "10-01": { name: "ولادت حضرت امام علی (ع)" },
    "10-04": { name: "ولادت حضرت عیسی مسیح" },
    "10-15": { name: "مبعث حضرت رسول اکرم (ص)" },
    "11-03": { name: "ولادت حضرت قائم (عج)" },
    "12-09": { name: "شهادت حضرت امام علی (ع)" },
    "12-18": { name: "عید سعید فطر" },
    "12-19": { name: "عید سعید فطر" },
  },
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Is the given Jalali date an official Iranian holiday? Returns the reason or null. */
export function jalaliHoliday(jy: number, jm: number, jd: number): HolidayEntry | null {
  const md = `${pad(jm)}-${pad(jd)}`;
  const fixed = FIXED_SOLAR[md];
  if (fixed) return fixed;
  const yearTable = JALALI_HOLIDAYS[String(jy)];
  return yearTable?.[md] ?? null;
}
