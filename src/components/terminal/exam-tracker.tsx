'use client'

// WEEKLY//UNI — exam & presentation tracker
// Small clickable cards (click = edit) + multiline titles (no «…» cut) + notes + Jalali calendar popup

import * as React from "react"
import { CalendarPlus, Clock3, GraduationCap, MapPin, Pencil, Plus, StickyNote, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useUni } from "@/lib/store"
import { toPersianDigits, isoToJalaliLabel, jalaliTodayISO, daysUntilISO } from "@/lib/jalali"
import { accentFor } from "@/lib/colors"
import type { UniExam } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { JalaliDatePicker } from "@/components/terminal/jalali-date"

const KIND_META: Record<UniExam["kind"], { label: string; badge: string }> = {
  exam: { label: "امتحان", badge: "border-final/40 bg-final/10 text-final" },
  presentation: { label: "ارائه", badge: "border-plasma/40 bg-plasma/10 text-plasma" },
}

function countdownLabel(days: number): { text: string; cls: string } {
  if (Number.isNaN(days)) return { text: "—", cls: "text-muted-foreground" }
  if (days > 0) return { text: `${toPersianDigits(days)} روز مانده`, cls: "text-terminal" }
  if (days === 0) return { text: "امروز!", cls: "text-amber" }
  return { text: "تمام شد", cls: "text-muted-foreground/50" }
}

function isoToUTC(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return NaN
  return Date.UTC(y, m - 1, d)
}

const WEEKDAY_FA: Record<number, string> = {
  0: "یکشنبه", 1: "دوشنبه", 2: "سه‌شنبه", 3: "چهارشنبه",
  4: "پنج‌شنبه", 5: "جمعه", 6: "شنبه",
}

function weekdayFa(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return ""
  return WEEKDAY_FA[d.getUTCDay()] ?? ""
}

/* ---------------- single exam card (click → edit) ---------------- */

function ExamCard({ exam, onEdit }: { exam: UniExam; onEdit: (ex: UniExam) => void }) {
  const classes = useUni((s) => s.classes)
  const deleteExam = useUni((s) => s.deleteExam)
  const accent = accentFor(exam.color, useTheme().resolvedTheme)
  const cls = classes.find((c) => c.id === exam.classId)
  const kind = KIND_META[exam.kind]
  const countdown = countdownLabel(daysUntilISO(exam.date))
  const notes = (exam.notes ?? "").trim()

  return (
    <div
      dir="rtl"
      role="button"
      tabIndex={0}
      aria-label={`ویرایش ${exam.title}`}
      onClick={() => onEdit(exam)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onEdit(exam)
        }
      }}
      className="glass-card group relative cursor-pointer overflow-hidden rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{ borderInlineStart: `3px solid ${exam.color}` }}
    >
      {/* top row: kind badge + edit/delete */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex rounded-full border px-2 py-0.5 font-fa text-[9px] font-bold",
            kind.badge
          )}
        >
          {kind.label}
        </span>
        {/* actions — stopPropagation so card click (edit dialog) doesn't fire */}
        <span className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label={`ویرایش ${exam.title}`}
            title="ویرایش"
            onClick={() => onEdit(exam)}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-terminal/10 hover:text-terminal"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                aria-label={`حذف ${exam.title}`}
                title="حذف"
                className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-final/10 hover:text-final"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent dir="rtl" className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-fa">حذف «{exam.title}»؟</AlertDialogTitle>
                <AlertDialogDescription className="font-fa">
                  این {kind.label} برای همیشه حذف می‌شود و قابل بازگشت نیست.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="font-fa">انصراف</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive font-fa text-white hover:bg-destructive/90"
                  onClick={() => void deleteExam(exam.id)}
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </span>
      </div>

      {/* title — wraps to 2 full lines instead of «…» truncation */}
      <p className="mt-2 line-clamp-2 break-words whitespace-normal font-fa text-sm font-bold leading-snug text-foreground">
        {exam.title}
      </p>
      <p className="mt-0.5 flex min-w-0 items-center gap-1.5 font-fa text-[10px] text-muted-foreground">
        <GraduationCap className="h-3 w-3 shrink-0" style={{ color: accent }} aria-hidden="true" />
        <span className="min-w-0 truncate">{cls ? cls.nameFa : "—"}</span>
        {cls && (
          <span dir="ltr" className="shrink-0 truncate font-mono text-[8px] opacity-60">
            {cls.name}
          </span>
        )}
      </p>

      {/* notes preview (only when a note exists) */}
      {notes && (
        <p className="mt-1.5 flex min-w-0 items-start gap-1 rounded-md bg-white/[0.03] px-1.5 py-1 text-[10px] leading-relaxed text-muted-foreground">
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber/80" aria-hidden="true" />
          <span className="line-clamp-1 break-words whitespace-normal">{notes}</span>
        </p>
      )}

      {/* divider */}
      <div className="my-2.5 h-px w-full" style={{ background: `${exam.color}26` }} />

      {/* bottom: compact Jalali date + countdown */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="font-fa text-base font-black leading-tight" style={{ color: accent }}>
            {isoToJalaliLabel(exam.date)}
          </p>
          <p className="mt-0.5 font-fa text-[9px] text-muted-foreground">
            {weekdayFa(exam.date)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            {exam.time && (
              <span className="flex items-center gap-0.5 font-fa text-[9px] text-muted-foreground">
                <Clock3 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span dir="ltr" className="font-mono tabular-nums">
                  {exam.time}
                </span>
              </span>
            )}
            {exam.location && (
              <span className="flex min-w-0 items-center gap-0.5 font-fa text-[9px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{exam.location}</span>
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 font-fa text-[10px] font-black",
            countdown.cls
          )}
        >
          {countdown.text}
        </span>
      </div>
    </div>
  )
}

