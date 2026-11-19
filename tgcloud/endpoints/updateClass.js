// WEEKLY//UNI — endpoints/updateClass.js — partial PUT (whitelisted fields only)

import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { classes as classesT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

const ALLOWED = ['name', 'nameFa', 'code', 'professor', 'location', 'day', 'time', 'type', 'color'];

export default async function (input, ctx) {
  requireOwner(ctx);
  const { id, patch } = input ?? {};
  if (!id || typeof patch !== 'object' || patch === null) {
    throw new EndpointError('id و patch لازم است.', { code: 'BAD_INPUT' });
  }
  const row = await db.select().from(classesT).where(eq(classesT.id, String(id))).get();
  if (!row) throw new EndpointError('کلاس پیدا نشد.', { code: 'NOT_FOUND' });

  const set = {};
  for (const k of ALLOWED) {
    if (patch[k] !== undefined && patch[k] !== null) set[k] = String(patch[k]);
  }
  if (Object.keys(set).length) {
    await db.update(classesT).set(set).where(eq(classesT.id, String(id))).run();
  }
  return db.select().from(classesT).where(eq(classesT.id, String(id))).get();
}
