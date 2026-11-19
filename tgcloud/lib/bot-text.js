// WEEKLY//UNI — bot message formatting (Persian, emoji-rich, Telegram HTML)
//
// The core request: «روزهایی که کلاس دارم تو ربات ارسال بشه به این شکل:
// تاریخ - نام روز» → e.g. «۱۴۰۵/۰۹/۰۲ - دوشنبه»
//
// All messages are sent with parse_mode: 'HTML' — every dynamic value MUST
// go through esc(). Pure JS (no sdk import) so it stays unit-testable.

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
// Shared pieces
// ---------------------------------------------------------------------------

/** Mini App URL — kept here so this module stays sdk-free and testable */
export const APP_URL_TEXT = 'https://app9229459492.tgcloud.ai/';

/** Escape dynamic user data for Telegram HTML parse_mode */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** One color dot per weekday — a stable visual code across all messages */
const DOW_EMOJI = {
  Saturday: '🟣',
  Sunday: '🔵',
  Monday: '🟢',
  Tuesday: '🟡',
  Wednesday: '🟠',
  Thursday: '🔴',
  Friday: '⚫',
};

const DIV = '━━━━━━━━━━━━━━━━━━';

const KEYCAP = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
function numEmoji(i) {
  return i < 10 ? KEYCAP[i] : `${toPersianDigits(i + 1)}.`;
}

/** Urgency emoji for the exam countdown */
function whenEmoji(d) {
  if (d <= 2) return '🚨';
  if (d <= 7) return '⚠️';
  if (d <= 14) return '⏳';
  return '🌱';
}

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
      ? `📅 <b>روزهای کلاس</b> — ${toPersianDigits(weeksCount)} هفتهٔ پیش‌رو 🎒`
      : `📅 <b>روزهای کلاس</b> — از ${isoToJalaliLong(fromISO)} 🎒`;

  if (!days.length) {
    return `${title}\n\n😴 در این بازه هیچ کلاسی ثبت نشده — تعطیلات! 🏖`;
  }

  const parts = [title, ''];
  for (const d of days) {
    let line = `${DOW_EMOJI[d.dayNameEn] || '▫️'} <b>${isoToJalaliSlash(d.iso)} - ${dayNameFa(d.dayNameEn)}</b>`;
    if (d.holiday) line += ' ⛔';
    parts.push(line);
    if (d.holiday) {
      parts.push(`  🚫 ${esc(d.holiday)} — تعطیل رسمی، کلاس‌ها برقرار نیست`);
    } else {
      d.classes.forEach((c, i) => {
        const t = startTimeFa(c.time);
        const loc = c.location && c.location !== 'N/A' ? ` — 📍 ${esc(c.location)}` : '';
        parts.push(`  ${numEmoji(i)} ${esc(c.nameFa)}${t ? ` — 🕐 ${t}` : ''}${loc}`);
      });
    }
    parts.push('');
  }
  parts.push('🎓 <i>برنامهٔ کامل در مینی‌اپ 👇</i>');
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// Today / tomorrow
// ---------------------------------------------------------------------------

