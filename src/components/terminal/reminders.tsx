"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  Presentation,
  BookOpenCheck,
  AlarmClock,
  Flag,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useUni } from "@/lib/store";
import {
  allReminders,
  dueReminders,
  faUntil,
  type ReminderInstance,
} from "@/lib/reminders";
import { playReminderSound, playClassChime, playExamAlarm, playPresentationChime, installAudioUnlock } from "@/lib/sounds";
import { tehranDateISO } from "@/lib/tehran";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ── localStorage keys ────────────────────────────────────────────────────
const LS_ENABLED = "wu.reminders.enabled";
const LS_FIRED = "wu.reminders.fired";
const FIRED_TTL = 8 * 86_400_000; // prune after 8 days

type PermissionState = "unsupported" | "default" | "granted" | "denied";

interface ReminderStore {
  enabled: boolean;
  permission: PermissionState;
  hydrated: boolean;
  hydrate: () => void;
  setEnabled: (v: boolean) => void;
  setPermission: (p: PermissionState) => void;
  requestPermission: () => Promise<void>;
}

export const useReminders = create<ReminderStore>((set, get) => ({
  enabled: true,
  permission: "default",
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const enabled = localStorage.getItem(LS_ENABLED) !== "0";
    let permission: PermissionState = "default";
    if (typeof Notification === "undefined") permission = "unsupported";
    else permission = Notification.permission as PermissionState;
    set({ enabled, permission, hydrated: true });
  },

  setEnabled: (v) => {
    localStorage.setItem(LS_ENABLED, v ? "1" : "0");
    set({ enabled: v });
  },

  setPermission: (p) => set({ permission: p }),

  requestPermission: async () => {
    if (typeof Notification === "undefined") {
      set({ permission: "unsupported" });
      return;
    }
    try {
      const res = await Notification.requestPermission();
      set({ permission: res as PermissionState });
      if (res === "granted") toast.success("نوتیفیکیشن سیستم فعال شد ✅");
      else if (res === "denied") toast.error("اجازه نوتیفیکیشن رد شد — از تنظیمات مرورگر می‌توانید فعال کنید");
    } catch {
      /* iOS Safari can throw outside a gesture */
    }
  },
}));

// ── fired-reminder persistence (multi-tab safe: mark before firing) ─────
function loadFired(): Record<string, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_FIRED) ?? "{}") as Record<string, number>;
    const now = Date.now();
    const clean: Record<string, number> = {};
    for (const [k, t] of Object.entries(raw)) if (now - t < FIRED_TTL) clean[k] = t;
    return clean;
  } catch {
    return {};
  }
}

function saveFired(fired: Record<string, number>): void {
  try {
    localStorage.setItem(LS_FIRED, JSON.stringify(fired));
  } catch {
    /* private mode */
  }
}

async function showSystemNotification(r: ReminderInstance): Promise<void> {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const icon = "/icons/icon-192.png";
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      // renotify is valid in browsers but missing from TS lib types
      const options: NotificationOptions & { renotify?: boolean } = {
        body: r.body,
        tag: r.key,
        renotify: true,
        icon,
        badge: icon,
        dir: "rtl",
        lang: "fa",
        requireInteraction: r.offsetMin >= 1440,
      };
      await reg.showNotification(r.title, options);
      return;
    }
    new Notification(r.title, { body: r.body, icon, tag: r.key, dir: "rtl", lang: "fa" });
  } catch {
    /* notification API failure → in-app toast already covers it */
  }
}

const KIND_ICON: Record<ReminderInstance["kind"], React.ReactNode> = {
  class: <AlarmClock className="h-4 w-4 text-terminal" aria-hidden />,
  exam: <Flag className="h-4 w-4 text-red-400" aria-hidden />,
  presentation: <Presentation className="h-4 w-4 text-amber" aria-hidden />,
};

