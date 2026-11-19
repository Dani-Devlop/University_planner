// WEEKLY//UNI — endpoints/deleteExam.js — mirrors DELETE /api/exams/[id]

import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { exams as examsT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const id = String(input?.id ?? '');
  if (!id) throw new EndpointError('id لازم است.', { code: 'BAD_INPUT' });

  const row = await db.select().from(examsT).where(eq(examsT.id, id)).get();
  if (!row) throw new EndpointError('امتحان پیدا نشد.', { code: 'NOT_FOUND' });

  await db.delete(examsT).where(eq(examsT.id, id)).run();
  return { ok: true };
}
