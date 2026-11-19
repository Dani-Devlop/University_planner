// WEEKLY//UNI — endpoints/addClass.js — mirrors POST /api/classes

import { db, EndpointError } from 'sdk';
import { eq } from 'sdk/db';
import { classes as classesT } from '../schema.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const body = input ?? {};
  const existing = await db.select().from(classesT).all();
  const id =
    body.id != null
      ? String(body.id)
      : String(existing.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0) + 1);

  const cls = {
    id,
    name: String(body.name ?? 'New Class'),
    nameFa: String(body.nameFa ?? 'درس جدید'),
    code: String(body.code ?? ''),
    professor: String(body.professor ?? ''),
    location: String(body.location ?? 'N/A'),
    day: String(body.day ?? 'Unscheduled'),
    time: String(body.time ?? 'N/A'),
    type: String(body.type ?? '0-0'),
    color: String(body.color ?? '#00ff41'),
  };

  await db.insert(classesT).values(cls).onConflictDoNothing().run();
  return db.select().from(classesT).where(eq(classesT.id, id)).get();
}
