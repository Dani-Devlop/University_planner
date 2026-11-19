// WEEKLY//UNI — Telegram Serverless database schema
//
// Mirrors the UniDB shape of the Next.js app (data/db.json):
// classes[], exams[], notes{} — adapted to relational tables (no FKs).

import { table, text, integer, index, sql } from 'sdk/db';

export const classes = table(
  'classes',
  {
    id:        text('id').primaryKey(),
    name:      text('name').notNull().default(''),
    nameFa:    text('name_fa').notNull().default(''),
    code:      text('code').notNull().default(''),
    professor: text('professor').notNull().default(''),
    location:  text('location').notNull().default(''),
    day:       text('day').notNull().default('Unscheduled'),
    time:      text('time').notNull().default('N/A'),
    type:      text('type').notNull().default('0-0'),
    color:     text('color').notNull().default('#00ff41'),
  },
  (t) => ({
    dayIdx: index('idx_classes_day').on(t.day),
  })
);

export const exams = table(
  'exams',
  {
    id:       text('id').primaryKey(),
    classId:  text('class_id').notNull().default('1'),
    title:    text('title').notNull().default(''),
    date:     text('date').notNull().default(''),   // ISO YYYY-MM-DD (Gregorian)
    time:     text('time').notNull().default(''),   // optional HH:MM
    kind:     text('kind').notNull().default('exam'), // exam | presentation
    location: text('location').notNull().default(''),
    color:    text('color').notNull().default(''),
    notes:    text('notes').notNull().default(''),
  },
  (t) => ({
    dateIdx: index('idx_exams_date').on(t.date),
  })
);

export const notes = table('notes', {
  classId: text('class_id').primaryKey(),
  text:    text('text').notNull().default(''),
  updated: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
