import { NextRequest, NextResponse } from "next/server";
import { mutateDB } from "@/lib/db";
import type { NotesMap } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const notes = await mutateDB((d) => d.notes);
  return NextResponse.json(notes);
}

/** PUT /api/notes  body: { classId: string, content: string } */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const classId = body?.classId;
  if (typeof classId !== "string" || !classId) {
    return NextResponse.json({ error: "classId is required" }, { status: 400 });
  }
  if (typeof body.content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }
  const notes = await mutateDB<NotesMap>((d) => {
    d.notes[classId] = body.content;
    return { result: d.notes, db: d };
  });
  return NextResponse.json({ ok: true, notes });
}
