"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import {
  MapPin,
  User,
  Clock,
  Hash,
  CalendarDays,
  Save,
  Loader2,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useUni } from "@/lib/store";
import { dayFa, classColor } from "@/components/terminal/schedule-grid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ClassModal() {
  const selectedClassId = useUni((s) => s.selectedClassId);
  const selectClass = useUni((s) => s.selectClass);
  const classes = useUni((s) => s.classes);
  const notes = useUni((s) => s.notes);
  const exams = useUni((s) => s.exams);
  const saveNote = useUni((s) => s.saveNote);

  const cls = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );

  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (selectedClassId) {
      setDraft(notes[selectedClassId] ?? "");
      setDirty(false);
    }
  }, [selectedClassId]);

  const classExams = exams.filter((e) => e.classId === selectedClassId);
  const color = cls ? classColor(cls) : "#00ff41";

  async function handleSave() {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      await saveNote(selectedClassId, draft);
      setDirty(false);
      toast.success("یادداشت ذخیره شد", {
        description: `${cls?.name ?? ""} · notes.md → db.json`,
      });
    } catch {
      toast.error("ذخیره ناموفق بود — دوباره تلاش کنید");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!selectedClassId} onOpenChange={(o) => !o && selectClass(null)}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-white/[0.1] bg-popover/95 backdrop-blur-2xl sm:rounded-2xl">
        {cls && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2.5 text-lg">
                <span
                  className="h-8 w-1.5 rounded-full"
                  style={{ background: color, boxShadow: `0 0 16px ${color}70` }}
                  aria-hidden
                />
                <span>{cls.name}</span>
                {cls.nameFa && (
                  <span dir="rtl" className="font-fa text-sm font-medium text-muted-foreground">
                    {cls.nameFa}
                  </span>
                )}
                <Badge
                  variant="outline"
                  className="rounded-full border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted-foreground"
                >
                  {cls.type} units
                </Badge>
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span dir="rtl" className="font-fa">{dayFa(cls.day)}</span>
                {cls.time !== "N/A" && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="font-mono tabular-nums">{cls.time}</span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { icon: <User className="h-3.5 w-3.5" aria-hidden />, label: "استاد", fa: true, value: cls.professor },
                { icon: <MapPin className="h-3.5 w-3.5" aria-hidden />, label: "محل برگزاری", fa: true, value: cls.location },
                { icon: <Hash className="h-3.5 w-3.5" aria-hidden />, label: "کد درس", fa: false, value: cls.code, ltr: true },
                { icon: <Clock className="h-3.5 w-3.5" aria-hidden />, label: "ساعت", fa: false, value: cls.time, ltr: true },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2"
                >
                  <span style={{ color }} aria-hidden>{f.icon}</span>
                  <span dir="rtl" className="font-fa text-[11px] text-muted-foreground">{f.label}:</span>
                  <span
                    dir={f.ltr ? "ltr" : "rtl"}
                    className={`truncate text-xs text-foreground ${f.ltr ? "font-mono tabular-nums" : "font-fa"}`}
                  >
                    {f.value}
                  </span>
                </div>
              ))}
            </div>

            {classExams.length > 0 && (
              <div className="rounded-xl border border-amber/25 bg-amber/[0.06] p-3">
                <div dir="rtl" className="mb-1.5 flex items-center gap-1.5 font-fa text-[11px] font-bold text-amber">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden /> امتحان‌ها و ارائه‌های این درس
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {classExams.map((e) => (
                    <li key={e.id}>
                      <span className="text-foreground">{e.title}</span>
                      <span className="font-mono tabular-nums"> — {e.date} {e.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator className="bg-white/[0.07]" />

            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="rounded-lg bg-white/[0.04]">
                <TabsTrigger value="edit" className="gap-1.5 text-xs data-[state=active]:text-terminal">
                  <FileText className="h-3.5 w-3.5" aria-hidden /> notes.md
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5 text-xs data-[state=active]:text-terminal">
                  <Eye className="h-3.5 w-3.5" aria-hidden /> پیش‌نمایش
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                  }}
                  placeholder={"# Markdown پشتیبانی می‌شود\n\n- [ ] مرور joins ها\n- **مهم:** کوییز هفته آینده"}
                  className="min-h-[220px] resize-y rounded-xl border-white/[0.09] bg-black/40 font-mono text-sm focus-visible:ring-terminal/40"
                  aria-label="Class notes in markdown"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[220px] rounded-xl border border-white/[0.09] bg-black/40 p-4 text-sm [&_a]:text-cyber [&_blockquote]:border-l-terminal [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-terminal [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-terminal [&_h3]:font-bold [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:text-terminal">
                  {draft.trim() ? (
                    <ReactMarkdown>{draft}</ReactMarkdown>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground/60">
                      $ nothing to preview — notes buffer is empty_
                    </span>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <motion.div whileTap={{ scale: 0.98 }} className="flex items-center justify-between gap-3">
              <span dir="rtl" className="font-fa text-[11px] text-muted-foreground/70">
                یادداشت‌ها به‌صورت زنده در سرور ذخیره می‌شوند
              </span>
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="gap-2 rounded-full bg-terminal font-semibold text-black hover:bg-terminal/85 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                {saving ? "در حال ذخیره…" : dirty ? "ذخیره یادداشت" : "ذخیره شد ✓"}
              </Button>
            </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