/* ---------------- add / edit exam dialog ---------------- */

interface ExamFormState {
  classId: string
  title: string
  kind: UniExam["kind"]
  date: string
  time: string
  location: string
  notes: string
}

const EMPTY_FORM: ExamFormState = {
  classId: "",
  title: "",
  kind: "exam",
  date: "",
  time: "08:00",
  location: "",
  notes: "",
}

function ExamDialog({
  open,
  onOpenChange,
  exam,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** null = add mode, non-null = edit mode */
  exam: UniExam | null
}) {
  const classes = useUni((s) => s.classes)
  const addExam = useUni((s) => s.addExam)
  const updateExam = useUni((s) => s.updateExam)
  const { toast } = useToast()
  const [form, setForm] = React.useState<ExamFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = React.useState(false)
  const isEdit = exam !== null

  // prefill each time the dialog opens
  React.useEffect(() => {
    if (!open) return
    if (exam) {
      setForm({
        classId: exam.classId,
        title: exam.title,
        kind: exam.kind,
        date: exam.date,
        time: exam.time ?? "",
        location: exam.location ?? "",
        notes: exam.notes ?? "",
      })
    } else {
      setForm({
        ...EMPTY_FORM,
        classId: classes[0]?.id ?? "",
        date: jalaliTodayISO(),
      })
    }
  }, [open, exam, classes])

  const submit = React.useCallback(() => {
    if (!form.classId || !form.title.trim() || !form.date) return
    const cls = classes.find((c) => c.id === form.classId)
    const payload = {
      classId: form.classId,
      title: form.title.trim(),
      kind: form.kind,
      date: form.date,
      time: form.time,
      location: form.location.trim(),
      notes: form.notes.trim(),
    }
    setSubmitting(true)
    const done = () => {
      setSubmitting(false)
      onOpenChange(false)
      toast({
        title: isEdit ? "ذخیره شد" : "ثبت شد",
        description: `${payload.title} — ${isoToJalaliLabel(payload.date)}`,
      })
    }
    if (isEdit && exam) {
      void updateExam(exam.id, payload).finally(done)
    } else {
      void addExam({
        ...payload,
        color: cls?.color ?? (form.kind === "exam" ? "#fb7185" : "#c084fc"),
      }).finally(done)
    }
  }, [form, classes, addExam, updateExam, onOpenChange, toast, isEdit, exam])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-md rounded-2xl border-white/[0.09]">
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle className="font-fa">
            {isEdit ? "ویرایش امتحان/ارائه" : "افزودن امتحان/ارائه"}
          </DialogTitle>
          <DialogDescription className="font-fa">
            {isEdit
              ? "هر تغییری بدهید بلافاصله ذخیره می‌شود — تاریخ با تقویم شمسی."
              : "تاریخ را با تقویم جلالی انتخاب کنید — شمارش معکوس خودکار ساخته می‌شود."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pe-0.5">
          <div className="flex flex-col gap-1.5">
            <Label className="font-fa text-[11px] text-muted-foreground">درس</Label>
            <Select value={form.classId} onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}>
              <SelectTrigger className="w-full font-fa text-xs" aria-label="درس">
                <SelectValue placeholder="انتخاب درس" />
              </SelectTrigger>
              <SelectContent className="font-fa">
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: c.color }}
                        aria-hidden="true"
                      />
                      {c.nameFa}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-fa text-[11px] text-muted-foreground" htmlFor="exam-title">
              عنوان
            </Label>
            <Input
              id="exam-title"
              dir="rtl"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="مثلاً میان‌ترم ۱"
              className="font-fa text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-fa text-[11px] text-muted-foreground">نوع</Label>
            <Select
              value={form.kind}
              onValueChange={(v) => setForm((f) => ({ ...f, kind: v as UniExam["kind"] }))}
            >
              <SelectTrigger className="w-full font-fa text-xs" aria-label="نوع">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-fa">
                <SelectItem value="exam" className="text-xs">امتحان</SelectItem>
                <SelectItem value="presentation" className="text-xs">ارائه</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-fa text-[11px] text-muted-foreground">تاریخ (تقویم شمسی)</Label>
            <JalaliDatePicker
              value={form.date}
              onChange={(iso) => setForm((f) => ({ ...f, date: iso }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="font-fa text-[11px] text-muted-foreground" htmlFor="exam-time">
                ساعت
              </Label>
              <Input
                id="exam-time"
                type="time"
                dir="ltr"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="font-mono text-xs tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-fa text-[11px] text-muted-foreground" htmlFor="exam-location">
                مکان (اختیاری)
              </Label>
              <Input
                id="exam-location"
                dir="rtl"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="مثلاً خوارزمی-۲۱۵"
                className="font-fa text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-fa text-[11px] text-muted-foreground" htmlFor="exam-notes">
              توضیحات و یادداشت
            </Label>
            <Textarea
              id="exam-notes"
              dir="rtl"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="مثلاً: از استاد بپرسم نحوه امتحان گرفتن چطوریه — تشریحی یا تستی…"
              className="resize-y font-fa text-xs leading-relaxed"
            />
            <p className="font-fa text-[9px] text-muted-foreground/60">
              این یادداشت داخل کارت هم به‌صورت خلاصه نمایش داده می‌شود.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-fa">
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={!form.classId || !form.title.trim() || !form.date || submitting}
            className="font-fa"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
            {isEdit ? "ذخیره تغییرات" : "ذخیره"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ---------------- main component ---------------- */

export default function ExamTracker() {
  const exams = useUni((s) => s.exams)
  const loaded = useUni((s) => s.loaded)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<UniExam | null>(null)

  const sorted = React.useMemo(
    () => [...exams].sort((a, b) => isoToUTC(a.date) - isoToUTC(b.date)),
    [exams]
  )

  return (
    <>
      <div dir="rtl" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {!loaded ? (
          <>
            <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
            <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
            <Skeleton className="h-32 rounded-2xl bg-white/[0.03]" />
          </>
        ) : sorted.length === 0 ? (
          <div
            dir="rtl"
            className="glass-card col-span-full flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center"
          >
            <GraduationCap className="h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
            <p className="font-fa text-sm text-muted-foreground">
              هنوز امتحانی ثبت نشده — اولین امتحان یا ارائه را اضافه کنید.
            </p>
            <Button onClick={() => setAddOpen(true)} className="font-fa">
              <Plus className="h-4 w-4" aria-hidden="true" />
              افزودن امتحان/ارائه
            </Button>
          </div>
        ) : (
          <>
            {sorted.map((ex) => (
              <ExamCard key={ex.id} exam={ex} onEdit={setEditing} />
            ))}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.01] text-muted-foreground transition-colors hover:border-terminal/40 hover:text-terminal"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span className="font-fa text-xs">افزودن امتحان/ارائه</span>
            </button>
          </>
        )}
      </div>

      <ExamDialog open={addOpen} onOpenChange={setAddOpen} exam={null} />
      <ExamDialog
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null)
        }}
        exam={editing}
      />
    </>
  )
}
