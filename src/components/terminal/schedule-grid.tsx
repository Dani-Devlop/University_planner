"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, User, Clock, Puzzle, Hash } from "lucide-react";
import { useUni } from "@/lib/store";
import type { UniClass } from "@/lib/types";
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

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export function parseTime(t: string): [number, number] | null {
  const m = t.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const s = parseInt(m[1]) * 60 + parseInt(m[2]);
  const e = parseInt(m[3]) * 60 + parseInt(m[4]);
  if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null;
  return [s, e];
}

/** greedy overlap columns so blocks sit side-by-side */
function layoutDay(classes: (UniClass & { _t: [number, number] })[]) {
  const sorted = [...classes].sort((a, b) => a._t[0] - b._t[0]);
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

const typeAccent = (c: UniClass) => {
  const n = (c.type.match(/\d+(\.\d+)?/g) || ["0"]).reduce((a, b) => a + parseFloat(b), 0);
  if (c.day === "Unscheduled") return "#b026ff";
  if (n >= 3) return "#00e5ff"; // cyber cyan — heavy theory
  if (n > 0 && n < 3) return "#00ff41"; // terminal green — lab
  return "#ffd166"; // amber fallback
};

function ClassBlock({
  item,
}: {
  item: UniClass & { col: number; cols: number; _t: [number, number] };
}) {
  const selectClass = useUni((s) => s.selectClass);
  const accent = typeAccent(item);
  const top = (item._t[0] - DAY_START) * PX_PER_MIN;
  const height = Math.max(34, (item._t[1] - item._t[0]) * PX_PER_MIN - 3);
  const width = 100 / item.cols;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * item.col, duration: 0.25 }}
      whileHover={{ y: -2 }}
      onClick={() => selectClass(item.id)}
      aria-haspopup="dialog"
      aria-label={`Open ${item.name} details`}
      style={{
        top,
        height,
        width: `calc(${width}% - 4px)`,
        left: `calc(${item.col * width}% + 2px)`,
        borderLeftColor: accent,
        boxShadow: `inset 3px 0 0 ${accent}`,
      }}
      className="glass-card group absolute cursor-pointer overflow-hidden rounded-md p-2 text-left transition-shadow duration-200 hover:z-10 hover:shadow-[0_0_20px_rgba(0,255,65,0.35)]"
    >
      <div className="truncate font-mono text-[11px] font-bold leading-tight text-foreground group-hover:text-terminal sm:text-xs">
        {item.name}
      </div>
      <div className="mt-0.5 truncate font-mono text-[9px] text-muted-foreground sm:text-[10px]">
        {item.time}
      </div>
      <div className="mt-0.5 hidden truncate font-mono text-[9px] text-muted-foreground/80 sm:block">
        <MapPin className="mr-0.5 inline h-2.5 w-2.5" aria-hidden />
        {item.location}
      </div>
    </motion.button>
  );
}

function HourGrid({ showLabels = false }: { showLabels?: boolean }) {
  const hours = [];
  for (let h = DAY_START / 60; h <= DAY_END / 60; h++) hours.push(h);
  return (
    <div className="relative h-full select-none" style={{ height: (DAY_END - DAY_START) * PX_PER_MIN }}>
      {hours.map((h) => (
        <div
          key={h}
          className="absolute left-0 w-full border-t border-terminal/10 font-mono text-[9px] text-muted-foreground/60"
          style={{ top: (h * 60 - DAY_START) * PX_PER_MIN }}
        >
          {showLabels && (
            <span className="absolute right-2 -top-2 tabular-nums">
              {String(h).padStart(2, '0')}:00
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function ScheduleGrid() {
  const classes = useUni((s) => s.classes);
  const selectClass = useUni((s) => s.selectClass);

  const { byDay, unscheduled } = useMemo(() => {
    const byDay = new Map<string, ReturnType<typeof layoutDay>>();
    const unscheduled: UniClass[] = [];
    for (const day of WEEK_DAYS) byDay.set(day, []);
    for (const c of classes) {
      const t = parseTime(c.time);
      if (c.day === "Unscheduled" || !t || !byDay.has(c.day)) {
        unscheduled.push(c);
        continue;
      }
      byDay.get(c.day)!.push({ ...c, _t: t });
    }
    for (const day of WEEK_DAYS) {
      byDay.set(day, layoutDay(byDay.get(day)!));
    }
    return { byDay, unscheduled };
  }, [classes]);

  return (
    <div>
      {/* desktop timeline */}
      <div className="hidden lg:block">
        <div className="ml-12 grid grid-cols-5 gap-2">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="pb-2 text-center font-mono text-[11px] font-bold uppercase tracking-widest text-terminal/80">
              {day.slice(0, 3)}<span className="text-muted-foreground/50">day</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="w-10 shrink-0">
            <HourGrid showLabels />
          </div>
          <div className="grid flex-1 grid-cols-5 gap-2">
            {WEEK_DAYS.map((day) => (
              <div key={day} className="relative rounded-lg border border-terminal/10 bg-white/[0.015]">
                <HourGrid />
                {(byDay.get(day) ?? []).map((item) => (
                  <ClassBlock key={item.id} item={item} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* mobile / tablet accordion */}
      <div className="lg:hidden">
        <Accordion type="multiple" defaultValue={["Monday", "Wednesday", "Thursday"]}>
          {WEEK_DAYS.map((day) => {
            const items = byDay.get(day) ?? [];
            return (
              <AccordionItem key={day} value={day} className="border-terminal/15">
                <AccordionTrigger className="font-mono text-sm uppercase tracking-widest hover:text-terminal hover:no-underline">
                  <span>
                    {day}
                    <span className="ml-2 text-xs text-terminal/60">[{items.length}]</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-2 pb-4">
                  {items.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground/60">$ no classes scheduled_</p>
                  )}
                  {items.map((cls) => (
                    <motion.button
                      key={cls.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => selectClass(cls.id)}
                      style={{ borderLeftColor: typeAccent(cls) }}
                      className="glass-card w-full rounded-md p-3 text-left transition-shadow hover:shadow-[0_0_20px_rgba(0,255,65,0.3)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold">{cls.name}</span>
                        <Badge variant="outline" className="border-terminal/30 font-mono text-[10px] text-terminal/80">
                          {cls.type}u
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground">
                        <div><Clock className="mr-1 inline h-3 w-3" aria-hidden />{cls.time}</div>
                        <div><MapPin className="mr-1 inline h-3 w-3" aria-hidden />{cls.location}</div>
                      </div>
                    </motion.button>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* unscheduled */}
      {unscheduled.length > 0 && (
        <div className="mt-6 rounded-lg border border-plasma/25 bg-plasma/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-plasma">
            <Puzzle className="h-4 w-4" aria-hidden /> UNSCHEDULED // self-paced
          </h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((c) => (
              <motion.button
                key={c.id}
                whileHover={{ y: -2 }}
                onClick={() => selectClass(c.id)}
                className="glass-card rounded-md p-3 text-left transition-shadow hover:shadow-[0_0_20px_rgba(176,38,255,0.35)]"
              >
                <div className="font-mono text-sm font-bold">{c.name}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 font-mono text-[11px] text-muted-foreground">
                  <span><User className="mr-1 inline h-3 w-3" aria-hidden />{c.professor}</span>
                  <span><Hash className="mr-1 inline h-3 w-3" aria-hidden />{c.code}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
