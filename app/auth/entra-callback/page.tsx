"use client"

/**
 * /auth/entra-callback
 *
 * Processa o redirect do backend apos autenticacao OAuth2 com Entra ID.
 *
 * O backend redireciona para esta pagina com os seguintes query params:
 *   - access_token: JWT interno emitido pelo backend
 *   - refresh_token: token para renovacao
 *   - expires_in: tempo de vida do access_token em segundos
 *   - user_info: JSON URL-encoded com dados do usuario
 *   - error: mensagem de erro (se falha na autenticacao)
 */

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Suspense } from "react"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // Verifica se houve erro na autenticacao
    const error = searchParams.get("error")
    if (error) {
      console.error("[EntraCallback] Erro retornado pelo backend:", error)
      router.replace(`/?error=${encodeURIComponent(error)}`)
      return
    }

    // Extrai tokens
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")
    const userInfoRaw = searchParams.get("user_info")

    if (!accessToken || !refreshToken || !userInfoRaw) {
      console.error("[EntraCallback] Parametros ausentes na URL.")
      router.replace("/?error=auth_failed")
      return
    }

    // Parseia dados do usuario
    try {
      const userInfo = JSON.parse(decodeURIComponent(userInfoRaw))

      // Mapeia role do backend para userType do frontend
      let userType: "internal" | "external" | "supervisor" | "support" = "internal"
      const role = (userInfo.role || "").toLowerCase()
      if (role.includes("supervisor")) userType = "supervisor"
      else if (role.includes("support") || role.includes("suporte")) userType = "support"
      else if (role.includes("external") || role.includes("externo")) userType = "external"

      const user = {
        id: String(userInfo.id),
        email: userInfo.email || "",
        name: userInfo.name || "",
        userType,
        jobTitle: userInfo.job_title || undefined,
        department: userInfo.department || undefined,
        employeeId: userInfo.employee_id || undefined,
        photoUrl: userInfo.photo_url || undefined,
      }

      // Salva no auth store (Zustand + persist)
      setAuth(user, accessToken, refreshToken)

      // Redireciona para dashboard
      router.replace("/dashboard")
    } catch (parseError) {
      console.error("[EntraCallback] Erro ao parsear user_info:", parseError)
      router.replace("/?error=auth_failed")
    }
  }, [searchParams, setAuth, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0047BB] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-foreground font-medium">Autenticando...</p>
        <p className="text-muted-foreground text-sm">
          Processando sua autenticacao com a Microsoft
        </p>
      </div>
    </div>
  )
}

export default function EntraCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-[#0047BB] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
