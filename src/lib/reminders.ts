// WEEKLY//UNI — reminder engine rules + firing logic (page must stay open)
import type { UniClass, UniExam, ReminderItem } from "./types";
import { tehranMinutes, tehranDayName, tehranISODate, parseRange } from "./tehran";
import { daysUntilISO } from "./jalali";
import { playSound } from "./sounds";

const FIRED_KEY = "wu.reminders.fired";
const FIRED_TTL_MS = 8 * 24 * 3600 * 1000; // 8 days
const LEAD_MINUTES = [90, 60]; // class & exam minutes-before
const PRESENTATION_DAY_LEADS = [4, 2]; // presentation days-before
const TICK_MS = 20_000;

interface FiredRecord {
  [key: string]: number; // key → fired-at epoch ms
}

function loadFired(): FiredRecord {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    if (!raw) return {};
    const rec = JSON.parse(raw) as FiredRecord;
    const now = Date.now();
    const alive: FiredRecord = {};
    for (const [k, t] of Object.entries(rec)) {
      if (now - t < FIRED_TTL_MS) alive[k] = t;
    }
    return alive;
  } catch {
    return {};
  }
}

function saveFired(rec: FiredRecord) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify(rec));
  } catch {
    /* private mode — ignore */
  }
}

function markFired(key: string): boolean {
  const rec = loadFired();
  if (rec[key]) return false;
  rec[key] = Date.now();
  saveFired(rec);
  return true;
}

export function resetFired() {
  try {
    localStorage.removeItem(FIRED_KEY);
  } catch { /* noop */ }
}

/** Build class reminders due within this tick window */
export function computeClassReminders(classes: UniClass[], now: Date): ReminderItem[] {
  const out: ReminderItem[] = [];
  const nowMin = tehranMinutes(now);
  const today = tehranDayName(now);
  for (const c of classes) {
    if (c.day === "Unscheduled" || c.day !== today) continue;
    const range = parseRange(c.time);
    if (!range) continue;
    const [start] = range;
    for (const lead of LEAD_MINUTES) {
      if (nowMin === start - lead || (nowMin > start - lead && nowMin < start - lead + Math.ceil(TICK_MS / 60000))) {
        const key = `class:${c.id}:${tehranISODate(now)}:b${lead}`;
        if (markFired(key)) {
          out.push({
            key,
            kind: "class",
            title: `کلاس ${c.nameFa}`,
            body: `${c.professor} — شروع تا ${lead} دقیقه دیگر (${c.time}) • ${c.location}`,
            at: Date.now(),
            color: c.color,
          });
        }
      }
    }
  }
  return out;
}

/** Exam: 90/60 minutes before its datetime */
export function computeExamReminders(exams: UniExam[], classes: UniClass[], now: Date): ReminderItem[] {
  const out: ReminderItem[] = [];
  const nowMs = now.getTime();
  for (const ex of exams) {
    if (ex.kind !== "exam") continue;
    const cls = classes.find((c) => c.id === ex.classId);
    const dt = new Date(`${ex.date}T${ex.time || "08:00"}:00`);
    if (isNaN(dt.getTime())) continue;
    for (const lead of LEAD_MINUTES) {
      const t = dt.getTime() - lead * 60000;
      if (nowMs >= t && nowMs < t + TICK_MS) {
        const key = `exam:${ex.id}:b${lead}`;
        if (markFired(key)) {
          out.push({
            key,
            kind: "exam",
            title: `امتحان ${cls?.nameFa ?? ""} — ${ex.title}`,
            body: `${lead} دقیقه دیگر شروع می‌شود${ex.location ? ` • ${ex.location}` : ""}`,
            at: Date.now(),
            color: ex.color || cls?.color || "#fb7185",
          });
        }
      }
    }
  }
  return out;
}

/** Presentation: 4 & 2 days before (9:00 Tehran morning) + exact minute */
export function computePresentationReminders(exams: UniExam[], classes: UniClass[], now: Date): ReminderItem[] {
  const out: ReminderItem[] = [];
  const isoToday = tehranISODate(now);
  for (const ex of exams) {
    if (ex.kind !== "presentation") continue;
    const cls = classes.find((c) => c.id === ex.classId);
    const diff = daysUntilISO(ex.date);
    if (isNaN(diff)) continue;
    const leads: Array<[number, string]> = [
      [4, "۴ روز"],
      [2, "۲ روز"],
      [0, "امروز"],
    ];
    for (const [lead, label] of leads) {
      if (diff === lead) {
        const key = `pres:${ex.id}:d${lead}`;
        if (markFired(key)) {
          out.push({
            key,
            kind: "presentation",
            title: `ارائه ${cls?.nameFa ?? ""} — ${ex.title}`,
            body: lead === 0 ? `امروز ارائه داری${ex.time ? ` — ساعت ${ex.time}` : ""}` : `${label} تا ارائه${ex.location ? ` • ${ex.location}` : ""}`,
            at: Date.now(),
            color: ex.color || cls?.color || "#c084fc",
          });
        }
      }
    }
    // exact minute reminder
    const dt = new Date(`${ex.date}T${ex.time || "08:00"}:00`);
    if (!isNaN(dt.getTime())) {
      const t = dt.getTime();
      if (now.getTime() >= t && now.getTime() < t + TICK_MS) {
        const key = `pres:${ex.id}:now`;
        if (markFired(key)) {
          out.push({
            key, kind: "presentation",
            title: `ارائه ${cls?.nameFa ?? ""} — الان وقتشه`,
            body: `${ex.title}${ex.location ? ` • ${ex.location}` : ""}`,
            at: Date.now(), color: ex.color || cls?.color || "#c084fc",
          });
        }
      }
    }
    void isoToday;
  }
  return out;
}

export function computeAllReminders(classes: UniClass[], exams: UniExam[], now: Date): ReminderItem[] {
  return [
    ...computeClassReminders(classes, now),
    ...computeExamReminders(exams, classes, now),
    ...computePresentationReminders(exams, classes, now),
  ];
}

/** Fire system notification (+sound) — page must be open */
export async function fireReminder(item: ReminderItem): Promise<void> {
  playSound(item.kind);
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      const reg = await navigator.serviceWorker?.getRegistration();
      const tag = `wu-${item.key}`;
      if (reg) {
        await reg.showNotification(item.title, {
          body: item.body,
          tag,
          badge: "/icons/icon-192.png",
          icon: "/icons/icon-192.png",
          dir: "rtl",
          lang: "fa",
        });
      } else {
        new Notification(item.title, { body: item.body, tag, icon: "/icons/icon-192.png", dir: "rtl", lang: "fa" });
      }
    }
  } catch {
    /* notifications unavailable — sound already played */
  }
}
