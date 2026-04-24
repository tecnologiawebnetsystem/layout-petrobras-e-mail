"use client"

/**
 * Auth Provider
 *
 * Envolve a aplicação e configura comportamentos globais de sessão:
 * - Processa o resultado do loginRedirect quando a Microsoft redireciona
 *   de volta para localhost:3000 com o ?code=...
 *   handleRedirectPromise() detecta isso, troca o código por tokens no
 *   browser (PKCE), e aqui fazemos a troca com o backend.
 * - Logout sincronizado entre abas (via localStorage)
 */

import { type ReactNode, useEffect } from "react"
import { setupCrossTabLogout } from "@/lib/auth/entra-security"
import { getMsalInstance } from "@/lib/auth/msal-config"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { getUserTypeFromEmail } from "@/lib/auth/entra-config"

interface EntraProviderProps {
  children: ReactNode
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { setAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    setupCrossTabLogout()

    getMsalInstance()
      .then(async (msal) => {
        // Processa o redirect de volta da Microsoft.
        // Retorna null em cargas de página normais (sem redirect pendente).
        const result = await msal.handleRedirectPromise()
        if (!result) return

        const idToken = result.idToken
        const accessToken = result.accessToken

        try {
          const res = await fetch("/api/auth/internal/entra", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "X-Graph-Token": accessToken,
            },
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.detail ?? "Erro ao autenticar")

          const userType = getUserTypeFromEmail(data.email, data.job_title)

          setAuth(
            {
              id: String(data.user_id),
              email: data.email,
              name: data.name,
              userType,
              jobTitle: data.job_title,
              department: data.department,
              employeeId: data.employee_id,
              photoUrl: data.photo_url,
              manager: data.manager_email
                ? { id: data.manager_email, name: data.manager_name ?? "", email: data.manager_email }
                : undefined,
            },
            data.access_token,
            data.refresh_token,
          )

          const destination =
            userType === "supervisor" ? "/supervisor" :
            userType === "internal"   ? "/upload" :
                                        "/download"
          router.replace(destination)
        } catch {
          router.replace("/?error=auth_failed")
        }
      })
      .catch(() => {
        // MSAL não inicializou (ex: variáveis de ambiente ausentes no build).
      })
  }, [setAuth, router])

  return <>{children}</>
}
