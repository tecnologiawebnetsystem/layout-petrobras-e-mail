import { msalInstance, loginRequest } from "./entra-config"

/**
 * Obtém o token de acesso do MSAL para fazer chamadas autenticadas
 * @returns Token de acesso ou null se não houver usuário autenticado
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const accounts = msalInstance.getAllAccounts()

    if (accounts.length === 0) {
      console.warn(" Nenhuma conta MSAL encontrada para obter token")
      return null
    }

    const account = accounts[0]

    // Tentar obter token silenciosamente
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    })

    return response.accessToken
  } catch (error) {
    console.error(" Erro ao obter token de acesso:", error)
    return null
  }
}
