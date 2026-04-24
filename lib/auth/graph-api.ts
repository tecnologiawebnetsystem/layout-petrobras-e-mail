/**
 * Microsoft Graph API - stubs.
 *
 * MSAL removido: as chamadas a Graph API (perfil, gestor, foto) foram migradas
 * para o csa-backend, que as executa durante o callback OAuth com as credenciais
 * server-side (ConfidentialClientApplication do msal python).
 *
 * Mantido apenas para referencia de tipos.
 */

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
  return null
}

/**
 * Busca informações do supervisor/gerente direto do usuário
 */
export async function getUserManager(): Promise<ManagerInfo | null> {
  return null
}

/**
 * Busca foto do perfil do usuário
 */
export async function getUserPhoto(): Promise<string | null> {
  return null
}
