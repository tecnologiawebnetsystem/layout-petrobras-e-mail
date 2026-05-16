"use client"

import type React from "react"

import { useEffect } from "react"
import { useThemeStore } from "@/lib/stores/theme-store"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, setTheme } = useThemeStore()

  useEffect(() => {
    // Apply theme on mount
    setTheme(isDark)
  }, [isDark, setTheme])

  return <>{children}</>
}
