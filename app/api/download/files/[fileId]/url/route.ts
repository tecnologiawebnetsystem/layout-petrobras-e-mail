/**
 * GET /api/download/files/[fileId]/url
 * 
 * Gera URL pre-assinada para download do arquivo
 * Requer token de autenticacao externa (OTP)
 * 
 * Integracao com backend Python: GET /v1/download/files/{file_id}/url
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
    const response = await fetch(`${BACKEND_URL}/v1/download/files/${fileId}/url`, {
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
            code: "URL_GENERATION_FAILED",
            message: "Erro ao gerar URL de download",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: data.download_url,
        expiresIn: data.expires_in || 300, // 5 minutos
        fileName: data.file_name,
        fileSize: data.file_size,
        remainingDownloads: data.remaining_downloads,
      },
    })
  } catch (error) {
    console.error("[API] Get download URL error:", error)
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