export function dayClassesMessage(classes, iso, label) {
  const dayNameEn = DOW_NAMES[isoDow(iso)];
  const list = classes.filter((c) => c.day === dayNameEn);
  const holiday = holidayForISO(iso);
  const face = label === 'فردا' ? '🌙' : '☀️';
  const head = `${face} <b>${esc(label)}</b> — ${isoToJalaliLong(iso)}\n${
    DOW_EMOJI[dayNameEn] || '▫️'
  } <b>${isoToJalaliSlash(iso)} - ${dayNameFa(dayNameEn)}</b>`;
  if (holiday) {
    return `${head}\n\n🚫 <b>${esc(holiday)}</b> — تعطیل رسمی، کلاس‌ها برقرار نیست 🏖`;
  }
  if (!list.length) {
    return `${head}\n\n🎉 خبر خوب! ${dayNameFa(dayNameEn)} کلاس نداری — حالشو ببر 🌴`;
  }
  const rows = list.map((c, i) => {
    const t = startTimeFa(c.time);
    const range = c.time && c.time !== 'N/A' ? ` (${toPersianDigits(c.time)})` : '';
    const loc = c.location && c.location !== 'N/A' ? `\n     📍 ${esc(c.location)}` : '';
    return `${numEmoji(i)} <b>${esc(c.nameFa)}</b>\n     🕐 ${t ? `ساعت ${t}${range}` : 'بدون زمان‌بندی'}${loc}\n     👨‍🏫 ${esc(c.professor)}`;
  });
  return `${head}\n\n${rows.join('\n\n')}`;
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
    return '📝 <b>امتحان‌ها و ارائه‌ها</b>\n\n😌 فعلاً هیچ امتحان یا ارائه‌ای در تقویم نیست — از مینی‌اپ اضافه‌ش کن ✨';
  }
  const rows = upcoming.slice(0, 10).map((e) => {
    const d = daysUntilISO(e.date);
    const cls = classes.find((c) => c.id === e.classId);
    const kind = e.kind === 'presentation' ? '🎤 ارائه' : '📝 امتحان';
    const when = d === 0 ? '🔥 <b>همین امروز!</b>' : `${whenEmoji(d)} <b>${toPersianDigits(d)} روز مانده</b>`;
    const t = e.time ? ` — 🕐 ${toPersianDigits(e.time)}` : '';
    const loc = e.location ? `\n     📍 ${esc(e.location)}` : '';
    return `${kind} ${cls ? `📚 «${esc(cls.nameFa)}»` : ''}\n     📄 ${esc(e.title)}\n     🗓 ${isoToJalaliLong(e.date)}${t}${loc}\n     ${when}`;
  });
  return `📝 <b>امتحان‌ها و ارائه‌های پیش‌رو</b>\n\n${rows.join('\n\n')}`;
}

// ---------------------------------------------------------------------------
// Welcome / help
// ---------------------------------------------------------------------------

export function startMessage(firstName) {
  const hi = firstName ? `سلام ${esc(firstName)}! 👋` : 'سلام! 👋';
  return [
    '🎓 <b>WEEKLY//UNI</b> ✨',
    '',
    `${hi}`,
    'ربات شخصی برنامه‌های دانشگاهت آماده‌ست 🎒📚',
    '',
    DIV,
    '🗂 <b>دستورها:</b>',
    '📅 /days — روزهای کلاس به شکل «تاریخ - نام روز»',
    '📆 /today — کلاس‌های امروز',
    '➡️ /tomorrow — کلاس‌های فردا',
    '📝 /exams — امتحان‌ها و ارائه‌های پیش‌رو',
    'ℹ️ /help — راهنمای کامل',
    DIV,
    '',
    'برای برنامهٔ کامل با گرید هفتگی، یادداشت‌ها و امتحان‌ها، مینی‌اپ رو باز کن 👇',
  ].join('\n');
}

export function helpMessage() {
  return [
    'ℹ️ <b>راهنمای WEEKLY//UNI</b>',
    '',
    '📅 <b>/days</b> — فهرست روزهایی که کلاس داری؛ هر خط دقیقاً «تاریخ - نام روز»',
    '      با دکمه‌های ⬅️ ➡️ تا ۱۶ هفتهٔ بعدی رو هم ببین',
    '📆 <b>/today</b> — کلاس‌های امروز با ساعت، استاد و محل',
    '➡️ <b>/tomorrow</b> — کلاس‌های فردا',
    '📝 <b>/exams</b> — امتحان‌ها و ارائه‌ها با شمارش معکوس ⏳',
    '🎓 دکمهٔ «برنامهٔ هفتگی» — باز کردن مینی‌اپ کامل',
    '',
    '💡 هر وقت تو مینی‌اپ کلاس یا امتحانی اضافه یا حذف کنی، جواب‌های همین ربات هم خودکار آپدیت می‌شه 🔄',
  ].join('\n');
}

export function notOwnerMessage() {
  return '🔒 این ربات شخصیه و فقط برای مالکش جواب می‌ده 🤖';
}

/** Inline keyboard for the days list: earlier weeks / next weeks */
export function daysKeyboard(weeksAhead) {
  const row = [];
  if (weeksAhead > 0) row.push({ text: '⬅️ ۴ هفتهٔ قبل', callback_data: `days:${weeksAhead - 1}` });
  if (weeksAhead < 16) row.push({ text: '۴ هفتهٔ بعد ➡️', callback_data: `days:${weeksAhead + 1}` });
  return { inline_keyboard: [row.concat([{ text: '🎓 مینی‌اپ', url: APP_URL_TEXT }])] };
}
