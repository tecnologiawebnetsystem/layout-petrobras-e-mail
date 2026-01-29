/**
 * POST /api/auth/refresh
 * 
 * Endpoint para renovar tokens JWT
 * Recebe refresh token, retorna novos tokens
 * 
 * Integracao com backend Python: POST /v1/auth/refresh
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Refresh token e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "REFRESH_FAILED",
            message: "Token expirado ou invalido",
          },
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
    console.error("[API] Refresh token error:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    )
  }
}
