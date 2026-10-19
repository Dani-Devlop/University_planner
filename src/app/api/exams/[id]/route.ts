import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { UniExam } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED: Array<keyof UniExam> = ["classId", "title", "date", "time", "kind", "location", "color"];

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Partial<UniExam>;
  const db = readDb();
  const idx = db.exams.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch: Partial<UniExam> = {};
  for (const k of ALLOWED) {
    if (body[k] !== undefined) (patch as Record<string, unknown>)[k] = body[k];
  }
  db.exams[idx] = { ...db.exams[idx], ...patch };
  writeDb(db);
  return NextResponse.json(db.exams[idx]);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const db = readDb();
  const before = db.exams.length;
  db.exams = db.exams.filter((e) => e.id !== id);
  if (db.exams.length === before) return NextResponse.json({ error: "not found" }, { status: 404 });
  writeDb(db);
  return NextResponse.json({ ok: true });
}
