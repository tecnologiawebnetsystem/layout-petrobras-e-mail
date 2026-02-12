/**
 * POST /api/supervisor/reject/[fileId]
 * Rejeitar um arquivo pendente via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getFileUploadById,
  updateFileUploadStatus,
  updateFileUploadStep,
  createAuditLog,
  createNotification,
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

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Motivo da rejeicao e obrigatorio" } },
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

    if (upload.status !== "pending") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: "Arquivo nao esta pendente de aprovacao" } },
        { status: 400 }
      )
    }

    // Rejeitar upload
    await updateFileUploadStatus(fileId, "rejected", { rejection_reason: reason })

    // Atualizar step 2 (Aprovacao do Supervisor) como rejeitado
    await updateFileUploadStep(fileId, 2, "rejected", reason)

    // Notificar remetente
    await createNotification({
      user_id: upload.sender_id,
      type: "rejection",
      priority: "critical",
      title: "Envio Rejeitado",
      message: `Seu envio "${upload.name}" foi rejeitado. Motivo: ${reason}`,
      action_label: "Ver detalhes",
      action_url: "/upload",
    })

    // Audit log
    const supervisor = await getUserById(session.user_id)
    await createAuditLog({
      action: "reject",
      level: "warning",
      user_id: session.user_id,
      user_name: session.user_name,
      user_email: session.user_email,
      user_type: session.user_type,
      user_employee_id: supervisor?.employee_id || null,
      target_id: fileId,
      target_name: upload.name,
      description: `Envio rejeitado: ${reason}`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    })

    return NextResponse.json({
      success: true,
      message: "Arquivo rejeitado",
      data: {
        fileId: upload.id,
        status: "rejected",
        rejectedAt: new Date().toISOString(),
        rejectedBy: session.user_name,
        reason,
      },
    })
  } catch (error) {
    console.error("[API] Reject file error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
