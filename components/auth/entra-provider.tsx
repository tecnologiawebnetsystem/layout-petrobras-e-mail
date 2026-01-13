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
import { msalInstance, loginRequest } from "@/lib/auth/entra-config"
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

interface EntraProviderProps {
  children: ReactNode
}

export function EntraProvider({ children }: EntraProviderProps) {
  const { setAuth, clearAuth } = useAuthStore()
  const { addLog } = useAuditLogStore()

  useEffect(() => {
    setupCrossTabLogout()

    const initializeMsal = async () => {
      try {
        await msalInstance.initialize()
        console.log("[v0] MSAL inicializado")

        // Aguardar um momento para garantir que está completamente pronto
        await new Promise((resolve) => setTimeout(resolve, 200))

        const accounts = msalInstance.getAllAccounts()
        console.log("[v0] Contas encontradas no MSAL após inicialização:", accounts.length)

        const currentUser = useAuthStore.getState().user
        if (accounts.length > 0 && !currentUser) {
          console.log("[v0] Conta MSAL encontrada sem usuário no store, enriquecendo perfil")
          console.log("[v0] Email da conta:", accounts[0].username)
          console.log("[v0] Tentando adquirir token silencioso com scopes:", loginRequest.scopes)

          try {
            const response = await msalInstance.acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
            })
            console.log("[v0] Token silencioso adquirido com sucesso")
            await handleLoginSuccess(response)
          } catch (error) {
            console.error("[v0] Erro ao adquirir token silencioso:", error)
            if (error && typeof error === "object") {
              const errorObj = error as any
              console.error("[v0] Detalhes do erro:", {
                errorCode: errorObj.errorCode || "unknown",
                errorMessage: errorObj.errorMessage || errorObj.message || "No details",
              })
            }

            console.log("[v0] Tentando login popup interativo")
            try {
              const popupResponse = await msalInstance.loginPopup(loginRequest)
              console.log("[v0] Login popup bem-sucedido")
              await handleLoginSuccess(popupResponse)
            } catch (popupError) {
              console.error("[v0] Erro no login popup:", popupError)
            }
          }
        }

        // Lidar com redirecionamento após login
        try {
          const response = await msalInstance.handleRedirectPromise()
          console.log("[v0] handleRedirectPromise concluído:", !!response)
          if (response !== null) {
            console.log("[v0] Response de redirect encontrado, processando")
            await handleLoginSuccess(response)
          }
        } catch (error: any) {
          if (error.message?.includes("user_cancelled")) {
            return
          }
          console.error("[Entra ID] Erro ao lidar com redirecionamento:", error)
        }

        const handleCustomLoginEvent = async (event: Event) => {
          const customEvent = event as CustomEvent
          console.log("[v0] Evento customizado de login recebido")
          if (customEvent.detail?.response) {
            await handleLoginSuccess(customEvent.detail.response)
          }
        }

        window.addEventListener("msal-login-success", handleCustomLoginEvent)

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
          window.removeEventListener("msal-login-success", handleCustomLoginEvent)
          if (callbackId) {
            msalInstance.removeEventCallback(callbackId)
          }
        }
      } catch (error) {
        console.error("[v0] Erro ao inicializar MSAL:", error)
      }
    }

    initializeMsal()
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

      interface EnrichedData {
        jobTitle?: string
        department?: string
        officeLocation?: string
        mobilePhone?: string
        employeeId?: string
        manager?: {
          id: string
          name: string
          email: string
          jobTitle?: string
          department?: string
        }
        photoUrl?: string
      }

      const enrichedData: EnrichedData = {}

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
