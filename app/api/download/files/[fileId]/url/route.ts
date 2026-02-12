/**
 * GET /api/download/files/[fileId]/url
 * Gerar URL de download via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken,
  getUserById,
  getFileUploadById,
  getFileUploadItems,
  createDownloadLog,
  createAuditLog,
  createNotification,
} from "@/lib/db/queries"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null
  return authHeader.split(" ")[1]
}

interface RouteParams {
  params: Promise<{ fileId: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const upload = await getFileUploadById(fileId)
    if (!upload) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Arquivo nao encontrado" } },
        { status: 404 }
      )
    }

    // Verificar se nao expirou
    if (upload.expires_at && new Date(upload.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: "EXPIRED", message: "Este arquivo expirou" } },
        { status: 410 }
      )
    }

    // Verificar se usuario tem acesso
    const user = await getUserById(session.user_id)
    if (!user || user.email !== upload.recipient_email) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Voce nao tem acesso a este arquivo" } },
        { status: 403 }
      )
    }

    const items = await getFileUploadItems(fileId)
    const firstFile = items[0]

    // Registrar download
    await createDownloadLog({
      upload_id: fileId,
      document_name: firstFile?.name || upload.name,
      downloaded_by_email: user.email,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      user_agent: request.headers.get("user-agent") || undefined,
    })

    // Audit log
    await createAuditLog({
      action: "download",
      level: "success",
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_type: "external",
      target_id: fileId,
      target_name: firstFile?.name || upload.name,
      description: `Download realizado: ${firstFile?.name || upload.name}`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    })

    // Notificar remetente
    await createNotification({
      user_id: upload.sender_id,
      type: "download",
      priority: "medium",
      title: "Arquivo Baixado",
      message: `${user.name} baixou o arquivo "${firstFile?.name || upload.name}" do envio "${upload.name}".`,
      action_label: "Ver atividade",
      action_url: "/upload",
    })

    // Como nao temos S3 real, retornamos URL placeholder
    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: `/api/download/stream/${fileId}`,
        expiresIn: 300,
        fileName: firstFile?.name || upload.name,
        fileSize: firstFile?.size || "N/A",
      },
    })
  } catch (error) {
    console.error("[API] Get download URL error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
