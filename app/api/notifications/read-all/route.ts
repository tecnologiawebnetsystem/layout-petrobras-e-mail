/**
 * PUT /api/notifications/read-all
 * Marcar todas notificacoes como lidas via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, markAllNotificationsAsRead } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function PUT(request: NextRequest) {
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

    await markAllNotificationsAsRead(session.user_id)

    return NextResponse.json({
      success: true,
      message: "Todas as notificacoes foram marcadas como lidas",
    })
  } catch (error) {
    console.error("[API] Mark all notifications read error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
