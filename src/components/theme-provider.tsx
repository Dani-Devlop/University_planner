'use client'

// WEEKLY//UNI — next-themes provider (class attribute, dark default, no system)

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type * as React from "react"

export function ThemeProvider(props: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />
}
