"use client"

/**
 * Auth Provider — Entra ID (backend-driven).
 *
 * Responsabilidades:
 * - Valida sessao existente ao carregar a app (via backend)
 * - Logout sincronizado entre abas (via localStorage)
 *
 * NAO usa MSAL no frontend. Todo o fluxo OAuth2 Authorization Code
 * e conduzido pelo backend (/api/v1/auth/entra/authorize → callback).
 * O resultado do callback chega na pagina /auth/entra-callback com
 * tokens na query string, processados pelo callback page component.
 */

import { type ReactNode, useEffect, useRef } from "react"
import { setupCrossTabLogout } from "@/lib/auth/entra-security"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter, usePathname } from "next/navigation"

interface EntraProviderProps {
  children: ReactNode
}

// Rotas publicas que nao exigem autenticacao
const PUBLIC_ROUTES = [
  "/",
  "/auth/entra-callback",
  "/download",
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { isAuthenticated, validateSession, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const hasValidated = useRef(false)

  useEffect(() => {
    setupCrossTabLogout()
  }, [])

  // Valida sessao com o backend ao carregar
  useEffect(() => {
    if (!_hasHydrated || hasValidated.current) return

    // So valida se usuario parece autenticado (tem token no localStorage)
    if (!isAuthenticated) return

    // Nao valida em rotas publicas (evita loop)
    if (isPublicRoute(pathname)) return

    hasValidated.current = true

    validateSession().then((valid) => {
      if (!valid) {
        // Sessao invalida — redireciona para login
        router.replace("/")
      }
    })
  }, [_hasHydrated, isAuthenticated, validateSession, router, pathname])

  return <>{children}</>
}
