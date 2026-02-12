import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * PATCH /api/shares/[shareId]/cancel - Cancelar compartilhamento
 * Proxy para PATCH /v1/shares/{share_id}/cancel
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const authHeader = request.headers.get("authorization") || ""

    let body = {}
    try {
      body = await request.json()
    } catch {
      // Body pode ser vazio para PATCH
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/shares/${shareId}/cancel`, {
      method: "PATCH",
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
        { success: false, error: { code: "CANCEL_SHARE_FAILED", message: data.detail || "Erro ao cancelar compartilhamento" } },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Share cancel proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
