/**
 * GET /api/users/me - Obter dados do usuario autenticado
 * PUT /api/users/me - Atualizar perfil do usuario
 * 
 * Integracao com backend Python: 
 * - GET /v1/users/me
 * - PUT /v1/users/me
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

/**
 * GET /api/users/me
 * Retorna os dados do usuario autenticado
 */
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
    const response = await fetch(`${BACKEND_URL}/v1/users/me`, {
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
            message: "Erro ao buscar dados do usuario",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        jobTitle: data.job_title,
        phone: data.phone,
        employeeId: data.employee_id,
        photoUrl: data.photo_url,
        createdAt: data.created_at,
        lastLogin: data.last_login,
        manager: data.manager ? {
          id: data.manager.id,
          name: data.manager.name,
          email: data.manager.email,
        } : null,
      },
    })
  } catch (error) {
    console.error("[API] Get user error:", error)
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

/**
 * PUT /api/users/me
 * Atualiza dados do perfil do usuario
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { name, phone, department, jobTitle } = body

    // Chamada para o backend Python
    const response = await fetch(`${BACKEND_URL}/v1/users/me`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        department,
        job_title: jobTitle,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || {
            code: "UPDATE_FAILED",
            message: "Erro ao atualizar perfil",
          },
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: {
        userId: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        jobTitle: data.job_title,
      },
    })
  } catch (error) {
    console.error("[API] Update user error:", error)
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
