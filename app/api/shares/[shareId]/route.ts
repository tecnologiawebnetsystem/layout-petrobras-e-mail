import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * GET /api/shares/[shareId] - Detalhes de um compartilhamento
 * Proxy para GET /v1/shares/{share_id}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const authHeader = request.headers.get("authorization") || ""

    const response = await fetch(`${BACKEND_URL}/api/v1/shares/${shareId}`, {
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
        { success: false, error: { code: "GET_SHARE_FAILED", message: data.detail || "Erro ao buscar compartilhamento" } },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Share detail proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shares/[shareId] - Excluir compartilhamento
 * Proxy para DELETE /v1/shares/{share_id}
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params
    const authHeader = request.headers.get("authorization") || ""

    const response = await fetch(`${BACKEND_URL}/api/v1/shares/${shareId}`, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "User-Agent": request.headers.get("user-agent") || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: { code: "DELETE_SHARE_FAILED", message: data.detail || "Erro ao excluir compartilhamento" } },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[API] Share delete proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
