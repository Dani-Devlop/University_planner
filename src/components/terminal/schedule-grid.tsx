'use client'

// WEEKLY//UNI — weekly schedule grid (desktop 6-col RTL grid + overlap sub-columns + mobile accordion)

import * as React from "react"
import { ChevronLeft, CircleDashed, GraduationCap, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useUni } from "@/lib/store"
import { parseRange, tehranDayName, tehranMinutes, tehranParts } from "@/lib/tehran"
import { JALALI_MONTHS, toPersianDigits, isoToJalaliParts } from "@/lib/jalali"
import { jalaliHoliday } from "@/lib/holidays"
import { accentFor } from "@/lib/colors"
import type { UniClass } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const WEEK_DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"] as const

const DAY_NAMES_FA: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج‌شنبه",
  Unscheduled: "بدون زمان‌بندی",
}

/* ---- display window: 08:00 → 17:00 (Tehran) mapped onto a 520px column ---- */
const DAY_START = 8 * 60
const DAY_END = 17 * 60
const SPAN = DAY_END - DAY_START // 540
const COL_H = 520
const PX_PER_MIN = COL_H / SPAN
const topOf = (min: number) => (min - DAY_START) * PX_PER_MIN

interface Timed {
  c: UniClass
  start: number
  end: number
}

interface Placed extends Timed {
  lane: number
}

interface Cluster {
  top: number
  height: number
  items: Placed[]
}

function toTimed(classes: UniClass[]): Timed[] {
  const out: Timed[] = []
  for (const c of classes) {
    const r = parseRange(c.time)
    if (!r) continue
    out.push({ c, start: r[0], end: r[1] })
  }
  return out.sort((a, b) => a.start - b.start || b.end - a.end)
}

/** group overlapping classes into clusters, assign narrow lanes inside each cluster */
function buildClusters(timed: Timed[]): Cluster[] {
  const clusters: Cluster[] = []
  let cur: Placed[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1

  const flush = () => {
    if (cur.length === 0) return
    const minStart = Math.min(...cur.map((p) => p.start))
    const maxEnd = Math.max(...cur.map((p) => p.end))
    clusters.push({
      top: topOf(minStart),
      height: Math.max((maxEnd - minStart) * PX_PER_MIN, 34),
      items: cur,
    })
    cur = []
    laneEnds = []
    clusterEnd = -1
  }

  for (const t of timed) {
    if (cur.length > 0 && t.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((e) => e <= t.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(t.end)
    } else {
      laneEnds[lane] = t.end
    }
    clusterEnd = Math.max(clusterEnd, t.end)
    cur.push({ ...t, lane })
  }
  flush()
  return clusters
}

function professorShort(professor: string): string {
  const parts = professor.trim().split(/\s+/)
  return parts[parts.length - 1] ?? professor
}

interface WeekDay {
  day: string
  iso: string
  jalaliLabel: string
  holiday: string | null
}

/** Thursday — استاد فدائیان present 08:00→19:00 (project hours, no fixed time slot) */
const PRESENCE = {
  day: "Thursday" as const,
  professor: "محمد فدائیان",
  from: "08:00",
  to: "19:00",
  label: "استاد فدائیان — حضور دارد",
  hint: "هماهنگی پروژه — ساعت ثابت ندارد",
}

/* ---------------- single class block (desktop) ---------------- */

function ClassBlock({ item, narrow }: { item: Timed; narrow: boolean }) {
  const openClass = useUni((s) => s.openClass)
  const { resolvedTheme } = useTheme()
  const { c } = item
  const accent = accentFor(c.color, resolvedTheme)
  return (
    <button
      type="button"
      dir="rtl"
      onClick={() => openClass(c.id)}
      className="group flex h-full w-full min-w-0 cursor-pointer flex-col gap-0.5 overflow-hidden rounded-lg border p-1.5 text-start transition-[filter] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{
        borderInlineStart: `3px solid ${c.color}`,
        background: `${c.color}14`,
        borderColor: `${c.color}40`,
      }}
      title={c.nameFa}
    >
      <span
        className="truncate font-fa text-[11px] font-bold leading-tight"
        style={{ color: accent }}
      >
        {c.nameFa}
      </span>
      {/* 🔴 استاد — always visible, short name + tooltip in narrow overlap columns */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex min-w-0 items-center gap-1 font-fa text-[10px] leading-tight text-foreground/75">
            <GraduationCap className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden="true" />
            <span className="truncate">
              {narrow ? professorShort(c.professor) : `استاد: ${c.professor}`}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent dir="rtl" className="font-fa">
          استاد: {c.professor}
        </TooltipContent>
      </Tooltip>
      <span dir="ltr" className="truncate text-right font-mono text-[9px] tabular-nums leading-tight text-foreground/60">
        {c.time}
      </span>
      <span className="truncate font-fa text-[9px] leading-tight text-muted-foreground">
        {c.location}
      </span>
    </button>
  )
}

/* ---------------- mobile class card (accordion) ---------------- */

function MobileClassCard({ c }: { c: UniClass }) {
  const openClass = useUni((s) => s.openClass)
  const accent = accentFor(c.color, useTheme().resolvedTheme)
  return (
    <button
      type="button"
      dir="rtl"
      onClick={() => openClass(c.id)}
      className="w-full rounded-xl border p-3 text-start transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{
        borderInlineStart: `3px solid ${c.color}`,
        background: `${c.color}0f`,
        borderColor: `${c.color}40`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-fa text-xs font-bold" style={{ color: accent }}>
          {c.nameFa}
        </span>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
      </div>
      <p className="mt-1 flex min-w-0 items-center gap-1 font-fa text-[10px] text-foreground/70">
        <GraduationCap className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <span className="truncate">استاد: {c.professor}</span>
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span dir="ltr" className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {c.time}
        </span>
        <span className="truncate font-fa text-[10px] text-muted-foreground">
          {c.location}
        </span>
      </div>
    </button>
  )
}

/* ---------------- unscheduled class card (big, e.g. پروژه) ---------------- */

function UnscheduledCard({ c }: { c: UniClass }) {
  const openClass = useUni((s) => s.openClass)
  const accent = accentFor(c.color, useTheme().resolvedTheme)
  return (
    <button
      type="button"
      dir="rtl"
      onClick={() => openClass(c.id)}
      title={c.nameFa}
      className="glass-card flex min-h-36 w-full cursor-pointer flex-col justify-between rounded-2xl p-5 text-start transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{ borderInlineStart: `4px solid ${c.color}` }}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="truncate font-fa text-lg font-black leading-tight" style={{ color: accent }}>
          {c.nameFa}
        </span>
        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} aria-hidden="true" />
      </div>
      <div className="mt-3 flex min-w-0 items-center gap-1.5 font-fa text-sm font-bold text-foreground">
        <GraduationCap className="h-4 w-4 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <span className="truncate">استاد: {c.professor}</span>
      </div>
      <div className="mt-2 flex w-full items-center justify-between gap-2">
        <span className="truncate font-mono text-[10px] text-muted-foreground/70">
          {c.name} · {c.code}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 font-fa text-[10px] text-muted-foreground/70 transition-colors group-hover:text-foreground">
          جزئیات و یادداشت
          <ChevronLeft className="h-3 w-3" aria-hidden="true" />
        </span>
      </div>
    </button>
  )
}

