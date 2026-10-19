"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarRange, GraduationCap, Layers, Sun, Command } from "lucide-react";
import { useUni } from "@/lib/store";
import { parseTime } from "@/components/terminal/schedule-grid";
import { tehranDayName, jalaliDate, gregorianDate } from "@/lib/tehran";
import { Navbar } from "@/components/terminal/navbar";
import { ScheduleGrid } from "@/components/terminal/schedule-grid";
import { ClassModal } from "@/components/terminal/class-modal";
import { ExamTracker, ExamDialog } from "@/components/terminal/exam-tracker";
import { CommandPalette } from "@/components/terminal/command-palette";
import { StatusBar } from "@/components/terminal/status-bar";
import { PaletteShortcut, SWRegister } from "@/components/terminal/system";
import { ReminderEngine } from "@/components/terminal/reminders";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_FA_SHORT: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج‌شنبه",
  Friday: "جمعه",
};

function todayLabel(today: string | null): string {
  return today ? `کلاس‌های امروز · ${DAY_FA_SHORT[today] ?? today}` : "کلاس‌های امروز";
}

function StatCard({
  icon,
  labelFa,
  value,
  accent,
  delay,
}: {
  icon: React.ReactNode;
  labelFa: string;
  value: number | string;
  accent: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="glass-card rounded-2xl p-4"
    >
      <div className="flex items-center justify-between">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${accent}1f`, color: accent }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-foreground">
          {value}
        </span>
      </div>
      <p dir="rtl" className="mt-2 text-right font-fa text-[11px] text-muted-foreground">
        {labelFa}
      </p>
    </motion.div>
  );
}

function SectionHeader({
  icon,
  titleEn,
  titleFa,
  accent,
}: {
  icon: React.ReactNode;
  titleEn: string;
  titleFa: string;
  accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="mb-5 flex items-center gap-3"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl border"
        style={{ background: `${accent}14`, color: accent, borderColor: `${accent}30` }}
        aria-hidden
      >
        {icon}
      </span>
      <div>
        <h2 className="font-mono text-base font-bold tracking-tight text-foreground">{titleEn}</h2>
        <p dir="rtl" className="font-fa text-xs text-muted-foreground">{titleFa}</p>
      </div>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="hidden xl:grid xl:grid-cols-6 xl:gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[520px] rounded-xl bg-white/[0.03]" />
      ))}
    </div>
  );
}

export default function Home() {
  const fetchAll = useUni((s) => s.fetchAll);
  const loading = useUni((s) => s.loading);
  const classes = useUni((s) => s.classes);
  const exams = useUni((s) => s.exams);

  const [today, setToday] = useState<string | null>(null);
  const [dates, setDates] = useState<{ jalali: string; greg: string } | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const tick = () => {
      setToday(tehranDayName());
      setDates({ jalali: jalaliDate(), greg: gregorianDate() });
    };
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => {
    const units = classes.reduce((acc, c) => {
      const nums = c.type.match(/\d+(\.\d+)?/g) || ["0"];
      return acc + nums.reduce((a, b) => a + parseFloat(b), 0);
    }, 0);
    const weekly = classes.filter((c) => parseTime(c.time) !== null).length;
    const todayCount = today
      ? classes.filter((c) => c.day === today && parseTime(c.time) !== null).length
      : 0;
    return { units: Number.isInteger(units) ? units : Number(units.toFixed(1)), weekly, todayCount };
  }, [classes, today]);

  return (
    <div className="flex min-h-screen flex-col">
      <PaletteShortcut />
      <SWRegister />
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-10">
        {/* ── hero ── */}
        <section className="mb-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 inline-flex items-center gap-2 rounded-full border border-terminal/25 bg-terminal/[0.06] px-3.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-terminal"
          >
            <span className="dot-live" aria-hidden />
            WEEKLY//UNI · TEHRAN
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            dir="rtl"
            className="font-fa text-3xl font-black leading-tight text-foreground sm:text-4xl"
          >
            برنامه هفتگی کلاس‌ها
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-3 flex flex-wrap items-center justify-center gap-2"
          >
            {dates && (
              <>
                <span
                  dir="rtl"
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-fa text-xs text-foreground/85"
                  suppressHydrationWarning
                >
                  {dates.jalali}
                </span>
                <span
                  className="hidden rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[11px] tabular-nums text-muted-foreground sm:inline"
                  suppressHydrationWarning
                >
                  {dates.greg}
                </span>
              </>
            )}
          </motion.div>
        </section>

        {/* ── stats ── */}
        <section aria-label="Overview" className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            labelFa="واحد این ترم"
            value={loading ? "—" : stats.units}
            accent="#00ff41"
            delay={0}
          />
          <StatCard
            icon={<Sun className="h-4 w-4" />}
            labelFa={todayLabel(today)}
            value={loading ? "—" : stats.todayCount}
            accent="#fbbf24"
            delay={0.05}
          />
          <StatCard
            icon={<CalendarRange className="h-4 w-4" />}
            labelFa="جلسه در هفته"
            value={loading ? "—" : stats.weekly}
            accent="#22d3ee"
            delay={0.1}
          />
          <StatCard
            icon={<GraduationCap className="h-4 w-4" />}
            labelFa="امتحان / ارائه پیش‌رو"
            value={loading ? "—" : exams.length}
            accent="#fb7185"
            delay={0.15}
          />
        </section>

        {/* ── schedule ── */}
        <section id="schedule" aria-label="Weekly schedule" className="scroll-mt-20">
          <SectionHeader
            icon={<CalendarRange className="h-4 w-4" />}
            titleEn="WEEKLY SCHEDULE"
            titleFa="شنبه تا پنج‌شنبه — روی هر کلاس بزنید تا جزئیات و یادداشت‌ها باز شود"
            accent="#00ff41"
          />
          {loading ? <LoadingSkeleton /> : <ScheduleGrid />}
        </section>

        {/* ── exams ── */}
        <section id="exams" aria-label="Exam tracker" className="mt-12 scroll-mt-20">
          <SectionHeader
            icon={<GraduationCap className="h-4 w-4" />}
            titleEn="EXAMS & PRESENTATIONS"
            titleFa="میان‌ترم، پایان‌ترم و ارائه‌ها — با شمارش معکوس"
            accent="#fb7185"
          />
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl bg-white/[0.03]" />
              ))}
            </div>
          ) : (
            <ExamTracker />
          )}
        </section>

        {/* ── hint ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          dir="rtl"
          className="mt-10 flex flex-wrap items-center justify-center gap-2 text-center font-fa text-[11px] text-muted-foreground/60"
        >
          <Command className="h-3 w-3" aria-hidden />
          برای جستجوی سریع درس‌ها و دستورها،
          <kbd
            className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-terminal"
            dir="ltr"
          >
            ⌘K
          </kbd>
          را بفشارید
        </motion.p>
      </main>

      <StatusBar />
      <ReminderEngine />
      <ClassModal />
      <ExamDialog />
      <CommandPalette />
    </div>
  );
}
