import { NextResponse } from "next/server"
import { microsoftGraphMailService } from "@/lib/services/microsoft-graph-mail"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000"

/**
 * Registra o email enviado via Graph no backend (tabela email_log + audit).
 * Fire-and-forget: nao bloqueia o retorno ao cliente.
 */
async function logEmailToBackend(params: {
  accessToken: string
  messageId?: string
  emailType: string
  toEmail: string
  subject: string
  bodyPreview?: string
  userId?: number
  shareId?: number
  headers: Headers
}) {
  try {
    // Log na tabela email_log via endpoint dedicado
    await fetch(`${BACKEND_URL}/api/v1/emails/log-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.accessToken}`,
        "X-Forwarded-For": params.headers.get("x-forwarded-for") || "",
        "User-Agent": params.headers.get("user-agent") || "",
      },
      body: JSON.stringify({
        message_id: params.messageId,
        email_type: params.emailType,
        to_email: params.toEmail,
        subject: params.subject,
        body_preview: params.bodyPreview,
        status: "sent",
        user_id: params.userId,
        share_id: params.shareId,
      }),
    })
  } catch (err) {
    console.error("[API] Falha ao registrar email no backend (non-blocking):", err)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, uploadData, accessToken } = body

    if (!accessToken) {
      return NextResponse.json({ error: "Token de acesso não fornecido" }, { status: 401 })
    }

    let result

    switch (type) {
      case "sender":
        result = await microsoftGraphMailService.sendEmail(
          microsoftGraphMailService.createUploadConfirmationEmail({
            senderName: uploadData.sender.name,
            fileName: uploadData.name,
            recipient: uploadData.recipient,
            fileCount: uploadData.files.length,
            expirationHours: uploadData.expirationHours,
            uploadDate: uploadData.uploadDate,
          }),
          accessToken,
        )
        break

      case "supervisor":
        result = await microsoftGraphMailService.sendEmail(
          microsoftGraphMailService.createSupervisorNotificationEmail({
            supervisorName: uploadData.supervisorName || "Supervisor",
            supervisorEmail: uploadData.supervisorEmail,
            senderName: uploadData.sender.name,
            fileName: uploadData.name,
            recipient: uploadData.recipient,
            description: uploadData.description,
            fileCount: uploadData.files.length,
            uploadDate: uploadData.uploadDate,
            uploadId: uploadData.uploadId,
          }),
          accessToken,
        )
        break

      case "cancellation":
        result = await microsoftGraphMailService.sendEmail(
          {
            subject: `Compartilhamento Cancelado - ${uploadData.name}`,
            body: {
              contentType: "HTML",
              content: `
              <p>O compartilhamento <strong>${uploadData.name}</strong> foi cancelado por <strong>${uploadData.sender.name}</strong>.</p>
              <p><strong>Motivo:</strong> ${uploadData.cancellationReason || "Não informado"}</p>
              <p><strong>Data do cancelamento:</strong> ${uploadData.cancellationDate}</p>
            `,
            },
            toRecipients: [
              {
                emailAddress: {
                  address: uploadData.supervisorEmail,
                },
              },
            ],
            importance: "Normal",
          },
          accessToken,
        )
        break

      default:
        return NextResponse.json({ error: "Tipo de email inválido" }, { status: 400 })
    }

    if (!result.success) {
      console.error("[API] Erro ao enviar email:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Registra no backend (email_log + audit) - fire-and-forget
    const emailTypeMap: Record<string, string> = {
      sender: "file_share",
      supervisor: "approval_request",
      cancellation: "system",
    }
    const recipientEmail =
      type === "supervisor"
        ? uploadData.supervisorEmail
        : type === "cancellation"
          ? uploadData.supervisorEmail
          : uploadData.recipient

    logEmailToBackend({
      accessToken,
      messageId: result.messageId,
      emailType: emailTypeMap[type] || "system",
      toEmail: recipientEmail,
      subject: `[Graph/${type}] ${uploadData.name}`,
      bodyPreview: `Email tipo ${type} enviado via Microsoft Graph`,
      shareId: uploadData.uploadId,
      headers: request.headers,
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("[API] Erro crítico ao processar envio de email:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
