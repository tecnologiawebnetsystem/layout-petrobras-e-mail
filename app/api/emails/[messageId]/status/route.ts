/**
 * GET /api/emails/[messageId]/status
 * Endpoint para verificar status de um email enviado
 * Faz proxy para o backend Python
 */

import { NextRequest, NextResponse } from "next/server"

// URL do backend Python
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params

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

    // Validar messageId
    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_MESSAGE_ID",
            message: "ID da mensagem e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Fazer request para o backend Python
    const backendResponse = await fetch(`${BACKEND_URL}/v1/emails/${messageId}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "STATUS_CHECK_FAILED",
            message: "Falha ao verificar status do email",
          },
        },
        { status: backendResponse.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        messageId,
        status: data.status, // "sent" | "delivered" | "bounced" | "complained" | "failed"
        sentAt: data.sentAt,
        deliveredAt: data.deliveredAt,
        bouncedAt: data.bouncedAt,
        bounceReason: data.bounceReason,
        opens: data.opens || 0,
        clicks: data.clicks || 0,
      },
    })
  } catch (error) {
    console.error("[API] Erro ao verificar status:", error)
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
