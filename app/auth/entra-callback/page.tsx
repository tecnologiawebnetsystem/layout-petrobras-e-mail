"use client"

/**
 * /auth/entra-callback
 *
 * Processa o redirect do Microsoft Entra ID apos autenticacao MSAL (fluxo SPA).
 *
 * Fluxo:
 *   1. MSAL redireciona o browser para esta pagina apos login na Microsoft
 *   2. handleRedirectPromise() processa o hash/code da URL e retorna os tokens
 *   3. Frontend envia id_token + access_token para o backend (POST /api/auth/entra/token)
 *   4. Backend valida, verifica grupo e retorna JWT interno + dados do usuario
 *   5. Salva no auth store e redireciona para o dashboard
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getMsalInstance } from "@/lib/auth/msal-config"
import { Suspense } from "react"

function CallbackContent() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const handleMsalCallback = async () => {
      try {
        const msal = await getMsalInstance()
        const result = await msal.handleRedirectPromise()

        if (!result) {
          // Nao e uma resposta de redirect do MSAL — voltar para login
          console.warn("[EntraCallback] handleRedirectPromise retornou null.")
          router.replace("/")
          return
        }

        // Trocar tokens Microsoft por JWT interno via backend
        const resp = await fetch("/api/auth/entra/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: result.idToken,
            access_token: result.accessToken,
          }),
        })

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}))
          const msg = err.detail || "Falha na autenticacao"
          console.error("[EntraCallback] Erro do backend:", msg)
          router.replace(`/?error=${encodeURIComponent(msg)}`)
          return
        }

        const data = await resp.json()
        const u = data.user
        const role: string = (u.role || "").toLowerCase()

        let userType: "internal" | "external" | "supervisor" | "admin"
        if (role === "admin") userType = "admin"
        else if (role === "supervisor") userType = "supervisor"
        else if (role === "external") userType = "external"
        else userType = "internal"

        const dest =
          userType === "admin" ? "/admin" :
          userType === "supervisor" ? "/supervisor" :
          userType === "external" ? "/download" :
          "/upload"

        setAuth(
          {
            id: String(u.id),
            email: u.email || "",
            name: u.name || "",
            userType,
            isAdmin: role === "admin",
            jobTitle: u.job_title || undefined,
            department: u.department || undefined,
            employeeId: u.employee_id || undefined,
            photoUrl: u.photo_url || undefined,
            manager: u.manager
              ? {
                  id: String(u.manager.id),
                  name: u.manager.name,
                  email: u.manager.email,
                  jobTitle: u.manager.job_title || undefined,
                  department: u.manager.department || undefined,
                }
              : undefined,
          },
          data.access_token,
          data.refresh_token,
        )

        router.replace(dest)
      } catch (err) {
        console.error("[EntraCallback] Erro inesperado:", err)
        router.replace("/?error=auth_failed")
      }
    }

    handleMsalCallback()
  }, [router, setAuth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto" />
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
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
