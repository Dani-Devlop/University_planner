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
} from "lucide-react";
import { toast } from "sonner";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { useUni, emptyDraft, type ExamDraft } from "@/lib/store";
import type { Exam, ExamKind } from "@/lib/types";
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

const KIND_META: Record<ExamKind, { label: string; color: string; badge: string }> = {
  midterm: { label: "MIDTERM", color: "#00e5ff", badge: "border-cyber/40 text-cyber" },
  final: { label: "FINAL", color: "#ff2d78", badge: "border-final/40 text-final" },
  presentation: { label: "PRESENTATION", color: "#ffd166", badge: "border-amber/40 text-amber" },
};

function countdown(dateISO: string): { text: string; urgent: boolean; past: boolean } {
  const d = differenceInCalendarDays(parseISO(dateISO), new Date());
  if (d < 0) return { text: `${-d}d ago`, urgent: false, past: true };
  if (d === 0) return { text: "TODAY", urgent: true, past: false };
  if (d <= 3) return { text: `${d}d left`, urgent: true, past: false };
  return { text: `${d}d left`, urgent: false, past: false };
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
        <p className="font-mono text-xs text-muted-foreground">
          $ cat ~/exams/*.md | sort -u <span className="text-terminal">→</span> {upcoming.length} upcoming
        </p>
        <Button
          size="sm"
          onClick={() => setExamDialog(true, null)}
          className="gap-1.5 bg-terminal font-mono text-xs font-bold text-black hover:bg-terminal/85"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> add_exam
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-lg border border-dashed border-terminal/20 bg-white/[0.02] p-10 text-center">
          <CalendarClock className="mx-auto mb-3 h-8 w-8 text-terminal/40" aria-hidden />
          <p className="font-mono text-sm text-muted-foreground">
            no assessments tracked yet
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground/60">
            press <kbd className="rounded border border-terminal/30 px-1 font-mono text-terminal">⌘K</kbd> → “add exam”
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {upcoming.map((exam, i) => (
            <ExamCard key={exam.id} exam={exam} index={i} onEdit={() => setExamDialog(true, exam.id)} onDelete={() => setConfirmId(exam.id)} classNameFor={KIND_META} classes={classes} />
          ))}
        </AnimatePresence>
      </div>

      {past.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
            {"// archived"}
          </h4>
          <div className="grid gap-3 opacity-50 md:grid-cols-2 xl:grid-cols-3">
            {past.map((exam, i) => (
              <ExamCard key={exam.id} exam={exam} index={i} onEdit={() => setExamDialog(true, exam.id)} onDelete={() => setConfirmId(exam.id)} classNameFor={KIND_META} classes={classes} />
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="border-terminal/30 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">rm ~/exams/{confirmTarget?.title}</AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-xs">
              This permanently deletes the assessment entry from db.json.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono">cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/90 font-mono text-white hover:bg-red-500"
              onClick={() => {
                if (confirmId) {
                  deleteExam(confirmId);
                  toast.success("entry removed from db.json");
                }
                setConfirmId(null);
              }}
            >
              delete
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
  classes: { id: string; name: string }[];
  classNameFor: Record<ExamKind, { label: string; color: string; badge: string }>;
}) {
  const meta = KIND_META[exam.kind];
  const cd = countdown(exam.date);
  const clsName = classes.find((c) => c.id === exam.classId)?.name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -3 }}
      style={{ borderTopColor: meta.color }}
      className="glass-card group relative rounded-lg border-t-2 p-4 transition-shadow hover:shadow-[0_0_24px_rgba(0,255,65,0.25)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`font-mono text-[9px] font-bold tracking-wider ${meta.badge}`}>
              {meta.label}
            </Badge>
            {!cd.past && (
              <span
                className={`flex items-center gap-1 font-mono text-[10px] font-bold ${
                  cd.urgent ? "animate-pulse text-red-400" : "text-terminal/80"
                }`}
              >
                <Timer className="h-3 w-3" aria-hidden /> {cd.text}
              </span>
            )}
          </div>
          <h4 className="mt-2 truncate font-mono text-sm font-bold text-foreground group-hover:text-terminal">
            {exam.title}
          </h4>
          <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3 text-terminal/60" aria-hidden />
              {format(parseISO(exam.date), "EEE dd MMM yyyy")}
              {exam.time && <span className="text-terminal/70">· {exam.time}</span>}
            </div>
            {exam.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-terminal/60" aria-hidden /> {exam.location}
              </div>
            )}
            {clsName && <div className="text-cyber/80">↳ {clsName}</div>}
          </div>
          {exam.note && (
            <p className="mt-2 line-clamp-2 border-l border-terminal/30 pl-2 text-[11px] italic text-muted-foreground/80">
              {exam.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            className="h-7 w-7 hover:bg-terminal/15 hover:text-terminal"
            aria-label={`Edit ${exam.title}`}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            className="h-7 w-7 hover:bg-red-500/15 hover:text-red-400"
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
        toast.success(editingExamId ? "exam updated" : "exam added to db.json");
        setExamDialog(false);
      } else {
        toast.error("validation failed on server");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setExamDialog}>
      <DialogContent className="max-w-md border-terminal/30 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-mono">
            <span className="text-terminal">$</span> {editing ? "edit_assessment" : "new_assessment"}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {editing ? `--patch ${editing.id}` : "--method POST ~/exams/"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ex-title" className="font-mono text-xs text-muted-foreground">TITLE *</Label>
            <Input
              id="ex-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Data Structures — Midterm"
              className="border-terminal/25 bg-black/40 font-mono focus-visible:ring-terminal/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs text-muted-foreground">KIND</Label>
              <Select value={draft.kind} onValueChange={(v) => setDraft({ ...draft, kind: v as ExamKind })}>
                <SelectTrigger className="border-terminal/25 bg-black/40 font-mono text-xs focus:ring-terminal/50">
                  <SelectValue placeholder="kind" />
                </SelectTrigger>
                <SelectContent className="border-terminal/30 bg-background font-mono">
                  <SelectItem value="midterm">MIDTERM</SelectItem>
                  <SelectItem value="final">FINAL</SelectItem>
                  <SelectItem value="presentation">PRESENTATION</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-date" className="font-mono text-xs text-muted-foreground">DATE *</Label>
              <Input
                id="ex-date"
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className="border-terminal/25 bg-black/40 font-mono text-xs focus-visible:ring-terminal/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ex-time" className="font-mono text-xs text-muted-foreground">TIME</Label>
              <Input
                id="ex-time"
                type="time"
                value={draft.time}
                onChange={(e) => setDraft({ ...draft, time: e.target.value })}
                className="border-terminal/25 bg-black/40 font-mono text-xs focus-visible:ring-terminal/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ex-loc" className="font-mono text-xs text-muted-foreground">LOCATION</Label>
              <Input
                id="ex-loc"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Khwarizmi-215"
                className="border-terminal/25 bg-black/40 font-mono text-xs focus-visible:ring-terminal/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-xs text-muted-foreground">LINKED CLASS</Label>
            <Select value={draft.classId || "none"} onValueChange={(v) => setDraft({ ...draft, classId: v === "none" ? "" : v })}>
              <SelectTrigger className="border-terminal/25 bg-black/40 font-mono text-xs focus:ring-terminal/50">
                <SelectValue placeholder="none" />
              </SelectTrigger>
              <SelectContent className="border-terminal/30 bg-background font-mono">
                <SelectItem value="none">— none —</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ex-note" className="font-mono text-xs text-muted-foreground">NOTE</Label>
            <Textarea
              id="ex-note"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              placeholder="chapters 1-4, closed book…"
              className="min-h-[60px] border-terminal/25 bg-black/40 font-mono text-xs focus-visible:ring-terminal/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setExamDialog(false)} className="font-mono text-xs">
            cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!valid || busy}
            className="gap-1.5 bg-terminal font-mono text-xs font-bold text-black hover:bg-terminal/85"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {editing ? "patch" : "create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
