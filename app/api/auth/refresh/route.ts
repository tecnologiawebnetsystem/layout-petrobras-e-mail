import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: body.refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "REFRESH_FAILED", message: data.detail || "Token invalido" },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        token: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
      },
    })
  } catch (error) {
    console.error("[API] Refresh proxy error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
