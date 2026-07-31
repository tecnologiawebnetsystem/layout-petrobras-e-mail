"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { validateSessionContext, initializeSessionBinding } from "@/lib/auth/session-binding"
import { showAlert } from "@/lib/stores/alert-store"
import { checkAnyPermission, type Permission } from "@/lib/auth/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes: Array<"internal" | "external" | "supervisor" | "admin" | "support">
  /**
   * Permissoes granulares exigidas (modelo RBAC CAv4).
   * Basta UMA das permissoes listadas estar presente para conceder acesso.
   * Quando fornecido, e usado como criterio primario; `allowedUserTypes`
   * funciona como fallback para sessoes sem campo `permissions`.
   */
  requiredPermissions?: Permission[]
}

export function ProtectedRoute({ children, allowedUserTypes, requiredPermissions }: ProtectedRouteProps) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  // Evita que o useEffect execute mais de uma vez (React StrictMode / re-renders).
  const checkedRef = useRef(false)

  useEffect(() => {
    // Aguarda a hidratação do store e garante execução única.
    if (!_hasHydrated || checkedRef.current) return
    checkedRef.current = true

    initializeSessionBinding()

    const sessionValidation = validateSessionContext()
    if (!sessionValidation.valid) {
      showAlert.error(
        "Sessão Invalidada",
        "Sua sessão foi invalidada por motivos de segurança. Por favor, faça login novamente.",
      )
      // replace evita que o usuário volte para a página protegida com o botão "Voltar"
      router.replace("/")
      return
    }

    if (!isAuthenticated) {
      router.replace("/")
      return
    }

    if (user) {
      const hasRole = allowedUserTypes.includes(user.userType)

      // Se há permissões granulares definidas, usa-as como critério primário.
      // Fallback para userType quando o campo permissions ainda não existe na sessão.
      const hasAccess = requiredPermissions
        ? checkAnyPermission(user.permissions, requiredPermissions) || hasRole
        : hasRole

      if (!hasAccess) {
        router.replace("/")
        return
      }
    }

    setIsChecking(false)
  }, [_hasHydrated, isAuthenticated, user, allowedUserTypes, requiredPermissions, router])

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
