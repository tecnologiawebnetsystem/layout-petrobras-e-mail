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
import {
  validateEmailDomain,
  sessionMonitor,
  setupCrossTabLogout,
  triggerCrossTabLogout,
} from "@/lib/auth/entra-security"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { getUserProfile, getUserManager, getUserPhoto } from "@/lib/auth/graph-api"
import { loginRequest } from "@/lib/auth/entra-config" // Assuming loginRequest is defined somewhere

interface EntraProviderProps {
  children: ReactNode
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { setAuth, clearAuth } = useAuthStore()
  const { addLog } = useAuditLogStore()

  useEffect(() => {
    setupCrossTabLogout()

    // Inicializar MSAL
    msalInstance.initialize().then(() => {
      console.log("[v0] MSAL inicializado")

      const accounts = msalInstance.getAllAccounts()
      console.log("[v0] Contas encontradas no MSAL:", accounts.length)

      if (accounts.length > 0 && !useAuthStore.getState().user) {
        console.log("[v0] Conta encontrada mas usuário não autenticado, enriquecendo perfil")
        // Buscar token silenciosamente e enriquecer perfil
        msalInstance
          .acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          })
          .then((response) => {
            console.log("[v0] Token silencioso adquirido com sucesso")
            handleLoginSuccess(response)
          })
          .catch((error) => {
            console.error("[v0] Erro ao adquirir token silencioso:", error)
          })
      }

      // Lidar com redirecionamento após login
      msalInstance
        .handleRedirectPromise()
        .then((response: AuthenticationResult | null) => {
          console.log("[v0] handleRedirectPromise concluído:", !!response)
          if (response !== null) {
            console.log("[v0] Response de redirect encontrado, processando")
            handleLoginSuccess(response)
          }
        })
        .catch((error: Error) => {
          if (error.message?.includes("user_cancelled")) {
            return
          }
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
          const error = event.error

          if (error?.errorCode === "user_cancelled" || error?.message?.includes("user_cancelled")) {
            return
          }

          // Log apenas para erros reais
          console.error("[Entra ID] Erro de login:", error)
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
                error: error?.message || "Erro desconhecido",
                errorCode: error?.errorCode,
              },
            },
          })
        }
      })

      const account = msalInstance.getAllAccounts()[0]
      if (account) {
        sessionMonitor.start()
      }

      return () => {
        sessionMonitor.stop()
        if (callbackId) {
          msalInstance.removeEventCallback(callbackId)
        }
      }
    })
  }, [setAuth, addLog, clearAuth])

  const handleLoginSuccess = async (response: AuthenticationResult) => {
    const account = response.account
    if (!account) {
      console.error("[Entra ID] Conta não encontrada no response")
      return
    }

    // Extrair dados do usuário
    const email = account.username || account.homeAccountId
    const name = account.name || "Usuário"

    if (!validateEmailDomain(email)) {
      console.error("[Security] Email não pertence a domínio permitido:", email)

      addLog({
        action: "login",
        level: "error",
        user: {
          id: account.localAccountId,
          name,
          email,
          type: "external",
        },
        details: {
          description: "Tentativa de login com domínio não autorizado",
          metadata: {
            reason: "invalid_domain",
            email,
          },
        },
      })

      // Fazer logout imediatamente
      msalInstance.logoutRedirect()
      return
    }

    const userType = getUserTypeFromEmail(email)

    // Salvar no auth store (dados básicos primeiro)
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

    console.log("[Entra ID] Iniciando busca de dados do Graph API")

    let employeeId: string | undefined

    try {
      const [profile, manager, photo] = await Promise.all([getUserProfile(), getUserManager(), getUserPhoto()])

      console.log("[Entra ID] Resultados do Graph API:", {
        hasProfile: !!profile,
        hasManager: !!manager,
        hasPhoto: !!photo,
        photoUrl: photo,
      })

      // Enriquecer perfil do usuário com dados adicionais
      const enrichedData: any = {}

      if (profile) {
        enrichedData.jobTitle = profile.jobTitle
        enrichedData.department = profile.department
        enrichedData.officeLocation = profile.officeLocation
        enrichedData.mobilePhone = profile.mobilePhone
        enrichedData.employeeId = profile.employeeId
        employeeId = profile.employeeId
        console.log("[Entra ID] Perfil enriquecido com dados:", profile)
      }

      if (manager) {
        enrichedData.manager = {
          id: manager.id,
          name: manager.displayName,
          email: manager.mail,
          jobTitle: manager.jobTitle,
          department: manager.department,
        }
        console.log("[Entra ID] Supervisor encontrado:", manager.displayName)
      } else {
        console.log("[Entra ID] Supervisor não encontrado ou não configurado")
      }

      if (photo) {
        enrichedData.photoUrl = photo
        console.log("[Entra ID] Foto do perfil carregada")
      } else {
        console.log("[Entra ID] Foto do perfil não disponível")
      }

      // Atualizar store com dados enriquecidos
      if (Object.keys(enrichedData).length > 0) {
        useAuthStore.getState().enrichUserProfile(enrichedData)
        console.log("[Entra ID] Dados adicionais salvos no store")
      }

      console.log("[Entra ID] Perfil enriquecido com sucesso:", {
        hasProfile: !!profile,
        hasManager: !!manager,
        hasPhoto: !!photo,
      })
    } catch (error) {
      console.error("[Entra ID] Erro ao enriquecer perfil:", error)
      console.error("[v0] Detalhes do erro:", error)
      // Não bloqueia o login se falhar ao buscar dados adicionais
    }

    sessionMonitor.start()

    addLog({
      action: "login",
      level: "success",
      user: {
        id: account.localAccountId,
        name,
        email,
        type: userType,
        employeeId, // Incluindo employeeId capturado do Graph API
      },
      details: {
        description: "Login realizado com sucesso via Microsoft Entra ID",
        metadata: {
          authMethod: "entra-id",
          tenantId: account.tenantId,
          employeeId, // Também em metadata para facilitar análise
        },
      },
    })

    if (typeof window !== "undefined") {
      window.location.href = "/upload"
    }
  }

  const handleLogoutSuccess = () => {
    sessionMonitor.stop()

    triggerCrossTabLogout()
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>
}
