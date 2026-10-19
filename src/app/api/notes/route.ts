import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readDb().notes);
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { classId?: string; text?: string };
  if (!body.classId) return NextResponse.json({ error: "classId required" }, { status: 400 });
  const db = readDb();
  db.notes[body.classId] = body.text ?? "";
  writeDb(db);
  return NextResponse.json({ ok: true, notes: db.notes });
}
