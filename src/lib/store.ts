// WEEKLY//UNI — global client state (zustand)
import { create } from "zustand";
import type { UniClass, UniExam, NotesMap } from "./types";
import seedData from "../../data/db.json";

/**
 * GitHub Pages static mode (NEXT_PUBLIC_STATIC=1):
 * no server/API available — the same UI persists everything in localStorage,
 * seeded on first visit from the bundled data/db.json snapshot.
 *
 * Telegram Serverless mode (auto-detected at runtime):
 * when the app runs inside Telegram as a Mini App, every read/write goes to
 * tgcloud endpoints (tgcloud/endpoints/*) via Telegram.WebApp.Serverless.call —
 * the same UI, persisted in the bot's cloud database.
 */
const STATIC = process.env.NEXT_PUBLIC_STATIC === "1";
const LS_KEY = "wu.static.db.v1";

interface ServerlessBridge {
  call: (name: string, input: object, cb: (err: unknown, res: unknown) => void) => void;
}

function serverless(): ServerlessBridge | null {
  if (typeof window === "undefined") return null;
  const bridge = (
    window as unknown as {
      Telegram?: { WebApp?: { Serverless?: ServerlessBridge } };
    }
  ).Telegram?.WebApp?.Serverless;
  return bridge && typeof bridge.call === "function" ? bridge : null;
}

/** Call a tgcloud endpoint; resolves with its result, rejects on error. */
function callEndpoint<T>(name: string, input?: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const bridge = serverless();
    if (!bridge) {
      reject(new Error("no-serverless"));
      return;
    }
    try {
      bridge.call(name, input ?? {}, (err, res) => {
        if (err) reject(err instanceof Error ? err : new Error(String((err as { message?: string })?.message ?? "endpoint-error")));
        else resolve(res as T);
      });
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

interface Snapshot {
  classes: UniClass[];
  exams: UniExam[];
  notes: NotesMap;
}

const SEED: Snapshot = {
  classes: (seedData.classes ?? []) as UniClass[],
  exams: (seedData.exams ?? []) as UniExam[],
  notes: (seedData.notes ?? {}) as NotesMap,
};

function lsRead(): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<Snapshot>;
    return {
      classes: Array.isArray(j.classes) ? j.classes : [],
      exams: Array.isArray(j.exams) ? j.exams : [],
      notes: j.notes && typeof j.notes === "object" ? (j.notes as NotesMap) : {},
    };
  } catch {
    return null;
  }
}

function lsWrite(s: Snapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {
    /* quota/private mode — state stays in memory */
  }
}

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
    if (serverless()) {
      set({ syncing: true });
      try {
        const data = await callEndpoint<{ classes: UniClass[]; exams: UniExam[]; notes: NotesMap }>("getSchedule");
        set({ loaded: true, classes: data.classes ?? [], exams: data.exams ?? [], notes: data.notes ?? {} });
        return;
      } catch {
        // endpoint unreachable — fall through to the bundled seed so the UI still works
        const snap = lsRead() ?? SEED;
        set({ loaded: true, classes: snap.classes, exams: snap.exams, notes: snap.notes });
        return;
      } finally {
        set({ syncing: false });
      }
    }
    if (STATIC) {
      const snap = lsRead();
      const data = snap ?? SEED;
      if (!snap) lsWrite(SEED);
      set({ loaded: true, syncing: false, classes: data.classes, exams: data.exams, notes: data.notes });
      return;
    }
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
    if (serverless()) {
      try {
        await callEndpoint("updateClass", { id, patch });
      } catch { /* offline — optimistic state kept */ }
      return;
    }
    if (STATIC) {
      lsWrite({ classes: get().classes, exams: get().exams, notes: get().notes });
      return;
    }
    try {
      await fetch(`/api/classes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch { /* offline — optimistic state kept */ }
  },

  addExam: async (ex) => {
    if (serverless()) {
      try {
        const saved = await callEndpoint<UniExam>("addExam", { ...ex });
        set({ exams: [...get().exams, saved] });
      } catch {
        // keep optimistic local copy so the UI still reflects the attempt
        const saved: UniExam = {
          ...ex,
          id: `ex${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        };
        set({ exams: [...get().exams, saved] });
      }
      return;
    }
    if (STATIC) {
      const saved: UniExam = {
        ...ex,
        id: `ex${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      };
      set({ exams: [...get().exams, saved] });
      lsWrite({ classes: get().classes, exams: get().exams, notes: get().notes });
      return;
    }
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
    if (serverless()) {
      try {
        await callEndpoint("updateExam", { id, patch });
      } catch { /* offline — optimistic state kept */ }
      return;
    }
    if (STATIC) {
      lsWrite({ classes: get().classes, exams: get().exams, notes: get().notes });
      return;
    }
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
    if (serverless()) {
      try {
        await callEndpoint("deleteExam", { id });
      } catch { /* offline — optimistic state kept */ }
      return;
    }
    if (STATIC) {
      lsWrite({ classes: get().classes, exams: get().exams, notes: get().notes });
      return;
    }
    try {
      await fetch(`/api/exams/${id}`, { method: "DELETE" });
    } catch { /* noop */ }
  },

  setNote: async (classId, text) => {
    set({ notes: { ...get().notes, [classId]: text } });
    if (serverless()) {
      try {
        await callEndpoint("setNote", { classId, text });
      } catch { /* offline — optimistic state kept */ }
      return;
    }
    if (STATIC) {
      lsWrite({ classes: get().classes, exams: get().exams, notes: get().notes });
      return;
    }
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
