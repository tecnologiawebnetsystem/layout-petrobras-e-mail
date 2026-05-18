"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { validateSessionContext, initializeSessionBinding } from "@/lib/auth/session-binding"
import { showAlert } from "@/lib/stores/alert-store"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes: Array<"internal" | "external" | "supervisor" | "admin" | "support">
}

// Verifica se e um token de desenvolvimento (modo teste)
function isDevToken(token: string | null): boolean {
  return token?.startsWith("dev-token-") || token?.startsWith("dev-refresh-token-") || false
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, isAuthenticated, accessToken, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!_hasHydrated) return

    initializeSessionBinding()

    const sessionValidation = validateSessionContext()
    if (!sessionValidation.valid) {
      showAlert.error(
        "Sessão Invalidada",
        "Sua sessão foi invalidada por motivos de segurança. Por favor, faça login novamente.",
      )
      router.push("/")
      return
    }

    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Em modo desenvolvimento (token dev), pula a validacao de sessao com o backend
    if (isDevToken(accessToken)) {
      if (user && !allowedUserTypes.includes(user.userType)) {
        showAlert.error(
          "Acesso Negado",
          "Voce nao tem permissao para acessar esta pagina.",
        )
        router.push("/")
        return
      }
      setIsChecking(false)
      return
    }

    if (user && !allowedUserTypes.includes(user.userType)) {
      router.push("/")
      return
    }

    setIsChecking(false)
  }, [_hasHydrated, isAuthenticated, user, allowedUserTypes, router, accessToken])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
