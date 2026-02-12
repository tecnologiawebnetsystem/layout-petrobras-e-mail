import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * GET /api/external/list-files - Listar arquivos para usuario externo (legado)
 * Proxy para GET /v1/external/list-files
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const searchParams = request.nextUrl.searchParams.toString()
    const qs = searchParams ? `?${searchParams}` : ""

    const response = await fetch(`${BACKEND_URL}/api/v1/external/list-files${qs}`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] External list-files proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
