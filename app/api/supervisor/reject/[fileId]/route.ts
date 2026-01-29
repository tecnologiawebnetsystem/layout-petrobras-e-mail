/**
 * POST /api/supervisor/reject/[fileId]
 * 
 * Rejeita um arquivo pendente
 * Apenas supervisores podem acessar este endpoint
 * 
 * Integracao com backend Python: POST /v1/supervisor/reject/{file_id}
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

    const body = await request.json()
    const { reason } = body

    // Validar motivo da rejeicao
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Motivo da rejeicao e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/supervisor/reject/${fileId}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "REJECTION_FAILED",
            message: "Erro ao rejeitar arquivo",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Arquivo rejeitado",
      data: {
        fileId: data.file_id,
        status: data.status,
        rejectedAt: data.rejected_at,
        rejectedBy: data.rejected_by,
        reason: data.reason,
      },
    })
  } catch (error) {
    console.error("[API] Reject file error:", error)
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
