// WEEKLY//UNI — endpoints/addExam.js — mirrors POST /api/exams

import { db, EndpointError } from 'sdk';
import { exams as examsT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const body = input ?? {};
  if (!body.title || !body.date) {
    throw new EndpointError('عنوان و تاریخ لازم است.', { code: 'BAD_INPUT' });
  }
  const exam = {
    id: `e${Date.now().toString(36)}${Math.floor(Math.random() * 10000).toString(36)}`,
    classId: String(body.classId ?? '1'),
    title: String(body.title),
    date: String(body.date),
    time: String(body.time ?? ''),
    kind: body.kind === 'presentation' ? 'presentation' : 'exam',
    location: String(body.location ?? ''),
    color: String(body.color ?? ''),
    notes: String(body.notes ?? ''),
  };
  await db.insert(examsT).values(exam).run();
  return exam;
}
