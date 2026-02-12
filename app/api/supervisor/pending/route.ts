/**
 * GET /api/supervisor/pending
 * Lista arquivos pendentes de aprovacao via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getFileUploadsByStatus,
  getFileUploadItems,
  getFileUploadSteps,
  getUserById,
} from "@/lib/db/queries"

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

    // Verificar se e supervisor
    if (session.user_type !== "supervisor") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Acesso restrito a supervisores" } },
        { status: 403 }
      )
    }

    const uploads = await getFileUploadsByStatus("pending")

    const enriched = await Promise.all(
      uploads.map(async (upload) => {
        const [items, steps, sender] = await Promise.all([
          getFileUploadItems(upload.id),
          getFileUploadSteps(upload.id),
          getUserById(upload.sender_id),
        ])

        return {
          id: upload.id,
          name: upload.name,
          recipientEmail: upload.recipient_email,
          description: upload.description,
          sender: sender
            ? {
                id: sender.id,
                name: sender.name,
                email: sender.email,
                department: sender.department,
                employeeId: sender.employee_id,
              }
            : null,
          files: items.map((f) => ({ name: f.name, size: f.size, type: f.type })),
          expirationHours: upload.expiration_hours,
          createdAt: upload.created_at,
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
    console.error("[API] Get pending files error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
