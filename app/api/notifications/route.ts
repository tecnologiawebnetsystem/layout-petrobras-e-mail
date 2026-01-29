/**
 * GET /api/notifications - Listar notificacoes do usuario
 * 
 * Query params:
 * - unreadOnly: true/false - filtrar apenas nao lidas
 * - page: numero da pagina
 * - limit: itens por pagina
 * 
 * Integracao com backend Python: GET /v1/notifications
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

export async function GET(request: NextRequest) {
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

    // Extrair query params
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"
    const page = searchParams.get("page") || "1"
    const limit = searchParams.get("limit") || "20"

    // Construir query params
    const queryParams = new URLSearchParams()
    if (unreadOnly) queryParams.append("unread_only", "true")
    queryParams.append("page", page)
    queryParams.append("limit", limit)

    // Chamada para o backend Python
    const response = await fetch(
      `${BACKEND_URL}/v1/notifications?${queryParams.toString()}`,
      {
        method: "GET",
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
            code: "FETCH_FAILED",
            message: "Erro ao buscar notificacoes",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.notifications.map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        priority: notif.priority,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        timestamp: notif.timestamp,
        actionLabel: notif.action_label,
        actionUrl: notif.action_url,
        metadata: notif.metadata,
      })),
      unreadCount: data.unread_count,
      pagination: data.pagination ? {
        currentPage: data.pagination.current_page,
        totalPages: data.pagination.total_pages,
        totalItems: data.pagination.total_items,
      } : null,
    })
  } catch (error) {
    console.error("[API] Get notifications error:", error)
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
