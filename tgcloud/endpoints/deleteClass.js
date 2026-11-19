// WEEKLY//UNI — endpoints/deleteClass.js — mirrors DELETE /api/classes/[id]

import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { classes as classesT, notes as notesT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const id = String(input?.id ?? '');
  if (!id) throw new EndpointError('id لازم است.', { code: 'BAD_INPUT' });

  const row = await db.select().from(classesT).where(eq(classesT.id, id)).get();
  if (!row) throw new EndpointError('کلاس پیدا نشد.', { code: 'NOT_FOUND' });

  await db.delete(notesT).where(eq(notesT.classId, id)).run(); // sweep children first
  await db.delete(classesT).where(eq(classesT.id, id)).run();
  return { ok: true };
}
