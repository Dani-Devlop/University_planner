// WEEKLY//UNI — endpoints/updateExam.js — partial PUT (whitelisted fields only)

import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { exams as examsT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

const ALLOWED = ['classId', 'title', 'date', 'time', 'kind', 'location', 'color', 'notes'];

export default async function (input, ctx) {
  requireOwner(ctx);
  const { id, patch } = input ?? {};
  if (!id || typeof patch !== 'object' || patch === null) {
    throw new EndpointError('id و patch لازم است.', { code: 'BAD_INPUT' });
  }
  const row = await db.select().from(examsT).where(eq(examsT.id, String(id))).get();
  if (!row) throw new EndpointError('امتحان پیدا نشد.', { code: 'NOT_FOUND' });

  const set = {};
  for (const k of ALLOWED) {
    if (patch[k] !== undefined && patch[k] !== null) set[k] = String(patch[k]);
  }
  if (Object.keys(set).length) {
    await db.update(examsT).set(set).where(eq(examsT.id, String(id))).run();
  }
  return db.select().from(examsT).where(eq(examsT.id, String(id))).get();
}
