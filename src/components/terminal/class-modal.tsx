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
  FileTerminal,
} from "lucide-react";
import { toast } from "sonner";
import { useUni } from "@/lib/store";
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

  async function handleSave() {
    if (!selectedClassId) return;
    setSaving(true);
    try {
      await saveNote(selectedClassId, draft);
      setDirty(false);
      toast.success("notes flushed to db.json", {
        description: `~/${selectedClassId}/notes.md`,
      });
    } catch {
      toast.error("write failed — check server log");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!selectedClassId} onOpenChange={(o) => !o && selectClass(null)}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto border-terminal/30 bg-background/95 backdrop-blur-xl sm:rounded-lg">
        {cls && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-mono text-lg">
                <span className="text-terminal">&gt;_</span> {cls.name}
                <Badge variant="outline" className="border-terminal/40 font-mono text-[10px] text-terminal/90">
                  {cls.type} units
                </Badge>
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground">
                {cls.day} · {cls.time}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-2 font-mono text-xs sm:grid-cols-2">
              {[
                [<User key="u" className="h-3.5 w-3.5 text-terminal/70" aria-hidden />, "professor", cls.professor],
                [<MapPin key="m" className="h-3.5 w-3.5 text-terminal/70" aria-hidden />, "location", cls.location],
                [<Hash key="h" className="h-3.5 w-3.5 text-terminal/70" aria-hidden />, "code", cls.code],
                [<Clock key="c" className="h-3.5 w-3.5 text-terminal/70" aria-hidden />, "time", cls.time],
              ].map(([icon, label, value]) => (
                <div key={label as string} className="flex items-center gap-2 rounded border border-terminal/15 bg-terminal/5 px-2.5 py-1.5">
                  {icon}
                  <span className="text-muted-foreground">{label as string}:</span>
                  <span className="truncate text-foreground">{value as string}</span>
                </div>
              ))}
            </div>

            {classExams.length > 0 && (
              <div className="rounded border border-amber/30 bg-amber/10 p-2.5">
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-amber">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden /> linked assessments
                </div>
                <ul className="space-y-0.5 font-mono text-xs text-muted-foreground">
                  {classExams.map((e) => (
                    <li key={e.id}>
                      <span className="text-foreground">{e.title}</span> — {e.date} {e.time}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator className="bg-terminal/15" />

            <Tabs defaultValue="edit" className="w-full">
              <TabsList className="bg-terminal/10 font-mono">
                <TabsTrigger value="edit" className="gap-1.5 font-mono text-xs data-[state=active]:text-terminal">
                  <FileTerminal className="h-3.5 w-3.5" aria-hidden /> notes.md
                </TabsTrigger>
                <TabsTrigger value="preview" className="font-mono text-xs data-[state=active]:text-terminal">
                  preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="mt-2">
                <Textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setDirty(true);
                  }}
                  placeholder={"# Markdown supported\n\n- [ ] review joins\n- **important:** quiz next week"}
                  className="min-h-[220px] resize-y border-terminal/25 bg-black/40 font-mono text-sm text-terminal-foreground placeholder:text-muted-foreground/40 focus-visible:ring-terminal/50"
                  aria-label="Class notes in markdown"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[220px] rounded-md border border-terminal/25 bg-black/40 p-4 text-sm [&_a]:text-cyber [&_blockquote]:border-l-terminal [&_code]:rounded [&_code]:bg-terminal/10 [&_code]:px-1 [&_code]:font-mono [&_h1]:mb-2 [&_h1]:font-mono [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-terminal [&_h2]:mb-2 [&_h2]:font-mono [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-terminal [&_li]:ml-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:text-terminal">
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

            <motion.div whileTap={{ scale: 0.98 }} className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="gap-2 bg-terminal font-mono text-black hover:bg-terminal/85 disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
                {saving ? "writing…" : dirty ? "save notes" : "saved"}
              </Button>
            </motion.div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
