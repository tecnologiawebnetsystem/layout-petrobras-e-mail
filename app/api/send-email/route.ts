import { NextResponse } from "next/server"
import { microsoftGraphMailService } from "@/lib/services/microsoft-graph-mail"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, uploadData } = body

    let result

    switch (type) {
      case "sender":
        // Email de confirmação para remetente
        result = await microsoftGraphMailService.sendEmail(
          microsoftGraphMailService.createUploadConfirmationEmail({
            senderName: uploadData.sender.name,
            fileName: uploadData.name,
            recipient: uploadData.recipient,
            fileCount: uploadData.files.length,
            expirationHours: uploadData.expirationHours,
            uploadDate: uploadData.uploadDate,
          }),
        )
        break

      case "supervisor":
        // Email de notificação para supervisor
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
        )
        break

      case "cancellation":
        // Email de cancelamento para supervisor
        result = await microsoftGraphMailService.sendEmail({
          subject: `❌ Compartilhamento Cancelado - ${uploadData.name}`,
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
        })
        break

      default:
        return NextResponse.json({ error: "Tipo de email inválido" }, { status: 400 })
    }

    if (!result.success) {
      console.error("[API] Erro ao enviar email:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (error) {
    console.error("[API] Erro crítico ao processar envio de email:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
