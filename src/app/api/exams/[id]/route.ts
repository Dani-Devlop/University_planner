import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/lib/db";
import type { ExamKind } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const KINDS: ExamKind[] = ["midterm", "final", "presentation"];

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const updated = await mutateDB((d) => {
    const idx = d.exams.findIndex((e) => e.id === id);
    if (idx === -1) return { result: null, db: d };
    const prev = d.exams[idx];
    const kind = body.kind !== undefined ? String(body.kind).toLowerCase() as ExamKind : prev.kind;
    if (!KINDS.includes(kind)) return { result: null, db: d };
    const date = body.date !== undefined ? String(body.date) : prev.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { result: null, db: d };
    d.exams[idx] = {
      id,
      title: body.title !== undefined ? String(body.title).trim() || prev.title : prev.title,
      kind,
      classId:
        body.classId !== undefined
          ? typeof body.classId === "string" && body.classId
            ? body.classId
            : null
          : prev.classId,
      date,
      time:
        body.time !== undefined
          ? /^\d{2}:\d{2}$/.test(String(body.time))
            ? String(body.time)
            : ""
          : prev.time,
      location: body.location !== undefined ? String(body.location) : prev.location,
      note: body.note !== undefined ? String(body.note) : prev.note,
    };
    return { result: d.exams[idx], db: d };
  });

  if (!updated) return NextResponse.json({ error: "not found or invalid" }, { status: 400 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const removed = await mutateDB((d) => {
    const before = d.exams.length;
    d.exams = d.exams.filter((e) => e.id !== id);
    return { result: d.exams.length < before, db: d };
  });
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
