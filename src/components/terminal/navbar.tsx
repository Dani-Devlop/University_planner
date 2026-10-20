'use client'

// WEEKLY//UNI — sticky terminal navbar (logo / pills / Tehran clock / bell popover / ⌘K)

import * as React from "react"
import { Bell, BellOff, BellRing, Command as CommandIcon, Moon, Sun, Terminal } from "lucide-react"
import { useTheme } from "next-themes"
import { useUni } from "@/lib/store"
import { tehranClock } from "@/lib/tehran"
import { playSound, SOUND_LABELS, SOUND_HINTS, type SoundKind } from "@/lib/sounds"
import { notifsEnabled, NOTIFS_ENABLED_KEY } from "@/lib/reminders"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const SOUND_ORDER: SoundKind[] = ["class", "exam", "presentation"]

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}

/** Bell — opens reminder sounds popover with functional labels + notification on/off toggle */
function BellButton() {
  const { toast } = useToast()
  const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">("default")
  const [notifOn, setNotifOn] = React.useState(true)

  React.useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [])

  // read the persisted app-level switch once on mount
  React.useEffect(() => {
    setNotifOn(notifsEnabled())
  }, [])

  const requestPermission = React.useCallback(async (): Promise<NotificationPermission | "unsupported"> => {
    if (typeof Notification === "undefined") return "unsupported"
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      return p
    } catch {
      /* permission request unavailable */
      return Notification.permission
    }
  }, [])

  /** enable ⇄ disable notifications (app-level; browser permission asked when enabling) */
  const toggleNotifs = React.useCallback(async () => {
    if (notifOn) {
      try {
        localStorage.setItem(NOTIFS_ENABLED_KEY, "0")
      } catch {
        /* private mode */
      }
      setNotifOn(false)
      toast({
        title: "نوتیفیکیشن خاموش شد",
        description: "دیگر یادآوری کلاس، امتحان و ارائه نمایش داده نمی‌شود",
      })
      return
    }
    // enabling — ask for browser permission if still undecided
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      await requestPermission()
    }
    try {
      localStorage.setItem(NOTIFS_ENABLED_KEY, "1")
    } catch {
      /* private mode */
    }
    setNotifOn(true)
    const granted = typeof Notification !== "undefined" && Notification.permission === "granted"
    toast({
      title: "نوتیفیکیشن روشن شد",
      description: granted
        ? "یادآوری کلاس‌ها و امتحان‌ها فعال است (مرورگر + داخل صفحه)"
        : "یادآوری داخل صفحه فعال شد — برای نوتیفیکیشن مرورگر مجوز را تأیید کنید",
    })
  }, [notifOn, requestPermission, toast])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={notifOn ? "یادآورها فعال" : "یادآورها خاموش"}
          className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-terminal transition-colors hover:border-terminal/40 hover:bg-terminal/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <Bell className="h-3.5 w-3.5" aria-hidden="true" />
          {notifOn && (
            <span
              className="absolute -top-0.5 -end-0.5 h-2 w-2 rounded-full bg-amber animate-pulse"
              aria-hidden="true"
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        dir="rtl"
        sideOffset={8}
        className="w-72 rounded-xl border-white/[0.09] bg-popover/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <p className="mb-2 flex items-center justify-between gap-2 font-fa text-xs font-bold text-foreground">
          <span>🔔 صداهای یادآور</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              notifOn ? "bg-terminal/15 text-terminal" : "bg-white/[0.08] text-muted-foreground"
            )}
          >
            {notifOn ? "نوتیفیکیشن: فعال" : "نوتیفیکیشن: خاموش"}
          </span>
        </p>
        <div className="flex flex-col gap-1">
          {SOUND_ORDER.map((kind) => (
            <div
              key={kind}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-fa text-[11px] font-bold text-foreground/90">
                  {SOUND_LABELS[kind]}
                </span>
                <span className="block truncate font-fa text-[9px] leading-relaxed text-muted-foreground">
                  {SOUND_HINTS[kind]}
                </span>
              </span>
              <button
                type="button"
                onClick={() => playSound(kind)}
                className="shrink-0 rounded-md border border-terminal/30 bg-terminal/10 px-2 py-0.5 font-fa text-[10px] text-terminal transition-colors hover:bg-terminal/20"
              >
                ▶ تست
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 font-fa text-[10px] leading-relaxed text-muted-foreground">
          یادآورها فقط وقتی صفحه باز است کار می‌کنند.
        </p>
        <button
          type="button"
          onClick={() => void toggleNotifs()}
          className={cn(
            "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 font-fa text-[11px] font-bold transition-colors",
            notifOn
              ? "border-white/[0.09] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              : "border-amber/40 bg-amber/10 text-amber hover:bg-amber/20"
          )}
        >
          {notifOn ? (
            <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {notifOn ? "غیرفعال‌سازی نوتیفیکیشن" : "فعال‌سازی نوتیفیکیشن"}
        </button>
      </PopoverContent>
    </Popover>
  )
}

/** Dark/light mode toggle — sits next to the reminder bell */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const isDark = mounted ? resolvedTheme !== "light" : true
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "حالت روشن" : "حالت تاریک"}
      title={isDark ? "حالت روشن ☀" : "حالت تاریک ☾"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-terminal transition-colors hover:border-terminal/40 hover:bg-terminal/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  )
}

export default function Navbar() {
  const classes = useUni((s) => s.classes)
  const exams = useUni((s) => s.exams)
  const setPalette = useUni((s) => s.setPalette)

  // Tehran clock — SSR-safe: starts as "--:--:--", set in effect (no hydration mismatch)
  const [clock, setClock] = React.useState("--:--:--")
  React.useEffect(() => {
    const tick = () => setClock(tehranClock())
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        {/* logo */}
        <a href="#" className="group flex items-center gap-2.5" aria-label="WEEKLY UNI home">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-terminal/30 bg-terminal/10 text-terminal transition-shadow group-hover:shadow-[0_0_20px_rgba(0,255,65,0.35)]"
            aria-hidden="true"
          >
            <Terminal className="h-4 w-4" />
          </span>
          <span className="font-mono text-sm font-bold tracking-tight text-foreground">
            WEEKLY<span className="text-terminal">{"//"}</span>UNI
          </span>
        </a>

        {/* desktop nav pills */}
        <nav
          className="ml-6 hidden items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 md:flex"
          aria-label="Primary"
        >
          <button
            type="button"
            onClick={() => scrollToId("schedule")}
            className="rounded-full px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            Schedule
            <span className="ml-1.5 rounded-full bg-white/[0.08] px-1.5 font-mono text-[10px] tabular-nums">
              {classes.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => scrollToId("exams")}
            className="rounded-full px-3.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            Exams
            <span className="ml-1.5 rounded-full bg-white/[0.08] px-1.5 font-mono text-[10px] tabular-nums">
              {exams.length}
            </span>
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Tehran clock */}
          <span
            className="hidden items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 font-mono text-xs tabular-nums text-muted-foreground sm:flex"
            title="Tehran local time"
          >
            <span className="dot-live" aria-hidden="true" />
            {clock}
            <span className="text-[9px] font-bold tracking-widest text-terminal/70">TEH</span>
          </span>

          {/* dark/light toggle + reminder bell + sounds popover */}
          <ThemeToggle />
          <BellButton />

          {/* command palette trigger */}
          <button
            type="button"
            onClick={() => setPalette(true)}
            aria-label="Open command palette"
            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-white/[0.09] bg-white/[0.03] px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-terminal/40 hover:bg-terminal/10 hover:text-terminal focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <CommandIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <kbd className="pointer-events-none font-mono">⌘K</kbd>
          </button>
        </div>
      </div>
    </header>
  )
}
