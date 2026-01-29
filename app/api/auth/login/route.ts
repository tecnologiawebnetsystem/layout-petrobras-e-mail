/**
 * POST /api/auth/login
 * 
 * Endpoint para autenticacao de usuarios
 * Recebe email e password, retorna tokens JWT e dados do usuario
 * 
 * Integracao com backend Python: POST /v1/auth/login
 */

import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validacao basica dos campos
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email e senha sao obrigatorios",
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
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "AUTH_FAILED",
            message: "Credenciais invalidas",
          },
        },
        { status: response.status }
      )
    }

    // Retornar tokens e dados do usuario
    return NextResponse.json({
      success: true,
      data: {
        token: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in || 3600,
        user: {
          userId: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.department,
          employeeId: data.user.employee_id,
          manager: data.user.manager,
        },
      },
    })
  } catch (error) {
    console.error("[API] Login error:", error)
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