/* ---------------- one day column (desktop) ---------------- */

function DayColumn({
  day,
  iso,
  jalaliLabel,
  holiday,
  isToday,
  nowMin,
  classes,
}: {
  day: string
  iso: string
  jalaliLabel: string
  holiday: string | null
  isToday: boolean
  nowMin: number | null
  classes: UniClass[]
}) {
  const timed = React.useMemo(
    () => toTimed(classes.filter((c) => c.day === day)),
    [classes, day]
  )
  const clusters = React.useMemo(() => buildClusters(timed), [timed])
  const showNow = isToday && nowMin !== null && nowMin >= DAY_START && nowMin <= DAY_END

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-white/[0.02]",
        isToday ? "border-terminal/25" : "border-white/[0.06]",
        holiday && !isToday && "border-red-500/15"
      )}
      data-day={day}
      data-iso={iso}
      title={holiday ? `${jalaliLabel} (تعطیل) — ${holiday}` : undefined}
    >
      {/* header */}
      <div
        className={cn(
          "flex items-center justify-between gap-1 border-b border-white/[0.06] px-2 py-2",
          isToday && "bg-terminal/10",
          holiday && !isToday && "bg-red-500/[0.06]"
        )}
      >
        <span className="flex items-center gap-1.5">
          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-terminal" aria-hidden="true" />}
          <span className={cn("font-fa text-xs font-bold", isToday ? "text-terminal" : "text-foreground/90")}>
            {DAY_NAMES_FA[day] ?? day}
          </span>
        </span>
        {holiday ? (
          <span className="font-fa text-[9px] font-bold text-red-500 dark:text-red-400">
            {jalaliLabel} (تعطیل)
          </span>
        ) : (
          <span className="font-fa text-[9px] text-muted-foreground">{jalaliLabel}</span>
        )}
      </div>

      {/* body */}
      <div className="relative h-[520px]">
        {/* faint hour lines */}
        {Array.from({ length: 10 }, (_, i) => DAY_START + i * 60).map((m) => (
          <div
            key={m}
            className="pointer-events-none absolute inset-x-0 flex items-start gap-1"
            style={{ top: topOf(m) }}
          >
            <span className="w-6 shrink-0 text-start font-fa text-[8px] leading-none text-muted-foreground/45">
              {toPersianDigits(`${Math.floor(m / 60)}:00`)}
            </span>
            <span className="mt-[3px] h-px flex-1 bg-white/[0.05]" />
          </div>
        ))}

        {/* red "now" line */}
        {showNow && nowMin !== null && (
          <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: topOf(nowMin) }}>
            <div className="border-t border-red-500/60" />
            <span className="absolute -top-2.5 start-1 flex items-center gap-1 rounded bg-red-500/15 px-1 py-0.5 font-fa text-[9px] font-bold leading-none text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
              الان
            </span>
          </div>
        )}

        {/* Thursday presence — استاد فدائیان 08:00→19:00 (under regular class blocks) */}
        {day === PRESENCE.day && (
          <div
            className="pointer-events-none absolute inset-x-1 bottom-1 z-0 flex flex-col gap-0.5 rounded-lg border border-dashed p-1.5"
            style={{
              top: topOf(DAY_START),
              borderColor: "color-mix(in srgb, var(--terminal) 40%, transparent)",
              background: "color-mix(in srgb, var(--terminal) 5%, transparent)",
            }}
          >
            <span
              className="flex items-center gap-1 font-fa text-[10px] font-bold leading-tight"
              style={{ color: "var(--terminal)" }}
            >
              <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
              {PRESENCE.label}
            </span>
            <span dir="ltr" className="text-right font-mono text-[9px] tabular-nums leading-tight text-foreground/55">
              {PRESENCE.from} - {PRESENCE.to}
            </span>
            <span className="font-fa text-[9px] leading-tight text-muted-foreground">
              {PRESENCE.hint}
            </span>
          </div>
        )}

        {/* class blocks / overlap clusters */}
        {clusters.map((cluster, ci) => {
          if (cluster.items.length === 1) {
            const item = cluster.items[0]
            return (
              <div
                key={`${item.c.id}-${ci}`}
                className="absolute inset-x-1 z-10"
                style={{ top: cluster.top, height: cluster.height }}
              >
                <ClassBlock item={item} narrow={false} />
              </div>
            )
          }
          const maxLane = Math.max(...cluster.items.map((p) => p.lane))
          const lanes: Placed[][] = []
          for (let li = 0; li <= maxLane; li++) {
            lanes.push(cluster.items.filter((p) => p.lane === li))
          }
          return (
            <div
              key={`cluster-${ci}`}
              className="absolute inset-x-1 z-10 flex gap-1"
              style={{ top: cluster.top, height: cluster.height }}
            >
              {lanes.map((laneItems, li) => (
                <div key={li} className="min-w-0 flex-1">
                  {laneItems.map((p) => (
                    <ClassBlock key={p.c.id} item={p} narrow />
                  ))}
                </div>
              ))}
            </div>
          )
        })}

        {timed.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center font-fa text-[10px] text-muted-foreground/40">
            —
          </span>
        )}
      </div>
    </div>
  )
}

