/**
 * Microsoft Entra ID - Camada de Segurança Avançada
 *
 * Implementa validações e proteções de segurança para SSO
 */

import { msalInstance } from "./entra-config"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"

/**
 * Domínios permitidos para autenticação
 */
const ALLOWED_DOMAINS = ["@petrobras.com.br", "@petrobras.com"]

/**
 * Timeout de sessão (em milissegundos)
 * Padrão: 30 minutos de inatividade
 */
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutos

/**
 * Intervalo para verificar expiração de token
 * Padrão: Verificar a cada 1 minuto
 */
const TOKEN_CHECK_INTERVAL = 60 * 1000 // 1 minuto

/**
 * Validar se o email pertence a um domínio permitido
 */
export function validateEmailDomain(email: string): boolean {
  const emailLower = email.toLowerCase()
  return ALLOWED_DOMAINS.some((domain) => emailLower.endsWith(domain))
}

/**
 * Validar se o token ainda é válido
 */
export function isTokenValid(expiresOn?: Date): boolean {
  if (!expiresOn) return false

  const now = new Date().getTime()
  const expiration = new Date(expiresOn).getTime()

  // Token válido se ainda não expirou
  return expiration > now
}

/**
 * Calcular tempo restante até expiração do token (em minutos)
 */
export function getTokenTimeRemaining(expiresOn?: Date): number {
  if (!expiresOn) return 0

  const now = new Date().getTime()
  const expiration = new Date(expiresOn).getTime()
  const remaining = expiration - now

  return Math.floor(remaining / 1000 / 60) // Converter para minutos
}

/**
 * Renovar token automaticamente (Refresh Token)
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const account = msalInstance.getAllAccounts()[0]
    if (!account) {
      console.error("[Security] Nenhuma conta encontrada para refresh")
      return false
    }

    // Tentar renovar token silenciosamente
    const response = await msalInstance.acquireTokenSilent({
      account,
      scopes: ["User.Read", "email", "profile", "openid"],
    })

    if (response && response.accessToken) {
      // Atualizar tokens no store
      const { setTokens } = useAuthStore.getState()
      setTokens(response.accessToken, response.idToken)

      console.log("[Security] Token renovado com sucesso")
      return true
    }

    return false
  } catch (error) {
    console.error("[Security] Erro ao renovar token:", error)
    return false
  }
}

/**
 * Monitor de sessão - Verifica inatividade e expiração
 */
export class SessionMonitor {
  private inactivityTimer: NodeJS.Timeout | null = null
  private tokenCheckTimer: NodeJS.Timeout | null = null
  private lastActivity: number = Date.now()

  /**
   * Iniciar monitoramento de sessão
   */
  start() {
    // Resetar timer de inatividade
    this.resetInactivityTimer()

    // Iniciar verificação periódica de token
    this.startTokenCheck()

    // Adicionar listeners para atividade do usuário
    this.addActivityListeners()

    console.log("[Security] Monitor de sessão iniciado")
  }

  /**
   * Parar monitoramento de sessão
   */
  stop() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }

    if (this.tokenCheckTimer) {
      clearInterval(this.tokenCheckTimer)
      this.tokenCheckTimer = null
    }

    this.removeActivityListeners()

    console.log("[Security] Monitor de sessão parado")
  }

  /**
   * Resetar timer de inatividade
   */
  private resetInactivityTimer() {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.lastActivity = Date.now()

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout()
    }, SESSION_TIMEOUT)
  }

  /**
   * Lidar com timeout de inatividade
   */
  private handleInactivityTimeout() {
    console.warn("[Security] Sessão expirada por inatividade")

    const { addLog } = useAuditLogStore.getState()
    const { user, clearAuth } = useAuthStore.getState()

    // Registrar logout por inatividade
    if (user) {
      addLog({
        action: "logout",
        level: "warning",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.userType,
        },
        details: {
          description: "Sessão encerrada por inatividade",
          metadata: {
            reason: "timeout",
            inactivityMinutes: SESSION_TIMEOUT / 1000 / 60,
          },
        },
      })
    }

    // Fazer logout
    clearAuth()
    msalInstance.logoutRedirect()
  }

  /**
   * Iniciar verificação periódica de token
   */
  private startTokenCheck() {
    this.tokenCheckTimer = setInterval(async () => {
      const account = msalInstance.getAllAccounts()[0]
      if (!account) return

      const { user } = useAuthStore.getState()
      if (!user) return

      // Verificar se token está próximo de expirar (menos de 5 minutos)
      const idTokenClaims = account.idTokenClaims as any
      if (idTokenClaims?.exp) {
        const expiresOn = new Date(idTokenClaims.exp * 1000)
        const minutesRemaining = getTokenTimeRemaining(expiresOn)

        if (minutesRemaining < 5 && minutesRemaining > 0) {
          console.log("[Security] Token expirando em breve, renovando...")
          await refreshToken()
        } else if (minutesRemaining <= 0) {
          console.warn("[Security] Token expirado")
          this.handleTokenExpired()
        }
      }
    }, TOKEN_CHECK_INTERVAL)
  }

  /**
   * Lidar com token expirado
   */
  private handleTokenExpired() {
    const { addLog } = useAuditLogStore.getState()
    const { user, clearAuth } = useAuthStore.getState()

    if (user) {
      addLog({
        action: "logout",
        level: "warning",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.userType,
        },
        details: {
          description: "Sessão encerrada por expiração de token",
          metadata: {
            reason: "token_expired",
          },
        },
      })
    }

    clearAuth()
    msalInstance.logoutRedirect()
  }

  /**
   * Adicionar listeners para atividade do usuário
   */
  private addActivityListeners() {
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"]

    activityEvents.forEach((event) => {
      window.addEventListener(event, this.handleActivity.bind(this))
    })
  }

  /**
   * Remover listeners de atividade
   */
  private removeActivityListeners() {
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"]

    activityEvents.forEach((event) => {
      window.removeEventListener(event, this.handleActivity.bind(this))
    })
  }

  /**
   * Lidar com atividade do usuário
   */
  private handleActivity() {
    this.resetInactivityTimer()
  }

  /**
   * Obter tempo de inatividade (em minutos)
   */
  getInactivityTime(): number {
    const now = Date.now()
    const inactive = now - this.lastActivity
    return Math.floor(inactive / 1000 / 60)
  }
}

/**
 * Instância global do monitor de sessão
 */
export const sessionMonitor = new SessionMonitor()

/**
 * Logout em todas as abas abertas
 */
export function setupCrossTabLogout() {
  if (typeof window === "undefined") return

  // Usar localStorage para comunicação entre abas
  window.addEventListener("storage", (event) => {
    if (event.key === "entra_logout" && event.newValue === "true") {
      console.log("[Security] Logout detectado em outra aba")

      const { clearAuth } = useAuthStore.getState()
      clearAuth()

      // Redirecionar para login
      window.location.href = "/"
    }
  })
}

/**
 * Triggar logout em todas as abas
 */
export function triggerCrossTabLogout() {
  if (typeof window === "undefined") return

  localStorage.setItem("entra_logout", "true")
  setTimeout(() => {
    localStorage.removeItem("entra_logout")
  }, 1000)
}
