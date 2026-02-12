/**
 * POST /api/auth/forgot-password
 * Recuperacao de senha via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, createOtpCode, createEmailHistoryEntry, createAuditLog } from "@/lib/db/queries"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Email e obrigatorio" } },
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

    // Verificar se usuario existe (sem revelar ao cliente)
    const user = await getUserByEmail(email)
    if (user) {
      // Gerar codigo OTP para reset
      const code = await createOtpCode(email)

      // Registrar email no historico
      await createEmailHistoryEntry({
        to_email: email,
        to_name: user.name,
        subject: "Redefinicao de senha - Petrobras",
        body: `Seu codigo de redefinicao de senha e: ${code}. Este codigo expira em 10 minutos.`,
        status: "sent",
      })

      await createAuditLog({
        action: "password_reset",
        level: "info",
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_type: user.user_type,
        description: "Solicitacao de redefinicao de senha",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      })
    }

    // Sempre retornar sucesso por seguranca (nao revelar se email existe)
    return NextResponse.json({
      success: true,
      message: "Se o email estiver cadastrado, voce recebera instrucoes para redefinir sua senha",
    })
  } catch (error) {
    console.error("[API] Forgot password error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
