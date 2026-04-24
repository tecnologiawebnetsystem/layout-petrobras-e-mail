import { NextRequest, NextResponse } from "next/server"
import { proxyJSON, BACKEND_URL } from "@/lib/api/route-handler-utils"

/**
 * POST /api/auth/login → POST /v1/auth/login (público)
 * auth-store espera: { access_token, refresh_token, token_type, expires_in, user }
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] POST /api/auth/login → handler atingido no Next.js")
  console.log("[DEBUG] BACKEND_URL =", BACKEND_URL)
  try {
    return await proxyJSON("POST", request, "/api/v1/auth/login", { withAuth: false })
  } catch (error) {
    console.error("[DEBUG] Erro ao chamar backend:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
