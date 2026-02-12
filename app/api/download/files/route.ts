/**
 * GET /api/download/files
 * Listar arquivos disponiveis para download via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getUserById,
  getFileUploadsByRecipient,
  getFileUploadItems,
  getDownloadLogsByUpload,
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

    const user = await getUserById(session.user_id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND", message: "Usuario nao encontrado" } },
        { status: 404 }
      )
    }

    // Buscar uploads aprovados para o email deste usuario
    const uploads = await getFileUploadsByRecipient(user.email, "approved")
    const now = new Date()

    const enriched = await Promise.all(
      uploads
        .filter((u) => u.expires_at && new Date(u.expires_at) > now)
        .map(async (upload) => {
          const [items, downloads, sender] = await Promise.all([
            getFileUploadItems(upload.id),
            getDownloadLogsByUpload(upload.id),
            getUserById(upload.sender_id),
          ])

          const expiresAt = new Date(upload.expires_at!)
          const remainingMs = expiresAt.getTime() - now.getTime()
          const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)))
          const remainingMinutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)))

          return {
            id: upload.id,
            name: upload.name,
            description: upload.description,
            sender: sender
              ? { name: sender.name, email: sender.email, department: sender.department }
              : null,
            files: items.map((f) => ({ name: f.name, size: f.size, type: f.type })),
            expiresAt: upload.expires_at,
            remainingTime: `${remainingHours}h ${remainingMinutes}m`,
            downloadCount: downloads.length,
            createdAt: upload.created_at,
          }
        })
    )

    return NextResponse.json({
      success: true,
      data: enriched,
    })
  } catch (error) {
    console.error("[API] Get download files error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
