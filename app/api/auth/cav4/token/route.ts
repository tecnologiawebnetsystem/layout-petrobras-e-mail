import { NextRequest } from "next/server"
import {
  BACKEND_URL,
  forwardedHeaders,
  handleProxyResponse,
  serverError,
} from "@/lib/api/route-handler-utils"

/** POST /api/auth/cav4/token -> POST /api/v1/auth/cav4/token */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/cav4/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...forwardedHeaders(request),
      },
      body: JSON.stringify(body),
    })

    return await handleProxyResponse(response)
  } catch (error) {
    return serverError("POST /api/v1/auth/cav4/token", error)
  }
}
