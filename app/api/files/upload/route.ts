/**
 * POST /api/files/upload
 * 
 * Endpoint para upload de arquivos
 * Recebe FormData com arquivos e metadados
 * 
 * Integracao com backend Python: POST /v1/files/upload
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

export async function POST(request: NextRequest) {
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

    // Obter FormData da requisicao
    const formData = await request.formData()

    // Validar se tem arquivos
    const files = formData.getAll("files")
    if (!files || files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_FILES",
            message: "Nenhum arquivo foi enviado",
          },
        },
        { status: 400 }
      )
    }

    // Validar campos obrigatorios
    const recipientEmail = formData.get("recipientEmail")
    const name = formData.get("name")
    const description = formData.get("description")
    const expirationHours = formData.get("expirationHours")

    if (!recipientEmail || !name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Destinatario e nome do compartilhamento sao obrigatorios",
          },
        },
        { status: 400 }
      )
    }

    // Encaminhar FormData para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/files/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        // Nao definir Content-Type para FormData, o browser define automaticamente
      },
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "UPLOAD_FAILED",
            message: "Erro ao fazer upload dos arquivos",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Upload realizado com sucesso",
      data: {
        uploadId: data.upload_id,
        name: data.name,
        recipientEmail: data.recipient_email,
        files: data.files.map((f: any) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          s3Key: f.s3_key,
        })),
        status: data.status,
        expirationHours: data.expiration_hours,
        createdAt: data.created_at,
      },
    })
  } catch (error) {
    console.error("[API] Upload error:", error)
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
