import { NextRequest } from "next/server"
import {
  BACKEND_URL,
  forwardedHeaders,
  handleProxyResponse,
  serverError,
} from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/entra/token → POST /api/v1/auth/entra/token
 *
 * Recebe { id_token, access_token } do MSAL (frontend SPA) e repassa ao backend.
 * O backend valida o id_token via JWKS, verifica grupo e emite JWT interno.
 *
 * Usado pela pagina /auth/entra-callback apos o MSAL processar o redirect
 * da Microsoft e obter os tokens via Authorization Code + PKCE.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/entra/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardedHeaders(request),
      },
      body: JSON.stringify(body),
    })

    return await handleProxyResponse(response)
  } catch (error) {
    return serverError("POST /api/v1/auth/entra/token", error)
  }
}
