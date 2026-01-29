/**
 * GET /api/download/files
 * 
 * Lista arquivos disponiveis para download do usuario externo
 * Requer token de autenticacao externa (OTP)
 * 
 * Integracao com backend Python: GET /v1/download/files
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

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)

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
    const response = await fetch(`${BACKEND_URL}/v1/download/files`, {
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
            code: "FETCH_FAILED",
            message: "Erro ao buscar arquivos",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: data.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        description: file.description,
        sender: {
          name: file.sender.name,
          email: file.sender.email,
          department: file.sender.department,
        },
        files: file.files.map((f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
        expiresAt: file.expires_at,
        remainingTime: file.remaining_time,
        downloadCount: file.download_count,
        maxDownloads: file.max_downloads,
        createdAt: file.created_at,
      })),
    })
  } catch (error) {
    console.error("[API] Get download files error:", error)
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
