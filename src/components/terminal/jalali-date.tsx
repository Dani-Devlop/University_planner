'use client'

// WEEKLY//UNI — Jalali date picker (3 shadcn Selects: day / month / year, Persian digits)

import * as React from "react"
import {
  JALALI_MONTHS,
  toPersianDigits,
  fromPersianDigits,
  isoToJalaliParts,
  jalaliPartsToISO,
  jalaliMonthLength,
  jalaliTodayISO,
} from "@/lib/jalali"
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
}

const YEAR_MIN = 1380
const YEAR_MAX = 1420

export function JalaliDatePicker({ value, onChange }: JalaliDatePickerProps) {
  const [jy, jm, jd] = React.useMemo(
    () => isoToJalaliParts(value || jalaliTodayISO()),
    [value]
  )
  const monthLen = React.useMemo(() => jalaliMonthLength(jy, jm), [jy, jm])
  const day = Math.min(jd, monthLen)

  const years = React.useMemo(() => {
    const arr: number[] = []
    for (let y = YEAR_MIN; y <= YEAR_MAX; y++) arr.push(y)
    return arr
  }, [])

  const days = React.useMemo(
    () => Array.from({ length: monthLen }, (_, i) => i + 1),
    [monthLen]
  )

  const commit = React.useCallback(
    (y: number, m: number, d: number) => {
      const len = jalaliMonthLength(y, m)
      onChange(jalaliPartsToISO(y, m, Math.min(d, len)))
    },
    [onChange]
  )

  return (
    <div dir="rtl" className="flex items-center gap-2">
      {/* روز */}
      <Select
        value={String(day)}
        onValueChange={(v) => commit(jy, jm, Number(fromPersianDigits(v)))}
      >
        <SelectTrigger
          size="sm"
          aria-label="روز"
          className="w-[4.25rem] font-fa text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60 font-fa">
          {days.map((d) => (
            <SelectItem key={d} value={String(d)} className="text-xs">
              {toPersianDigits(d)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ماه */}
      <Select
        value={String(jm)}
        onValueChange={(v) => commit(jy, Number(v), jd)}
      >
        <SelectTrigger
          size="sm"
          aria-label="ماه"
          className="min-w-[6.5rem] font-fa text-xs"
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

      {/* سال */}
      <Select
        value={String(jy)}
        onValueChange={(v) => commit(Number(v), jm, jd)}
      >
        <SelectTrigger
          size="sm"
          aria-label="سال"
          className="w-[5.5rem] font-fa text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60 font-fa">
          {years.map((y) => (
            <SelectItem key={y} value={String(y)} className="text-xs">
              {toPersianDigits(y)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default JalaliDatePicker
