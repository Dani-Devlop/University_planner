import { NextResponse } from "next/server";
import { mutateDB } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/schedule → entire db (classes + notes + exams) */
export async function GET() {
  const db = await mutateDB((d) => d);
  return NextResponse.json(db);
}
