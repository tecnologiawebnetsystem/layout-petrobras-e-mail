/**
 * Configuração de Autenticação – Entra ID
 *
 * MSAL removido: toda a autenticação é tratada pelo backend (csa-backend).
 * O frontend inicia o fluxo OAuth redirecionando para /api/auth/internal/entra-login,
 * que o backend processa e redireciona de volta com um JWT de sessão.
 */

import { getClientEnv } from "@/lib/env"

/**
 * Tipos de usuario baseados no email e cargo.
 *
 * IMPORTANTE: A deteccao real de supervisor e feita pelo BACKEND via:
 * - Grupo Entra ID (entra_supervisor_group_ids)
 * - Cargo (jobTitle) contendo termos como "gerente", "coordenador", etc.
 * - Flag is_supervisor no banco de dados
 *
 * Esta funcao e apenas um fallback para UI antes da autenticacao completa.
 * O tipo real do usuario vem do backend apos o login.
 *
 * @param email Email do usuario autenticado
 * @param jobTitle Cargo do usuario (opcional)
 * @param isSupervisor Flag do backend indicando se e supervisor (opcional)
 * @returns 'supervisor' se flag true ou cargo de gerencia, 'internal' se @petrobras, 'external' caso contrario
 */
export function getUserTypeFromEmail(
  email: string,
  jobTitle?: string,
  isSupervisor?: boolean
): "internal" | "supervisor" | "external" {
  const emailLower = email.toLowerCase()

  // Usuarios externos (nao Petrobras)
  if (!emailLower.includes("@petrobras")) {
    return "external"
  }

  // Se o backend ja informou que e supervisor, usar essa informacao
  if (isSupervisor === true) {
    return "supervisor"
  }

  // Identificar supervisor pelo cargo (se disponivel)
  if (jobTitle) {
    const jobTitleLower = jobTitle.toLowerCase()
    const supervisorTitles = ["gerente", "coordenador", "diretor", "superintendente", "chefe", "lider", "supervisor"]
    
    if (supervisorTitles.some(title => jobTitleLower.includes(title))) {
      return "supervisor"
    }
  }

  // Usuarios internos: dominio @petrobras sem cargo de gerencia
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
