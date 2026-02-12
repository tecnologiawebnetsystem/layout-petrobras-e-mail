import { NextResponse } from "next/server"
import { microsoftGraphMailService } from "@/lib/services/microsoft-graph-mail"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * Registra o email OTP enviado via Graph no backend (tabela email_log + audit).
 * Fire-and-forget: nao bloqueia o retorno ao cliente.
 */
async function logOtpEmailToBackend(params: {
  accessToken?: string
  messageId?: string
  toEmail: string
  senderName: string
  fileName: string
  headers: Headers
}) {
  try {
    // Se temos accessToken, usamos o endpoint autenticado
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-For": params.headers.get("x-forwarded-for") || "",
      "User-Agent": params.headers.get("user-agent") || "",
    }
    if (params.accessToken) {
      authHeaders["Authorization"] = `Bearer ${params.accessToken}`
    }

    // Registra na tabela audit via endpoint de log
    await fetch(`${BACKEND_URL}/api/v1/audit/logs`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        action: "ENVIAR_OTP_GRAPH",
        detail: `to=${params.toEmail}, sender=${params.senderName}, file=${params.fileName}, message_id=${params.messageId}`,
        ip_address: params.headers.get("x-forwarded-for") || undefined,
        user_agent: params.headers.get("user-agent") || undefined,
      }),
    })
  } catch (err) {
    console.error("[API] Falha ao registrar OTP email no backend (non-blocking):", err)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code, shareInfo, accessToken } = body

    const result = await microsoftGraphMailService.sendEmail(
      microsoftGraphMailService.createExternalUserOTPEmail({
        recipientEmail: email,
        otpCode: code,
        senderName: shareInfo.senderName,
        fileName: shareInfo.fileName,
        expirationHours: shareInfo.expirationHours || 72,
      }),
      accessToken,
    )

    if (!result.success) {
      console.error("[API] Erro ao enviar email OTP:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Registra no backend (audit) - fire-and-forget
    logOtpEmailToBackend({
      accessToken,
      messageId: result.messageId,
      toEmail: email,
      senderName: shareInfo.senderName,
      fileName: shareInfo.fileName,
      headers: request.headers,
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("[API] Erro crítico ao enviar email OTP:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
