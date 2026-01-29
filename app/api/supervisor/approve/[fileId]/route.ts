/**
 * POST /api/supervisor/approve/[fileId]
 * 
 * Aprova um arquivo pendente
 * Apenas supervisores podem acessar este endpoint
 * 
 * Integracao com backend Python: POST /v1/supervisor/approve/{file_id}
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
  params: Promise<{ fileId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getAuthToken(request)
    const { fileId } = await params

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

    const body = await request.json().catch(() => ({}))
    const { message } = body

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/supervisor/approve/${fileId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "APPROVAL_FAILED",
            message: "Erro ao aprovar arquivo",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Arquivo aprovado com sucesso",
      data: {
        fileId: data.file_id,
        status: data.status,
        approvedAt: data.approved_at,
        approvedBy: data.approved_by,
        expiresAt: data.expires_at,
        otpSent: data.otp_sent,
        recipientEmail: data.recipient_email,
      },
    })
  } catch (error) {
    console.error("[API] Approve file error:", error)
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
