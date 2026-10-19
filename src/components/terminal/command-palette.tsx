"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  GraduationCap,
  Pencil,
  Plus,
  TerminalSquare,
  ArrowDown,
  StickyNote,
} from "lucide-react";
import { useUni } from "@/lib/store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandPalette() {
  const open = useUni((s) => s.paletteOpen);
  const setPaletteOpen = useUni((s) => s.setPaletteOpen);
  const classes = useUni((s) => s.classes);
  const exams = useUni((s) => s.exams);
  const selectClass = useUni((s) => s.selectClass);
  const setExamDialog = useUni((s) => s.setExamDialog);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const run = (action: () => void) => {
    setPaletteOpen(false);
    // let the dialog close before scrolling/dialog chaining
    setTimeout(action, 80);
  };

  return (
    <CommandDialog open={open} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="Type a command or search…" className="font-mono" />
      <CommandList>
        <CommandEmpty className="font-mono text-xs text-muted-foreground">
          $ no results — try another query_
        </CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => run(() => setExamDialog(true, null))}
            className="gap-2 font-mono text-xs"
          >
            <Plus className="h-4 w-4 text-terminal" aria-hidden />
            Add new exam / presentation
            <span className="ml-auto text-[10px] text-muted-foreground">new assessment</span>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => scrollTo("schedule"))}
            className="gap-2 font-mono text-xs"
          >
            <CalendarClock className="h-4 w-4 text-cyber" aria-hidden />
            Go to weekly schedule
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => scrollTo("exams"))}
            className="gap-2 font-mono text-xs"
          >
            <GraduationCap className="h-4 w-4 text-amber" aria-hidden />
            Go to exam tracker
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => scrollTo("unscheduled"))}
            className="gap-2 font-mono text-xs"
          >
            <ArrowDown className="h-4 w-4 text-plasma" aria-hidden />
            Jump to unscheduled classes
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Classes — jump to notes">
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.code} ${c.professor} ${c.day}`}
              onSelect={() => run(() => selectClass(c.id))}
              className="gap-2 font-mono text-xs"
            >
              <StickyNote className="h-4 w-4 text-terminal/70" aria-hidden />
              <span className="font-bold">{c.name}</span>
              <span className="text-muted-foreground">· {c.day}</span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">{c.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Assessments">
          {exams.length === 0 && (
            <div className="px-3 py-2 font-mono text-[11px] text-muted-foreground/60">
              no assessments tracked — add one with “Add new exam”
            </div>
          )}
          {exams.map((e) => (
            <CommandItem
              key={e.id}
              value={`${e.title} ${e.kind} ${e.date}`}
              onSelect={() => run(() => scrollTo("exams"))}
              className="gap-2 font-mono text-xs"
            >
              <Pencil className="h-4 w-4 text-amber/80" aria-hidden />
              {e.title}
              <span className="ml-auto text-[10px] text-muted-foreground">{e.date}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="System">
          <CommandItem
            onSelect={() => run(() => window.open("/api/schedule", "_blank"))}
            className="gap-2 font-mono text-xs"
          >
            <TerminalSquare className="h-4 w-4 text-terminal" aria-hidden />
            Dump raw db.json (GET /api/schedule)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
