/**
 * Camada de Segurança de Sessão
 *
 * Monitoramento de inatividade, session binding e logout multi-aba.
 * MSAL removido: autenticação centralizada no backend.
 */

import { useAuthStore } from "@/lib/stores/auth-store"

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
  return Math.floor(remaining / 1000 / 60)
}

/**
 * Configurar logout sincronizado entre abas (via localStorage)
 */
export function setupCrossTabLogout() {
  if (typeof window === "undefined") return

  window.addEventListener("storage", (event) => {
    if (event.key === "entra_logout" && event.newValue === "true") {
      const { clearAuth } = useAuthStore.getState()
      clearAuth()
      window.location.href = "/"
    }
  })
}

/**
 * Disparar logout em todas as abas
 */
export function triggerCrossTabLogout() {
  if (typeof window === "undefined") return

  localStorage.setItem("entra_logout", "true")
  setTimeout(() => {
    localStorage.removeItem("entra_logout")
  }, 1000)
}
