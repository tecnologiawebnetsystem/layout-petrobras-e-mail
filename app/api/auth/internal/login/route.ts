import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * POST /api/auth/internal/login - Login local (credenciais)
 * Proxy para POST /v1/auth/internal/login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/internal/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Internal login proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
