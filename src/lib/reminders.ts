// ── Reminder engine — pure computation (no DOM) ──────────────────────────
// Rules (user spec):
//   · Classes              → notify 90 and 60 minutes before start
//   · Midterms & Finals    → notify 90 and 60 minutes before start
//   · Presentations        → the above + 4 days and 2 days before
//   · Distinct sound per kind (class / exam / presentation)
// Iran (Asia/Tehran) has no DST since 2022 → fixed UTC+03:30.

import type { UniClass, Exam, ExamKind } from "./types";
import { toFaDigits } from "./jalali";
import { parseTime, WEEK_DAYS, dayFa } from "@/components/terminal/schedule-grid";

export const TEHRAN_OFFSET_MIN = 210; // +03:30

export type ReminderKind = "class" | "exam" | "presentation";

export interface ReminderInstance {
  key: string; // dedupe/storage key
  at: number; // epoch ms when the reminder should fire
  kind: ReminderKind;
  offsetMin: number; // minutes before the event start
  title: string; // Persian notification title
  body: string; // Persian notification body
  sound: ReminderKind;
}

export const CLASS_OFFSETS = [90, 60];
export const EXAM_OFFSETS = [90, 60];
export const PRESENTATION_DAY_OFFSETS = [4 * 24 * 60, 2 * 24 * 60]; // 4d, 2d

const GRACE_MINUTE_LEVEL = 4 * 60_000; // minute-level reminders stay due 4 min
const GRACE_DAY_LEVEL = 90 * 60_000; // day-level reminders stay due 90 min

function faDuration(offsetMin: number): string {
  if (offsetMin >= 1440) return `${toFaDigits(offsetMin / 1440)} روز`;
  if (offsetMin === 60) return "۱ ساعت";
  return `${toFaDigits(offsetMin)} دقیقه`;
}

/** epoch ms for a Tehran wall-clock date+time */
export function tehranEpoch(dateISO: string, timeHM: string): number | null {
  const dm = dateISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm = timeHM.match(/^(\d{1,2}):(\d{2})/);
  if (!dm || !tm) return null;
  const [, y, mo, d] = dm.map(Number) as unknown as number[];
  const [, h, mi] = tm.map(Number) as unknown as number[];
  if (mo < 1 || mo > 12 || h > 23) return null;
  return Date.UTC(y, mo - 1, d, h, mi) - TEHRAN_OFFSET_MIN * 60_000;
}

/** Tehran civil date ("YYYY-MM-DD") shifted by n days */
export function tehranDatePlus(dateISO: string, n: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d, 12) + n * 86_400_000;
  const dt = new Date(t);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}

/** English weekday name (Sunday..Saturday) of a Tehran civil date */
function tehranWeekdayName(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12))
  );
}

const KIND_FA: Record<ExamKind, string> = {
  midterm: "میان‌ترم",
  final: "پایان‌ترم",
  presentation: "ارائه",
};

function eventTiming(exam: Exam): { dateISO: string; time: string } | null {
  const m = exam.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  // no explicit time → nominal 08:00 so day-level reminders still fire in the morning
  const time = /^\d{1,2}:\d{2}$/.test(exam.time) ? exam.time : "08:00";
  return { dateISO: exam.date, time };
}

/**
 * All reminder instances for classes (next `daysAhead` days) and exams.
 * Classes recur weekly — one instance per (class, date, offset).
 */
export function allReminders(
  classes: UniClass[],
  exams: Exam[],
  todayISO: string,
  daysAhead = 7
): ReminderInstance[] {
  const out: ReminderInstance[] = [];

  // ── classes: scan the next daysAhead Tehran dates ──
  for (let i = 0; i <= daysAhead; i++) {
    const dateISO = tehranDatePlus(todayISO, i);
    const weekday = tehranWeekdayName(dateISO);
    if (!WEEK_DAYS.includes(weekday as (typeof WEEK_DAYS)[number])) continue;
    for (const c of classes) {
      if (c.day !== weekday) continue;
      const t = parseTime(c.time);
      if (!t) continue;
      const startEpoch = tehranEpoch(dateISO, `${String(Math.floor(t[0] / 60)).padStart(2, "0")}:${String(t[0] % 60).padStart(2, "0")}`);
      if (startEpoch === null) continue;
      const name = c.nameFa || c.name;
      const meta = [dayFa(c.day), c.time, c.location !== "N/A" ? c.location : null, `استاد ${c.professor}`]
        .filter(Boolean)
        .join(" · ");
      for (const off of CLASS_OFFSETS) {
        out.push({
          key: `c:${c.id}:${dateISO}:${off}`,
          at: startEpoch - off * 60_000,
          kind: "class",
          offsetMin: off,
          title: `⏰ ${faDuration(off)} تا کلاس «${name}»`,
          body: meta,
          sound: "class",
        });
      }
    }
  }

  // ── exams / presentations ──
  for (const e of exams) {
    const timing = eventTiming(e);
    if (!timing) continue;
    const startEpoch = tehranEpoch(timing.dateISO, timing.time);
    if (startEpoch === null) continue;
    const kind: ReminderKind = e.kind === "presentation" ? "presentation" : "exam";
    const dateFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      timeZone: "Asia/Tehran",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(startEpoch));
    const meta = [dateFa, `ساعت ${toFaDigits(timing.time)}`, e.location || null]
      .filter(Boolean)
      .join(" · ");

    const offsets = [
      ...EXAM_OFFSETS,
      ...(e.kind === "presentation" ? PRESENTATION_DAY_OFFSETS : []),
    ];
    for (const off of offsets) {
      const dayLevel = off >= 1440;
      out.push({
        key: `e:${e.id}:${off}`,
        at: startEpoch - off * 60_000,
        kind,
        offsetMin: off,
        title: dayLevel
          ? `📌 ${KIND_FA[e.kind]} «${e.title}» — ${faDuration(off)} مانده!`
          : `⏰ ${KIND_FA[e.kind]} «${e.title}» تا ${faDuration(off)} دیگر`,
        body: meta,
        sound: kind,
      });
    }
  }

  return out.sort((a, b) => a.at - b.at);
}

/** Reminders that are due right now and not yet fired. */
export function dueReminders(
  classes: UniClass[],
  exams: Exam[],
  todayISO: string,
  now: number,
  fired: Record<string, number>
): ReminderInstance[] {
  return allReminders(classes, exams, todayISO).filter((r) => {
    if (fired[r.key]) return false;
    const grace = r.offsetMin >= 1440 ? GRACE_DAY_LEVEL : GRACE_MINUTE_LEVEL;
    return r.at <= now && now < r.at + grace;
  });
}

/** Friendly Persian text for a reminder's countdown preview, e.g. "۱ ساعت و ۱۵ دقیقه" */
export function faUntil(ms: number): string {
  if (ms <= 0) return "همین حالا";
  const totalMin = Math.round(ms / 60_000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (d) parts.push(`${toFaDigits(d)} روز`);
  if (h) parts.push(`${toFaDigits(h)} ساعت`);
  if (m && !d) parts.push(`${toFaDigits(m)} دقیقه`);
  return parts.join(" و ") || "لحظاتی دیگر";
}
