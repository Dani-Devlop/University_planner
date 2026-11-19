// WEEKLY//UNI — bot message formatting (Persian, terminal-style)
//
// The core request: «روزهایی که کلاس دارم تو ربات ارسال بشه به این شکل:
// تاریخ - نام روز» → e.g. «۱۴۰۵/۰۹/۰۲ - دوشنبه»

import {
  dayNameFa,
  startTimeFa,
  toPersianDigits,
  tehranISODate,
  isoDow,
  isoToJalaliSlash,
  isoToJalaliLong,
  isoPlusDays,
  holidayForISO,
  daysUntilISO,
  DOW_NAMES,
} from './jalali.js';

// ---------------------------------------------------------------------------
// Class-day listing
// ---------------------------------------------------------------------------

/**
 * Upcoming class days starting from `fromISO` for `days` days.
 * Returns [{ iso, dayNameEn, holiday }] with at least one scheduled class.
 */
export function upcomingClassDays(classes, fromISO, days) {
  const result = [];
  for (let i = 0; i < days; i++) {
    const iso = isoPlusDays(fromISO, i);
    const dayNameEn = DOW_NAMES[isoDow(iso)];
    const dayClasses = classes.filter((c) => c.day === dayNameEn);
    if (!dayClasses.length) continue;
    result.push({ iso, dayNameEn, holiday: holidayForISO(iso), classes: dayClasses });
  }
  return result;
}

/** One line exactly as requested: «۱۴۰۵/۰۹/۰۲ - دوشنبه» */
export function dayLine(iso) {
  return `${isoToJalaliSlash(iso)} - ${dayNameFa(DOW_NAMES[isoDow(iso)])}`;
}

