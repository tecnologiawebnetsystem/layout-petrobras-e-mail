/**
 * POST /api/supervisor/approve/[fileId]
 * Aprovar um arquivo pendente via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getFileUploadById,
  updateFileUploadStatus,
  approveAllSteps,
  createAuditLog,
  createNotification,
  createOtpCode,
  createEmailHistoryEntry,
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

    // Aprovar upload e todos os steps
    const updated = await updateFileUploadStatus(fileId, "approved", {
      approved_by: session.user_name,
    })
    await approveAllSteps(fileId)

    // Gerar OTP para destinatario
    const otpCode = await createOtpCode(upload.recipient_email)

    // Registrar email no historico
    await createEmailHistoryEntry({
      to_email: upload.recipient_email,
      subject: `Novo arquivo disponivel para download - ${upload.name}`,
      body: `Voce tem um novo arquivo disponivel para download: "${upload.name}". Use o codigo ${otpCode} para acessar.`,
      status: "sent",
    })

    // Notificar remetente
    await createNotification({
      user_id: upload.sender_id,
      type: "approval",
      priority: "high",
      title: "Envio Aprovado",
      message: `Seu envio "${upload.name}" foi aprovado por ${session.user_name}.`,
      action_label: "Ver detalhes",
      action_url: "/upload",
    })

    // Audit log
    const supervisor = await getUserById(session.user_id)
    await createAuditLog({
      action: "approve",
      level: "success",
      user_id: session.user_id,
      user_name: session.user_name,
      user_email: session.user_email,
      user_type: session.user_type,
      user_employee_id: supervisor?.employee_id || null,
      target_id: fileId,
      target_name: upload.name,
      description: `Envio aprovado pelo supervisor`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    })

    return NextResponse.json({
      success: true,
      message: "Arquivo aprovado com sucesso",
      data: {
        fileId: upload.id,
        status: "approved",
        approvedAt: updated?.approval_date || new Date().toISOString(),
        approvedBy: session.user_name,
        expiresAt: updated?.expires_at,
        otpSent: true,
        recipientEmail: upload.recipient_email,
      },
    })
  } catch (error) {
    console.error("[API] Approve file error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
