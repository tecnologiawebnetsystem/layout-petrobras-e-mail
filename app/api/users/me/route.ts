/**
 * GET /api/users/me - Obter dados do usuario autenticado
 * PUT /api/users/me - Atualizar perfil do usuario
 * Via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getSessionByAccessToken, getUserById } from "@/lib/db/queries"
import { sql } from "@/lib/db/neon"

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

    // Buscar manager se existir
    let manager = null
    if (user.manager_id) {
      const mgr = await getUserById(user.manager_id)
      if (mgr) {
        manager = { id: mgr.id, name: mgr.name, email: mgr.email }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.user_type,
        department: user.department,
        jobTitle: user.job_title,
        phone: user.mobile_phone,
        employeeId: user.employee_id,
        photoUrl: user.photo_url,
        officeLocation: user.office_location,
        createdAt: user.created_at,
        lastLogin: user.last_login_at,
        manager,
      },
    })
  } catch (error) {
    console.error("[API] Get user error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { name, phone, department, jobTitle } = body

    const rows = await sql`
      UPDATE users SET
        name = COALESCE(${name || null}, name),
        mobile_phone = COALESCE(${phone || null}, mobile_phone),
        department = COALESCE(${department || null}, department),
        job_title = COALESCE(${jobTitle || null}, job_title),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${session.user_id}
      RETURNING *
    `

    const user = rows[0]
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UPDATE_FAILED", message: "Erro ao atualizar perfil" } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: {
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.mobile_phone,
        department: user.department,
        jobTitle: user.job_title,
      },
    })
  } catch (error) {
    console.error("[API] Update user error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
