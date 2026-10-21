// WEEKLY//UNI — core domain types

/** Days as stored in DB (English keys, rendered RTL شنبه→پنج‌شنبه) */
export type ClassDay =
  | "Saturday"
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Unscheduled";

/** A weekly university class */
export interface UniClass {
  id: string;
  /** English course name (mono display) */
  name: string;
  /** Persian course name */
  nameFa: string;
  /** Course code, e.g. 5990101495 */
  code: string;
  /** Professor full name */
  professor: string;
  /** Location, e.g. خوارزمی-۲۱۵ (or N/A) */
  location: string;
  /** Day of week or "Unscheduled" */
  day: ClassDay | string;
  /** "HH:MM - HH:MM" or "N/A" */
  time: string;
  /** Units label as stored, e.g. "0-3" or "0.50-0.50" */
  type: string;
  /** Accent color (hex) */
  color: string;
}

/** Exam or presentation tracked with a Jalali date */
export interface UniExam {
  id: string;
  classId: string;
  title: string;
  /** ISO date (Gregorian) of the exam/presentation */
  date: string;
  /** Optional HH:MM */
  time: string;
  /** "exam" | "presentation" */
  kind: "exam" | "presentation";
  location: string;
  color: string;
  /** Free-form user notes/description (توضیحات و یادداشت) */
  notes: string;
}

/** Notes keyed by class id (markdown-ish text) */
export type NotesMap = Record<string, string>;

/** The whole JSON-file database persisted to data/db.json */
export interface UniDB {
  classes: UniClass[];
  exams: UniExam[];
  notes: NotesMap;
}

/** A reminder surfaced by the engine */
export interface ReminderItem {
  key: string;
  kind: "class" | "exam" | "presentation";
  title: string;
  body: string;
  at: number;
  color: string;
}
