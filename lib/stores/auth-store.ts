/**
 * Auth Store using Zustand for state management.
 * Integrado com backend Python via /api/auth/* proxy.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiFetch, ApiRequestError } from "@/lib/services/api-fetch"

interface User {
  id: string
  email: string
  name: string
  userType: "internal" | "external" | "supervisor" | "support"
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

/**
 * Mapeia o campo `role` do backend Python para `userType` do frontend.
 * O Python retorna: "internal", "external", "supervisor", "support" (ou TypeUser enum).
 */
function mapRoleToUserType(role: string): "internal" | "external" | "supervisor" | "support" {
  const normalized = role?.toLowerCase().replace("typeuser.", "") || "external"
  if (normalized.includes("support") || normalized.includes("suporte") || normalized.includes("atendimento")) return "support"
  if (normalized.includes("supervisor")) return "supervisor"
  if (normalized.includes("internal") || normalized.includes("interno")) return "internal"
  return "external"
}

interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: number | string
    name: string
    email: string
    role: string
    department?: string
    employee_id?: string
    manager?: {
      id: number | string
      name: string
      email: string
    } | null
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Acoes de state
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateAccessToken: (accessToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  enrichUserProfile: (enrichedData: Partial<User>) => void

  // Acoes de API
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      updateAccessToken: (accessToken) => set({ accessToken }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      enrichUserProfile: (enrichedData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...enrichedData } : null,
        })),

      /**
       * Login real via backend Python.
       * POST /api/auth/login -> { access_token, refresh_token, user }
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const data = await apiFetch<LoginResponse>("/auth/login", {
            method: "POST",
            body: { email, password },
            skipAuth: true,
          })

          const userType = mapRoleToUserType(data.user.role)

          const user: User = {
            id: String(data.user.id),
            email: data.user.email,
            name: data.user.name,
            userType,
            department: data.user.department,
            employeeId: data.user.employee_id,
            manager: data.user.manager
              ? {
                  id: String(data.user.manager.id),
                  name: data.user.manager.name,
                  email: data.user.manager.email,
                }
              : undefined,
          }

          set({
            user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })

          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          if (err instanceof ApiRequestError) {
            return { success: false, error: err.detail }
          }
          return { success: false, error: "Erro de conexao com o servidor" }
        }
      },

      /**
       * Logout via backend Python.
       * POST /api/auth/logout
       */
      logout: async () => {
        try {
          await apiFetch("/auth/logout", { method: "POST" })
        } catch {
          // Ignora erros de logout -- limpa o state de qualquer forma
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      /**
       * Refresh do token via backend Python.
       * POST /api/auth/refresh -> { access_token, refresh_token }
       */
      refreshSession: async () => {
        const { refreshToken: currentRefreshToken } = get()
        if (!currentRefreshToken) return false

        try {
          const data = await apiFetch<{
            access_token: string
            refresh_token: string
          }>("/auth/refresh", {
            method: "POST",
            body: { refresh_token: currentRefreshToken },
            skipAuth: true,
          })

          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          })
          return true
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          })
          return false
        }
      },
    }),
    {
      name: "petrobras-auth-storage",
    },
  ),
)
