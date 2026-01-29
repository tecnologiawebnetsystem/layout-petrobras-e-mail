/**
 * PUT /api/notifications/read-all
 * 
 * Marca todas as notificacoes como lidas
 * 
 * Integracao com backend Python: PUT /v1/notifications/read-all
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

// Helper para extrair token do header
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  return authHeader.split(" ")[1]
}

export async function PUT(request: NextRequest) {
  try {
    const token = getAuthToken(request)

    if (!token) {
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

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/notifications/read-all`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "UPDATE_FAILED",
            message: "Erro ao marcar notificacoes como lidas",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Todas as notificacoes foram marcadas como lidas",
      data: {
        updatedCount: data.updated_count,
      },
    })
  } catch (error) {
    console.error("[API] Mark all notifications read error:", error)
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
