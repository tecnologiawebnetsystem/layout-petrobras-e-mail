/**
 * POST /api/download/verify
 * 
 * Verifica se um email externo tem arquivos disponiveis para download
 * e envia codigo OTP para autenticacao
 * 
 * Integracao com backend Python: POST /v1/download/verify
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validar email
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email e obrigatorio",
          },
        },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_EMAIL",
            message: "Formato de email invalido",
          },
        },
        { status: 400 }
      )
    }

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/download/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "VERIFICATION_FAILED",
            message: "Nenhum arquivo encontrado para este email",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Codigo de verificacao enviado para o email",
      data: {
        hasFiles: data.has_files,
        fileCount: data.file_count,
        otpSent: data.otp_sent,
        expiresIn: data.expires_in || 300, // 5 minutos
      },
    })
  } catch (error) {
    console.error("[API] Download verify error:", error)
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
