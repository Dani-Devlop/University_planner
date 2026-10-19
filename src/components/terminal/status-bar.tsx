'use client'

// WEEKLY//UNI — sticky bottom status bar (LIVE / synced / host → system panel)

import * as React from "react"
import { useUni } from "@/lib/store"
import { tehranClock } from "@/lib/tehran"

export default function StatusBar() {
  const syncing = useUni((s) => s.syncing)
  const setSystem = useUni((s) => s.setSystem)

  // Tehran clock — SSR-safe ("--:--:--" until mounted)
  const [clock, setClock] = React.useState("--:--:--")
  React.useEffect(() => {
    const tick = () => setClock(tehranClock())
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [])

  return (
    <footer className="sticky bottom-0 z-40 mt-auto border-t border-white/[0.07] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-9 max-w-7xl items-center gap-3 overflow-hidden px-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="dot-live" aria-hidden="true" />
          <span className="font-mono font-bold text-terminal">LIVE</span>
        </span>
        <span className="hidden items-center gap-2 sm:flex">
          <span className="font-mono">{syncing ? "syncing…" : `synced ${clock}`}</span>
        </span>
        <span className="ml-auto hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => setSystem(true)}
            title="پنل سیستم"
            className="font-mono text-muted-foreground/60 transition-colors hover:text-terminal"
          >
            weeklyuni.up.railway.app
          </button>
        </span>
        <span className="font-mono tabular-nums md:hidden">{clock}</span>
      </div>
    </footer>
  )
}
