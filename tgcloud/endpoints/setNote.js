// WEEKLY//UNI — endpoints/setNote.js — mirrors PUT /api/notes

import { db, EndpointError } from 'sdk';
import { notes as notesT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const classId = String(input?.classId ?? '');
  if (!classId) throw new EndpointError('classId لازم است.', { code: 'BAD_INPUT' });
  const text = String(input?.text ?? '');

  await db
    .insert(notesT)
    .values({ classId, text })
    .onConflictDoUpdate({ target: notesT.classId, set: { text } })
    .run();

  return { ok: true };
}