/** Full «روزهای کلاس» message for a 4-week window starting weeksAhead*7 days from today */
export function daysMessage(classes, weeksAhead = 0, weeksCount = 4) {
  const today = tehranISODate();
  const fromISO = isoPlusDays(today, weeksAhead * 7);
  const days = upcomingClassDays(classes, fromISO, weeksCount * 7);

  const title =
    weeksAhead === 0
      ? `📅 روزهای کلاس — ${toPersianDigits(weeksCount)} هفتهٔ پیش‌رو`
      : `📅 روزهای کلاس — از ${isoToJalaliLong(fromISO)}`;

  if (!days.length) {
    return `${title}\n\nدر این بازه هیچ کلاسی ثبت نشده است.`;
  }

  const parts = [title, ''];
  for (const d of days) {
    let line = dayLine(d.iso);
    if (d.holiday) line += ` ⛔ ${d.holiday}`;
    parts.push(line);
    if (d.holiday) {
      parts.push('  ⟂ تعطیل رسمی — کلاس‌ها برقرار نیست');
    } else {
      for (const c of d.classes) {
        const t = startTimeFa(c.time);
        const loc = c.location && c.location !== 'N/A' ? ` — ${c.location}` : '';
        parts.push(`  • ${c.nameFa}${t ? ` — ساعت ${t}` : ''}${loc}`);
      }
    }
    parts.push('');
  }
  parts.push('🎓 مینی‌اپ کامل: /start');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Today / tomorrow
// ---------------------------------------------------------------------------

export function dayClassesMessage(classes, iso, label) {
  const dayNameEn = DOW_NAMES[isoDow(iso)];
  const list = classes.filter((c) => c.day === dayNameEn);
  const holiday = holidayForISO(iso);
  const head = `📆 ${label} — ${isoToJalaliLong(iso)}\n${dayLine(iso)}`;
  if (holiday) return `${head}\n\n⛔ ${holiday} — تعطیل رسمی، کلاس‌ها برقرار نیست.`;
  if (!list.length) return `${head}\n\nخبر خوب، ${dayNameFa(dayNameEn)} کلاس نداری 🌴`;
  const rows = list.map((c) => {
    const t = startTimeFa(c.time);
    const range = c.time && c.time !== 'N/A' ? ` (${toPersianDigits(c.time)})` : '';
    const loc = c.location && c.location !== 'N/A' ? `\n    📍 ${c.location}` : '';
    return `  • ${c.nameFa}\n    🕐${t ? ` ساعت ${t}${range}` : ' بدون زمان‌بندی'}${loc}\n    👨‍🏫 ${c.professor}`;
  });
  return `${head}\n\n${rows.join('\n')}`;
}

export function todayMessage(classes) {
  return dayClassesMessage(classes, tehranISODate(), 'امروز');
}

export function tomorrowMessage(classes) {
  return dayClassesMessage(classes, isoPlusDays(tehranISODate(), 1), 'فردا');
}

// ---------------------------------------------------------------------------
// Exams
// ---------------------------------------------------------------------------

export function examsMessage(exams, classes) {
  const today = tehranISODate();
  const upcoming = exams.filter((e) => {
    const d = daysUntilISO(e.date);
    return !isNaN(d) && d >= 0;
  });
  if (!upcoming.length) {
    return '📝 امتحان یا ارائه‌ای در تقویم ثبت نشده — از مینی‌اپ اضافه کن.';
  }
  const rows = upcoming.slice(0, 10).map((e) => {
    const d = daysUntilISO(e.date);
    const cls = classes.find((c) => c.id === e.classId);
    const kind = e.kind === 'presentation' ? '🎤 ارائه' : '📝 امتحان';
    const when = d === 0 ? 'امروز!' : `${toPersianDigits(d)} روز مانده`;
    const t = e.time ? ` — ساعت ${toPersianDigits(e.time)}` : '';
    const loc = e.location ? `\n    📍 ${e.location}` : '';
    return `${kind} ${cls ? `«${cls.nameFa}»` : ''}\n    ${e.title}\n    🗓 ${isoToJalaliLong(e.date)}${t}${loc}\n    ⏳ ${when}`;
  });
  return `📝 امتحان‌ها و ارائه‌های پیش‌رو\n\n${rows.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Welcome / help
// ---------------------------------------------------------------------------

export function startMessage() {
  return [
    '🎓 WEEKLY//UNI',
    '',
    'ربات شخصی برنامه‌های دانشگاهت آماده‌ست.',
    '',
    'دستورها:',
    '📅 /days — روزهای کلاس در قالب «تاریخ - نام روز»',
    '📆 /today — کلاس‌های امروز',
    '➡️ /tomorrow — کلاس‌های فردا',
    '📝 /exams — امتحان‌ها و ارائه‌های پیش‌رو',
    'ℹ️ /help — راهنما',
    '',
    'برای برنامهٔ کامل با گرید هفتگی، یادداشت‌ها و امتحان‌ها، مینی‌اپ رو باز کن 👇',
  ].join('\n');
}

export function helpMessage() {
  return [
    'ℹ️ راهنمای WEEKLY//UNI',
    '',
    '📅 /days — فهرست روزهایی که کلاس داری، هر خط به شکل «تاریخ - نام روز»',
    '📆 /today — کلاس‌های امروز',
    '➡️ /tomorrow — کلاس‌های فردا',
    '📝 /exams — امتحان‌ها و ارائه‌ها با شمارش معکوس',
    '🎓 دکمهٔ «برنامه هفتگی» — باز کردن مینی‌اپ کامل',
    '',
    'روی دکمه‌های زیر پیام‌ها بزن تا ۴ هفتهٔ بعدی رو هم ببینی.',
  ].join('\n');
}

export function notOwnerMessage() {
  return 'این ربات شخصی است و فقط برای مالکش کار می‌کند 🤖';
}

/** Inline keyboard for the days list: earlier weeks / next weeks */
export function daysKeyboard(weeksAhead) {
  const row = [];
  if (weeksAhead > 0) row.push({ text: '⬅️ ۴ هفتهٔ قبل', callback_data: `days:${weeksAhead - 1}` });
  if (weeksAhead < 16) row.push({ text: '۴ هفتهٔ بعد ➡️', callback_data: `days:${weeksAhead + 1}` });
  return { inline_keyboard: [row.concat([{ text: '🎓 مینی‌اپ', url: 'https://app9229459492.tgcloud.ai/' }])] };
}
