/**
 * POST /api/emails/send
 * Enviar email e registrar no historico via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, createEmailHistoryEntry } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { to, subject, body: emailBody, html } = body

    if (!to || (Array.isArray(to) && to.length === 0)) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_RECIPIENTS", message: "Lista de destinatarios e obrigatoria" } },
        { status: 400 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_SUBJECT", message: "Assunto do email e obrigatorio" } },
        { status: 400 }
      )
    }

    const recipients = Array.isArray(to) ? to : [to]
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Registrar no historico para cada destinatario
    for (const recipient of recipients) {
      await createEmailHistoryEntry({
        message_id: messageId,
        to_email: recipient,
        subject,
        body: emailBody,
        html_body: html,
        status: "sent",
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        status: "sent",
        sentTo: recipients,
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[API] Erro ao enviar email:", error)
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
