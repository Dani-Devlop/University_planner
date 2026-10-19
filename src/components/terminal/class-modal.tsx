'use client'

// WEEKLY//UNI — class details modal (info rows + debounced note autosave + prev/next)

import * as React from "react"
import { ChevronLeft, ChevronRight, GraduationCap, MapPin, Save } from "lucide-react"
import { useUni } from "@/lib/store"
import { toPersianDigits } from "@/lib/jalali"
import type { UniClass } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const DAY_NAMES_FA: Record<string, string> = {
  Saturday: "شنبه",
  Sunday: "یکشنبه",
  Monday: "دوشنبه",
  Tuesday: "سه‌شنبه",
  Wednesday: "چهارشنبه",
  Thursday: "پنج‌شنبه",
  Unscheduled: "بدون زمان‌بندی",
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="shrink-0 font-fa text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-start font-fa text-xs text-foreground">{children}</span>
    </div>
  )
}

function classTimeFa(c: UniClass): React.ReactNode {
  const day = DAY_NAMES_FA[c.day] ?? c.day
  if (!c.time || c.time === "N/A") return day
  return (
    <>
      {day}
      <span dir="ltr" className="ms-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
        {c.time}
      </span>
    </>
  )
}

export default function ClassModal() {
  const activeClassId = useUni((s) => s.activeClassId)
  const classes = useUni((s) => s.classes)
  const notes = useUni((s) => s.notes)
  const openClass = useUni((s) => s.openClass)
  const setNote = useUni((s) => s.setNote)
  const { toast } = useToast()

  const active = React.useMemo(
    () => classes.find((c) => c.id === activeClassId) ?? null,
    [classes, activeClassId]
  )
  const index = classes.findIndex((c) => c.id === activeClassId)

  /* note draft — reload only when switching to another class */
  const [text, setText] = React.useState("")
  const lastIdRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (activeClassId && activeClassId !== lastIdRef.current) {
      lastIdRef.current = activeClassId
      setText(useUni.getState().notes[activeClassId] ?? "")
    }
    if (!activeClassId) lastIdRef.current = null
  }, [activeClassId, notes])

  /* debounced autosave (800ms) */
  React.useEffect(() => {
    if (!activeClassId) return
    const t = window.setTimeout(() => {
      const current = useUni.getState().notes[activeClassId] ?? ""
      if (current !== text) void setNote(activeClassId, text)
    }, 800)
    return () => window.clearTimeout(t)
  }, [text, activeClassId, setNote])

  const saveNow = React.useCallback(() => {
    if (!activeClassId) return
    void setNote(activeClassId, text)
    toast({
      title: "یادداشت ذخیره شد",
      description: active ? active.nameFa : undefined,
    })
  }, [activeClassId, text, setNote, toast, active])

  const open = activeClassId !== null && active !== null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) openClass(null) }}>
      <DialogContent dir="rtl" className="max-w-md rounded-2xl border-white/[0.09]">
        {active && (
          <>
            <DialogHeader className="text-start sm:text-start">
              <div className="flex items-center gap-2.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: active.color, boxShadow: `0 0 12px ${active.color}80` }}
                  aria-hidden="true"
                />
                <DialogTitle className="font-fa text-base text-foreground">{active.nameFa}</DialogTitle>
              </div>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2">
                  <span dir="ltr" className="font-mono text-[11px] text-muted-foreground">
                    {active.name}
                  </span>
                  <span
                    dir="ltr"
                    className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9px] tabular-nums text-muted-foreground/70"
                  >
                    {active.code}
                  </span>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <InfoRow label="استاد">
                <span className="flex items-center gap-1">
                  <GraduationCap
                    className="h-3 w-3 shrink-0"
                    style={{ color: active.color }}
                    aria-hidden="true"
                  />
                  {active.professor}
                </span>
              </InfoRow>
              <InfoRow label="زمان">{classTimeFa(active)}</InfoRow>
              <InfoRow label="مکان">
                {active.location && active.location !== "N/A" ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {active.location}
                  </span>
                ) : (
                  "—"
                )}
              </InfoRow>
              <InfoRow label="واحد/نوع">
                <span dir="ltr" className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {active.type}
                </span>
              </InfoRow>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="font-fa text-[11px] text-muted-foreground">
                یادداشت — خودکار ذخیره می‌شود
              </span>
              <Textarea
                dir="rtl"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="یادداشت این کلاس… (کتاب، جزوه، نکات استاد)"
                className="min-h-24 resize-y font-fa text-xs leading-relaxed"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-fa text-[9px] text-muted-foreground/60">
                  ذخیره‌ی خودکار ۰٫۸ ثانیه پس از تایپ
                </span>
                <Button size="sm" onClick={saveNow} className="font-fa">
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  ذخیره یادداشت
                </Button>
              </div>
            </div>

            {/* prev / next navigation */}
            {classes.length > 1 && (
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index <= 0}
                  onClick={() => openClass(classes[index - 1].id)}
                  className="font-fa text-xs"
                >
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  قبلی
                </Button>
                <span className="font-fa text-[10px] tabular-nums text-muted-foreground">
                  {toPersianDigits(index + 1)} از {toPersianDigits(classes.length)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={index >= classes.length - 1}
                  onClick={() => openClass(classes[index + 1].id)}
                  className="font-fa text-xs"
                >
                  بعدی
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
