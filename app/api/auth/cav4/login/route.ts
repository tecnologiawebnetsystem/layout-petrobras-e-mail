import { NextRequest, NextResponse } from "next/server"
import {
  BACKEND_URL,
  forwardedHeaders,
  handleProxyResponse,
  serverError,
} from "@/lib/api/route-handler-utils"

/** GET /api/auth/cav4/login -> GET /api/v1/auth/cav4/login */
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/cav4/login`, {
      method: "GET",
      headers: {
        ...forwardedHeaders(request),
      },
      redirect: "manual",
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location")
      if (location) {
        return NextResponse.redirect(location, { status: response.status })
      }
    }

    return await handleProxyResponse(response)
  } catch (error) {
    return serverError("GET /api/v1/auth/cav4/login", error)
  }
}
