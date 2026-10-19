"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Puzzle, CalendarHeart, GraduationCap } from "lucide-react";
import { useUni } from "@/lib/store";
import type { UniClass } from "@/lib/types";
import { tehranDayName, tehranMinutes } from "@/lib/tehran";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// ── time helpers ────────────────────────────────────────────────────────
const DAY_START = 8 * 60; // 08:00
const DAY_END = 18 * 60; // 18:00
const PX_PER_MIN = 1.15;

/** Iranian academic week — Saturday through Thursday */
export const WEEK_DAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
] as const;

export const DAY_FA: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج‌شنبه",
  Unscheduled: "بدون تقویم",
};

export function dayFa(day: string): string {
  return DAY_FA[day] ?? day;
}

/** course accent color (falls back to terminal green) */
export function classColor(c: UniClass): string {
  return c.color ?? (c.day === "Unscheduled" ? "#34d399" : "#00ff41");
}

export function parseTime(t: string): [number, number] | null {
  const m = t.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const s = parseInt(m[1]) * 60 + parseInt(m[2]);
  const e = parseInt(m[3]) * 60 + parseInt(m[4]);
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  return [s, e];
}

type PlacedClass = UniClass & { col: number; cols: number; _t: [number, number] };

/** greedy overlap columns so parallel blocks sit side-by-side */
function layoutDay(classes: (UniClass & { _t: [number, number] })[]): PlacedClass[] {
  const sorted = [...classes].sort((a, b) => a._t[0] - b._t[0] || a.id.localeCompare(b.id));
  const colEnd: number[] = [];
  const placed = sorted.map((c) => ({ cls: c, col: 0 }));
  for (const p of placed) {
    let col = colEnd.findIndex((end) => p.cls._t[0] >= end);
    if (col === -1) {
      col = colEnd.length;
      colEnd.push(0);
    }
    colEnd[col] = p.cls._t[1];
    p.col = col;
  }
  const cols = Math.max(1, colEnd.length);
  return placed.map((p) => ({ ...p.cls, col: p.col, cols }));
}

function ClassBlock({
  item,
  nowMinutes,
}: {
  item: PlacedClass;
  nowMinutes: number | null;
}) {
  const selectClass = useUni((s) => s.selectClass);
  const color = classColor(item);
  const top = (item._t[0] - DAY_START) * PX_PER_MIN;
  const height = Math.max(40, (item._t[1] - item._t[0]) * PX_PER_MIN - 4);
  const width = 100 / item.cols;
  const isNow = nowMinutes !== null && nowMinutes >= item._t[0] && nowMinutes < item._t[1];

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.04 * item.col, duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={() => selectClass(item.id)}
      aria-haspopup="dialog"
      aria-label={`Open ${item.name} details`}
      style={
        {
          top,
          height,
          width: `calc(${width}% - 6px)`,
          right: `calc(${item.col * width}% + 3px)`,
          "--c": color,
          background: `linear-gradient(-150deg, ${color}26, ${color}0d 55%, transparent)`,
          borderColor: `${color}45`,
          boxShadow: `inset -3px 0 0 ${color}${isNow ? ", 0 0 24px " + color + "55" : ""}`,
        } as React.CSSProperties
      }
      className="group absolute cursor-pointer overflow-hidden rounded-lg border p-2 text-right backdrop-blur-sm transition-[box-shadow,border-color] duration-200 hover:z-10 hover:border-[var(--c)] hover:shadow-[0_10px_32px_var(--c)]/40"
    >
      {isNow && (
        <span
          className="absolute left-1.5 top-1.5 h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: color }}
          aria-hidden
        />
      )}
      <div dir="rtl" className="truncate text-right font-fa text-[11px] font-bold leading-tight text-foreground sm:text-xs">
        {item.nameFa || item.name}
      </div>
      {item.nameFa && height > 110 && item.cols === 1 && (
        <div dir="ltr" className="truncate text-right font-mono text-[8px] leading-snug text-muted-foreground/60 sm:text-[9px]">
          {item.name}
        </div>
      )}
      {height > 70 && item.professor && (
        <div
          dir="rtl"
          className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-foreground/75 sm:text-[10px]"
          title={`استاد: ${item.professor}`}
        >
          <GraduationCap className="h-2.5 w-2.5 shrink-0" aria-hidden style={{ color }} />
          <span className="truncate font-fa">
            {item.cols > 1 ? item.professor : `استاد: ${item.professor}`}
          </span>
        </div>
      )}
      <div dir="rtl" className="mt-1 flex items-center gap-1 truncate text-[9px] tabular-nums text-muted-foreground sm:text-[10px]">
        <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden style={{ color }} />
        <span dir="ltr">{item.time}</span>
      </div>
      {height > 95 && (
        <div dir="rtl" className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-muted-foreground/85 sm:text-[10px]">
          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden style={{ color }} />
          <span className="truncate font-fa">{item.location}</span>
        </div>
      )}
    </motion.button>
  );
}

