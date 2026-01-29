/**
 * PUT /api/notifications/[notificationId]/read
 * 
 * Marca uma notificacao como lida
 * 
 * Integracao com backend Python: PUT /v1/notifications/{notification_id}/read
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

interface RouteParams {
  params: Promise<{ notificationId: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getAuthToken(request)
    const { notificationId } = await params

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
    const response = await fetch(
      `${BACKEND_URL}/v1/notifications/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "UPDATE_FAILED",
            message: "Erro ao marcar notificacao como lida",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Notificacao marcada como lida",
    })
  } catch (error) {
    console.error("[API] Mark notification read error:", error)
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
