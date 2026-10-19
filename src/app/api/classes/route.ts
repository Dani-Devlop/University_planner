import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { UniClass } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ classes: readDb().classes });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<UniClass>;
  const db = readDb();
  const id = body.id ?? String(Math.max(0, ...db.classes.map((c) => Number(c.id) || 0)) + 1);
  const cls: UniClass = {
    id,
    name: body.name ?? "New Class",
    nameFa: body.nameFa ?? "درس جدید",
    code: body.code ?? "",
    professor: body.professor ?? "",
    location: body.location ?? "N/A",
    day: body.day ?? "Unscheduled",
    time: body.time ?? "N/A",
    type: body.type ?? "0-0",
    color: body.color ?? "#00ff41",
  };
  db.classes.push(cls);
  writeDb(db);
  return NextResponse.json(cls, { status: 201 });
}
