/**
 * Auth Store using Zustand for state management.
 * Integrado com backend Python via /api/auth/* proxy.
 *
 * IMPORTANTE: Autenticacao corporativa via CAv4 (backend-driven).
 * Modo dev local e suportado para desenvolvimento.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiFetch } from "@/lib/services/api-fetch"
import { getClientEnv } from "@/lib/env"

interface User {
  id: string
  email: string
  name: string
  userType: "internal" | "external" | "supervisor" | "support" | "admin"
  isAdmin?: boolean
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
 * O Python retorna: "internal", "external", "supervisor", "support", "admin" (ou TypeUser enum).
 */
function mapRoleToUserType(role: string, isAdmin?: boolean): "internal" | "external" | "supervisor" | "support" | "admin" {
  // Se e admin, sempre retorna admin
  if (isAdmin === true) return "admin"
  
  const normalized = role?.toLowerCase().replace("typeuser.", "") || "external"
  if (normalized.includes("admin")) return "admin"
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
      * Valida a sessao com o backend (cav4 conforme modo).
       * Se invalida, limpa o state e redireciona para login.
       * Retorna true se sessao e valida, false caso contrario.
       */
      validateSession: async () => {
        const { accessToken } = get()
        if (!accessToken) {
          get().clearAuth()
          return false
        }

        const authMode = getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "cav4"

        // Em modo local/dev, não há session-check dedicado no backend.
        if (authMode !== "cav4") {
          return true
        }

        const sessionCheckEndpoint = "/auth/cav4/session-check"

        try {
          const data = await apiFetch<{
            valid: boolean
            user_id: number
            email: string
            role: string
            expires_in: number
          }>(sessionCheckEndpoint)

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
       * Logout via backend.
       * - Modo cav4: POST /auth/cav4/logout (revoga refresh token)
       * - Modo dev:   POST /auth/internal/logout (limpa cookie de sessão)
       * Em ambos os casos limpa o state local e redireciona para /.
       */
      logout: async () => {
        const authMode = getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "cav4"
        const endpoint =
          authMode === "cav4" ? "/auth/cav4/logout" : "/auth/internal/logout"
        const clearState = {
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }

        try {
          await apiFetch(endpoint, { method: "POST" })
          set(clearState)
        } catch {
          // Ignora erros de logout — limpa o state de qualquer forma
        }

        set(clearState)
        // Redireciona para a pagina de login
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      },

      /**
      * Refresh do token via backend (cav4 conforme modo).
       * Usa header X-Refresh-Token conforme esperado pelo backend.
       */
      refreshSession: async () => {
        const { refreshToken: currentRefreshToken } = get()
        if (!currentRefreshToken) return false

        const authMode = getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "cav4"
        const refreshEndpoint =
          authMode === "cav4"
            ? "/api/auth/cav4/refresh"
            : "/api/auth/refresh"

        try {
          const response = await fetch(refreshEndpoint, {
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
