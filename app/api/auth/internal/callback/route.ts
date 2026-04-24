import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, forwardedHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * GET /api/auth/internal/callback → GET /api/v1/auth/internal/callback
 *
 * Proxy para o callback OAuth do Entra ID.
 * O ENTRA_REDIRECT_URI deve apontar para esta rota (localhost:3000) para evitar
 * cross-origin authorization code redemption (AADSTS9002325): o browser inicia o
 * fluxo em localhost:3000, então o callback deve retornar à mesma origem.
 *
 * O backend processa o código OAuth, cria/atualiza o usuário e retorna 302
 * redirecionando para /auth/entra-callback?access_token=...
 * Este handler lê o Location e repassa o redirect ao browser.
 */
export async function GET(request: NextRequest) {
  try {
    const qs = request.nextUrl.search // ?code=...&state=...
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/callback${qs}`, {
      method: "GET",
      redirect: "manual", // não seguir o redirect — apenas repassar ao browser
      headers: forwardedHeaders(request),
    })

    const location = response.headers.get("location")

    if ((response.status === 302 || response.status === 301 || response.status === 307) && location) {
      return NextResponse.redirect(location, { status: 302 })
    }

    // Backend retornou erro (ex: state inválido, code ausente)
    if (!response.ok) {
      try {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } catch {
        return NextResponse.redirect(
          new URL("/?error=auth_callback_failed", request.url),
          { status: 302 }
        )
      }
    }

    return serverError("GET /api/auth/internal/callback", `Status inesperado: ${response.status}`)
  } catch (error) {
    return serverError("GET /api/auth/internal/callback", error)
  }
}
