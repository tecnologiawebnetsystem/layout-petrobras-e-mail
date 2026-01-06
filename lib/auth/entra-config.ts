/**
 * Microsoft Entra ID (Azure AD) Configuration
 *
 * Este arquivo contém todas as configurações necessárias para autenticação
 * com o Microsoft Entra ID da Petrobras.
 */

import { type Configuration, PublicClientApplication } from "@azure/msal-browser"

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

    redirectUri: process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI || "",

    // URL de redirecionamento após logout
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_ENTRA_REDIRECT_URI || "",

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
 * @returns 'internal' se for @petrobras, 'supervisor' caso contrário
 */
export function getUserTypeFromEmail(email: string): "internal" | "supervisor" | "external" {
  const emailLower = email.toLowerCase()

  // Supervisores: lista específica de emails
  const supervisorEmails = [
    "wagner.brazil@petrobras.com.br",
    // Adicionar outros supervisores aqui
  ]

  if (supervisorEmails.includes(emailLower)) {
    return "supervisor"
  }

  // Usuários internos: domínio @petrobras
  if (emailLower.includes("@petrobras")) {
    return "internal"
  }

  // Demais: externos
  return "external"
}

/**
 * Verificar se as variáveis de ambiente estão configuradas
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

  if (!config.clientId) missing.push("NEXT_PUBLIC_ENTRA_CLIENT_ID")
  if (!config.tenantId) missing.push("NEXT_PUBLIC_ENTRA_TENANT_ID")
  if (!config.redirectUri) missing.push("NEXT_PUBLIC_ENTRA_REDIRECT_URI")

  return {
    configured: missing.length === 0,
    missing,
  }
}
