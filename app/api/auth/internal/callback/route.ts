import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/internal/callback  →  /auth/entra-callback
 *
 * Redirect provisório: mantém a URL antiga cadastrada no Azure AD funcionando
 * enquanto a nova (/auth/entra-callback) ainda não foi registrada como SPA
 * redirect URI. Preserva os query params (?code=&state=) para que o MSAL
 * processe normalmente via handleRedirectPromise().
 *
 * Remover após cadastrar http://localhost:3000/auth/entra-callback no Azure AD.
 */
export async function GET(request: NextRequest) {
  const qs = request.nextUrl.search
  return NextResponse.redirect(
    new URL(`/auth/entra-callback${qs}`, request.url),
    { status: 302 },
  )
}
