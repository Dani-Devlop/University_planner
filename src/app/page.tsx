'use client'

import { useEffect } from "react";
import {
  Terminal, Layers, Sun, CalendarRange, GraduationCap, Command,
} from "lucide-react";
import Navbar from "@/components/terminal/navbar";
import ScheduleGrid from "@/components/terminal/schedule-grid";
import ExamTracker from "@/components/terminal/exam-tracker";
import ClassModal from "@/components/terminal/class-modal";
import CommandPalette from "@/components/terminal/command-palette";
import StatusBar from "@/components/terminal/status-bar";
import SystemPanel from "@/components/terminal/system";
import ReminderEngine from "@/components/terminal/reminders";
import { useUni } from "@/lib/store";
import { tehranDayName } from "@/lib/tehran";
import { daysUntilISO } from "@/lib/jalali";

function StatCard({
  color, icon, label, value,
}: { color: string; icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${color}1f`, color }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </span>
      </div>
      <p dir="rtl" className="mt-2 text-right font-fa text-[11px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default function Home() {
  const { loaded, classes, exams, load } = useUni();

  useEffect(() => {
    void load();
  }, [load]);

  const todayName = loaded ? tehranDayName() : "";
  const todayCount = loaded
    ? classes.filter((c) => c.day === todayName).length
    : 0;
  const sessionsPerWeek = loaded
    ? classes.filter((c) => c.day !== "Unscheduled").length
    : 0;
  const upcoming = loaded
    ? exams.filter((e) => {
        const d = daysUntilISO(e.date);
        return !isNaN(d) && d >= 0;
      }).length
    : 0;
  const totalUnits = loaded
    ? classes.reduce((sum, c) => {
        const parts = String(c.type ?? "").split("-");
        const v = Number(parts[1] ?? 0);
        return sum + (isNaN(v) ? 0 : v);
      }, 0)
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-10">
        {/* Hero */}
        <section className="mb-8 text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-terminal/25 bg-terminal/[0.06] px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal">
            <span className="dot-live" aria-hidden="true" />
            WEEKLY//UNI · TEHRAN
          </p>
          <h1 dir="rtl" className="font-fa text-3xl font-black leading-tight text-foreground sm:text-4xl">
            برنامه هفتگی کلاس‌ها
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2" />
        </section>

        {/* Overview stats */}
        <section aria-label="Overview" className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            color="#00ff41"
            icon={<Layers className="h-4 w-4" aria-hidden="true" />}
            label="واحد این ترم"
            value={loaded ? totalUnits : "—"}
          />
          <StatCard
            color="#fbbf24"
            icon={<Sun className="h-4 w-4" aria-hidden="true" />}
            label="کلاس‌های امروز"
            value={loaded ? todayCount : "—"}
          />
          <StatCard
            color="#22d3ee"
            icon={<CalendarRange className="h-4 w-4" aria-hidden="true" />}
            label="جلسه در هفته"
            value={loaded ? sessionsPerWeek : "—"}
          />
          <StatCard
            color="#fb7185"
            icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
            label="امتحان / ارائه پیش‌رو"
            value={loaded ? upcoming : "—"}
          />
        </section>

        {/* Schedule */}
        <section id="schedule" aria-label="Weekly schedule" className="scroll-mt-20">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ background: "#00ff4114", color: "#00ff41", borderColor: "#00ff4130" }}
              aria-hidden="true"
            >
              <CalendarRange className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-mono text-base font-bold tracking-tight text-foreground">
                WEEKLY SCHEDULE
              </h2>
              <p dir="rtl" className="font-fa text-xs text-muted-foreground">
                شنبه تا پنج‌شنبه — روی هر کلاس بزنید تا جزئیات و یادداشت‌ها باز شود
              </p>
            </div>
          </div>
          <ScheduleGrid />
        </section>

        {/* Exams */}
        <section id="exams" aria-label="Exam tracker" className="mt-12 scroll-mt-20">
          <div className="mb-5 flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
              style={{ background: "#fb718514", color: "#fb7185", borderColor: "#fb718530" }}
              aria-hidden="true"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-mono text-base font-bold tracking-tight text-foreground">
                EXAMS &amp; PRESENTATIONS
              </h2>
              <p dir="rtl" className="font-fa text-xs text-muted-foreground">
                میان‌ترم، پایان‌ترم و ارائه‌ها — با شمارش معکوس
              </p>
            </div>
          </div>
          <ExamTracker />
        </section>

        {/* Hint */}
        <p
          dir="rtl"
          className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center font-fa text-[11px] text-muted-foreground/60"
        >
          <Command className="h-3 w-3" aria-hidden="true" />
          برای جستجوی سریع درس‌ها و دستورها،
          <kbd
            dir="ltr"
            className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-terminal"
          >
            ⌘K
          </kbd>
          را بفشارید
        </p>
      </main>

      <StatusBar />

      {/* Overlays */}
      <ClassModal />
      <CommandPalette />
      <SystemPanel />
      <ReminderEngine />
      <span className="sr-only" aria-hidden="true">
        <Terminal className="h-3 w-3" />
      </span>
    </div>
  );
}
