'use client'

// WEEKLY//UNI — weekly schedule grid (desktop 6-col RTL grid + overlap sub-columns + mobile accordion)

import * as React from "react"
import { CircleDashed, GraduationCap, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUni } from "@/lib/store"
import { parseRange, tehranDayName, tehranMinutes, tehranParts } from "@/lib/tehran"
import { JALALI_MONTHS, toPersianDigits, isoToJalaliParts } from "@/lib/jalali"
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

/* ---------------- single class block (desktop) ---------------- */

function ClassBlock({ item, narrow }: { item: Timed; narrow: boolean }) {
  const openClass = useUni((s) => s.openClass)
  const { c } = item
  return (
    <button
      type="button"
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
        style={{ color: c.color }}
      >
        {c.nameFa}
      </span>
      {/* 🔴 استاد — always visible, short name + tooltip in narrow overlap columns */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex min-w-0 items-center gap-1 font-fa text-[10px] leading-tight text-foreground/75">
            <GraduationCap className="h-3 w-3 shrink-0" style={{ color: c.color }} aria-hidden="true" />
            <span className="truncate">
              {narrow ? professorShort(c.professor) : `استاد: ${c.professor}`}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent dir="rtl" className="font-fa">
          استاد: {c.professor}
        </TooltipContent>
      </Tooltip>
      <span dir="ltr" className="truncate font-mono text-[9px] tabular-nums leading-tight text-foreground/60">
        {c.time}
      </span>
      <span className="truncate font-fa text-[9px] leading-tight text-muted-foreground">
        {c.location}
      </span>
    </button>
  )
}

/* ---------------- one day column (desktop) ---------------- */

function DayColumn({
  day,
  iso,
  jalaliLabel,
  isToday,
  nowMin,
  classes,
}: {
  day: string
  iso: string
  jalaliLabel: string
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
        isToday ? "border-terminal/25" : "border-white/[0.06]"
      )}
      data-day={day}
      data-iso={iso}
    >
      {/* header */}
      <div
        className={cn(
          "flex items-center justify-between gap-1 border-b border-white/[0.06] px-2 py-2",
          isToday && "bg-terminal/10"
        )}
      >
        <span className="flex items-center gap-1.5">
          {isToday && <span className="h-1.5 w-1.5 rounded-full bg-terminal" aria-hidden="true" />}
          <span className={cn("font-fa text-xs font-bold", isToday ? "text-terminal" : "text-foreground/90")}>
            {DAY_NAMES_FA[day] ?? day}
          </span>
        </span>
        <span className="font-fa text-[9px] text-muted-foreground">{jalaliLabel}</span>
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
  const openClass = useUni((s) => s.openClass)

  // current Tehran minute for the red "now" line (client-only, no SSR mismatch)
  const [nowMin, setNowMin] = React.useState<number | null>(null)
  React.useEffect(() => {
    const tick = () => setNowMin(tehranMinutes())
    tick()
    const t = window.setInterval(tick, 30_000)
    return () => window.clearInterval(t)
  }, [])

  // mounted-once snapshot of the current week (component only renders dates after `loaded`)
  const [week] = React.useState(() => {
    const p = tehranParts()
    const base = Date.UTC(p.y, p.mo - 1, p.d)
    return WEEK_DAYS.map((day, i) => {
      const dt = new Date(base + (i - (p.dow - 1)) * 86_400_000)
      const pad = (n: number) => String(n).padStart(2, "0")
      const iso = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
      const [jy, jm, jd] = isoToJalaliParts(iso)
      return { day, iso, jalaliLabel: `${toPersianDigits(jd)} ${JALALI_MONTHS[jm - 1]}` }
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
        {week.map(({ day, iso, jalaliLabel }) => (
          <DayColumn
            key={day}
            day={day}
            iso={iso}
            jalaliLabel={jalaliLabel}
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
        {week.map(({ day, iso, jalaliLabel }) => {
          const timed = toTimed(classes.filter((c) => c.day === day))
          return (
            <AccordionItem
              key={day}
              value={day}
              className="glass-card mb-2 rounded-xl border-0 px-3"
            >
              <AccordionTrigger className="gap-2 py-3 hover:no-underline [&>svg]:text-muted-foreground">
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
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-white/[0.08] px-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {toPersianDigits(timed.length)}
                  </span>
                  <span className="font-fa text-[10px] text-muted-foreground">{jalaliLabel}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                {timed.length === 0 ? (
                  <p className="py-3 text-center font-fa text-xs text-muted-foreground">
                    کلاسی در این روز نیست
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {timed.map(({ c }) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openClass(c.id)}
                        className="w-full rounded-xl border p-3 text-start transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                        style={{
                          borderInlineStart: `3px solid ${c.color}`,
                          background: `${c.color}0f`,
                          borderColor: `${c.color}40`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="truncate font-fa text-xs font-bold"
                            style={{ color: c.color }}
                          >
                            {c.nameFa}
                          </span>
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: c.color }}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="mt-1 flex min-w-0 items-center gap-1 font-fa text-[10px] text-foreground/70">
                          <GraduationCap
                            className="h-3 w-3 shrink-0"
                            style={{ color: c.color }}
                            aria-hidden="true"
                          />
                          <span className="truncate">استاد: {c.professor}</span>
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span
                            dir="ltr"
                            className="font-mono text-[10px] tabular-nums text-muted-foreground"
                          >
                            {c.time}
                          </span>
                          <span className="truncate font-fa text-[10px] text-muted-foreground">
                            {c.location}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* ---------- unscheduled classes ---------- */}
      {unscheduled.length > 0 && (
        <div dir="rtl" className="mt-3">
          <div className="mb-2 flex items-center gap-2">
            <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <span className="font-fa text-[11px] text-muted-foreground">
              بدون زمان‌بندی — برای جزئیات و یادداشت بزنید
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openClass(c.id)}
                className="flex max-w-full items-center gap-2 rounded-full border py-1.5 pe-3 ps-2 transition-[filter] hover:brightness-110"
                style={{ background: `${c.color}0f`, borderColor: `${c.color}40` }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden="true"
                />
                <span className="truncate font-fa text-[11px] font-bold" style={{ color: c.color }}>
                  {c.nameFa}
                </span>
                <span className="flex min-w-0 items-center gap-1 font-fa text-[10px] text-muted-foreground">
                  <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{c.professor}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* parallel-classes hint (e.g. Monday overlap) */}
      <p className="mt-3 hidden items-center gap-1.5 font-fa text-[10px] text-muted-foreground/60 xl:flex">
        <Users className="h-3 w-3" aria-hidden="true" />
        کلاس‌های هم‌زمان در ستون‌های باریک کنار هم نمایش داده می‌شوند — روی هر کلاس بزنید
      </p>
    </>
  )
}
