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

// HOMOLOGACAO: Definir como true para permitir acesso sem autenticacao
// IMPORTANTE: Mudar para false em producao!
const HOMOLOGATION_MODE = true

// Usuario mock para homologacao
const MOCK_ADMIN_USER = {
  id: "homologacao-admin-001",
  email: "admin.homologacao@petrobras.com.br",
  name: "Admin Homologacao",
  userType: "admin" as const,
  isAdmin: true,
  jobTitle: "Administrador do Sistema",
  department: "TI - Desenvolvimento",
  officeLocation: "EDISE",
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { user, isAuthenticated, _hasHydrated, setAuth } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(!HOMOLOGATION_MODE)

  useEffect(() => {
    // Se modo homologacao esta ativo, configura usuario mock e permite acesso direto
    if (HOMOLOGATION_MODE) {
      // Se nao ha usuario autenticado, configura o mock admin
      if (!user) {
        setAuth(MOCK_ADMIN_USER, "homologacao-token", "homologacao-refresh")
      }
      return
    }

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

    if (user && !allowedUserTypes.includes(user.userType)) {
      router.push("/")
      return
    }

    setIsChecking(false)
  }, [_hasHydrated, isAuthenticated, user, allowedUserTypes, router])

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
