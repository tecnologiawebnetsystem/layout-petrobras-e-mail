/**
 * GET /api/files/[fileId] - Obter detalhes de um arquivo
 * DELETE /api/files/[fileId] - Excluir/cancelar um arquivo
 * 
 * Integracao com backend Python:
 * - GET /v1/files/{file_id}
 * - DELETE /v1/files/{file_id}
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

/**
 * GET /api/files/[fileId]
 * Retorna detalhes de um arquivo especifico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/files/${fileId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "NOT_FOUND",
            message: "Arquivo nao encontrado",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        recipientEmail: data.recipient_email,
        description: data.description,
        sender: {
          id: data.sender.id,
          name: data.sender.name,
          email: data.sender.email,
          department: data.sender.department,
          employeeId: data.sender.employee_id,
          manager: data.sender.manager,
        },
        files: data.files.map((f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          s3Key: f.s3_key,
        })),
        status: data.status,
        expirationHours: data.expiration_hours,
        expiresAt: data.expires_at,
        expirationLogs: data.expiration_logs,
        createdAt: data.created_at,
        approvedAt: data.approved_at,
        approvedBy: data.approved_by,
        rejectionReason: data.rejection_reason,
        workflow: {
          currentStep: data.workflow.current_step,
          totalSteps: data.workflow.total_steps,
          steps: data.workflow.steps,
        },
      },
    })
  } catch (error) {
    console.error("[API] Get file error:", error)
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

/**
 * DELETE /api/files/[fileId]
 * Cancela/exclui um arquivo (apenas se ainda nao aprovado)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const { reason } = body

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/files/${fileId}`, {
      method: "DELETE",
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
            code: "DELETE_FAILED",
            message: "Erro ao cancelar arquivo",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Arquivo cancelado com sucesso",
    })
  } catch (error) {
    console.error("[API] Delete file error:", error)
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
