import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * POST /api/auth/internal/logout - Logout legado interno
 * Proxy para POST /v1/auth/internal/logout
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Internal logout proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
