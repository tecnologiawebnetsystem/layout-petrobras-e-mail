/**
 * Configuração do MSAL (Microsoft Authentication Library).
 *
 * App Registration configurado como SPA no Azure:
 * - Nenhum client_secret é usado aqui (nem pode)
 * - O MSAL realiza o fluxo Authorization Code + PKCE inteiramente no browser
 * - O backend recebe apenas o id_token já emitido e o valida via JWKS
 */

import {
  PublicClientApplication,
  Configuration,
  LogLevel,
} from "@azure/msal-browser"
import { getClientEnv } from "@/lib/env"

// Lê de window.__ENV__ no cliente (runtime) em vez do valor baked no bundle (build-time).
const clientId = getClientEnv("NEXT_PUBLIC_ENTRA_CLIENT_ID")
const tenantId = getClientEnv("NEXT_PUBLIC_ENTRA_TENANT_ID")

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    // redirectUri principal: usado pelo loginRedirect (não loginPopup).
    redirectUri: typeof window !== "undefined" ? window.location.origin : "/",
  },
  cache: {
    // sessionStorage: tokens sobrevivem à aba mas não ao fechar o browser
    cacheLocation: "sessionStorage",
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        if (process.env.NODE_ENV !== "development") return
        switch (level) {
          case LogLevel.Error:
            console.error("[MSAL]", message)
            break
          case LogLevel.Warning:
            console.warn("[MSAL]", message)
            break
          default:
            console.debug("[MSAL]", message)
        }
      },
    },
  },
}

/** Escopos solicitados ao Microsoft Entra ID. */
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
}

/**
 * Instância singleton do MSAL para uso no browser.
 * Inicializar com `await getMsalInstance()` antes de chamar qualquer método.
 */
let _instance: PublicClientApplication | null = null

export async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!_instance) {
    _instance = new PublicClientApplication(msalConfig)
    await _instance.initialize()
  }
  return _instance
}
