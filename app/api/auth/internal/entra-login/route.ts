import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, forwardedHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * GET /api/auth/internal/entra-login
 *
 * Inicia o fluxo OAuth com o Microsoft Entra ID via backend.
 *
 * O backend constrói a URL de autorização da Microsoft e responde com 302.
 * Este handler lê o Location da resposta e repassa a redirect ao browser,
 * sem expor a URL interna do backend.
 */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/entra-login`, {
      method: "GET",
      redirect: "manual", // não seguir o redirect — apenas repassar ao browser
      headers: forwardedHeaders(request),
    })

    const location = response.headers.get("location")

    if ((response.status === 302 || response.status === 301 || response.status === 307) && location) {
      return NextResponse.redirect(location, { status: 302 })
    }

    // Modo local sem Entra ID configurado
    if (response.status === 404) {
      return NextResponse.redirect(new URL("/?error=entra_not_configured", request.url), { status: 302 })
    }

    return serverError("GET /api/auth/internal/entra-login", `Status inesperado: ${response.status}`)
  } catch (error) {
    return serverError("GET /api/auth/internal/entra-login", error)
  }
}
