/**
 * PUT /api/supervisor/extend/[fileId]
 * Estender tempo de expiracao via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getFileUploadById,
  extendFileUploadExpiration,
  createExpirationLog,
  createAuditLog,
  getUserById,
} from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
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

    if (session.user_type !== "supervisor") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Acesso restrito a supervisores" } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { additionalHours, reason } = body

    if (!additionalHours || additionalHours <= 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Numero de horas adicionais deve ser maior que zero" } },
        { status: 400 }
      )
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Motivo da extensao e obrigatorio" } },
        { status: 400 }
      )
    }

    if (additionalHours > 72) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Tempo maximo de extensao e 72 horas" } },
        { status: 400 }
      )
    }

    const upload = await getFileUploadById(fileId)
    if (!upload) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Arquivo nao encontrado" } },
        { status: 404 }
      )
    }

    const previousHours = upload.expiration_hours
    const newHours = previousHours + additionalHours

    // Atualizar expiracao
    const updated = await extendFileUploadExpiration(fileId, newHours)

    // Log de expiracao
    await createExpirationLog({
      upload_id: fileId,
      changed_by: session.user_name,
      previous_value: previousHours,
      new_value: newHours,
      reason,
    })

    // Audit log
    const supervisor = await getUserById(session.user_id)
    await createAuditLog({
      action: "expiration_change",
      level: "info",
      user_id: session.user_id,
      user_name: session.user_name,
      user_email: session.user_email,
      user_type: session.user_type,
      user_employee_id: supervisor?.employee_id || null,
      target_id: fileId,
      target_name: upload.name,
      description: `Prazo de expiracao alterado de ${previousHours}h para ${newHours}h`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    })

    return NextResponse.json({
      success: true,
      message: "Tempo de expiracao estendido com sucesso",
      data: {
        fileId: upload.id,
        previousExpiration: previousHours,
        newExpiration: newHours,
        additionalHours,
        extendedBy: session.user_name,
        expiresAt: updated?.expires_at,
        reason,
      },
    })
  } catch (error) {
    console.error("[API] Extend expiration error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
