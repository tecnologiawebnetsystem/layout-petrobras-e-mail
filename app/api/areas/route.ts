import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * GET /api/areas - Listar areas/departamentos
 * Proxy para GET /v1/areas/
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""

    const response = await fetch(`${BACKEND_URL}/api/v1/areas/`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Areas list proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/areas - Criar nova area
 * Proxy para POST /v1/areas/
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/areas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Areas create proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
