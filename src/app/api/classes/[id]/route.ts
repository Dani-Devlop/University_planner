import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { UniClass } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED: Array<keyof UniClass> = [
  "name", "nameFa", "code", "professor", "location", "day", "time", "type", "color",
];

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cls = readDb().classes.find((c) => c.id === id);
  if (!cls) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(cls);
}

/** Partial PUT — only whitelisted fields merge */
export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<UniClass>;
  const db = readDb();
  const idx = db.classes.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch: Partial<UniClass> = {};
  for (const k of ALLOWED) {
    if (body[k] !== undefined) (patch as Record<string, unknown>)[k] = body[k];
  }
  db.classes[idx] = { ...db.classes[idx], ...patch };
  writeDb(db);
  return NextResponse.json(db.classes[idx]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const db = readDb();
  const before = db.classes.length;
  db.classes = db.classes.filter((c) => c.id !== id);
  if (db.classes.length === before) return NextResponse.json({ error: "not found" }, { status: 404 });
  writeDb(db);
  return NextResponse.json({ ok: true });
}
