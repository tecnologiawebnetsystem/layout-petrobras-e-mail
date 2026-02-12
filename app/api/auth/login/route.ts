/**
 * POST /api/auth/login
 * Autenticacao de usuarios direto no Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateUserLastLogin, createSession, createAuditLog } from "@/lib/db/queries"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email e senha sao obrigatorios" } },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_EMAIL", message: "Formato de email invalido" } },
        { status: 400 }
      )
    }

    // Buscar usuario no banco
    const user = await getUserByEmail(email)

    if (!user) {
      await createAuditLog({
        action: "login",
        level: "error",
        user_email: email,
        description: "Tentativa de login com email nao cadastrado",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      })
      return NextResponse.json(
        { success: false, error: { code: "AUTH_FAILED", message: "Credenciais invalidas" } },
        { status: 401 }
      )
    }

    // Validar senha
    if (user.password_hash) {
      const isValid = await bcrypt.compare(password, user.password_hash)
      if (!isValid) {
        await createAuditLog({
          action: "login",
          level: "error",
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          user_type: user.user_type,
          description: "Tentativa de login com senha incorreta",
          ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
        })
        return NextResponse.json(
          { success: false, error: { code: "AUTH_FAILED", message: "Credenciais invalidas" } },
          { status: 401 }
        )
      }
    }

    // Criar sessao
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
    const userAgent = request.headers.get("user-agent") || undefined
    const session = await createSession(user.id, ipAddress, userAgent)

    // Atualizar ultimo login
    await updateUserLastLogin(user.id)

    // Log de auditoria
    await createAuditLog({
      action: "login",
      level: "success",
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      user_type: user.user_type,
      user_employee_id: user.employee_id,
      description: "Login realizado com sucesso",
      ip_address: ipAddress || null,
    })

    return NextResponse.json({
      success: true,
      data: {
        token: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: 86400,
        user: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.user_type,
          department: user.department,
          employeeId: user.employee_id,
          jobTitle: user.job_title,
          phone: user.mobile_phone,
          photoUrl: user.photo_url,
        },
      },
    })
  } catch (error) {
    console.error("[API] Login error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
