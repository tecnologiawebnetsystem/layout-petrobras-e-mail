import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") || ""
    const searchParams = request.nextUrl.searchParams.toString()
    const qs = searchParams ? `?${searchParams}` : ""

    const response = await fetch(`${BACKEND_URL}/api/v1/audit/logs${qs}`, {
      method: "GET",
      headers: { Authorization: authHeader },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Passthrough: retorna o formato exato do backend Python
    // O audit-log-store espera: { logs: [...], pagination: {...} }
    return NextResponse.json(data)
  } catch (error) {
    console.error("[API] Audit logs proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
