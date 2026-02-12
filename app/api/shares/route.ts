import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * POST /api/shares - Criar novo compartilhamento
 * Proxy para POST /v1/shares/
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/shares/`, {
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
      return NextResponse.json(
        { success: false, error: { code: "CREATE_SHARE_FAILED", message: data.detail || "Erro ao criar compartilhamento" } },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Shares create proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}

/**
 * GET /api/shares - Listar compartilhamentos
 * Proxy para GET /v1/shares/
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const searchParams = request.nextUrl.searchParams.toString()
    const queryString = searchParams ? `?${searchParams}` : ""

    const response = await fetch(`${BACKEND_URL}/api/v1/shares/${queryString}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: { code: "LIST_SHARES_FAILED", message: data.detail || "Erro ao listar compartilhamentos" } },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Shares list proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
