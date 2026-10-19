import { NextResponse } from "next/server";
import { readDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDB();
  return NextResponse.json({
    ok: true,
    service: "weeklyuni",
    classes: db.classes.length,
    exams: db.exams.length,
    ts: Date.now(),
  });
}
