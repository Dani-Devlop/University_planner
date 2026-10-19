"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import {
  JALALI_MONTHS_FA,
  jalaaliMonthLength,
  isoToJalali,
  jalaliToISO,
  todayJalali,
  isoWeekdayFa,
  isoToDate,
  toFaDigits,
} from "@/lib/jalali";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  /** Gregorian ISO "YYYY-MM-DD" (stored value) */
  value: string;
  onChange: (iso: string) => void;
  invalid?: boolean;
}

/**
 * Shamsi (Jalali) date picker — three selects, right-to-left: روز / ماه / سال.
 * Fully controlled: derives Jalali parts from the stored Gregorian ISO value.
 */
export function JalaliDatePicker({ value, onChange, invalid = false }: Props) {
  const parsed = useMemo(() => isoToJalali(value), [value]);
  const today = useMemo(() => todayJalali(), []);

  const jy = parsed?.jy ?? today.jy;
  const jm = parsed?.jm ?? today.jm;
  const jd = parsed?.jd ?? today.jd;

  const monthLen = jalaaliMonthLength(jy, jm);
  const day = Math.min(jd, monthLen);

  const iso = jalaliToISO(jy, jm, day);
  const weekdayFa = isoWeekdayFa(iso);
  const greg = isoToDate(iso);
  const gregFa = greg
    ? greg.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = today.jy - 1; y <= today.jy + 2; y++) list.push(y);
    return list;
  }, [today.jy]);

  function commit(ny: number, nm: number, nd: number): void {
    const len = jalaaliMonthLength(ny, nm);
    const d = Math.min(nd, len);
    onChange(jalaliToISO(ny, nm, d));
  }

  const triggerCls =
    "h-8 rounded-xl border-white/[0.09] bg-black/40 text-xs font-fa focus:ring-terminal/40";

  return (
    <div dir="rtl" className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {/* روز */}
        <Select
          value={String(day)}
          onValueChange={(v) => commit(jy, jm, Number(v))}
        >
          <SelectTrigger aria-label="روز" className={`${triggerCls} w-[4.5rem] ${invalid ? "border-red-500/60" : ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56 border-white/[0.1] bg-popover">
            {Array.from({ length: monthLen }, (_, i) => i + 1).map((d) => (
              <SelectItem key={d} value={String(d)} className="font-fa text-xs">
                {toFaDigits(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ماه */}
        <Select
          value={String(jm)}
          onValueChange={(v) => commit(jy, Number(v), jd)}
        >
          <SelectTrigger aria-label="ماه" className={`${triggerCls} flex-1 ${invalid ? "border-red-500/60" : ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.1] bg-popover">
            {JALALI_MONTHS_FA.map((name, i) => (
              <SelectItem key={name} value={String(i + 1)} className="font-fa text-xs">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* سال */}
        <Select
          value={String(jy)}
          onValueChange={(v) => commit(Number(v), jm, jd)}
        >
          <SelectTrigger aria-label="سال" className={`${triggerCls} w-[5.5rem] ${invalid ? "border-red-500/60" : ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.1] bg-popover">
            {years.map((y) => (
              <SelectItem key={y} value={String(y)} className="font-fa text-xs">
                {toFaDigits(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
        <CalendarDays className="h-3 w-3 shrink-0 text-terminal/60" aria-hidden />
        <span>
          {weekdayFa} {toFaDigits(day)} {JALALI_MONTHS_FA[jm - 1]} {toFaDigits(jy)}
        </span>
        <span className="font-mono" dir="ltr">
          ({gregFa})
        </span>
      </p>
    </div>
  );
}
