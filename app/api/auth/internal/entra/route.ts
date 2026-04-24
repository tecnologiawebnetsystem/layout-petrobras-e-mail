import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, forwardedHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/internal/entra
 *
 * BFF proxy: recebe o id_token do MSAL e repassa ao backend para validação via JWKS.
 *
 * Headers esperados do cliente:
 *   Authorization: Bearer <id_token>   ← id_token do MSAL (obrigatório)
 *   X-Graph-Token: <access_token>      ← access_token para Graph API (opcional)
 *
 * O backend valida o id_token, sincroniza o usuário e retorna tokens internos.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization") ?? ""
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return NextResponse.json(
        { detail: "Header Authorization: Bearer <id_token> obrigatorio." },
        { status: 401 },
      )
    }

    const headers: Record<string, string> = {
      ...forwardedHeaders(request),
      Authorization: authHeader,
    }

    const graphToken = request.headers.get("X-Graph-Token")
    if (graphToken) {
      headers["X-Graph-Token"] = graphToken
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/entra`, {
      method: "POST",
      headers,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return serverError("POST /api/auth/internal/entra", error)
  }
}