/* ---------------- main component ---------------- */

export default function ScheduleGrid() {
  const classes = useUni((s) => s.classes)
  const loaded = useUni((s) => s.loaded)

  // current Tehran minute for the red "now" line (client-only, no SSR mismatch)
  const [nowMin, setNowMin] = React.useState<number | null>(null)
  React.useEffect(() => {
    const tick = () => setNowMin(tehranMinutes())
    tick()
    const t = window.setInterval(tick, 30_000)
    return () => window.clearInterval(t)
  }, [])

  // mounted-once snapshot of the current week (component only renders dates after `loaded`)
  const [week] = React.useState<WeekDay[]>(() => {
    const p = tehranParts()
    const base = Date.UTC(p.y, p.mo - 1, p.d)
    return WEEK_DAYS.map((day, i) => {
      const dt = new Date(base + (i - (p.dow - 1)) * 86_400_000)
      const pad = (n: number) => String(n).padStart(2, "0")
      const iso = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
      const [jy, jm, jd] = isoToJalaliParts(iso)
      const hol = jalaliHoliday(jy, jm, jd)
      return {
        day,
        iso,
        jalaliLabel: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}`,
        holiday: hol?.name ?? null,
      }
    })
  })

  const [todayDay] = React.useState(() => tehranDayName())
  const unscheduled = React.useMemo(
    () => classes.filter((c) => c.day === "Unscheduled" || !parseRange(c.time)),
    [classes]
  )

  if (!loaded) {
    return (
      <>
        <div className="hidden xl:grid xl:grid-cols-6 xl:gap-2.5">
          {WEEK_DAYS.map((d) => (
            <Skeleton key={d} className="h-[520px] rounded-xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="flex flex-col gap-2 xl:hidden">
          <Skeleton className="h-14 rounded-xl bg-white/[0.03]" />
          <Skeleton className="h-14 rounded-xl bg-white/[0.03]" />
          <Skeleton className="h-14 rounded-xl bg-white/[0.03]" />
        </div>
      </>
    )
  }

  return (
    <>
      {/* ---------- desktop grid (شنبه rightmost in RTL) ---------- */}
      <div dir="rtl" className="hidden xl:grid xl:grid-cols-6 xl:gap-2.5">
        {week.map(({ day, iso, jalaliLabel, holiday }) => (
          <DayColumn
            key={day}
            day={day}
            iso={iso}
            jalaliLabel={jalaliLabel}
            holiday={holiday}
            isToday={day === todayDay}
            nowMin={nowMin}
            classes={classes}
          />
        ))}
      </div>

      {/* ---------- mobile accordion (today open by default) ---------- */}
      <Accordion
        type="single"
        collapsible
        defaultValue={todayDay}
        dir="rtl"
        className="xl:hidden"
      >
        {week.map(({ day, iso, jalaliLabel, holiday }) => {
          const timed = toTimed(classes.filter((c) => c.day === day))
          const isPresenceDay = day === PRESENCE.day
          return (
            <AccordionItem
              key={day}
              value={day}
              dir="rtl"
              className="glass-card mb-2 rounded-xl border-0 px-3"
            >
              <AccordionTrigger className="gap-2 py-3 text-start hover:no-underline [&>svg]:text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="font-fa text-sm font-bold text-foreground">
                    {DAY_NAMES_FA[day] ?? day}
                  </span>
                  {day === todayDay && (
                    <span className="rounded-full bg-terminal/15 px-1.5 py-0.5 font-fa text-[9px] font-bold text-terminal">
                      امروز
                    </span>
                  )}
                </span>
                <span className="ms-auto flex items-center gap-2">
                  {holiday && (
                    <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 font-fa text-[9px] font-bold text-red-500 dark:text-red-400">
                      تعطیل
                    </span>
                  )}
                  {holiday ? (
                    <span className="font-fa text-[10px] font-bold text-red-500 dark:text-red-400">
                      {jalaliLabel} (تعطیل)
                    </span>
                  ) : (
                    <span className="font-fa text-[10px] text-muted-foreground">{jalaliLabel}</span>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                {isPresenceDay && (
                  <div
                    className="mb-2 flex flex-col gap-1 rounded-xl border border-dashed p-3"
                    style={{
                      borderColor: "color-mix(in srgb, var(--terminal) 40%, transparent)",
                      background: "color-mix(in srgb, var(--terminal) 5%, transparent)",
                    }}
                  >
                    <span
                      className="flex items-center gap-1.5 font-fa text-xs font-bold"
                      style={{ color: "var(--terminal)" }}
                    >
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {PRESENCE.label}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        dir="ltr"
                        className="text-right font-mono text-[10px] tabular-nums text-foreground/55"
                      >
                        {PRESENCE.from} - {PRESENCE.to}
                      </span>
                      <span className="font-fa text-[10px] text-muted-foreground">
                        {PRESENCE.hint}
                      </span>
                    </div>
                  </div>
                )}
                {timed.length === 0 ? (
                  <p className="py-3 text-center font-fa text-xs text-muted-foreground">
                    {isPresenceDay ? "کلاس ثابتی در این روز نیست — فقط حضور استاد" : "کلاسی در این روز نیست"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {timed.map(({ c }) => (
                      <MobileClassCard key={c.id} c={c} />
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* ---------- unscheduled classes (big cards, like پروژه) ---------- */}
      {unscheduled.length > 0 && (
        <section dir="rtl" aria-label="کلاس‌های بدون ساعت ثابت" className="mt-8">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
              style={{
                background: "color-mix(in srgb, var(--plasma) 8%, transparent)",
                color: "var(--plasma)",
                borderColor: "color-mix(in srgb, var(--plasma) 19%, transparent)",
              }}
              aria-hidden="true"
            >
              <CircleDashed className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="font-fa text-sm font-bold text-foreground">
                کلاس‌های بدون ساعت ثابت
              </h3>
              <p className="font-fa text-xs text-muted-foreground">
                مثل درس پروژه — ساعت مشخصی در برنامه هفتگی ندارند؛ برای جزئیات و یادداشت روی کارت بزنید
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {unscheduled.map((c) => (
              <UnscheduledCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {/* parallel-classes hint (e.g. Monday overlap) */}
      <p className="mt-3 hidden items-center gap-1.5 font-fa text-[10px] text-muted-foreground/60 xl:flex">
        <Users className="h-3 w-3" aria-hidden="true" />
        کلاس‌های هم‌زمان در ستون‌های باریک کنار هم نمایش داده می‌شوند — روی هر کلاس بزنید
      </p>
    </>
  )
}
