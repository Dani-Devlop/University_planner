'use client'

// WEEKLY//UNI — ⌘K command palette (classes / navigation / sounds / reminders)

import * as React from "react"
import {
  Activity,
  CalendarRange,
  GraduationCap,
  RotateCcw,
  Volume2,
} from "lucide-react"
import { useUni } from "@/lib/store"
import { playSound, SOUND_LABELS, type SoundKind } from "@/lib/sounds"
import { resetFired } from "@/lib/reminders"
import { useToast } from "@/hooks/use-toast"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const SOUND_ORDER: SoundKind[] = ["class", "exam", "presentation"]

export default function CommandPalette() {
  const paletteOpen = useUni((s) => s.paletteOpen)
  const setPalette = useUni((s) => s.setPalette)
  const classes = useUni((s) => s.classes)
  const { toast } = useToast()

  // global ⌘K / Ctrl+K shortcut
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPalette(!useUni.getState().paletteOpen)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [setPalette])

  const run = React.useCallback(
    (fn: () => void) => {
      fn()
      setPalette(false)
    },
    [setPalette]
  )

  const scrollTo = React.useCallback(
    (id: string) => {
      run(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    },
    [run]
  )

  return (
    <CommandDialog
      open={paletteOpen}
      onOpenChange={setPalette}
      title="Command Palette"
      description="جستجوی کلاس‌ها و دستورها"
      className="rounded-xl border-white/[0.09] shadow-[0_24px_80px_rgba(0,0,0,0.6)] [&_[cmdk-group-heading]]:font-fa"
    >
      <CommandInput dir="rtl" placeholder="جستجو… (درس، صدا، ناوبری)" className="font-fa" />
      <CommandList>
        <CommandEmpty className="font-fa text-muted-foreground">نتیجه‌ای پیدا نشد.</CommandEmpty>

        <CommandGroup heading="کلاس‌ها">
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.nameFa} ${c.name} ${c.professor}`}
              onSelect={() => run(() => useUni.getState().openClass(c.id))}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: c.color }}
                aria-hidden="true"
              />
              <span className="font-fa">{c.nameFa}</span>
              <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                {c.name}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="ناوبری">
          <CommandItem value="schedule برنامه هفتگی" onSelect={() => scrollTo("schedule")}>
            <CalendarRange aria-hidden="true" />
            <span className="font-fa">برنامه هفتگی — Schedule</span>
          </CommandItem>
          <CommandItem value="exams امتحان‌ها" onSelect={() => scrollTo("exams")}>
            <GraduationCap aria-hidden="true" />
            <span className="font-fa">امتحان‌ها — Exams</span>
          </CommandItem>
          <CommandItem value="system سیستم پنل" onSelect={() => run(() => useUni.getState().setSystem(true))}>
            <Activity aria-hidden="true" />
            <span className="font-fa">پنل سیستم</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="صداها">
          {SOUND_ORDER.map((kind) => (
            <CommandItem
              key={kind}
              value={`sound ${kind} ${SOUND_LABELS[kind]}`}
              onSelect={() => run(() => playSound(kind))}
            >
              <Volume2 aria-hidden="true" />
              <span className="font-fa">{SOUND_LABELS[kind]}</span>
              <span dir="ltr" className="ms-auto font-mono text-[10px] text-muted-foreground">
                test
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="یادآورها">
          <CommandItem
            value="reset reminders ریست یادآور"
            onSelect={() =>
              run(() => {
                resetFired()
                toast({
                  title: "یادآورهای امروز ریست شد",
                  description: "در زمان مقرر دوباره پخش می‌شود.",
                })
              })
            }
          >
            <RotateCcw aria-hidden="true" />
            <span className="font-fa">ریست یادآورهای امروز</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