// ── Engine — ticks every 20s, fires due reminders ────────────────────────
export function ReminderEngine() {
  const hydrated = useReminders((s) => s.hydrated);
  const enabled = useReminders((s) => s.enabled);
  const hydrate = useReminders((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    installAudioUnlock();
  }, [hydrate]);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      useReminders.getState().setPermission(Notification.permission as PermissionState);
    }
  }, []);

  const runCheck = useCallback(() => {
    const st = useReminders.getState();
    if (!st.enabled) return;
    const uni = useUni.getState();
    if (!uni.booted) return;
    const todayISO = tehranDateISO();
    const fired = loadFired();
    const due = dueReminders(uni.classes, uni.exams, todayISO, Date.now(), fired);
    if (due.length === 0) return;
    const marked = { ...fired };
    for (const r of due) marked[r.key] = Date.now();
    saveFired(marked); // mark first → other tabs / re-renders won't double-fire
    for (const r of due) {
      playReminderSound(r.sound);
      void showSystemNotification(r);
      toast(r.title, {
        description: r.body,
        icon: KIND_ICON[r.kind],
        duration: r.offsetMin >= 1440 ? 15000 : 8000,
      });
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !enabled) return;
    const t = setInterval(runCheck, 20_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") runCheck();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    // catch-up shortly after boot too
    const boot = setTimeout(runCheck, 2_500);
    return () => {
      clearInterval(t);
      clearTimeout(boot);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [hydrated, enabled, runCheck]);

  return null;
}

// ── Navbar bell + settings popover ───────────────────────────────────────
const SOUND_TESTS: { label: string; kind: ReminderInstance["kind"]; fn: () => void }[] = [
  { label: "صدای کلاس", kind: "class", fn: playClassChime },
  { label: "صدای امتحان", kind: "exam", fn: playExamAlarm },
  { label: "صدای ارائه", kind: "presentation", fn: playPresentationChime },
];

export function BellButton() {
  const enabled = useReminders((s) => s.enabled);
  const permission = useReminders((s) => s.permission);
  const setEnabled = useReminders((s) => s.setEnabled);
  const requestPermission = useReminders((s) => s.requestPermission);
  const classes = useUni((s) => s.classes);
  const exams = useUni((s) => s.exams);
  const [open, setOpen] = useState(false);

  const upcoming = useMemo(() => {
    if (!open) return [];
    const todayISO = tehranDateISO();
    const now = Date.now();
    return allReminders(classes, exams, todayISO)
      .filter((r) => r.at > now)
      .slice(0, 4);
  }, [open, classes, exams]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={enabled ? "یادآورها فعال" : "یادآورها خاموش"}
          className={`relative h-8 w-8 rounded-full border-white/[0.09] bg-white/[0.03] hover:border-terminal/40 hover:bg-terminal/10 ${
            enabled ? "text-terminal" : "text-muted-foreground"
          }`}
        >
          {enabled ? (
            permission === "granted" ? (
              <BellRing className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Bell className="h-3.5 w-3.5" aria-hidden />
            )
          ) : (
            <BellOff className="h-3.5 w-3.5" aria-hidden />
          )}
          {enabled && permission !== "granted" && (
            <span className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-amber animate-pulse" aria-hidden />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        dir="rtl"
        className="w-80 rounded-2xl border-white/[0.1] bg-popover/95 p-4 font-fa backdrop-blur-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-terminal" aria-hidden />
            <span className="text-sm font-bold">یادآورهای هوشمند</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Label htmlFor="rem-sw" className="text-[11px] text-muted-foreground">
              {enabled ? "فعال" : "خاموش"}
            </Label>
            <Switch
              id="rem-sw"
              checked={enabled}
              onCheckedChange={(v) => {
                setEnabled(v);
                if (v) playClassChime();
              }}
            />
          </div>
        </div>

        {/* system notification permission */}
        <div className="mb-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          {permission === "granted" ? (
            <p className="flex items-center gap-2 text-xs text-terminal">
              <BellRing className="h-3.5 w-3.5 shrink-0" aria-hidden />
              نوتیفیکیشن سیستم فعال است
            </p>
          ) : permission === "denied" ? (
            <p className="flex items-center gap-2 text-xs text-red-400">
              <BellOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
              نوتیفیکیشن رد شده — از تنظیمات مرورگر سایت را Allow کنید
            </p>
          ) : permission === "unsupported" ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              مرورگر شما نوتیفیکیشن ندارد — صدا و اعلان داخلی کار می‌کند
            </p>
          ) : (
            <Button
              size="sm"
              onClick={() => void requestPermission()}
              className="w-full rounded-full bg-terminal text-xs font-semibold text-black hover:bg-terminal/85"
            >
              <Bell className="h-3.5 w-3.5" aria-hidden />
              فعال‌سازی نوتیفیکیشن مرورگر
            </Button>
          )}
        </div>

        {/* rules */}
        <ul className="mb-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <AlarmClock className="h-3 w-3 shrink-0 text-terminal/70" aria-hidden />
            کلاس‌ها: <b className="text-foreground/85">۹۰ و ۶۰ دقیقه</b> قبل + صدای زنگ
          </li>
          <li className="flex items-center gap-1.5">
            <BookOpenCheck className="h-3 w-3 shrink-0 text-cyber/80" aria-hidden />
            میان‌ترم / پایان‌ترم: <b className="text-foreground/85">۹۰ و ۶۰ دقیقه</b> قبل + صدای هشدار
          </li>
          <li className="flex items-center gap-1.5">
            <Presentation className="h-3 w-3 shrink-0 text-amber/90" aria-hidden />
            ارائه‌ها: <b className="text-foreground/85">۴ و ۲ روز</b> قبل + دقیقه‌ای‌ها
          </li>
        </ul>

        {/* sound test */}
        <p className="mb-1.5 text-[11px] text-muted-foreground/70">تست صداها:</p>
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          {SOUND_TESTS.map((s) => (
            <Button
              key={s.kind}
              size="sm"
              variant="outline"
              onClick={s.fn}
              className="h-7 rounded-full border-white/10 bg-white/[0.03] px-2 text-[10px] hover:border-terminal/40 hover:bg-terminal/10"
            >
              <Volume2 className="h-3 w-3" aria-hidden />
              {s.label}
            </Button>
          ))}
        </div>

        {/* upcoming reminders preview */}
        {upcoming.length > 0 && (
          <div className="border-t border-white/[0.07] pt-2.5">
            <p className="mb-1.5 text-[11px] font-bold text-foreground/80">یادآورهای بعدی:</p>
            <ul className="space-y-1.5">
              <AnimatePresence initial={false}>
                {upcoming.map((r) => (
                  <motion.li
                    key={r.key}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <span className="mt-0.5 shrink-0">{KIND_ICON[r.kind]}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-foreground/90">{r.title.replace(/^(⏰|📌) /, "")}</span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {faUntil(r.at - Date.now())} دیگر
                      </span>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
