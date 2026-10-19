import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    ok: true,
    service: "weeklyuni",
    classes: db.classes.length,
    exams: db.exams.length,
    ts: Date.now(),
  });
}
