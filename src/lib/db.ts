// WEEKLY//UNI — JSON-file database (data/db.json)
// ⚠️ SEED never overwrites live data on the Railway volume; writes happen via API only.
import fs from "fs";
import path from "path";
import type { UniDB, UniClass } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

/** Reference seed — 6 classes (nameFa of #3 uses ZWNJ: «ساختمان‌داده‌ها») */
export const SEED: UniDB = {
  classes: [
    {
      id: "1", name: "Database Lab", nameFa: "آزمایشگاه پایگاه داده‌ها", code: "5990101495",
      professor: "نیما خوز", location: "خوارزمی-۱", day: "Monday", time: "14:00 - 16:55",
      type: "0-2", color: "#00ff41",
    },
    {
      id: "2", name: "Operating System Lab", nameFa: "آزمایشگاه سیستم‌عامل", code: "5990102228",
      professor: "جواد حسین‌خانی", location: "خوارزمی-۳", day: "Monday", time: "14:00 - 15:55",
      type: "0-1", color: "#22d3ee",
    },
    {
      id: "3", name: "Data Structures", nameFa: "ساختمان‌داده‌ها", code: "5990132559",
      professor: "سیدحمیدرضا فاطمی", location: "خوارزمی-۲۱۵", day: "Monday", time: "13:00 - 15:55",
      type: "0-3", color: "#c084fc",
    },
    {
      id: "4", name: "General Mathematics", nameFa: "ریاضی عمومی", code: "5990130047",
      professor: "مهدی امیرمیاندرق", location: "خوارزمی-۴۱۲", day: "Wednesday", time: "08:00 - 10:55",
      type: "0-3", color: "#fbbf24",
    },
    {
      id: "5", name: "Physical Education", nameFa: "تربیت بدنی", code: "99079",
      professor: "محمدعلی اسماعیل‌زاده", location: "پارک فناوری پردیس-سالن ۱", day: "Thursday", time: "11:30 - 13:00",
      type: "0.50-0.50", color: "#fb7185",
    },
    {
      id: "6", name: "Project", nameFa: "پروژه", code: "5990114704",
      professor: "محمد فدائیان", location: "N/A", day: "Unscheduled", time: "N/A",
      type: "0-2", color: "#34d399",
    },
  ] satisfies UniClass[],
  exams: [],
  notes: { "1": "" },
};

export function readDb(): UniDB {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(SEED, null, 2), "utf8");
      return structuredClone(SEED);
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw) as UniDB;
    return {
      classes: Array.isArray(db.classes) ? db.classes : SEED.classes,
      exams: Array.isArray(db.exams) ? db.exams : [],
      notes: db.notes && typeof db.notes === "object" ? db.notes : {},
    };
  } catch {
    return structuredClone(SEED);
  }
}

export function writeDb(db: UniDB): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_PATH);
}
