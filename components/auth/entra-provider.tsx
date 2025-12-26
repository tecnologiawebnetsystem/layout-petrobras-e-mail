"use client"

/**
 * Entra ID Provider Component
 *
 * Componente que envolve a aplicação e fornece contexto de autenticação
 * do Microsoft Entra ID para todos os componentes filhos.
 */

import { type ReactNode, useEffect } from "react"
import { MsalProvider } from "@azure/msal-react"
import { EventType, type EventMessage, type AuthenticationResult } from "@azure/msal-browser"
import { msalInstance } from "@/lib/auth/entra-config"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getUserTypeFromEmail } from "@/lib/auth/entra-config"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"

interface EntraProviderProps {
  children: ReactNode
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { setAuth } = useAuthStore()
  const { addLog } = useAuditLogStore()

  useEffect(() => {
    // Inicializar MSAL
    msalInstance.initialize().then(() => {
      // Lidar com redirecionamento após login
      msalInstance
        .handleRedirectPromise()
        .then((response: AuthenticationResult | null) => {
          if (response !== null) {
            // Login bem-sucedido via redirect
            handleLoginSuccess(response)
          }
        })
        .catch((error: Error) => {
          console.error("[Entra ID] Erro ao lidar com redirecionamento:", error)
        })

      // Adicionar listener para eventos de autenticação
      const callbackId = msalInstance.addEventCallback((event: EventMessage) => {
        // Login bem-sucedido
        if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
          const payload = event.payload as AuthenticationResult
          handleLoginSuccess(payload)
        }

        // Logout bem-sucedido
        if (event.eventType === EventType.LOGOUT_SUCCESS) {
          handleLogoutSuccess()
        }

        // Erro de login
        if (event.eventType === EventType.LOGIN_FAILURE) {
          console.error("[Entra ID] Erro de login:", event.error)
          addLog({
            action: "login",
            level: "error",
            user: {
              id: "unknown",
              name: "Desconhecido",
              email: "unknown",
              type: "external",
            },
            details: {
              description: "Erro ao fazer login com Entra ID",
              metadata: {
                error: event.error?.message || "Erro desconhecido",
              },
            },
          })
        }
      })

      return () => {
        if (callbackId) {
          msalInstance.removeEventCallback(callbackId)
        }
      }
    })
  }, [setAuth, addLog])

  const handleLoginSuccess = (response: AuthenticationResult) => {
    console.log("[v0] Entra ID login success:", response)

    const account = response.account
    if (!account) {
      console.error("[Entra ID] Conta não encontrada no response")
      return
    }

    // Extrair dados do usuário
    const email = account.username || account.homeAccountId
    const name = account.name || "Usuário"
    const userType = getUserTypeFromEmail(email)

    console.log("[v0] Dados do usuário Entra ID:", { email, name, userType })

    // Salvar no auth store
    setAuth(
      {
        id: account.localAccountId,
        email,
        name,
        userType,
      },
      response.accessToken,
      response.idToken,
    )

    // Registrar no audit log
    addLog({
      action: "login",
      level: "success",
      user: {
        id: account.localAccountId,
        name,
        email,
        type: userType,
      },
      details: {
        description: "Login realizado com sucesso via Microsoft Entra ID",
        metadata: {
          authMethod: "entra-id",
          tenantId: account.tenantId,
        },
      },
    })
  }

  const handleLogoutSuccess = () => {
    console.log("[v0] Entra ID logout success")
    // O clearAuth já é chamado pelo botão de logout
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>
}
