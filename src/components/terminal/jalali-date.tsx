'use client'

// WEEKLY//UNI — Jalali calendar popup date picker (Persian edition of <input type="date">)
// Grid: شنبه-first week, Persian digits, month/year dropdowns + ‹ › nav, «امروز» chip

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  JALALI_MONTHS,
  toPersianDigits,
  isoToJalaliParts,
  isoToJalaliLabel,
  jalaliPartsToISO,
  jalaliMonthLength,
  jalaliToGregorian,
  jalaliToday,
  jalaliTodayISO,
} from "@/lib/jalali"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface JalaliDatePickerProps {
  /** ISO gregorian date, "YYYY-MM-DD" */
  value: string
  onChange: (iso: string) => void
  className?: string
}

const YEAR_MIN = 1380
const YEAR_MAX = 1420

/** Persian weekday letters, شنبه → جمعه */
const WEEKDAY_LETTERS = ["ش", "ی", "د", "س", "چ", "پ", "ج"]

/** Jalali (jy, jm, 1) → grid column index where 0 = شنبه */
function firstDayColumn(jy: number, jm: number): number {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1)
  const utcDay = new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay() // Sunday=0 … Saturday=6
  return (utcDay + 1) % 7 // شنبه→0, یکشنبه→1, …, جمعه→6
}

const YEARS = (() => {
  const arr: number[] = []
  for (let y = YEAR_MIN; y <= YEAR_MAX; y++) arr.push(y)
  return arr
})()

export function JalaliDatePicker({ value, onChange, className }: JalaliDatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // selected (or today when empty)
  const [selY, selM, selD] = React.useMemo(
    () => isoToJalaliParts(value || jalaliTodayISO()),
    [value]
  )

  // visible month/year inside the popup (independent until a day is picked)
  const [view, setView] = React.useState({ y: selY, m: selM })
  React.useEffect(() => {
    if (open) setView({ y: selY, m: selM })
  }, [open, selY, selM])

  const monthLen = React.useMemo(() => jalaliMonthLength(view.y, view.m), [view.y, view.m])
  const lead = React.useMemo(() => firstDayColumn(view.y, view.m), [view.y, view.m])

  const today = React.useMemo(() => jalaliToday(), [])

  const shiftMonth = React.useCallback((delta: number) => {
    setView((v) => {
      let m = v.m + delta
      let y = v.y
      if (m < 1) { m = 12; y -= 1 }
      if (m > 12) { m = 1; y += 1 }
      return { y, m }
    })
  }, [])

  const pick = React.useCallback(
    (d: number) => {
      onChange(jalaliPartsToISO(view.y, view.m, d))
      setOpen(false)
    },
    [onChange, view.y, view.m]
  )

  const goToday = React.useCallback(() => {
    const iso = jalaliTodayISO()
    onChange(iso)
    const [ty, tm] = isoToJalaliParts(iso)
    setView({ y: ty, m: tm })
    setOpen(false)
  }, [onChange])

  const isToday = (d: number) =>
    today[0] === view.y && today[1] === view.m && today[2] === d

  const isSelected = (d: number) =>
    value && selY === view.y && selM === view.m && selD === d

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          dir="rtl"
          aria-label="انتخاب تاریخ (تقویم شمسی)"
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-white/[0.10] bg-white/[0.03] px-3 text-start transition-colors hover:border-terminal/40 hover:bg-terminal/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
            className
          )}
        >
          <span
            className={cn(
              "truncate font-fa text-xs",
              value ? "text-foreground" : "text-muted-foreground/70"
            )}
          >
            {value ? isoToJalaliLabel(value) : "انتخاب تاریخ…"}
          </span>
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-terminal" aria-hidden="true" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        dir="rtl"
        align="start"
        sideOffset={6}
        className="w-[17.5rem] rounded-xl border-white/[0.09] bg-popover/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        {/* header: nav + month/year selects */}
        <div className="mb-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="ماه بعد"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            <Select
              value={String(view.m)}
              onValueChange={(v) => setView((s) => ({ ...s, m: Number(v) }))}
            >
              <SelectTrigger
                size="sm"
                aria-label="ماه"
                className="h-7 w-[5.75rem] font-fa text-[11px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 font-fa">
                {JALALI_MONTHS.map((m, i) => (
                  <SelectItem key={m} value={String(i + 1)} className="text-xs">
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(view.y)}
              onValueChange={(v) => setView((s) => ({ ...s, y: Number(v) }))}
            >
              <SelectTrigger
                size="sm"
                aria-label="سال"
                className="h-7 w-[4.5rem] font-fa text-[11px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 font-fa">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {toPersianDigits(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="ماه قبل"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* weekday letters */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LETTERS.map((w, i) => (
            <span
              key={w}
              className={cn(
                "flex h-5 items-center justify-center font-fa text-[9px] font-bold",
                i === 6 ? "text-red-400/80" : "text-muted-foreground/70"
              )}
            >
              {w}
            </span>
          ))}
        </div>

        {/* day grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: monthLen }, (_, i) => {
            const d = i + 1
            const friday = (lead + i) % 7 === 6
            const selected = isSelected(d)
            const todayMark = isToday(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => pick(d)}
                aria-label={`${toPersianDigits(d)} ${JALALI_MONTHS[view.m - 1]}`}
                aria-current={todayMark ? "date" : undefined}
                className={cn(
                  "flex h-7.5 w-full items-center justify-center rounded-md font-fa text-[11px] tabular-nums transition-colors",
                  friday ? "text-red-400/80" : "text-foreground/85",
                  !selected && "hover:bg-terminal/15 hover:text-terminal",
                  todayMark && !selected && "ring-1 ring-inset ring-terminal/60 text-terminal",
                  selected && "bg-terminal font-bold text-background hover:bg-terminal/90"
                )}
              >
                {toPersianDigits(d)}
              </button>
            )
          })}
        </div>

        {/* footer */}
        <div className="mt-2 flex items-center justify-between border-t border-white/[0.06] pt-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md px-2 py-1 font-fa text-[10px] font-bold text-terminal transition-colors hover:bg-terminal/10"
          >
            امروز
          </button>
          <span className="font-fa text-[9px] text-muted-foreground/60">
            تقویم هجری شمسی
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default JalaliDatePicker
