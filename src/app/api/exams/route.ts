import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { UniExam } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(readDb().exams);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<UniExam>;
  if (!body.title || !body.date) {
    return NextResponse.json({ error: "title and date are required" }, { status: 400 });
  }
  const db = readDb();
  const exam: UniExam = {
    id: `e${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    classId: body.classId ?? db.classes[0]?.id ?? "1",
    title: body.title,
    date: body.date,
    time: body.time ?? "",
    kind: body.kind === "presentation" ? "presentation" : "exam",
    location: body.location ?? "",
    color: body.color ?? "",
  };
  db.exams.push(exam);
  writeDb(db);
  return NextResponse.json(exam, { status: 201 });
}
