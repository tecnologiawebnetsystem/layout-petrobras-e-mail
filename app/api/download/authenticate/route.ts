/**
 * POST /api/download/authenticate
 * 
 * Autentica usuario externo com codigo OTP
 * Retorna token temporario para acesso aos downloads
 * 
 * Integracao com backend Python: POST /v1/download/authenticate
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    // Validar campos obrigatorios
    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email e codigo sao obrigatorios",
          },
        },
        { status: 400 }
      )
    }

    // Validar formato do codigo (6 digitos)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_CODE",
            message: "Codigo deve ter 6 digitos",
          },
        },
        { status: 400 }
      )
    }

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/download/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "AUTH_FAILED",
            message: "Codigo invalido ou expirado",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Autenticacao realizada com sucesso",
      data: {
        token: data.token,
        expiresIn: data.expires_in || 3600, // 1 hora
        email: data.email,
        fileCount: data.file_count,
      },
    })
  } catch (error) {
    console.error("[API] Download authenticate error:", error)
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
