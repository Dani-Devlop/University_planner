"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarClock,
  Loader2,
  MapPin,
  Timer,
  BookOpenCheck,
  Presentation,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { useUni, emptyDraft, type ExamDraft } from "@/lib/store";
import type { Exam, ExamKind, UniClass } from "@/lib/types";
import { formatJalaliEventDate, toFaDigits } from "@/lib/jalali";
import { JalaliDatePicker } from "@/components/terminal/jalali-date";
import { classColor } from "@/components/terminal/schedule-grid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const KIND_META: Record<
  ExamKind,
  { label: string; fa: string; color: string; icon: React.ReactNode }
> = {
  midterm: {
    label: "MIDTERM",
    fa: "میان‌ترم",
    color: "#22d3ee",
    icon: <BookOpenCheck className="h-3 w-3" aria-hidden />,
  },
  final: {
    label: "FINAL",
    fa: "پایان‌ترم",
    color: "#fb7185",
    icon: <Flag className="h-3 w-3" aria-hidden />,
  },
  presentation: {
    label: "PRESENTATION",
    fa: "ارائه",
    color: "#fbbf24",
    icon: <Presentation className="h-3 w-3" aria-hidden />,
  },
};

function countdown(dateISO: string): { text: string; fa: string; urgent: boolean; past: boolean } {
  const d = differenceInCalendarDays(parseISO(dateISO), new Date());
  if (d < 0) return { text: `${-d}d ago`, fa: `${toFaDigits(-d)} روز پیش`, urgent: false, past: true };
  if (d === 0) return { text: "TODAY", fa: "امروز!", urgent: true, past: false };
  if (d === 1) return { text: "1d left", fa: "فردا", urgent: true, past: false };
  if (d <= 3) return { text: `${d}d left`, fa: `${toFaDigits(d)} روز مانده`, urgent: true, past: false };
  return { text: `${d}d left`, fa: `${toFaDigits(d)} روز مانده`, urgent: false, past: false };
}

