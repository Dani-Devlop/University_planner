'use client'

// WEEKLY//UNI — system panel (health check / reminder cache reset / version & persistence info)

import * as React from "react"
import { CheckCircle2, Database, RefreshCw, ServerCog, XCircle } from "lucide-react"
import { useUni } from "@/lib/store"
import { toPersianDigits, isoToJalaliLabel } from "@/lib/jalali"
import { tehranClock, tehranISODate } from "@/lib/tehran"
import { resetFired } from "@/lib/reminders"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface HealthInfo {
  ok: boolean
  service?: string
  classes: number
  exams: number
  ts: number
}

function HealthRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="shrink-0 font-fa text-[11px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-start font-fa text-xs text-foreground">{children}</span>
    </div>
  )
}

export default function SystemPanel() {
  const systemOpen = useUni((s) => s.systemOpen)
  const setSystem = useUni((s) => s.setSystem)
  const { toast } = useToast()

  const [health, setHealth] = React.useState<HealthInfo | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [checking, setChecking] = React.useState(false)

  const fetchHealth = React.useCallback(async () => {
    setChecking(true)
    setFailed(false)
    try {
      const res = await fetch("/api/health", { cache: "no-store" })
      if (!res.ok) throw new Error("bad status")
      const data = (await res.json()) as HealthInfo
      setHealth(data)
    } catch {
      setFailed(true)
      setHealth(null)
    } finally {
      setChecking(false)
    }
  }, [])

  // fetch health each time the panel opens
  React.useEffect(() => {
    if (systemOpen) void fetchHealth()
  }, [systemOpen, fetchHealth])

  const clearReminderCache = React.useCallback(() => {
    resetFired()
    toast({
      title: "کش یادآورها پاک شد",
      description: "یادآورهای امروز دوباره در زمان مقرر پخش می‌شوند.",
    })
  }, [toast])

  return (
    <Dialog open={systemOpen} onOpenChange={setSystem}>
      <DialogContent dir="rtl" className="max-w-md rounded-2xl border-white/[0.09]">
        <DialogHeader className="text-start sm:text-start">
          <DialogTitle className="flex items-center gap-2 font-fa">
            <ServerCog className="h-4 w-4 text-terminal" aria-hidden="true" />
            سیستم
          </DialogTitle>
          <DialogDescription dir="ltr" className="text-start font-mono text-[11px] text-muted-foreground">
            WEEKLY//UNI v2 · Midnight Campus
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <HealthRow label="وضعیت API">
            {failed ? (
              <span className="flex items-center gap-1.5 font-fa text-final">
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                قطع — /api/health پاسخ نداد
              </span>
            ) : checking && !health ? (
              <span className="flex items-center gap-1.5 font-fa text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                در حال بررسی…
              </span>
            ) : health ? (
              <span className="flex items-center gap-1.5 font-fa text-terminal">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                متصل
              </span>
            ) : (
              "—"
            )}
          </HealthRow>

          {health && (
            <>
              <HealthRow label="کلاس‌ها">
                <span dir="rtl" className="font-fa tabular-nums">
                  {toPersianDigits(health.classes)}
                </span>
              </HealthRow>
              <HealthRow label="امتحان/ارائه">
                <span dir="rtl" className="font-fa tabular-nums">
                  {toPersianDigits(health.exams)}
                </span>
              </HealthRow>
              <HealthRow label="زمان سرور">
                <span dir="ltr" className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {tehranClock(new Date(health.ts))}
                </span>
              </HealthRow>
            </>
          )}

          <HealthRow label="تاریخ امروز">
            <span className="font-fa">{isoToJalaliLabel(tehranISODate())}</span>
          </HealthRow>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={clearReminderCache}
            className="w-full font-fa text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            پاک‌سازی کش یادآورها
          </Button>
          <Button
            variant="ghost"
            onClick={() => void fetchHealth()}
            disabled={checking}
            className="w-full font-fa text-xs text-muted-foreground"
          >
            <Database className="h-3.5 w-3.5" aria-hidden="true" />
            بررسی مجدد اتصال
          </Button>
        </div>

        <p className="font-fa text-[10px] leading-relaxed text-muted-foreground/70">
          دیتای برنامه (کلاس‌ها، امتحان‌ها و یادداشت‌ها) روی Volume سرور پارسیست می‌شود؛ هر تغییری
          بلافاصله در فایل پایگاه‌داده ذخیره و به همه‌ی تب‌ها همگام می‌گردد. یادآورها فقط وقتی صفحه
          باز است صدا می‌دهند.
        </p>
      </DialogContent>
    </Dialog>
  )
}
