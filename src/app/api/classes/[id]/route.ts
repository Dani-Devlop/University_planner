import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const updated = await mutateDB((d) => {
    const idx = d.classes.findIndex((c) => c.id === id);
    if (idx === -1) return { result: null, db: d };
    d.classes[idx] = {
      ...d.classes[idx],
      name: body.name !== undefined ? String(body.name) : d.classes[idx].name,
      nameFa: body.nameFa !== undefined ? String(body.nameFa) : d.classes[idx].nameFa,
      code: body.code !== undefined ? String(body.code) : d.classes[idx].code,
      professor: body.professor !== undefined ? String(body.professor) : d.classes[idx].professor,
      location: body.location !== undefined ? String(body.location) : d.classes[idx].location,
      day: body.day !== undefined ? String(body.day) : d.classes[idx].day,
      time: body.time !== undefined ? String(body.time) : d.classes[idx].time,
      type: body.type !== undefined ? String(body.type) : d.classes[idx].type,
      color: body.color !== undefined ? String(body.color) : d.classes[idx].color,
    };
    return { result: d.classes[idx], db: d };
  });

  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const removed = await mutateDB((d) => {
    const idx = d.classes.findIndex((c) => c.id === id);
    if (idx === -1) return { result: false, db: d };
    d.classes.splice(idx, 1);
    delete d.notes[id];
    d.exams = d.exams.filter((e) => e.classId !== id);
    return { result: true, db: d };
  });
  if (!removed) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