function HourGrid({ showLabels = false }: { showLabels?: boolean }) {
  const hours: number[] = [];
  for (let h = DAY_START / 60; h <= DAY_END / 60; h++) hours.push(h);
  return (
    <div className="relative h-full select-none" style={{ height: (DAY_END - DAY_START) * PX_PER_MIN }}>
      {hours.map((h) => (
        <div
          key={h}
          className="absolute left-0 w-full border-t border-white/[0.05] font-mono text-[9px] tabular-nums text-muted-foreground/55"
          style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }}
        >
          {showLabels && (
            <span className="absolute -top-2 left-2">
              {String(h).padStart(2, "0")}:00
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function NowLine({ minutes }: { minutes: number }) {
  if (minutes < DAY_START || minutes > DAY_END) return null;
  return (
    <div
      className="pointer-events-none absolute left-0 z-20 w-full"
      style={{ top: (minutes - DAY_START) * PX_PER_MIN }}
      aria-hidden
    >
      <div className="relative h-[2px] w-full bg-gradient-to-l from-red-500 via-red-400/70 to-transparent">
        <span className="absolute -right-1 -top-[3px] h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]" />
      </div>
    </div>
  );
}

export function ScheduleGrid() {
  const classes = useUni((s) => s.classes);
  const selectClass = useUni((s) => s.selectClass);

  // Tehran "today" + now-minutes, set after mount (SSR-safe)
  const [today, setToday] = useState<string | null>(null);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const day = tehranDayName();
      setToday(day);
      setNowMinutes(WEEK_DAYS.includes(day as (typeof WEEK_DAYS)[number]) ? tehranMinutes() : null);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  const { byDay, unscheduled } = useMemo(() => {
    const raw = new Map<string, (UniClass & { _t: [number, number] })[]>();
    const unscheduled: UniClass[] = [];
    for (const day of WEEK_DAYS) raw.set(day, []);
    for (const c of classes) {
      const t = parseTime(c.time);
      if (c.day === "Unscheduled" || !t || !raw.has(c.day)) {
        unscheduled.push(c);
        continue;
      }
      raw.get(c.day)!.push({ ...c, _t: t });
    }
    const byDay = new Map<string, PlacedClass[]>();
    for (const day of WEEK_DAYS) {
      byDay.set(day, layoutDay(raw.get(day)!));
    }
    return { byDay, unscheduled };
  }, [classes]);

  const todayIndex = today ? WEEK_DAYS.indexOf(today as (typeof WEEK_DAYS)[number]) : -1;

  return (
    <div dir="rtl">
      {/* ── desktop timeline (Sat → Thu, right-to-left) ── */}
      <div className="hidden xl:block">
        <div className="mr-14 grid grid-cols-6 gap-2.5 pb-2">
          {WEEK_DAYS.map((day, i) => {
            const isToday = i === todayIndex;
            return (
              <div
                key={day}
                className={`flex items-baseline justify-center gap-1.5 rounded-lg border px-2 py-1.5 ${
                  isToday
                    ? "border-terminal/45 bg-terminal/[0.07] shadow-[0_0_24px_rgba(0,255,65,0.12)]"
                    : "border-transparent"
                }`}
              >
                <span
                  dir="rtl"
                  className={`font-fa text-xs font-bold ${
                    isToday ? "text-terminal" : "text-foreground/85"
                  }`}
                >
                  {dayFa(day)}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest ${
                    isToday ? "text-terminal/80" : "text-muted-foreground"
                  }`}
                >
                  {day.slice(0, 3)}
                </span>
                {(byDay.get(day)?.length ?? 0) > 0 && (
                  <span className="rounded-full bg-white/[0.07] px-1.5 font-mono text-[9px] tabular-nums text-muted-foreground">
                    {byDay.get(day)!.length}
                  </span>
                )}
                {isToday && (
                  <span className="rounded-full bg-terminal px-1.5 font-mono text-[8px] font-bold uppercase text-black">
                    today
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2.5">
          <div className="w-11 shrink-0 pt-px">
            <HourGrid showLabels />
          </div>
          <div className="grid flex-1 grid-cols-6 gap-2.5">
            {WEEK_DAYS.map((day, i) => (
              <div
                key={day}
                className={`relative rounded-xl border ${
                  i === todayIndex
                    ? "border-terminal/30 bg-terminal/[0.03]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                <HourGrid />
                {i === todayIndex && nowMinutes !== null && <NowLine minutes={nowMinutes} />}
                {(byDay.get(day) ?? []).map((item) => (
                  <ClassBlock key={item.id} item={item} nowMinutes={i === todayIndex ? nowMinutes : null} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── mobile / tablet accordion ── */}
      <div className="xl:hidden">
        <Accordion
          type="multiple"
          defaultValue={[todayIndex >= 0 ? WEEK_DAYS[todayIndex] : "Monday"]}
        >
          {WEEK_DAYS.map((day, i) => {
            const items = byDay.get(day) ?? [];
            const isToday = i === todayIndex;
            return (
              <AccordionItem key={day} value={day} className="border-white/[0.07]">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex items-center gap-2.5">
                    {isToday ? (
                      <span className="flex items-center gap-1.5 rounded-full bg-terminal/15 px-2.5 py-1 text-terminal">
                        <CalendarHeart className="h-3.5 w-3.5" aria-hidden />
                        <span dir="rtl" className="font-fa text-sm font-bold">{dayFa(day)}</span>
                      </span>
                    ) : (
                      <span dir="rtl" className="font-fa text-sm font-semibold text-foreground/90">
                        {dayFa(day)}
                      </span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                      {day.slice(0, 3)}
                    </span>
                    {items.length > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-1 rounded-full border-white/10 font-mono text-[10px] tabular-nums text-muted-foreground"
                      >
                        {items.length}
                      </Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2.5 pb-4">
                  {items.length === 0 && (
                    <p dir="rtl" className="rounded-lg border border-dashed border-white/10 py-4 text-center font-fa text-xs text-muted-foreground/70">
                      کلاسی ثبت نشده است
                    </p>
                  )}
                  {items.map((cls) => {
                    const color = classColor(cls);
                    return (
                      <motion.button
                        key={cls.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectClass(cls.id)}
                        aria-label={`Open ${cls.name} details`}
                        style={
                          {
                            background: `linear-gradient(150deg, ${color}1f, ${color}0a)`,
                            borderColor: `${color}40`,
                          } as React.CSSProperties
                        }
                        className="w-full rounded-xl border p-3.5 text-right"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className="h-7 w-1 rounded-full" style={{ background: color }} aria-hidden />
                            <span>
                              <span dir="rtl" className="block text-right font-fa text-sm font-bold text-foreground">
                                {cls.nameFa || cls.name}
                              </span>
                              {cls.nameFa && (
                                <span dir="ltr" className="block text-right font-mono text-[10px] text-muted-foreground/60">
                                  {cls.name}
                                </span>
                              )}
                            </span>
                          </span>
                          <Badge
                            variant="outline"
                            className="rounded-full border-white/10 font-mono text-[10px] tabular-nums text-muted-foreground"
                          >
                            {cls.type}u
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1 pr-3 text-[11px] text-muted-foreground">
                          <div dir="rtl" className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 shrink-0" aria-hidden style={{ color }} />
                            <span dir="ltr" className="tabular-nums">{cls.time}</span>
                          </div>
                          {cls.professor && (
                            <div dir="rtl" className="flex items-center gap-1.5">
                              <GraduationCap className="h-3 w-3 shrink-0" aria-hidden style={{ color }} />
                              <span className="font-fa text-foreground/80">استاد: {cls.professor}</span>
                            </div>
                          )}
                          <div dir="rtl" className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden style={{ color }} />
                            <span className="font-fa">{cls.location}</span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* ── unscheduled (self-paced) ── */}
      {unscheduled.length > 0 && (
        <div
          id="unscheduled"
          className="mt-6 rounded-xl border border-[#34d399]/25 bg-[#34d399]/[0.04] p-4"
        >
          <h3 className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#34d399]">
            <Puzzle className="h-4 w-4" aria-hidden />
            <span className="font-mono">SELF-PACED</span>
            <span dir="rtl" className="font-fa normal-case tracking-normal text-[#34d399]/80">
              بدون تقویم — پروژه
            </span>
          </h3>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((c, i) => (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                onClick={() => selectClass(c.id)}
                aria-label={`Open ${c.name} details`}
                style={
                  {
                    "--c": classColor(c),
                    background: `linear-gradient(150deg, ${classColor(c)}1c, ${classColor(c)}08)`,
                    borderColor: `${classColor(c)}38`,
                  } as React.CSSProperties
                }
                className="rounded-xl border p-3.5 text-right transition-shadow hover:shadow-[0_10px_32px_var(--c)]/40"
              >
                <div dir="rtl" className="text-right font-fa text-sm font-bold text-foreground">
                  {c.nameFa || c.name}
                </div>
                {c.nameFa && (
                  <div dir="ltr" className="mt-0.5 text-right font-mono text-[10px] text-muted-foreground/60">
                    {c.name}
                  </div>
                )}
                <div dir="rtl" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-fa text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3 shrink-0" aria-hidden style={{ color: classColor(c) }} />
                    استاد: {c.professor}
                  </span>
                  <span className="font-mono" dir="ltr">#{c.code}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
