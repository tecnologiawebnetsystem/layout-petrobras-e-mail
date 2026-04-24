/**
 * Configuração de Autenticação – Entra ID
 *
 * MSAL removido: toda a autenticação é tratada pelo backend (csa-backend).
 * O frontend inicia o fluxo OAuth redirecionando para /api/auth/internal/entra-login,
 * que o backend processa e redireciona de volta com um JWT de sessão.
 */

import { getClientEnv } from "@/lib/env"

/**
 * Tipos de usuário baseados no email
 *
 * @param email Email do usuário autenticado
 * @param jobTitle Cargo do usuário (opcional) - usado para identificar supervisores
 * @returns 'internal' se for @petrobras, 'supervisor' se tiver cargo de gerente, 'external' caso contrário
 */
export function getUserTypeFromEmail(email: string, jobTitle?: string): "internal" | "supervisor" | "external" {
  const emailLower = email.toLowerCase()

  // Usuários externos (não Petrobras)
  if (!emailLower.includes("@petrobras")) {
    return "external"
  }

  // Supervisores: lista específica de emails OU cargo de gerente/coordenador
  const supervisorEmails = [
    "wagner.brazil@petrobras.com.br",
    "sabrina.araujo@petrobras.com.br",
    // Adicionar outros supervisores aqui
  ]

  if (supervisorEmails.includes(emailLower)) {
    return "supervisor"
  }

  // Identificar supervisor pelo cargo (se disponível)
  if (jobTitle) {
    const jobTitleLower = jobTitle.toLowerCase()
    const supervisorTitles = ["gerente", "coordenador", "diretor", "superintendente", "chefe", "líder", "supervisor"]
    
    if (supervisorTitles.some(title => jobTitleLower.includes(title))) {
      return "supervisor"
    }
  }

  // Usuários internos: domínio @petrobras sem cargo de gerência
  return "internal"
}

/**
 * Verificar se as variáveis de ambiente estão configuradas
 * 
 * Nota: O redirect URI pode estar vazio em localhost, pois usamos
 * window.location.origin dinamicamente. Apenas clientId e tenantId são obrigatórios.
 */
export function checkEntraIdConfig(): {
  configured: boolean
  missing: string[]
} {
  // NEXT_PUBLIC_AUTH_MODE=dev força login local (email+senha), ignorando credenciais Entra ID.
  // NEXT_PUBLIC_AUTH_MODE=entra (ou ausente) usa o fluxo Microsoft normalmente.
  // Usa getClientEnv() para ler o valor runtime (window.__ENV__ no cliente, process.env no servidor).
  if (getClientEnv("NEXT_PUBLIC_AUTH_MODE") === "dev") {
    return { configured: false, missing: [] }
  }

  const config = {
    clientId: getClientEnv("NEXT_PUBLIC_ENTRA_CLIENT_ID"),
    tenantId: getClientEnv("NEXT_PUBLIC_ENTRA_TENANT_ID"),
    redirectUri: getClientEnv("NEXT_PUBLIC_ENTRA_REDIRECT_URI"),
  }

  const missing: string[] = []

  // Apenas clientId e tenantId são obrigatórios
  // redirectUri pode ser gerado dinamicamente com window.location.origin
  if (!config.clientId) missing.push("NEXT_PUBLIC_ENTRA_CLIENT_ID")
  if (!config.tenantId) missing.push("NEXT_PUBLIC_ENTRA_TENANT_ID")

  return {
    configured: missing.length === 0,
    missing,
  }
}
