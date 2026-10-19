import fs from "fs";
import path from "path";
import type { ScheduleDB, UniClass, Exam, NotesMap } from "./types";

// ── JSON file database (lowdb-style, zero-dependency) ───────────────────
// Location: $DB_PATH (default <cwd>/data/db.json)
// On Railway: mount a Volume at /app/data  (DB_PATH=/app/data/db.json)
// Writes are serialized through a promise-queue + atomic tmp/rename.

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), "data", "db.json");

const SEED: ScheduleDB = {
  classes: [
    { id: "1", name: "Database Lab", nameFa: "آزمایشگاه پایگاه داده‌ها", code: "5990101495", professor: "نیما خوز", location: "خوارزمی-۱", day: "Monday", time: "14:00 - 16:55", type: "0-2", color: "#00ff41" },
    { id: "2", name: "Operating System Lab", nameFa: "آزمایشگاه سیستم‌عامل", code: "5990102228", professor: "جواد حسین‌خانی", location: "خوارزمی-۳", day: "Monday", time: "14:00 - 15:55", type: "0-1", color: "#22d3ee" },
    { id: "3", name: "Data Structures", nameFa: "ساختمان‌داده‌ها", code: "5990132559", professor: "سیدحمیدرضا فاطمی", location: "خوارزمی-۲۱۵", day: "Monday", time: "13:00 - 15:55", type: "0-3", color: "#c084fc" },
    { id: "4", name: "General Mathematics", nameFa: "ریاضی عمومی", code: "5990130047", professor: "مهدی امیرمیاندرق", location: "خوارزمی-۴۱۲", day: "Wednesday", time: "08:00 - 10:55", type: "0-3", color: "#fbbf24" },
    { id: "5", name: "Physical Education", nameFa: "تربیت بدنی", code: "99079", professor: "محمدعلی اسماعیل‌زاده", location: "پارک فناوری پردیس-سالن ۱", day: "Thursday", time: "11:30 - 13:00", type: "0.50-0.50", color: "#fb7185" },
    { id: "6", name: "Project", nameFa: "پروژه", code: "5990114704", professor: "محمد فدائیان", location: "N/A", day: "Unscheduled", time: "N/A", type: "0-2", color: "#34d399" },
  ],
  notes: {},
  exams: [],
};

let queue: Promise<unknown> = Promise.resolve();

function ensureFile(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2), "utf-8");
  }
}

export function readDB(): ScheduleDB {
  ensureFile();
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<ScheduleDB>;
    return {
      classes: Array.isArray(parsed.classes) ? parsed.classes : [],
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      exams: Array.isArray(parsed.exams) ? parsed.exams : [],
    };
  } catch {
    // corrupted file → recover with seed
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2), "utf-8");
    return structuredClone(SEED);
  }
}

/** Serialized atomic write. Never call directly — use mutateDB. */
function writeDB(db: ScheduleDB): void {
  ensureFile();
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, DB_PATH);
}

/** Queue-serialized read-modify-write. Returns the mutation result. */
export async function mutateDB<T>(
  fn: (db: ScheduleDB) => { result: T; db: ScheduleDB } | T
): Promise<T> {
  const run = queue.then(async () => {
    const db = readDB();
    const out = fn(structuredClone(db));
    if (out && typeof out === "object" && "db" in (out as object) && "result" in (out as object)) {
      const typed = out as { result: T; db: ScheduleDB };
      writeDB(typed.db);
      return typed.result;
    }
    return out as T;
  });
  queue = run.catch(() => undefined);
  return run;
}

// ── Domain helpers ──────────────────────────────────────────────────────

export function nextId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function listClasses(db: ScheduleDB): UniClass[] {
  return db.classes;
}
export function listNotes(db: ScheduleDB): NotesMap {
  return db.notes;
}
export function listExams(db: ScheduleDB): Exam[] {
  return db.exams;
}