export function ExamTracker() {
  const exams = useUni((s) => s.exams);
  const classes = useUni((s) => s.classes);
  const setExamDialog = useUni((s) => s.setExamDialog);
  const deleteExam = useUni((s) => s.deleteExam);

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...exams].sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
      ),
    [exams]
  );

  const upcoming = sorted.filter((e) => differenceInCalendarDays(parseISO(e.date), new Date()) >= 0);
  const past = sorted.filter((e) => differenceInCalendarDays(parseISO(e.date), new Date()) < 0);

  const confirmTarget = exams.find((e) => e.id === confirmId);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <span dir="rtl" className="font-fa">
            {upcoming.length > 0
              ? `${upcoming.length} رویداد پیش‌رو`
              : "هنوز رویدادی ثبت نشده"}
          </span>
          <span className="font-mono text-muted-foreground/50">· sorted by date</span>
        </p>
        <Button
          size="sm"
          onClick={() => setExamDialog(true, null)}
          className="gap-1.5 rounded-full bg-terminal font-semibold text-black hover:bg-terminal/85"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          <span dir="rtl" className="font-fa">افزودن رویداد</span>
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] p-10 text-center">
          <CalendarClock className="mx-auto mb-3 h-9 w-9 text-terminal/40" aria-hidden />
          <p dir="rtl" className="font-fa text-sm text-muted-foreground">
            هنوز امتحان یا ارائه‌ای ثبت نشده است
          </p>
          <p dir="rtl" className="mt-1 font-fa text-xs text-muted-foreground/60">
            با دکمه‌ی بالا یا <kbd className="rounded border border-terminal/30 px-1 font-mono text-terminal" dir="ltr">⌘K</kbd> اضافه کنید
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {upcoming.map((exam, i) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              index={i}
              onEdit={() => setExamDialog(true, exam.id)}
              onDelete={() => setConfirmId(exam.id)}
              classes={classes}
            />
          ))}
        </AnimatePresence>
      </div>

      {past.length > 0 && (
        <div className="mt-6">
          <h4 dir="rtl" className="mb-2 font-fa text-[11px] text-muted-foreground/50">
            گذشته‌ها
          </h4>
          <div className="grid gap-3 opacity-50 md:grid-cols-2 xl:grid-cols-3">
            {past.map((exam, i) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                index={i}
                onEdit={() => setExamDialog(true, exam.id)}
                onDelete={() => setConfirmId(exam.id)}
                classes={classes}
              />
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="border-white/[0.1] bg-popover/95 backdrop-blur-2xl sm:rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle dir="rtl" className="font-fa">
              حذف «{confirmTarget?.title}»؟
            </AlertDialogTitle>
            <AlertDialogDescription dir="rtl" className="font-fa text-xs">
              این رویداد برای همیشه از دیتابیس حذف می‌شود و قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-red-500/90 text-white hover:bg-red-500"
              onClick={() => {
                if (confirmId) {
                  deleteExam(confirmId);
                  toast.success("رویداد حذف شد");
                }
                setConfirmId(null);
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExamCard({
  exam,
  index,
  onEdit,
  onDelete,
  classes,
}: {
  exam: Exam;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  classes: UniClass[];
}) {
  const meta = KIND_META[exam.kind];
  const cd = countdown(exam.date);
  const linked = classes.find((c) => c.id === exam.classId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      style={
        {
          "--c": meta.color,
          borderColor: "rgba(255,255,255,0.08)",
          background: `linear-gradient(165deg, ${meta.color}12, rgba(255,255,255,0.015) 45%)`,
        } as React.CSSProperties
      }
      className="group relative rounded-2xl border p-4 transition-shadow hover:border-[var(--c)]/40 hover:shadow-[0_12px_36px_var(--c)]/25"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              style={{ borderColor: `${meta.color}55`, color: meta.color }}
              className="gap-1 rounded-full bg-transparent font-mono text-[9px] font-bold tracking-wider"
            >
              {meta.icon} {meta.fa}
            </Badge>
            {!cd.past && (
              <span
                dir="rtl"
                className={`flex items-center gap-1 font-fa text-[11px] font-bold ${
                  cd.urgent ? "animate-pulse text-red-400" : "text-terminal/85"
                }`}
              >
                <Timer className="h-3 w-3" aria-hidden /> {cd.fa}
              </span>
            )}
          </div>
          <h4 dir="rtl" className="mt-2 truncate text-right font-fa text-sm font-bold text-foreground">{exam.title}</h4>
          <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
            <div dir="rtl" className="flex items-center gap-1.5 font-fa">
              <CalendarClock className="h-3 w-3 shrink-0" style={{ color: meta.color }} aria-hidden />
              <span className="text-foreground/85">{formatJalaliEventDate(exam.date)}</span>
              {exam.time && (
                <span className="font-mono tabular-nums" dir="ltr" style={{ color: meta.color }}>
                  · {toFaDigits(exam.time)}
                </span>
              )}
            </div>
            {exam.location && (
              <div dir="rtl" className="flex items-center gap-1.5 font-fa">
                <MapPin className="h-3 w-3 shrink-0" style={{ color: meta.color }} aria-hidden />
                {exam.location}
              </div>
            )}
            {linked && (
              <div dir="rtl" className="flex items-center gap-1.5 font-fa" style={{ color: classColor(linked) }}>
                ↳ درس: {linked.name}
              </div>
            )}
          </div>
          {exam.note && (
            <p dir="rtl" className="mt-2 line-clamp-2 border-r-2 border-white/10 pr-2 text-[11px] italic text-muted-foreground/80 font-fa">
              {exam.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            className="h-7 w-7 rounded-full hover:bg-white/[0.08] hover:text-foreground"
            aria-label={`Edit ${exam.title}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 rounded-full hover:bg-red-500/15 hover:text-red-400"
            aria-label={`Delete ${exam.title}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function ExamDialog() {
  const open = useUni((s) => s.examDialogOpen);
  const setExamDialog = useUni((s) => s.setExamDialog);
  const editingExamId = useUni((s) => s.editingExamId);
  const exams = useUni((s) => s.exams);
  const classes = useUni((s) => s.classes);
  const addExam = useUni((s) => s.addExam);
  const updateExam = useUni((s) => s.updateExam);

  const [draft, setDraft] = useState<ExamDraft>(emptyDraft);
  const [busy, setBusy] = useState(false);
  const editing = exams.find((e) => e.id === editingExamId) ?? null;

  useEffect(() => {
    if (open) {
      setDraft(
        editing
          ? {
              title: editing.title,
              kind: editing.kind,
              classId: editing.classId ?? "",
              date: editing.date,
              time: editing.time,
              location: editing.location,
              note: editing.note,
            }
          : emptyDraft
      );
    }
  }, [open, editingExamId]);

  const valid = draft.title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(draft.date);

  async function submit() {
    setBusy(true);
    try {
      const ok = editingExamId ? await updateExam(editingExamId, draft) : await addExam(draft);
      if (ok) {
        toast.success(editingExamId ? "رویداد به‌روزرسانی شد" : "رویداد اضافه شد");
        setExamDialog(false);
      } else {
        toast.error("خطای اعتبارسنجی سرور");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setExamDialog}>
      <DialogContent className="max-w-md border-white/[0.1] bg-popover/95 backdrop-blur-2xl sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle dir="rtl" className="font-fa">
            {editing ? "ویرایش رویداد" : "رویداد جدید"}
          </DialogTitle>
          <DialogDescription dir="rtl" className="font-fa text-xs text-muted-foreground">
            امتحان، میان‌ترم یا ارائه را به تقویم اضافه کنید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ex-title" dir="rtl" className="font-fa text-xs text-muted-foreground">عنوان *</Label>
            <Input
              id="ex-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="میان‌ترم ساختمان داده‌ها"
              className="rounded-xl border-white/[0.09] bg-black/40 font-fa focus-visible:ring-terminal/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label dir="rtl" className="font-fa text-xs text-muted-foreground">نوع</Label>
              <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as ExamKind })}>
                <SelectTrigger className="rounded-xl border-white/[0.09] bg-black/40 text-xs focus:ring-terminal/40">
                  <SelectValue placeholder="نوع" />
                </SelectTrigger>
                <SelectContent className="border-white/[0.1] bg-popover">
                  <SelectItem value="midterm" dir="rtl" className="font-fa">میان‌ترم</SelectItem>
                  <SelectItem value="final" dir="rtl" className="font-fa">پایان‌ترم</SelectItem>
                  <SelectItem value="presentation" dir="rtl" className="font-fa">ارائه</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label dir="rtl" className="font-fa text-xs text-muted-foreground">تاریخ شمسی *</Label>
              <JalaliDatePicker
                value={draft.date}
                onChange={(iso) => setDraft({ ...draft, date: iso })}
                invalid={!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-time" dir="rtl" className="font-fa text-xs text-muted-foreground">ساعت</Label>
              <Input
                id="ex-time"
                type="time"
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                className="rounded-xl border-white/[0.09] bg-black/40 font-mono text-xs focus-visible:ring-terminal/40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-loc" dir="rtl" className="font-fa text-xs text-muted-foreground">محل</Label>
              <Input
                id="ex-loc"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="خوارزمی-۲۱۵"
                className="rounded-xl border-white/[0.09] bg-black/40 font-fa text-xs focus-visible:ring-terminal/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label dir="rtl" className="font-fa text-xs text-muted-foreground">درس مرتبط</Label>
            <Select value={draft.classId || "none"} onValueChange={(v) => setDraft({ ...draft, classId: v === "none" ? "" : v })}>
              <SelectTrigger className="rounded-xl border-white/[0.09] bg-black/40 text-xs focus:ring-terminal/40">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent className="border-white/[0.1] bg-popover">
                <SelectItem value="none" dir="rtl" className="font-fa">— بدون درس —</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id} dir="rtl">
                    <span className="font-fa text-xs">{c.nameFa || c.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-note" dir="rtl" className="font-fa text-xs text-muted-foreground">یادداشت</Label>
            <Textarea
              id="ex-note"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              placeholder="فصل‌های ۱ تا ۴، بدون کتاب…"
              className="min-h-[60px] rounded-xl border-white/[0.09] bg-black/40 font-fa text-xs focus-visible:ring-terminal/40"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setExamDialog(false)} className="rounded-full font-fa">
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || busy}
            className="gap-1.5 rounded-full bg-terminal font-semibold text-black hover:bg-terminal/85"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            <span dir="rtl" className="font-fa">{editing ? "ذخیره تغییرات" : "افزودن"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
