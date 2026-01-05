"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMsal } from "@azure/msal-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getUserTypeFromEmail } from "@/lib/auth/entra-config"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedUserTypes: Array<"internal" | "external" | "supervisor">
}

export function ProtectedRoute({ children, allowedUserTypes }: ProtectedRouteProps) {
  const { instance, accounts } = useMsal()
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      if (accounts.length > 0 && !isAuthenticated) {
        const account = accounts[0]

        try {
          // Tentar obter token silenciosamente (SSO)
          const response = await instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: account,
          })

          // Login automático com SSO
          const email = account.username || account.homeAccountId
          const name = account.name || "Usuário"
          const userType = getUserTypeFromEmail(email)

          setAuth(
            {
              id: account.localAccountId,
              email,
              name,
              userType,
            },
            response.accessToken,
            response.idToken || "",
          )

          setIsChecking(false)
          return
        } catch (error) {
          console.error("Erro ao obter token silenciosamente:", error)
        }
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
    }

    checkAuth()
  }, [accounts, instance, isAuthenticated, user, allowedUserTypes, router, setAuth])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-[#00A99D] border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
