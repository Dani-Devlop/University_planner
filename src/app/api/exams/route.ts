import { NextRequest, NextResponse } from "next/server";
import { mutateDB, nextId } from "@/lib/db";
import type { Exam, ExamKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: ExamKind[] = ["midterm", "final", "presentation"];

function sanitize(body: Record<string, unknown>): Omit<Exam, "id"> | null {
  const kind = String(body.kind ?? "").toLowerCase() as ExamKind;
  if (!KINDS.includes(kind)) return null;
  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    title: String(body.title ?? "Untitled").trim() || "Untitled",
    kind,
    classId: typeof body.classId === "string" && body.classId ? body.classId : null,
    date,
    time: /^\d{2}:\d{2}$/.test(String(body.time ?? "")) ? String(body.time) : "",
    location: String(body.location ?? ""),
    note: String(body.note ?? ""),
  };
}

export async function GET() {
  const exams = await mutateDB((d) => d.exams);
  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const clean = body ? sanitize(body) : null;
  if (!clean) {
    return NextResponse.json(
      { error: "invalid exam: kind must be midterm|final|presentation and date must be YYYY-MM-DD" },
      { status: 400 }
    );
  }
  const created: Exam = { id: nextId("exm"), ...clean };
  const exam = await mutateDB((d) => {
    d.exams.push(created);
    return { result: created, db: d };
  });
  return NextResponse.json(exam, { status: 201 });
}
