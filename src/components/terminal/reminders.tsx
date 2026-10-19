'use client'

// WEEKLY//UNI — reminder engine (headless): boot catch-up + 20s tick + focus re-check + toasts
// Also exports BellBadge: recent-reminder counter for the navbar bell dot.

import * as React from "react"
import { useUni } from "@/lib/store"
import { computeAllReminders, fireReminder } from "@/lib/reminders"
import { toPersianDigits } from "@/lib/jalali"
import type { ReminderItem } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

const TICK_MS = 20_000
const BOOT_CATCHUP_MS = 10 * 60 * 1000 // fire anything missed in the last 10 minutes

/* ---- tiny module-level store for "recent reminders" (consumed by BellBadge) ---- */

let recentCount = 0
const recentSubs = new Set<() => void>()

function bumpRecent() {
  recentCount += 1
  recentSubs.forEach((fn) => fn())
}

function subscribeRecent(fn: () => void): () => void {
  recentSubs.add(fn)
  return () => {
    recentSubs.delete(fn)
  }
}

function getRecentSnapshot(): number {
  return recentCount
}

function getServerSnapshot(): number {
  return 0
}

/** Amber pulsing counter for the bell — mount inside the navbar trigger (optional). */
export function BellBadge() {
  const count = React.useSyncExternalStore(subscribeRecent, getRecentSnapshot, getServerSnapshot)
  if (count <= 0) return null
  return (
    <span className="absolute -top-1.5 -end-1.5 flex h-3.5 min-w-3.5 animate-pulse items-center justify-center rounded-full bg-amber px-1 font-mono text-[8px] font-bold leading-none text-black">
      {toPersianDigits(count)}
    </span>
  )
}

/* ---- headless reminder engine ---- */

function fireAndToast(item: ReminderItem, toast: ReturnType<typeof useToast>["toast"]) {
  void fireReminder(item)
  bumpRecent()
  toast({
    title: item.title,
    description: item.body,
  })
}

export function ReminderEngine() {
  const loaded = useUni((s) => s.loaded)
  const classes = useUni((s) => s.classes)
  const exams = useUni((s) => s.exams)
  const { toast } = useToast()

  React.useEffect(() => {
    if (!loaded) return
    let stopped = false

    const check = (now: Date) => {
      if (stopped) return
      const items = computeAllReminders(classes, exams, now)
      for (const item of items) {
        if (stopped) return
        fireAndToast(item, toast)
      }
    }

    // boot catch-up: refire anything that should have fired in the last 10 minutes
    check(new Date(Date.now() - BOOT_CATCHUP_MS))

    const interval = window.setInterval(() => check(new Date()), TICK_MS)
    const onFocus = () => check(new Date())
    window.addEventListener("focus", onFocus)

    return () => {
      stopped = true
      window.clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [loaded, toast, classes, exams])

  return null
}

export default ReminderEngine
