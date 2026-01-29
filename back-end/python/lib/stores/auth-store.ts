/**
 * Auth Store using Zustand for state management
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface User {
  id: string
  email: string
  name: string
  userType: "internal" | "external" | "supervisor"
  jobTitle?: string
  department?: string
  officeLocation?: string
  mobilePhone?: string
  employeeId?: string
  photoUrl?: string
  manager?: {
    id: string
    name: string
    email: string
    jobTitle?: string
    department?: string
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateAccessToken: (accessToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  enrichUserProfile: (enrichedData: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      setTokens: (accessToken, refreshToken) =>
        set({
          accessToken,
          refreshToken,
        }),
      enrichUserProfile: (enrichedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...enrichedData } : null,
        })),
    }),
    {
      name: "petrobras-auth-storage",
    },
  ),
)
