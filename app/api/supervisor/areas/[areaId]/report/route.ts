import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * GET /api/supervisor/areas/[areaId]/report - Relatorio da area
 * Proxy para GET /v1/supervisor/areas/{area_id}/report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { areaId } = await params
    const authHeader = request.headers.get("authorization") || ""

    const response = await fetch(`${BACKEND_URL}/api/v1/supervisor/areas/${areaId}/report`, {
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
        { success: false, error: { code: "REPORT_FAILED", message: data.detail || "Erro ao buscar relatorio" } },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Supervisor area report proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
