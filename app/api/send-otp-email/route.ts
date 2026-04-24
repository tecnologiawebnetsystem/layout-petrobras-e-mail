import { NextResponse } from "next/server"
import { microsoftGraphMailService } from "@/lib/services/microsoft-graph-mail"

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080"

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
    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Forwarded-For": params.headers.get("x-forwarded-for") || "",
      "User-Agent": params.headers.get("user-agent") || "",
    }
    // Encaminha o cookie de sessao da app (app_session) para autenticar no backend Python.
    // NAO usa o access token MSAL, que e incompativel com decode_app_jwt do backend.
    const cookie = params.headers.get("cookie") || ""
    if (cookie) {
      authHeaders["Cookie"] = cookie
    }

    // Registra na tabela email_log + audit via endpoint dedicado
    await fetch(`${BACKEND_URL}/api/v1/emails/log-external`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        message_id: params.messageId,
        email_type: "otp",
        to_email: params.toEmail,
        subject: `[Graph/OTP] Codigo de acesso para ${params.fileName}`,
        body_preview: `OTP enviado para ${params.toEmail} ref. ${params.senderName}/${params.fileName}`,
        status: "sent",
      }),
    })
  } catch (err) {
    // console.error("[API] Falha ao registrar OTP email no backend (non-blocking):", err)
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
    // console.error("[API] Erro crítico ao enviar email OTP:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
