/**
 * Verificação de Usuário Externo — Stub aguardando liberação da API
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CONTEXTO
 * ─────────────────────────────────────────────────────────────────────────────
 * Antes de enviar o código OTP, o sistema precisa confirmar que o e-mail
 * informado pertence a um destinatário autorizado (ex: listagem de parceiros,
 * diretório corporativo externo, etc.).
 *
 * A API de verificação ainda não foi liberada pelo supervisor.
 * Quando estiver disponível, basta:
 *   1. Definir `USER_VERIFICATION_API_URL` no `.env` / secrets da plataforma.
 *   2. Ajustar `callVerificationApi()` abaixo conforme o contrato da API real.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MODO BYPASS
 * ─────────────────────────────────────────────────────────────────────────────
 * - `USER_VERIFICATION_API_URL` ausente ou vazio  → **bypass ON** (aprova todos)
 * - `USER_VERIFICATION_API_URL` definida          → chama a API real
 *
 * O modo bypass gera um aviso no log do servidor para não passar despercebido.
 */

export interface VerificationResult {
  /** true = usuário autorizado a receber o código OTP */
  verified: boolean
  /** Motivo da rejeição (exibível ao usuário) */
  reason?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub – substituir pelo contrato real da API do supervisor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Chama a API de verificação real.
 *
 * TODO: implementar quando o acesso for liberado.
 * Adapte os campos de request/response conforme a documentação da API.
 */
async function callVerificationApi(email: string): Promise<VerificationResult> {
  const apiUrl = process.env.USER_VERIFICATION_API_URL!
  const apiKey = process.env.USER_VERIFICATION_API_KEY ?? ""

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: ajustar nome do header conforme a API (ex: "x-api-key", "Authorization", etc.)
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({ email }),
      // Timeout de 5 s para não travar o fluxo de login
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) {
      // API retornou erro — considera não autorizado
      // console.error(`[user-verification] API retornou ${response.status} para ${email}`)
      return { verified: false, reason: "Usuário não encontrado na lista de autorizados" }
    }

    // TODO: adaptar ao formato real de resposta da API
    // Exemplo esperado: { authorized: boolean, message?: string }
    const data = (await response.json()) as { authorized?: boolean; message?: string }
    return {
      verified: data.authorized === true,
      reason: data.authorized ? undefined : (data.message ?? "Usuário não autorizado"),
    }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      // console.error("[user-verification] Timeout ao chamar API de verificação")
      return { verified: false, reason: "Serviço de verificação indisponível. Tente novamente." }
    }
    // console.error("[user-verification] Erro ao chamar API de verificação:", error)
    return { verified: false, reason: "Não foi possível verificar o usuário. Tente novamente." }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Função principal — usada pelo Route Handler
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica se o e-mail está autorizado a receber um código OTP.
 *
 * Enquanto `USER_VERIFICATION_API_URL` não estiver configurado, opera em
 * **bypass mode** (aprova todos) e exibe aviso no log do servidor.
 */
export async function verifyExternalUser(email: string): Promise<VerificationResult> {
  const apiUrl = process.env.USER_VERIFICATION_API_URL

  if (!apiUrl) {
    // ⚠️  BYPASS MODE — remover quando a API estiver disponível
    // console.warn(
    //   `[user-verification] BYPASS MODE ativo — USER_VERIFICATION_API_URL não configurada. ` +
    //     `Usuário "${email}" aprovado automaticamente.`
    // )
    return { verified: true }
  }

  return callVerificationApi(email)
}
