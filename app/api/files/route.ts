/**
 * GET /api/files - Listar arquivos enviados pelo usuario
 * Direto no Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getFileUploadsBySender, getFileUploadItems, getFileUploadSteps, getUserById } from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)

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

    const uploads = await getFileUploadsBySender(session.user_id)
    const user = await getUserById(session.user_id)

    const enriched = await Promise.all(
      uploads.map(async (upload) => {
        const items = await getFileUploadItems(upload.id)
        const steps = await getFileUploadSteps(upload.id)

        return {
          id: upload.id,
          name: upload.name,
          description: upload.description,
          recipientEmail: upload.recipient_email,
          sender: user ? {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            employeeId: user.employee_id,
          } : null,
          files: items.map((item) => ({
            name: item.name,
            size: item.size,
            type: item.type,
          })),
          status: upload.status,
          expirationHours: upload.expiration_hours,
          expiresAt: upload.expires_at,
          createdAt: upload.created_at,
          approvedAt: upload.approval_date,
          approvedBy: upload.approved_by,
          rejectionReason: upload.rejection_reason,
          workflow: {
            currentStep: upload.current_step,
            totalSteps: upload.total_steps,
            steps: steps.map((s) => ({
              title: s.title,
              status: s.status,
              completedDate: s.completed_date,
              comments: s.comments,
            })),
          },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: enriched,
    })
  } catch (error) {
    console.error("[API] List files error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
