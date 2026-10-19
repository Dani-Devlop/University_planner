"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Command } from "lucide-react";
import { useUni } from "@/lib/store";
import { tehranClock } from "@/lib/tehran";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const setPaletteOpen = useUni((s) => s.setPaletteOpen);
  const examsCount = useUni((s) => s.exams.length);
  const classesCount = useUni((s) => s.classes.length);
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(tehranClock());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <motion.header
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <a
          href="#"
          className="group flex items-center gap-2.5"
          aria-label="WEEKLY UNI home"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal/30 bg-terminal/10 text-terminal transition-shadow group-hover:shadow-[0_0_20px_rgba(0,255,65,0.35)]"
            aria-hidden
          >
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            WEEKLY<span className="text-terminal">{"//"}</span>UNI
          </span>
        </a>

        <nav
          className="ml-6 hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 md:flex"
          aria-label="Primary"
        >
          {[
            ["Schedule", "schedule", classesCount],
            ["Exams", "exams", examsCount],
          ].map(([label, id, count]) => (
            <button
              key={id}
              onClick={() => scrollTo(id as string)}
              className="rounded-full px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {label as string}
              <span className="ml-1.5 rounded-full bg-white/[0.08] px-1.5 font-mono text-[10px] tabular-nums">
                {count as number}
              </span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-mono text-xs tabular-nums text-muted-foreground sm:flex"
            title="Tehran local time"
            suppressHydrationWarning
          >
            <span className="dot-live" aria-hidden />
            {now ?? "--:--:--"}
            <span className="text-[9px] font-bold tracking-widest text-terminal/70">TEH</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="gap-1.5 rounded-full border-white/[0.09] bg-white/[0.03] text-xs text-muted-foreground hover:border-terminal/40 hover:bg-terminal/10 hover:text-terminal"
            aria-label="Open command palette"
          >
            <Command className="h-3.5 w-3.5" aria-hidden />
            <kbd className="pointer-events-none font-mono">⌘K</kbd>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
