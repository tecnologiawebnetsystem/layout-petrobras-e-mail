import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, handleProxyResponse, serverError } from "@/lib/api/route-handler-utils"
import { verifyExternalUser } from "@/lib/auth/user-verification"

/**
 * POST /api/auth/external/request-code → POST /v1/auth/external/request-code
 *
 * Fluxo:
 *   1. Lê o e-mail do body
 *   2. Verifica se o usuário está autorizado (via `verifyExternalUser`)
 *      - Enquanto USER_VERIFICATION_API_URL não estiver configurada → bypass mode
 *   3. Se autorizado → repassa ao csa-backend que gera e envia o OTP por e-mail
 *   4. Se não autorizado → retorna 403 sem chamar o backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; validity_minutes?: number }
    const email = body.email?.trim() ?? ""

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: "EMAIL_REQUIRED", message: "E-mail é obrigatório" } },
        { status: 400 }
      )
    }

    // ── Verificação de usuário autorizado ────────────────────────────────────
    const verification = await verifyExternalUser(email)

    if (!verification.verified) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_AUTHORIZED",
            message: verification.reason ?? "Usuário não autorizado a receber o código de acesso.",
          },
        },
        { status: 403 }
      )
    }
    // ────────────────────────────────────────────────────────────────────────

    // Usuário verificado → solicita OTP ao backend
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/external/request-code`, {
      method: "POST",
      headers: proxyHeaders(request, { withAuth: false, withContentType: true }),
      body: JSON.stringify(body),
    })

    return handleProxyResponse(response)
  } catch (error) {
    return serverError("POST /api/auth/external/request-code", error)
  }
}
