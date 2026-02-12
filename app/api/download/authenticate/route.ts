/**
 * POST /api/download/authenticate
 * Autenticar externo com OTP via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyOtpCode, getFileUploadsByRecipient, getUserByEmail, createUser, createSession, createAuditLog } from "@/lib/db/queries"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email e codigo sao obrigatorios" } },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CODE", message: "Codigo deve ter 6 digitos" } },
        { status: 400 }
      )
    }

    // Verificar OTP
    const isValid = await verifyOtpCode(email, code)
    if (!isValid) {
      await createAuditLog({
        action: "otp_verify",
        level: "error",
        user_email: email,
        description: "Codigo OTP invalido ou expirado",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      })
      return NextResponse.json(
        { success: false, error: { code: "AUTH_FAILED", message: "Codigo invalido ou expirado" } },
        { status: 401 }
      )
    }

    // Buscar ou criar usuario externo
    let user = await getUserByEmail(email)
    if (!user) {
      user = await createUser({
        email,
        name: email.split("@")[0],
        user_type: "external",
      })
    }

    // Criar sessao temporaria (1 hora)
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined
    const userAgent = request.headers.get("user-agent") || undefined
    const session = await createSession(user.id, ipAddress, userAgent)

    // Contar arquivos disponiveis
    const files = await getFileUploadsByRecipient(email, "approved")
    const validFiles = files.filter((f) => f.expires_at && new Date(f.expires_at) > new Date())

    await createAuditLog({
      action: "login",
      level: "success",
      user_id: user.id,
      user_name: user.name,
      user_email: email,
      user_type: "external",
      description: "Login externo via codigo de verificacao",
      ip_address: ipAddress || null,
    })

    return NextResponse.json({
      success: true,
      message: "Autenticacao realizada com sucesso",
      data: {
        token: session.access_token,
        expiresIn: 3600,
        email,
        fileCount: validFiles.length,
      },
    })
  } catch (error) {
    console.error("[API] Download authenticate error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
