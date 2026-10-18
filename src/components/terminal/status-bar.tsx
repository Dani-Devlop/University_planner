"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { GitBranch, Cpu, Activity } from "lucide-react";
import { useUni } from "@/lib/store";

const subscribe = (cb: () => void) => {
  const t = setInterval(cb, 30_000);
  return () => clearInterval(t);
};
const todayISO = () => new Date().toISOString().slice(0, 10);

/** vim-style sticky status bar (footer) */
export function StatusBar() {
  const classes = useUni((s) => s.classes);
  const exams = useUni((s) => s.exams);
  const loading = useUni((s) => s.loading);
  const date = useSyncExternalStore(subscribe, todayISO, () => "");

  return (
    <motion.footer
      initial={{ y: 40 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 16 }}
      className="sticky bottom-0 z-40 mt-auto border-t border-terminal/25 bg-black/90 backdrop-blur-md"
    >
      <div className="mx-auto flex h-8 max-w-7xl items-center gap-3 overflow-hidden px-4 font-mono text-[10px] text-muted-foreground">
        <span className="bg-terminal px-2 py-0.5 font-bold text-black">NORMAL</span>
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3 text-terminal/60" aria-hidden /> main
        </span>
        <span className="hidden items-center gap-1 sm:flex">
          <Activity className="h-3 w-3 text-terminal/60" aria-hidden />
          {loading ? "syncing…" : `db.json · ${classes.length} classes · ${exams.length} assessments`}
        </span>
        <span className="ml-auto hidden items-center gap-1 md:flex">
          <Cpu className="h-3 w-3 text-terminal/60" aria-hidden /> weeklyuni.up.railway.app
        </span>
        <span className="tabular-nums" suppressHydrationWarning>{date}</span>
      </div>
    </motion.footer>
  );
}
