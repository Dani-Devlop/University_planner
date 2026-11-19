// WEEKLY//UNI — endpoints/getSchedule.js
// Full snapshot for the Mini App (same shape as GET /api/schedule on Railway).

import { allClasses, allExams, notesMap } from '../lib/uni.js';
import { requireOwner } from '../lib/gate.js';

export default async function (input, ctx) {
  requireOwner(ctx);
  const [classes, exams, notes] = await Promise.all([allClasses(), allExams(), notesMap()]);
  return { classes, exams, notes };
}
