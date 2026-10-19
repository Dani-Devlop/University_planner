"use client";

import { useSyncExternalStore } from "react";
import { useUni } from "@/lib/store";
import { tehranDateISO, jalaliDate, gregorianDate } from "@/lib/tehran";

const subscribeMinute = (cb: () => void) => {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
};

/** slim sticky footer — live status + dates */
export function StatusBar() {
  const classes = useUni((s) => s.classes);
  const exams = useUni((s) => s.exams);
  const loading = useUni((s) => s.loading);

  // value-stable snapshot (ISO date string) → SSR renders nothing, client picks up after mount
  const todayISO = useSyncExternalStore(subscribeMinute, tehranDateISO, () => "");
  const dates = todayISO ? { jalali: jalaliDate(), greg: gregorianDate() } : null;

  return (
    <footer className="sticky bottom-0 z-40 mt-auto border-t border-white/[0.07] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 overflow-hidden px-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="dot-live" aria-hidden />
          <span className="font-mono font-bold text-terminal">LIVE</span>
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <span className="font-mono">
            {loading ? "syncing…" : `db.json · ${classes.length} classes · ${exams.length} exams`}
          </span>
        </span>
        <span className="ml-auto hidden items-center gap-3 md:flex">
          {dates && (
            <span dir="rtl" className="font-fa text-muted-foreground/80">
              {dates.jalali}
            </span>
          )}
          <span className="font-mono text-muted-foreground/60">weeklyuni.up.railway.app</span>
        </span>
        <span className="font-mono tabular-nums md:hidden" suppressHydrationWarning>
          {dates?.greg ?? ""}
        </span>
      </div>
    </footer>
  );
}
