"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Terminal, Search } from "lucide-react";
import { useUni } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const setPaletteOpen = useUni((s) => s.setPaletteOpen);
  const examsCount = useUni((s) => s.exams.length);
  const classesCount = useUni((s) => s.classes.length);
  const [now, setNow] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
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
      className="sticky top-0 z-40 border-b border-terminal/20 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <a
          href="#"
          className="group flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
          aria-label="WEEKLY UNI home"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded border border-terminal/40 bg-terminal/10 text-terminal shadow-[0_0_12px_rgba(0,255,65,0.25)] transition-shadow group-hover:shadow-[0_0_18px_rgba(0,255,65,0.45)]">
            <Terminal className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-foreground">
            WEEKLY<span className="text-terminal">{"//"}</span>UNI
          </span>
          <span className="hidden text-[10px] font-normal text-muted-foreground sm:inline">
            v2.1.0
          </span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 font-mono text-xs md:flex" aria-label="Primary">
          {[
            ["SCHEDULE", "schedule", classesCount],
            ["EXAMS", "exams", examsCount],
          ].map(([label, id, count]) => (
            <button
              key={id}
              onClick={() => scrollTo(id as string)}
              className="rounded px-3 py-1.5 text-muted-foreground transition-colors hover:bg-terminal/10 hover:text-terminal"
            >
              ./{label}
              <span className="ml-1.5 text-[10px] text-terminal/60">[{count as number}]</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline" suppressHydrationWarning>
            {now}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaletteOpen(true)}
            className="gap-2 border-terminal/30 bg-transparent font-mono text-xs text-muted-foreground hover:border-terminal hover:text-terminal"
            aria-label="Open command palette"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            <kbd className="pointer-events-none font-mono">⌘K</kbd>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
