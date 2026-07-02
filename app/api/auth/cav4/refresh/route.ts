import { NextRequest } from "next/server"
import {
  BACKEND_URL,
  forwardedHeaders,
  handleProxyResponse,
  serverError,
} from "@/lib/api/route-handler-utils"

/** POST /api/auth/cav4/refresh -> POST /api/v1/auth/cav4/refresh */
export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.headers.get("x-refresh-token") ?? ""

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/cav4/refresh`, {
      method: "POST",
      headers: {
        "X-Refresh-Token": refreshToken,
        ...forwardedHeaders(request),
      },
    })

    return await handleProxyResponse(response)
  } catch (error) {
    return serverError("POST /api/v1/auth/cav4/refresh", error)
  }
}
