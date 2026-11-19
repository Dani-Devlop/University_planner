// WEEKLY//UNI — endpoints/health.js — mirrors GET /api/health

import { db } from 'sdk';
import { classes as classesT, exams as examsT } from '../schema.js';
import { ensureSeed } from '../lib/uni.js';

export default async function () {
  await ensureSeed();
  const [classes, exams] = await Promise.all([db.$count(classesT), db.$count(examsT)]);
  return { ok: true, classes, exams, ts: new Date().toISOString() };
}
