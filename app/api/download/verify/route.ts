/**
 * POST /api/download/verify
 * Verifica email externo e envia OTP via Neon PostgreSQL
 */

import { NextRequest, NextResponse } from "next/server"
import { getFileUploadsByRecipient, createOtpCode, createEmailHistoryEntry, createAuditLog } from "@/lib/db/queries"

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

    // Buscar arquivos aprovados para este email
    const files = await getFileUploadsByRecipient(email, "approved")
    const validFiles = files.filter((f) => f.expires_at && new Date(f.expires_at) > new Date())

    if (validFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILES", message: "Nenhum arquivo encontrado para este email" } },
        { status: 404 }
      )
    }

    // Gerar OTP
    const code = await createOtpCode(email)

    // Registrar email
    await createEmailHistoryEntry({
      to_email: email,
      subject: "Codigo de verificacao - Petrobras",
      body: `Seu codigo de verificacao e: ${code}. Valido por 10 minutos.`,
      status: "sent",
    })

    await createAuditLog({
      action: "otp_request",
      level: "info",
      user_email: email,
      description: `Codigo OTP enviado para ${email} (${validFiles.length} arquivo(s) disponiveis)`,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
    })

    return NextResponse.json({
      success: true,
      message: "Codigo de verificacao enviado para o email",
      data: {
        hasFiles: true,
        fileCount: validFiles.length,
        otpSent: true,
        expiresIn: 600,
      },
    })
  } catch (error) {
    console.error("[API] Download verify error:", error)
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } },
      { status: 500 }
    )
  }
}
