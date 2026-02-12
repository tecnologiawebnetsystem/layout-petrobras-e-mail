interface EmailData {
  subject: string
  body: {
    contentType: string
    content: string
  }
  toRecipients: Array<{
    emailAddress: {
      address: string
    }
  }>
  importance?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

class MicrosoftGraphMailService {
  private baseUrl = "https://graph.microsoft.com/v1.0"

  async sendEmail(emailData: EmailData, accessToken: string): Promise<EmailResult> {
    try {
      console.log("[Graph Mail] Enviando email via Microsoft Graph API")

      if (!accessToken) {
        throw new Error("Token de acesso não fornecido")
      }

      const response = await fetch(`${this.baseUrl}/me/sendMail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: emailData,
          saveToSentItems: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Graph Mail] Erro na resposta:", errorText)
        throw new Error(`Falha ao enviar email: ${response.status} ${errorText}`)
      }

      console.log("[Graph Mail] Email enviado com sucesso")
      return {
        success: true,
        messageId: "sent",
      }
    } catch (error) {
      console.error("[Graph Mail] Erro ao enviar email:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }
    }
  }

  createUploadConfirmationEmail(data: {
    senderName: string
    fileName: string
    recipient: string
    fileCount: number
    expirationHours: number
    uploadDate: string
  }): EmailData {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://compartilhamento-petrobras.vercel.app"

    return {
      subject: `✅ Confirmação de Compartilhamento - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #006494; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .info-box { background: white; border-left: 4px solid #006494; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #006494; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Compartilhamento Confirmado</h2>
              </div>
              <div class="content">
                <p>Olá <strong>${data.senderName}</strong>,</p>
                <p>Seu compartilhamento foi criado com sucesso e está aguardando aprovação do seu supervisor.</p>
                <div class="info-box">
                  <p><strong>📄 Arquivo:</strong> ${data.fileName}</p>
                  <p><strong>📧 Destinatário:</strong> ${data.recipient}</p>
                  <p><strong>📁 Quantidade de arquivos:</strong> ${data.fileCount}</p>
                  <p><strong>⏰ Validade:</strong> ${data.expirationHours} horas após aprovação</p>
                  <p><strong>📅 Data do envio:</strong> ${data.uploadDate}</p>
                </div>
                <p>Você receberá uma notificação quando o supervisor aprovar ou rejeitar o compartilhamento.</p>
                <a href="${appUrl}/compartilhamentos" class="button">Acompanhar Status</a>
              </div>
              <div class="footer">
                <p>Sistema de Transferência Segura de Arquivos - Petrobras</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.recipient,
          },
        },
      ],
      importance: "Normal",
    }
  }

  createSupervisorNotificationEmail(data: {
    supervisorName: string
    supervisorEmail: string
    senderName: string
    fileName: string
    recipient: string
    description?: string
    fileCount: number
    uploadDate: string
    uploadId: string
  }): EmailData {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://compartilhamento-petrobras.vercel.app"
    const approvalLink = `${appUrl}/supervisor/detalhes/${data.uploadId}`

    return {
      subject: `🔔 Nova Solicitação de Compartilhamento - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #FFC107; color: #333; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .info-box { background: white; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #006494; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
              .urgent { background: #FFC107; padding: 10px; border-radius: 4px; margin: 15px 0; text-align: center; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>⚠️ Aprovação Necessária</h2>
              </div>
              <div class="content">
                <p>Olá <strong>${data.supervisorName}</strong>,</p>
                <div class="urgent">
                  Uma nova solicitação de compartilhamento requer sua aprovação
                </div>
                <div class="info-box">
                  <p><strong>👤 Solicitante:</strong> ${data.senderName}</p>
                  <p><strong>📄 Arquivo:</strong> ${data.fileName}</p>
                  <p><strong>📧 Destinatário Externo:</strong> ${data.recipient}</p>
                  <p><strong>📁 Quantidade de arquivos:</strong> ${data.fileCount}</p>
                  <p><strong>📅 Data da solicitação:</strong> ${data.uploadDate}</p>
                  ${data.description ? `<p><strong>📝 Justificativa:</strong> ${data.description}</p>` : ""}
                </div>
                <p>Por favor, revise e aprove ou rejeite esta solicitação o mais breve possível.</p>
                <a href="${approvalLink}" class="button">Revisar e Aprovar</a>
              </div>
              <div class="footer">
                <p>Sistema de Transferência Segura de Arquivos - Petrobras</p>
                <p>Este é um email automático, não responda.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.supervisorEmail,
          },
        },
      ],
      importance: "High",
    }
  }
  createExternalUserOTPEmail(data: {
    recipientEmail: string
    otpCode: string
    senderName: string
    fileName: string
    expirationHours: number
  }): EmailData {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://compartilhamento-petrobras.vercel.app"

    return {
      subject: `Codigo de Acesso - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #006494; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .otp-box { background: #006494; color: white; font-size: 32px; letter-spacing: 8px; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; font-weight: bold; }
              .info-box { background: white; border-left: 4px solid #006494; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #006494; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
              .warning { background: #FFF3CD; border: 1px solid #FFC107; padding: 12px; border-radius: 4px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Transferencia Segura de Arquivos</h2>
                <p>Petrobras</p>
              </div>
              <div class="content">
                <p>Voce recebeu arquivos compartilhados por <strong>${data.senderName}</strong> da Petrobras.</p>
                <p>Use o codigo abaixo para acessar os documentos:</p>
                <div class="otp-box">${data.otpCode}</div>
                <div class="info-box">
                  <p><strong>Arquivo:</strong> ${data.fileName}</p>
                  <p><strong>Enviado por:</strong> ${data.senderName}</p>
                  <p><strong>Validade do acesso:</strong> ${data.expirationHours} horas</p>
                </div>
                <div class="warning">
                  <strong>Importante:</strong> Este codigo expira em 10 minutos. Nao compartilhe com terceiros.
                </div>
                <a href="${appUrl}/download" class="button">Acessar Documentos</a>
              </div>
              <div class="footer">
                <p>Sistema de Transferencia Segura de Arquivos - Petrobras</p>
                <p>Este e um email automatico, nao responda.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: data.recipientEmail,
          },
        },
      ],
      importance: "High",
    }
  }
}

export const microsoftGraphMailService = new MicrosoftGraphMailService()
