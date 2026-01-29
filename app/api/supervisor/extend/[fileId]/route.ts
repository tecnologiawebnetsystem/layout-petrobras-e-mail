/**
 * PUT /api/supervisor/extend/[fileId]
 * 
 * Estende o tempo de expiracao de um arquivo
 * Apenas supervisores podem acessar este endpoint
 * 
 * Integracao com backend Python: PUT /v1/supervisor/extend/{file_id}
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

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const { additionalHours, reason } = body

    // Validar campos obrigatorios
    if (!additionalHours || additionalHours <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Numero de horas adicionais deve ser maior que zero",
          },
        },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Motivo da extensao e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Validar limite maximo (72 horas)
    if (additionalHours > 72) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Tempo maximo de extensao e 72 horas",
          },
        },
        { status: 400 }
      )
    }

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/supervisor/extend/${fileId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        additional_hours: additionalHours,
        reason,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "EXTENSION_FAILED",
            message: "Erro ao estender expiracao",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Tempo de expiracao estendido com sucesso",
      data: {
        fileId: data.file_id,
        previousExpiration: data.previous_expiration,
        newExpiration: data.new_expiration,
        additionalHours: data.additional_hours,
        extendedBy: data.extended_by,
        reason: data.reason,
      },
    })
  } catch (error) {
    console.error("[API] Extend expiration error:", error)
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
