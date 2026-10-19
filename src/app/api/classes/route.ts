import { NextRequest, NextResponse } from "next/server";
import { mutateDB, nextId } from "@/lib/db";
import type { UniClass } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const classes = await mutateDB((d) => d.classes);
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string" || !body.name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const created: UniClass = {
    id: nextId("cls"),
    name: String(body.name).trim(),
    code: String(body.code ?? "N/A"),
    professor: String(body.professor ?? "N/A"),
    location: String(body.location ?? "N/A"),
    day: String(body.day ?? "Unscheduled"),
    time: String(body.time ?? "N/A"),
    type: String(body.type ?? "0-0"),
  };
  const cls = await mutateDB((d) => {
    d.classes.push(created);
    return { result: created, db: d };
  });
  return NextResponse.json(cls, { status: 201 });
}
