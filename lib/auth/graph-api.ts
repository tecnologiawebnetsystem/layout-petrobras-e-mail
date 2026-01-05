/**
 * Microsoft Graph API Client
 *
 * Fornece funções para buscar dados adicionais do usuário
 * através do Microsoft Graph API (perfil completo, supervisor, departamento, etc)
 */

import { msalInstance } from "./entra-config"

export interface UserProfile {
  id: string
  displayName: string
  mail: string
  jobTitle?: string
  department?: string
  officeLocation?: string
  mobilePhone?: string
  businessPhones?: string[]
  preferredLanguage?: string
  employeeId?: string
  companyName?: string
}

export interface ManagerInfo {
  id: string
  displayName: string
  mail: string
  jobTitle?: string
  department?: string
}

const GRAPH_API_ENDPOINT = "https://graph.microsoft.com/v1.0"

/**
 * Busca o perfil completo do usuário logado
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const account = msalInstance.getAllAccounts()[0]
    if (!account) {
      console.error("[Graph API] Nenhuma conta logada")
      return null
    }

    // Solicitar token com escopo User.Read
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account,
    })

    // Buscar perfil completo
    const profileResponse = await fetch(`${GRAPH_API_ENDPOINT}/me`, {
      headers: {
        Authorization: `Bearer ${response.accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      console.error("[Graph API] Erro ao buscar perfil:", profileResponse.statusText)
      return null
    }

    const profile = await profileResponse.json()
    return profile
  } catch (error) {
    console.error("[Graph API] Erro ao buscar perfil do usuário:", error)
    return null
  }
}

/**
 * Busca informações do supervisor/gerente direto do usuário
 */
export async function getUserManager(): Promise<ManagerInfo | null> {
  try {
    const account = msalInstance.getAllAccounts()[0]
    if (!account) {
      console.error("[Graph API] Nenhuma conta logada")
      return null
    }

    // Solicitar token com escopo User.Read
    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account,
    })

    // Buscar gerente direto
    const managerResponse = await fetch(`${GRAPH_API_ENDPOINT}/me/manager`, {
      headers: {
        Authorization: `Bearer ${response.accessToken}`,
      },
    })

    if (!managerResponse.ok) {
      // Usuário pode não ter gerente configurado
      if (managerResponse.status === 404) {
        console.log("[Graph API] Usuário não possui gerente configurado no AD")
        return null
      }
      console.error("[Graph API] Erro ao buscar gerente:", managerResponse.statusText)
      return null
    }

    const manager = await managerResponse.json()
    return manager
  } catch (error) {
    console.error("[Graph API] Erro ao buscar gerente do usuário:", error)
    return null
  }
}

/**
 * Busca foto do perfil do usuário
 */
export async function getUserPhoto(): Promise<string | null> {
  try {
    const account = msalInstance.getAllAccounts()[0]
    if (!account) return null

    const response = await msalInstance.acquireTokenSilent({
      scopes: ["User.Read"],
      account,
    })

    const photoResponse = await fetch(`${GRAPH_API_ENDPOINT}/me/photo/$value`, {
      headers: {
        Authorization: `Bearer ${response.accessToken}`,
      },
    })

    if (!photoResponse.ok) {
      // Usuário pode não ter foto configurada
      return null
    }

    const photoBlob = await photoResponse.blob()
    const photoUrl = URL.createObjectURL(photoBlob)
    return photoUrl
  } catch (error) {
    console.error("[Graph API] Erro ao buscar foto do usuário:", error)
    return null
  }
}
