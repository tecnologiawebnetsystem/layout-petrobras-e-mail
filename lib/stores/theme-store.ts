/**
 * Theme Store for Dark Mode
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  setTheme: (isDark: boolean) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggleTheme: () =>
        set((state) => {
          const newIsDark = !state.isDark
          if (typeof window !== "undefined") {
            if (newIsDark) {
              document.documentElement.classList.add("dark")
            } else {
              document.documentElement.classList.remove("dark")
            }
          }
          return { isDark: newIsDark }
        }),
      setTheme: (isDark) => {
        if (typeof window !== "undefined") {
          if (isDark) {
            document.documentElement.classList.add("dark")
          } else {
            document.documentElement.classList.remove("dark")
          }
        }
        set({ isDark })
      },
    }),
    {
      name: "petrobras-theme-storage",
    },
  ),
)
