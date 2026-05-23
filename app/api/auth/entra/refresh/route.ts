import { NextRequest } from "next/server"
import {
  BACKEND_URL,
  forwardedHeaders,
  handleProxyResponse,
  serverError,
} from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/entra/refresh → POST /api/v1/auth/entra/refresh
 *
 * O backend espera o refresh_token no header X-Refresh-Token (sem body).
 * proxyJSON não repassa headers customizados, então fazemos o fetch manualmente.
 */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.headers.get("x-refresh-token") ?? ""

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/entra/refresh`, {
      method: "POST",
      headers: {
        "X-Refresh-Token": refreshToken,
        ...forwardedHeaders(request),
      },
    })

    return await handleProxyResponse(response)
  } catch (error) {
    return serverError("POST /api/v1/auth/entra/refresh", error)
  }
}
