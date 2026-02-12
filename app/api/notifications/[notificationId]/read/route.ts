/**
 * PUT /api/notifications/[notificationId]/read
 * Marcar notificacao individual como lida via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, markNotificationAsRead } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
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

    await markNotificationAsRead(notificationId)

    return NextResponse.json({
      success: true,
      message: "Notificacao marcada como lida",
    })
  } catch (error) {
    console.error("[API] Mark notification read error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
