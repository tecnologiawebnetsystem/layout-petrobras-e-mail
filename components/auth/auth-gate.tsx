"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { resolvePostLoginRoute, type FrontendUserType } from "@/lib/auth/cav4-config"

type GateStatus = "checking" | "redirecting" | "unauthenticated"

/**
 * Portao de entrada da rota "/".
 *
 * Regra unica desta camada: ao acessar a URL, se ja existir uma sessao valida,
 * o usuario e redirecionado direto para a area do seu papel (admin/supervisor/
 * remetente/externo) — sem precisar clicar em "login corporativo".
 * A tela de login (children) so aparece quando NAO ha sessao valida.
 *
 * A validacao e feita contra o backend (validateSession), portanto um token
 * antigo/expirado no localStorage nao redireciona para uma area protegida:
 * ele e descartado e o login e exibido.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const hasHydrated = useAuthStore((s) => s._hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const validateSession = useAuthStore((s) => s.validateSession)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const [status, setStatus] = useState<GateStatus>("checking")
  // Evita rodar a verificacao mais de uma vez (StrictMode / re-renders).
  const checkedRef = useRef(false)

  useEffect(() => {
    // Aguarda a hidratacao do store a partir do localStorage.
    if (!hasHydrated || checkedRef.current) return
    checkedRef.current = true

    // Sem sessao local -> mostra o login imediatamente.
    if (!isAuthenticated || !user) {
      setStatus("unauthenticated")
      return
    }

    // Ha sessao local: confirma com o backend antes de redirecionar.
    let active = true
    ;(async () => {
      const valid = await validateSession()
      if (!active) return

      if (valid) {
        const dest = resolvePostLoginRoute(user.userType as FrontendUserType)
        setStatus("redirecting")
        router.replace(dest)
      } else {
        clearAuth()
        setStatus("unauthenticated")
      }
    })()

    return () => {
      active = false
    }
  }, [hasHydrated, isAuthenticated, user, validateSession, clearAuth, router])

  if (status === "unauthenticated") {
    return <>{children}</>
  }

  // "checking" (validando sessao) ou "redirecting" (indo para a area do papel)
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <img
          src="/images/petrobras-full-logo.png"
          alt="Petrobras - Logo oficial"
          className="h-12 w-auto"
          width={180}
          height={48}
        />
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm font-medium">
            {status === "redirecting"
              ? "Acesso confirmado. Redirecionando..."
              : "Verificando sua sessao..."}
          </span>
        </div>
      </div>
    </div>
  )
}
