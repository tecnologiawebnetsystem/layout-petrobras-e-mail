/**
 * Auth Store using Zustand for state management.
 * Integrado com backend Python via /api/auth/* proxy.
 *
 * IMPORTANTE: Autenticacao exclusiva via Entra ID (backend-driven).
 * Nao ha login local, mocks, tokens fake, ou bypass.
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

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /**
   * Indica que o persist middleware terminou de hidratar o store a partir
   * do localStorage. Nunca e persistido — comeca false em todo carregamento
   * e e setado para true pelo onRehydrateStorage.
   */
  _hasHydrated: boolean

  // Acoes de state
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  updateAccessToken: (accessToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  enrichUserProfile: (enrichedData: Partial<User>) => void
  setHasHydrated: (value: boolean) => void

  // Acoes de API
  validateSession: () => Promise<boolean>
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
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

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
       * Valida a sessao com o backend (GET /auth/entra/session-check).
       * Se invalida, limpa o state e redireciona para login.
       * Retorna true se sessao e valida, false caso contrario.
       */
      validateSession: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          get().clearAuth()
          return false
        }

        try {
          const data = await apiFetch<{
            valid: boolean
            user_id: number
            email: string
            role: string
            expires_in: number
          }>("/auth/entra/session-check")

          if (!data.valid) {
            get().clearAuth()
            return false
          }

          // Se a sessao esta perto de expirar (< 5 min), tenta refresh
          if (data.expires_in < 300) {
            const refreshed = await get().refreshSession()
            return refreshed
          }

          return true
        } catch {
          // Token invalido/expirado — tenta refresh antes de deslogar
          const { refreshToken: currentRefreshToken } = get()
          if (currentRefreshToken) {
            const refreshed = await get().refreshSession()
            return refreshed
          }
          get().clearAuth()
          return false
        }
      },

      /**
       * Logout via backend (POST /auth/entra/logout).
       * Revoga todos refresh tokens e redireciona para logout Microsoft.
       */
      logout: async () => {
        try {
          const data = await apiFetch<{ ms_logout_url?: string }>("/auth/entra/logout", {
            method: "POST",
          })
          // Limpa state local
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
          // Redireciona para logout Microsoft (limpa sessao SSO)
          if (data?.ms_logout_url) {
            window.location.href = data.ms_logout_url
            return
          }
        } catch {
          // Ignora erros de logout — limpa o state de qualquer forma
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
      },

      /**
       * Refresh do token via backend (POST /auth/entra/refresh).
       * Usa header X-Refresh-Token conforme esperado pelo backend.
       */
      refreshSession: async () => {
        const { refreshToken: currentRefreshToken } = get()
        if (!currentRefreshToken) return false

        try {
          const response = await fetch("/api/auth/entra/refresh", {
            method: "POST",
            headers: {
              "X-Refresh-Token": currentRefreshToken,
            },
          })

          if (!response.ok) {
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            })
            return false
          }

          const data = await response.json()

          // Atualizar user se retornado
          const currentUser = get().user
          const updatedUser = data.user
            ? {
                ...currentUser,
                id: String(data.user.id),
                name: data.user.name,
                email: data.user.email,
                userType: mapRoleToUserType(data.user.role),
              }
            : currentUser

          set({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: updatedUser as User,
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
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
