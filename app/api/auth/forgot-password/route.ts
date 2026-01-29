/**
 * POST /api/auth/forgot-password
 * 
 * Endpoint para recuperacao de senha
 * Envia email com link para redefinir senha
 * 
 * Integracao com backend Python: POST /v1/auth/forgot-password
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

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

    // Validacao de formato de email
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
    const response = await fetch(`${BACKEND_URL}/v1/auth/forgot-password`, {
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
            code: "REQUEST_FAILED",
            message: "Erro ao processar solicitacao",
          },
        },
        { status: response.status }
      )
    }

    // Sempre retornar sucesso por seguranca (nao revelar se email existe)
    return NextResponse.json({
      success: true,
      message: "Se o email estiver cadastrado, voce recebera instrucoes para redefinir sua senha",
    })
  } catch (error) {
    console.error("[API] Forgot password error:", error)
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
