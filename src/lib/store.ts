// WEEKLY//UNI — global client state (zustand)
import { create } from "zustand";
import type { UniClass, UniExam, NotesMap } from "./types";

interface UniState {
  loaded: boolean;
  syncing: boolean;
  classes: UniClass[];
  exams: UniExam[];
  notes: NotesMap;
  activeClassId: string | null;
  paletteOpen: boolean;
  systemOpen: boolean;
  load: () => Promise<void>;
  updateClass: (id: string, patch: Partial<UniClass>) => Promise<void>;
  addExam: (ex: Omit<UniExam, "id">) => Promise<void>;
  updateExam: (id: string, patch: Partial<UniExam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  setNote: (classId: string, text: string) => Promise<void>;
  openClass: (id: string | null) => void;
  setPalette: (open: boolean) => void;
  setSystem: (open: boolean) => void;
}

export const useUni = create<UniState>((set, get) => ({
  loaded: false,
  syncing: false,
  classes: [],
  exams: [],
  notes: {},
  activeClassId: null,
  paletteOpen: false,
  systemOpen: false,

  load: async () => {
    set({ syncing: true });
    try {
      const res = await fetch("/api/schedule", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { classes: UniClass[]; exams: UniExam[]; notes: NotesMap };
        set({ loaded: true, classes: data.classes ?? [], exams: data.exams ?? [], notes: data.notes ?? {} });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    } finally {
      set({ syncing: false });
    }
  },

  updateClass: async (id, patch) => {
    set({ classes: get().classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    try {
      await fetch(`/api/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* offline — optimistic state kept */ }
  },

  addExam: async (ex) => {
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ex),
      });
      if (res.ok) {
        const saved = (await res.json()) as UniExam;
        set({ exams: [...get().exams, saved] });
      }
    } catch { /* noop */ }
  },

  updateExam: async (id, patch) => {
    set({ exams: get().exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
    try {
      await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* noop */ }
  },

  deleteExam: async (id) => {
    set({ exams: get().exams.filter((e) => e.id !== id) });
    try {
      await fetch(`/api/exams/${id}`, { method: "DELETE" });
    } catch { /* noop */ }
  },

  setNote: async (classId, text) => {
    set({ notes: { ...get().notes, [classId]: text } });
    try {
      await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, text }),
      });
    } catch { /* noop */ }
  },

  openClass: (id) => set({ activeClassId: id }),
  setPalette: (open) => set({ paletteOpen: open }),
  setSystem: (open) => set({ systemOpen: open }),
}));
