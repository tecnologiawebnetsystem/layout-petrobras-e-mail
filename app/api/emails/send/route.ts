/**
 * POST /api/emails/send
 * Endpoint para enviar emails via AWS SES
 * Faz proxy para o backend Python
 */

import { NextRequest, NextResponse } from "next/server"

// URL do backend Python
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

interface EmailSendRequest {
  to: string[]
  subject: string
  body?: string
  html?: string
  template?: string
  templateData?: Record<string, unknown>
  attachments?: Array<{
    filename: string
    content: string
    contentType: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Extrair token do header
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader) {
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

    // Parse do body
    const body: EmailSendRequest = await request.json()

    // Validar campos obrigatorios
    if (!body.to || body.to.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_RECIPIENTS",
            message: "Lista de destinatarios e obrigatoria",
          },
        },
        { status: 400 }
      )
    }

    if (!body.subject) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_SUBJECT",
            message: "Assunto do email e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Fazer request para o backend Python
    const backendResponse = await fetch(`${BACKEND_URL}/v1/emails/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "EMAIL_SEND_FAILED",
            message: "Falha ao enviar email",
          },
        },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId: data.messageId,
        status: "sent",
        sentTo: body.to,
        sentAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[API] Erro ao enviar email:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Erro interno do servidor",
        },
      },
      { status: 500 }
    )
  }
}
