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

/** Telegram Serverless mini-app build: data lives in the bot's cloud DB (tgcloud endpoints). */
const TGCLOUD_BUILD = process.env.NEXT_PUBLIC_TGCLOUD === "1";

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

/** Raw Telegram initData (present inside Telegram even on clients without the Serverless bridge). */
function tgInitData(): string {
  if (typeof window === "undefined") return "";
  try {
    return (window as unknown as { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? "";
  } catch {
    return "";
  }
}

/**
 * Direct HTTP fallback — replicates the official telegram-web-app.js wire
 * protocol exactly: POST /api/<name> with `Authorization: TMA base64(initData)`.
 * Works on Telegram clients that expose WebApp.initData but ship a broken/
 * missing Serverless bridge. initData is URL-encoded ASCII, so btoa is safe.
 */
async function httpCall<T>(name: string, input: Record<string, unknown>): Promise<T> {
  const initData = tgInitData();
  if (!initData) throw new Error("no-init-data: open the mini app from inside Telegram");
  const res = await fetch(`/api/${name}`, {
    method: "POST",
    headers: {
      Authorization: `TMA ${window.btoa(initData)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  let data: { ok?: boolean; result?: T; description?: string } | null = null;
  try {
    data = (await res.json()) as typeof data;
  } catch {
    /* non-JSON body */
  }
  if (!data || typeof data.ok !== "boolean") {
    throw new Error(`unexpected response from ${name} (HTTP ${res.status})`);
  }
  if (!data.ok) throw new Error(data.description || `endpoint ${name} failed (HTTP ${res.status})`);
  return data.result as T;
}

/**
 * Call a tgcloud endpoint; resolves with its result, rejects on error.
 * Transport: official Serverless bridge first — on sync throw OR callback
 * error falls back to the direct HTTP protocol above (same server, same auth).
 */
function callEndpoint<T>(name: string, input?: Record<string, unknown>): Promise<T> {
  const viaHttp = () => httpCall<T>(name, input ?? {});
  const bridge = serverless();
  if (!bridge) return viaHttp();
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    try {
      bridge.call(name, input ?? {}, (err, res) => {
        if (settled) return;
        if (!err) {
          settled = true;
          resolve(res as T);
          return;
        }
        viaHttp()
          .then((r) => {
            if (!settled) {
              settled = true;
              resolve(r);
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              reject(err instanceof Error ? err : new Error(String((err as { message?: string })?.message ?? "endpoint-error")));
            }
          });
      });
    } catch {
      viaHttp().then(resolve, reject);
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
  /** true when the last cloud read/write failed (tgcloud mini-app build only) */
  offline: boolean;
  /** true when the last mutation failed to reach the cloud (optimistic state kept) */
  lastWriteFailed: boolean;
  classes: UniClass[];
  exams: UniExam[];
  notes: NotesMap;
  activeClassId: string | null;
  paletteOpen: boolean;
  systemOpen: boolean;
  /** soft=true: on failure keep what is already on screen (used on resync) */
  load: (soft?: boolean) => Promise<void>;
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
  offline: false,
  lastWriteFailed: false,
  classes: [],
  exams: [],
  notes: {},
  activeClassId: null,
  paletteOpen: false,
  systemOpen: false,

  load: async (soft = false) => {
    if (TGCLOUD_BUILD) {
      set({ syncing: true });
      try {
        const data = await callEndpoint<{ classes: UniClass[]; exams: UniExam[]; notes: NotesMap }>("getSchedule");
        set({
          loaded: true,
          offline: false,
          classes: data.classes ?? [],
          exams: data.exams ?? [],
          notes: data.notes ?? {},
        });
        return;
      } catch {
        // endpoint unreachable — soft resync keeps what is on screen, initial
        // load falls back to the local snapshot / bundled seed
        if (soft) {
          set({ offline: true });
          return;
        }
        const snap = lsRead() ?? SEED;
        set({ loaded: true, offline: true, classes: snap.classes, exams: snap.exams, notes: snap.notes });
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
    if (TGCLOUD_BUILD) {
      try {
        await callEndpoint("updateClass", { id, patch });
        set({ lastWriteFailed: false, offline: false });
      } catch {
        // optimistic state kept — UI flags the failure via lastWriteFailed
        set({ lastWriteFailed: true, offline: true });
      }
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
    if (TGCLOUD_BUILD) {
      try {
        const saved = await callEndpoint<UniExam>("addExam", { ...ex });
        set({ exams: [...get().exams, saved], lastWriteFailed: false, offline: false });
      } catch {
        // keep optimistic local copy so the UI still reflects the attempt —
        // but flag it honestly so the UI can warn about the failed save
        const saved: UniExam = {
          ...ex,
          id: `ex${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        };
        set({ exams: [...get().exams, saved], lastWriteFailed: true, offline: true });
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
    if (TGCLOUD_BUILD) {
      try {
        await callEndpoint("updateExam", { id, patch });
        set({ lastWriteFailed: false, offline: false });
      } catch {
        set({ lastWriteFailed: true, offline: true });
      }
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
    if (TGCLOUD_BUILD) {
      try {
        await callEndpoint("deleteExam", { id });
        set({ lastWriteFailed: false, offline: false });
      } catch {
        set({ lastWriteFailed: true, offline: true });
      }
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
    if (TGCLOUD_BUILD) {
      try {
        await callEndpoint("setNote", { classId, text });
        set({ lastWriteFailed: false, offline: false });
      } catch {
        set({ lastWriteFailed: true, offline: true });
      }
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
