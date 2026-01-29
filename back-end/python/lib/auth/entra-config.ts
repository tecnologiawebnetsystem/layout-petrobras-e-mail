/**
 * Microsoft Entra ID (Azure AD) Configuration
 *
 * Este arquivo contém todas as configurações necessárias para autenticação
 * com o Microsoft Entra ID da Petrobras.
 */

import { type Configuration, PublicClientApplication } from "@azure/msal-browser"

/**
 * Obter redirect URI dinamicamente
 * Usa a variável de ambiente se configurada, senão usa window.location.origin
 */
function getRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI
  }
  // Em ambiente de browser, usar a origem atual (funciona em localhost e produção)
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  // Fallback para SSR
  return ""
}

/**
 * Configuração do MSAL (Microsoft Authentication Library)
 *
 * IMPORTANTE: As variáveis de ambiente devem ser fornecidas pelo time de infra
 */
export const msalConfig: Configuration = {
  auth: {
    // Client ID da aplicação registrada no Entra ID
    clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID || "",

    // Authority: URL do tenant da Petrobras
    // Formato: https://login.microsoftonline.com/{TENANT_ID}
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_ENTRA_TENANT_ID}`,

    // Redirect URI dinâmico - funciona em localhost e produção
    redirectUri: getRedirectUri(),

    // URL de redirecionamento após logout
    postLogoutRedirectUri: getRedirectUri(),

    navigateToLoginRequestUrl: true,
  },
  cache: {
    // Armazenar tokens no sessionStorage (mais seguro que localStorage)
    cacheLocation: "sessionStorage",

    // Prevenir problemas com múltiplas abas
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      // Logs apenas em desenvolvimento
      loggerCallback: (level: any, message: string, containsPii: boolean) => {
        if (containsPii) return

        if (process.env.NODE_ENV === "development") {
          console.log(`[Entra ID] ${message}`)
        }
      },
      piiLoggingEnabled: false,
      logLevel: process.env.NODE_ENV === "development" ? 3 : 0, // LogLevel.Info : LogLevel.Error
    },
  },
}

/**
 * Escopos solicitados ao Entra ID
 *
 * Estes escopos determinam quais informações podemos acessar do usuário
 */
export const loginRequest = {
  scopes: [
    "User.Read", // Ler perfil básico (nome, email)
    "User.ReadBasic.All", // Ler perfil completo (cargo, departamento, telefone, employeeId)
    "User.Read.All", // Ler informações de outros usuários (supervisor/manager)
    "email", // Obter email
    "profile", // Obter informações de perfil
    "openid", // OpenID Connect
  ],
}

/**
 * Inicializar MSAL Public Client Application
 *
 * Esta instância deve ser usada em todo o front-end
 */
export const msalInstance = new PublicClientApplication(msalConfig)

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
  const config = {
    clientId: process.env.NEXT_PUBLIC_ENTRA_CLIENT_ID,
    tenantId: process.env.NEXT_PUBLIC_ENTRA_TENANT_ID,
    redirectUri: process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI,
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
