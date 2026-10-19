// ── WEEKLY//UNI core types ──────────────────────────────────────────────

export type ClassType = string; // "0-2" = theory-lab units, kept as raw string

export interface UniClass {
  id: string;
  name: string;
  nameFa?: string; // Persian title, e.g. "ساختمان داده‌ها"
  code: string;
  professor: string; // Persian as written by the university
  location: string; // Persian as written by the university
  day: string; // Monday | Tuesday | ... | Unscheduled
  time: string; // "14:00 - 16:55" | "N/A"
  type: ClassType;
  color?: string; // hex accent used across the UI
}

export type ExamKind = "midterm" | "final" | "presentation";

export interface Exam {
  id: string;
  title: string;
  kind: ExamKind;
  classId: string | null;
  date: string; // ISO "YYYY-MM-DD"
  time: string; // "HH:MM" or ""
  location: string;
  note: string;
}

export type NotesMap = Record<string, string>; // classId -> markdown

export interface ScheduleDB {
  classes: UniClass[];
  notes: NotesMap;
  exams: Exam[];
}
