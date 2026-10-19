"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarRange, GraduationCap } from "lucide-react";
import { useUni } from "@/lib/store";
import { Navbar } from "@/components/terminal/navbar";
import { ScheduleGrid } from "@/components/terminal/schedule-grid";
import { ClassModal } from "@/components/terminal/class-modal";
import { ExamTracker, ExamDialog } from "@/components/terminal/exam-tracker";
import { CommandPalette } from "@/components/terminal/command-palette";
import { StatusBar } from "@/components/terminal/status-bar";
import { PaletteShortcut, SWRegister } from "@/components/terminal/system";
import { Skeleton } from "@/components/ui/skeleton";

function SectionHeader({
  icon,
  cmd,
  title,
  sub,
}: {
  icon: React.ReactNode;
  cmd: string;
  title: string;
  sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="mb-5"
    >
      <h2 className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight">
        <span className="text-terminal">{icon}</span>
        <span>{title}</span>
      </h2>
      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
        <span className="text-terminal/70">$</span> {cmd} <span className="text-terminal"># {sub}</span>
      </p>
    </motion.div>
  );
}

function BootLine() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-6 rounded-lg border border-terminal/20 bg-black/50 p-4 font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs"
    >
      <p>
        <span className="text-terminal">user@weeklyuni</span>:<span className="text-cyber">~/schedule</span>$ ./load --week=current
      </p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        [OK] mounting db.json <span className="text-terminal">✓</span>
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
        [OK] 6 classes indexed · notes store ready · exam tracker armed <span className="text-terminal">✓</span>
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
        <span className="text-terminal">hint:</span> press{" "}
        <kbd className="rounded border border-terminal/40 px-1.5 py-0.5 text-terminal">⌘K</kbd> anywhere for the command
        palette
      </motion.p>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[420px] border-terminal/10 bg-terminal/5" />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const fetchAll = useUni((s) => s.fetchAll);
  const loading = useUni((s) => s.loading);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="flex min-h-screen flex-col">
      <PaletteShortcut />
      <SWRegister />
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <BootLine />

        <section id="schedule" aria-label="Weekly schedule" className="scroll-mt-20">
          <SectionHeader
            icon={<CalendarRange className="h-5 w-5" aria-hidden />}
            cmd="grid --view=week --layout=timeline"
            title="WEEKLY SCHEDULE"
            sub="click a class to open details + notes"
          />
          {loading ? <LoadingSkeleton /> : <ScheduleGrid />}
        </section>

        <section id="exams" aria-label="Exam tracker" className="mt-12 scroll-mt-20">
          <SectionHeader
            icon={<GraduationCap className="h-5 w-5" aria-hidden />}
            cmd="tracker --assessments --sort=date"
            title="EXAM & PRESENTATION TRACKER"
            sub="midterms · finals · presentations — persisted to db.json"
          />
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 border-terminal/10 bg-terminal/5" />
              ))}
            </div>
          ) : (
            <ExamTracker />
          )}
        </section>
      </main>

      <StatusBar />
      <ClassModal />
      <ExamDialog />
      <CommandPalette />
    </div>
  );
}
