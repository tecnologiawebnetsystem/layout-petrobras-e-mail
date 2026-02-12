/**
 * GET /api/notifications
 * Listar notificacoes do usuario via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getNotificationsByUserId, getUnreadNotificationCount } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Token de autenticacao nao fornecido" } },
        { status: 401 }
      )
    }

    const session = await getSessionByAccessToken(token)
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sessao invalida ou expirada" } },
        { status: 401 }
      )
    }

    const [notifications, unreadCount] = await Promise.all([
      getNotificationsByUserId(session.user_id),
      getUnreadNotificationCount(session.user_id),
    ])

    return NextResponse.json({
      success: true,
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        priority: n.priority,
        title: n.title,
        message: n.message,
        read: n.read,
        timestamp: n.created_at,
        actionLabel: n.action_label,
        actionUrl: n.action_url,
        metadata: n.metadata,
      })),
      unreadCount,
    })
  } catch (error) {
    console.error("[API] Get notifications error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
