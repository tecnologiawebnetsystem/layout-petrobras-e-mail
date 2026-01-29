/**
 * POST /api/auth/logout
 * 
 * Endpoint para logout de usuarios
 * Invalida o token JWT no backend
 * 
 * Integracao com backend Python: POST /v1/auth/logout
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Token de autenticacao nao fornecido",
          },
        },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const body = await request.json().catch(() => ({}))
    const { sessionId } = body

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    })

    if (!response.ok) {
      const data = await response.json()
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "LOGOUT_FAILED",
            message: "Erro ao realizar logout",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
    })
  } catch (error) {
    console.error("[API] Logout error:", error)
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
