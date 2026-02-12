import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken, getFileUploadById, getFileUploadItems,
  getFileUploadSteps, getExpirationLogs, getUserById,
  updateFileUploadStatus, createAuditLog,
} from "@/lib/db/queries"

function getAuthToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization")
  return h?.startsWith("Bearer ") ? h.slice(7) : null
}

interface RouteParams { params: Promise<{ fileId: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getAuthToken(request)
    const { fileId } = await params
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Token nao fornecido" } }, { status: 401 })

    const session = await getSessionByAccessToken(token)
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Sessao invalida" } }, { status: 401 })

    const upload = await getFileUploadById(fileId)
    if (!upload) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Arquivo nao encontrado" } }, { status: 404 })

    const [items, steps, expLogs, sender] = await Promise.all([
      getFileUploadItems(fileId),
      getFileUploadSteps(fileId),
      getExpirationLogs(fileId),
      getUserById(upload.sender_id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        id: upload.id, name: upload.name, description: upload.description, recipientEmail: upload.recipient_email,
        sender: sender ? { id: sender.id, name: sender.name, email: sender.email, department: sender.department, employeeId: sender.employee_id } : null,
        files: items.map(f => ({ name: f.name, size: f.size, type: f.type, s3Key: f.s3_key })),
        status: upload.status, expirationHours: upload.expiration_hours, expiresAt: upload.expires_at,
        expirationLogs: expLogs, createdAt: upload.created_at, approvedAt: upload.approval_date, approvedBy: upload.approved_by,
        rejectionReason: upload.rejection_reason,
        workflow: {
          currentStep: upload.current_step, totalSteps: upload.total_steps,
          steps: steps.map(s => ({ title: s.title, status: s.status, completedDate: s.completed_date, comments: s.comments })),
        },
      },
    })
  } catch (error) {
    console.error("[API] Get file error:", error)
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Erro interno" } }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const token = getAuthToken(request)
    const { fileId } = await params
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Token nao fornecido" } }, { status: 401 })

    const session = await getSessionByAccessToken(token)
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Sessao invalida" } }, { status: 401 })

    const upload = await getFileUploadById(fileId)
    if (!upload) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Arquivo nao encontrado" } }, { status: 404 })
    if (upload.status === "approved") return NextResponse.json({ success: false, error: { code: "CANNOT_CANCEL", message: "Nao e possivel cancelar envio aprovado" } }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const user = await getUserById(session.user_id)
    await updateFileUploadStatus(fileId, "cancelled", { cancelled_by: user?.name, cancellation_reason: body.reason })
    await createAuditLog({ action: "cancel", level: "warning", user_id: session.user_id, user_name: user?.name, user_email: user?.email, user_type: user?.user_type, target_id: fileId, target_name: upload.name, description: `Envio cancelado: ${upload.name}`, ip_address: request.headers.get("x-forwarded-for") || null })

    return NextResponse.json({ success: true, message: "Arquivo cancelado com sucesso" })
  } catch (error) {
    console.error("[API] Delete file error:", error)
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Erro interno" } }, { status: 500 })
  }
}
