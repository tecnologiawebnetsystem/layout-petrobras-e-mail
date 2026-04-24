/**
 * Session Hijacking Protection
 *
 * Vincula sessão ao contexto do usuário (IP, User-Agent)
 * para prevenir roubo de sessão
 */

interface SessionContext {
  userAgent: string
  screenResolution: string
  timezone: string
  language: string
  createdAt: number
}

const SESSION_CONTEXT_KEY = "session_context"

/**
 * Capturar contexto da sessão atual
 */
export function captureSessionContext(): SessionContext {
  if (typeof window === "undefined") {
    return {
      userAgent: "",
      screenResolution: "",
      timezone: "",
      language: "",
      createdAt: Date.now(),
    }
  }

  return {
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    createdAt: Date.now(),
  }
}

/**
 * Salvar contexto da sessão
 */
export function saveSessionContext(context: SessionContext): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.setItem(SESSION_CONTEXT_KEY, JSON.stringify(context))
  } catch (error) {
    // console.error("[Session Binding] Erro ao salvar contexto:", error)
  }
}

/**
 * Obter contexto salvo da sessão
 */
export function getSavedSessionContext(): SessionContext | null {
  if (typeof window === "undefined") return null

  try {
    const saved = sessionStorage.getItem(SESSION_CONTEXT_KEY)
    if (!saved) return null

    return JSON.parse(saved)
  } catch (error) {
    // console.error("[Session Binding] Erro ao recuperar contexto:", error)
    return null
  }
}

/**
 * Validar se o contexto atual corresponde ao contexto salvo
 */
export function validateSessionContext(): {
  valid: boolean
  reason?: string
} {
  const saved = getSavedSessionContext()
  if (!saved) {
    return { valid: true } // Primeira validação
  }

  const current = captureSessionContext()

  // Validar User-Agent (obrigatório)
  if (saved.userAgent !== current.userAgent) {
    return {
      valid: false,
      reason: "User-Agent alterado - possível session hijacking",
    }
  }

  // Validar resolução de tela (alerta, não bloqueia)
  if (saved.screenResolution !== current.screenResolution) {
    // console.warn("[Session Binding] Resolução de tela alterada")
  }

  // Validar timezone (alerta, não bloqueia)
  if (saved.timezone !== current.timezone) {
    // console.warn("[Session Binding] Timezone alterado")
  }

  return { valid: true }
}

/**
 * Limpar contexto da sessão
 */
export function clearSessionContext(): void {
  if (typeof window === "undefined") return

  try {
    sessionStorage.removeItem(SESSION_CONTEXT_KEY)
  } catch (error) {
    // console.error("[Session Binding] Erro ao limpar contexto:", error)
  }
}

import { showAlert } from "@/lib/stores/alert-store"

/**
 * Inicializar proteção de session hijacking
 */
export function initializeSessionBinding(): void {
  if (typeof window === "undefined") return

  // Capturar e salvar contexto inicial
  const context = captureSessionContext()
  saveSessionContext(context)

  setInterval(() => {
    const validation = validateSessionContext()

    if (!validation.valid) {
      // console.error("[Session Binding]", validation.reason)

      if (typeof window !== "undefined") {
        showAlert.error(
          "Sessão Invalidada",
          "Sua sessão foi invalidada por motivos de segurança. Você será redirecionado para a página inicial.",
        )
        setTimeout(() => {
          window.location.href = "/"
        }, 2000)
      }
    }
  }, 30 * 1000)
}
