"use client";

import { useMemo } from "react";
import {
  CalendarClock,
  GraduationCap,
  Plus,
  TerminalSquare,
  ArrowDown,
  StickyNote,
} from "lucide-react";
import { useUni } from "@/lib/store";
import { dayFa, classColor } from "@/components/terminal/schedule-grid";
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

  const upcomingExams = useMemo(
    () => [...exams].sort((a, b) => a.date.localeCompare(b.date)),
    [exams]
  );

  return (
    <CommandDialog open={open} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="جستجوی درس یا دستور… (search)" className="font-fa" />
      <CommandList>
        <CommandEmpty className="py-4 text-center font-fa text-xs text-muted-foreground">
          نتیجه‌ای پیدا نشد — عبارت دیگری امتحان کنید
        </CommandEmpty>

        <CommandGroup heading="دستورها">
          <CommandItem
            onSelect={() => run(() => setExamDialog(true, null))}
            className="gap-2.5"
          >
            <Plus className="h-4 w-4 text-terminal" aria-hidden />
            <span dir="rtl" className="font-fa text-xs">افزودن امتحان / ارائه</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">new exam</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => scrollTo("schedule"))} className="gap-2.5">
            <CalendarClock className="h-4 w-4 text-cyber" aria-hidden />
            <span dir="rtl" className="font-fa text-xs">برو به برنامه هفتگی</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => scrollTo("exams"))} className="gap-2.5">
            <GraduationCap className="h-4 w-4 text-amber" aria-hidden />
            <span dir="rtl" className="font-fa text-xs">برو به امتحان‌ها</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => scrollTo("unscheduled"))} className="gap-2.5">
            <ArrowDown className="h-4 w-4 text-plasma" aria-hidden />
            <span dir="rtl" className="font-fa text-xs">درس‌های بدون تقویم</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="کلاس‌ها — یادداشت‌ها">
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.nameFa ?? ""} ${c.code} ${c.professor} ${c.day} ${dayFa(c.day)}`}
              onSelect={() => run(() => selectClass(c.id))}
              className="gap-2.5"
            >
              <span
                className="h-3.5 w-1 rounded-full"
                style={{ background: classColor(c) }}
                aria-hidden
              />
              <span className="text-xs font-bold">{c.name}</span>
              {c.nameFa && (
                <span dir="rtl" className="font-fa text-[11px] text-muted-foreground">{c.nameFa}</span>
              )}
              <span dir="rtl" className="font-fa text-[11px] text-muted-foreground/70">· {dayFa(c.day)}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">{c.code}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="رویدادها">
          {upcomingExams.length === 0 && (
            <div dir="rtl" className="px-3 py-2 font-fa text-[11px] text-muted-foreground/60">
              رویدادی ثبت نشده — با «افزودن امتحان» شروع کنید
            </div>
          )}
          {upcomingExams.map((e) => (
            <CommandItem
              key={e.id}
              value={`${e.title} ${e.kind} ${e.date}`}
              onSelect={() => run(() => scrollTo("exams"))}
              className="gap-2.5"
            >
              <StickyNote className="h-4 w-4 text-amber/80" aria-hidden />
              <span dir="rtl" className="font-fa text-xs">{e.title}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{e.date}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="System">
          <CommandItem
            onSelect={() => run(() => window.open("/api/schedule", "_blank"))}
            className="gap-2.5 font-mono text-xs"
          >
            <TerminalSquare className="h-4 w-4 text-terminal" aria-hidden />
            Dump raw db.json (GET /api/schedule)
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
