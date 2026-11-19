// WEEKLY//UNI — shared data helpers: seed, owner gate, app URL, DB accessors.

import { db } from 'sdk';
import { eq } from 'sdk/db';
import { classes as classesT, exams as examsT, notes as notesT } from '../schema.js';

/** Bot owner (the only user this personal bot serves) */
export const OWNER_ID = 2040835005;

/** Mini App URL — served by Telegram Serverless next to this bot */
export const APP_URL = 'https://app9229459492.tgcloud.ai/';

/** Seed classes — snapshot of data/db.json (id, code, professor, …) */
export const SEED_CLASSES = [
  {
    id: '1',
    name: 'Database Lab',
    nameFa: 'آزمایشگاه پایگاه داده‌ها',
    code: '5990101495',
    professor: 'نیما خوز',
    location: 'خوارزمی-۱',
    day: 'Monday',
    time: '14:00 - 16:55',
    type: '0-2',
    color: '#00ff41',
  },
  {
    id: '2',
    name: 'Operating System Lab',
    nameFa: 'آزمایشگاه سیستم‌عامل',
    code: '5990102228',
    professor: 'جواد حسین‌خانی',
    location: 'خوارزمی-۴۱۱',
    day: 'Monday',
    time: '13:00 - 15:00',
    type: '0-1',
    color: '#22d3ee',
  },
  {
    id: '3',
    name: 'Data Structures',
    nameFa: 'ساختمان‌داده‌ها',
    code: '5990132559',
    professor: 'سیدحمیدرضا فاطمی',
    location: 'خوارزمی-۲۱۵',
    day: 'Monday',
    time: '13:00 - 15:55',
    type: '0-3',
    color: '#c084fc',
  },
  {
    id: '4',
    name: 'General Mathematics',
    nameFa: 'ریاضی عمومی',
    code: '5990130047',
    professor: 'مهدی امیرمیاندرق',
    location: 'خوارزمی-۴۱۲',
    day: 'Wednesday',
    time: '08:00 - 10:55',
    type: '0-3',
    color: '#fbbf24',
  },
  {
    id: '5',
    name: 'Physical Education',
    nameFa: 'تربیت بدنی',
    code: '99079',
    professor: 'محمدعلی اسماعیل‌زاده',
    location: 'پارک فناوری پردیس-سالن ۱',
    day: 'Thursday',
    time: '11:30 - 13:00',
    type: '0.50-0.50',
    color: '#fb7185',
  },
  {
    id: '6',
    name: 'Project',
    nameFa: 'پروژه',
    code: '5990114704',
    professor: 'محمد فدائیان',
    location: 'N/A',
    day: 'Unscheduled',
    time: 'N/A',
    type: '0-2',
    color: '#34d399',
  },
];

/** Insert the seed classes once (idempotent, safe to call on every invocation). */
export async function ensureSeed() {
  const count = await db.$count(classesT);
  if (count > 0) return;
  await db.insert(classesT).values(SEED_CLASSES).onConflictDoNothing().run();
}

/** All classes, ordered: scheduled days first (شنبه→پنجشنبه order), then by start time, Unscheduled last. */
export async function allClasses() {
  await ensureSeed();
  const rows = await db.select().from(classesT).all();
  const order = { Saturday: 1, Sunday: 2, Monday: 3, Tuesday: 4, Wednesday: 5, Thursday: 6, Friday: 7, Unscheduled: 8 };
  return rows.sort((a, b) => {
    const d = (order[a.day] ?? 9) - (order[b.day] ?? 9);
    if (d !== 0) return d;
    const ta = (a.time || '99:99').slice(0, 5);
    const tb = (b.time || '99:99').slice(0, 5);
    return ta < tb ? -1 : ta > tb ? 1 : Number(a.id) - Number(b.id);
  });
}

/** All exams sorted by date (soonest first) */
export async function allExams() {
  return (await db.select().from(examsT).all()).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Notes as { classId: text } */
export async function notesMap() {
  const rows = await db.select().from(notesT).all();
  const map = {};
  for (const r of rows) map[r.classId] = r.text;
  return map;
}

/** One class by id, or null */
export async function classById(id) {
  return (await db.select().from(classesT).where(eq(classesT.id, String(id))).get()) ?? null;
}

/** Classes on a given weekday (English DB key) */
export function classesOnDay(list, day) {
  return list.filter((c) => c.day === day);
}
