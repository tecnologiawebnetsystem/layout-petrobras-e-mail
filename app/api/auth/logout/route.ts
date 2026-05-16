import { NextRequest, NextResponse } from "next/server"
import { BACKEND_URL, proxyHeaders, serverError } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/logout → POST /v1/auth/logout
 * Sempre retorna 200 com success (logout não deve bloquear o cliente).
 */
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: proxyHeaders(request, { withContentType: true }),
      body: JSON.stringify({}),
    })
    const data = await response.json()
    return NextResponse.json({ success: true, message: (data as { message?: string }).message ?? "Logout realizado com sucesso" })
  } catch (error) {
    return serverError("POST /api/v1/auth/logout", error)
  }
}
