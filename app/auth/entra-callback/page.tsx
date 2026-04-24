"use client"

/**
 * /auth/entra-callback
 *
 * Esta página não é mais usada pelo fluxo MSAL (o login é feito via popup
 * diretamente em login-form.tsx). Existe apenas como fallback para evitar
 * 404 em bookmarks ou links antigos — redireciona para a raiz.
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function EntraCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/?error=auth_failed")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#0047BB] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Redirecionando...</p>
      </div>
    </div>
  )
}
