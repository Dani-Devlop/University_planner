"use client";

import { create } from "zustand";
import type { UniClass, Exam, NotesMap, ExamKind } from "./types";
import { tehranDateISO } from "./tehran";

export interface ExamDraft {
  title: string;
  kind: ExamKind;
  classId: string;
  date: string;
  time: string;
  location: string;
  note: string;
}

interface UniState {
  // data
  classes: UniClass[];
  notes: NotesMap;
  exams: Exam[];
  loading: boolean;
  booted: boolean;

  // ui
  selectedClassId: string | null;
  paletteOpen: boolean;
  examDialogOpen: boolean;
  editingExamId: string | null;

  fetchAll: () => Promise<void>;
  saveNote: (classId: string, content: string) => Promise<void>;
  addExam: (draft: ExamDraft) => Promise<boolean>;
  updateExam: (id: string, draft: ExamDraft) => Promise<boolean>;
  deleteExam: (id: string) => Promise<void>;

  selectClass: (id: string | null) => void;
  setPaletteOpen: (open: boolean) => void;
  setExamDialog: (open: boolean, editingId?: string | null) => void;
}

const emptyDraft: ExamDraft = {
  title: "",
  kind: "midterm",
  classId: "",
  date: tehranDateISO(), // Tehran "today" — Jalali picker shows the Shamsi equivalent
  time: "",
  location: "",
  note: "",
};

export const useUni = create<UniState>((set, get) => ({
  classes: [],
  notes: {},
  exams: [],
  loading: true,
  booted: false,

  selectedClassId: null,
  paletteOpen: false,
  examDialogOpen: false,
  editingExamId: null,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      const db = await res.json();
      set({
        classes: Array.isArray(db.classes) ? db.classes : [],
        notes: db.notes ?? {},
        exams: Array.isArray(db.exams) ? db.exams : [],
        booted: true,
      });
    } finally {
      set({ loading: false });
    }
  },

  saveNote: async (classId, content) => {
    const res = await fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, content }),
    });
    if (res.ok) {
      const data = await res.json();
      set({ notes: data.notes });
    }
  },

  addExam: async (draft) => {
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) return false;
    const exam: Exam = await res.json();
    set({ exams: [...get().exams, exam] });
    return true;
  },

  updateExam: async (id, draft) => {
    const res = await fetch(`/api/exams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) return false;
    const exam: Exam = await res.json();
    set({ exams: get().exams.map((e) => (e.id === id ? exam : e)) });
    return true;
  },

  deleteExam: async (id) => {
    const res = await fetch(`/api/exams/${id}`, { method: "DELETE" });
    if (res.ok) set({ exams: get().exams.filter((e) => e.id !== id) });
  },

  selectClass: (id) => set({ selectedClassId: id }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setExamDialog: (open, editingId = null) =>
    set({ examDialogOpen: open, editingExamId: editingId }),
}));

export { emptyDraft };
