/**
 * Stub mantido para compatibilidade com workflow-store.ts.
 *
 * MSAL removido: o token de acesso ao backend agora fica no auth-store.
 * A integração de envio de e-mail via Microsoft Graph (Mail.Send) precisa
 * ser migrada para o csa-backend com credenciais de aplicação (client_credentials).
 *
 * @deprecated Retorna sempre null. Migrar chamadas para useAuthStore.getState().accessToken.
 */
export async function getAccessToken(): Promise<string | null> {
  return null
}
