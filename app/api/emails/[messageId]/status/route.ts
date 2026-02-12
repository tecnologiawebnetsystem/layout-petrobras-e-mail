/**
 * GET /api/emails/[messageId]/status
 * Status de email via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getEmailByMessageId } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params
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

    const email = await getEmailByMessageId(messageId)
    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Email nao encontrado" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: email.message_id,
        status: email.status,
        sentAt: email.sent_at,
        deliveredAt: email.delivered_at,
        error: email.error,
      },
    })
  } catch (error) {
    console.error("[API] Erro ao verificar status:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
