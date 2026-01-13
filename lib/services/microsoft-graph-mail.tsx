import { msalInstance } from "@/lib/auth/entra-config"

interface EmailMessage {
  subject: string
  body: {
    contentType: "HTML" | "Text"
    content: string
  }
  toRecipients: Array<{
    emailAddress: {
      address: string
      name?: string
    }
  }>
  importance?: "Low" | "Normal" | "High"
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

class MicrosoftGraphMailService {
  private async getAccessToken(): Promise<string> {
    try {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        throw new Error("Nenhuma conta autenticada encontrada")
      }

      const request = {
        scopes: ["Mail.Send"],
        account: accounts[0],
      }

      const response = await msalInstance.acquireTokenSilent(request)
      return response.accessToken
    } catch (error) {
      console.error("[Graph Mail] Erro ao obter token:", error)
      throw error
    }
  }

  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          saveToSentItems: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Erro ao enviar email: ${response.status} - ${errorText}`)
      }

      return {
        success: true,
        messageId: `email-${Date.now()}`,
      }
    } catch (error) {
      console.error("[Graph Mail] Erro ao enviar email:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao enviar email",
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
  }): EmailMessage {
    const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin

    return {
      subject: `✅ Confirmação de Compartilhamento - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #006494 0%, #009bdf 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #006494; margin: 20px 0; border-radius: 4px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
              .info-label { font-weight: bold; color: #006494; }
              .button { display: inline-block; padding: 12px 30px; background: #006494; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">📤 Compartilhamento Enviado</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.senderName}</strong>,</p>
                <p>Seu compartilhamento foi enviado com sucesso e está aguardando aprovação do supervisor.</p>
                
                <div class="info-box">
                  <h3 style="margin-top:0; color:#006494;">📋 Detalhes do Compartilhamento</h3>
                  <div class="info-row">
                    <span class="info-label">Arquivo:</span>
                    <span>${data.fileName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Destinatário:</span>
                    <span>${data.recipient}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Quantidade de arquivos:</span>
                    <span>${data.fileCount}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Validade:</span>
                    <span>${data.expirationHours} horas</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Data de envio:</span>
                    <span>${data.uploadDate}</span>
                  </div>
                </div>

                <p><strong>Próximos passos:</strong></p>
                <ul>
                  <li>Seu supervisor receberá uma notificação para aprovar o compartilhamento</li>
                  <li>Após aprovação, o destinatário receberá um código de acesso por email</li>
                  <li>Você será notificado quando o compartilhamento for aprovado ou rejeitado</li>
                </ul>

                <center>
                  <a href="${baseUrl}/compartilhamentos" class="button">Acompanhar Status</a>
                </center>

                <div class="footer">
                  <p>Este é um email automático da Petrobras - Transferência Segura de Arquivos</p>
                  <p>Por favor, não responda este email.</p>
                </div>
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
            name: data.senderName,
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
    description: string
    fileCount: number
    uploadDate: string
    uploadId: string
  }): EmailMessage {
    const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin

    return {
      subject: `⚠️ Nova Solicitação de Aprovação - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ffc600 0%, #ff8c00 100%); color: #1a1a1a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #006494; margin: 20px 0; border-radius: 4px; }
              .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
              .info-label { font-weight: bold; color: #006494; }
              .buttons { display: flex; gap: 10px; justify-content: center; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .button-approve { background: #28a745; }
              .button-review { background: #006494; }
              .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">🔔 Aprovação Necessária</h1>
              </div>
              <div class="content">
                <p>Olá <strong>${data.supervisorName}</strong>,</p>
                
                <div class="alert-box">
                  <p style="margin:0;"><strong>⚠️ Ação necessária:</strong> Um novo compartilhamento aguarda sua aprovação.</p>
                </div>

                <p><strong>${data.senderName}</strong> enviou um compartilhamento que precisa da sua aprovação:</p>
                
                <div class="info-box">
                  <h3 style="margin-top:0; color:#006494;">📋 Detalhes do Compartilhamento</h3>
                  <div class="info-row">
                    <span class="info-label">Remetente:</span>
                    <span>${data.senderName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Arquivo:</span>
                    <span>${data.fileName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Destinatário:</span>
                    <span>${data.recipient}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Descrição:</span>
                    <span>${data.description || "Não informada"}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Quantidade de arquivos:</span>
                    <span>${data.fileCount}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Data de envio:</span>
                    <span>${data.uploadDate}</span>
                  </div>
                </div>

                <p><strong>Importante:</strong> Após sua aprovação, o destinatário externo receberá automaticamente um código de acesso por email para baixar os arquivos com segurança.</p>

                <center>
                  <div class="buttons">
                    <a href="${baseUrl}/supervisor/detalhes/${data.uploadId}" class="button button-review">Revisar Solicitação</a>
                  </div>
                </center>

                <div class="footer">
                  <p>Este é um email automático da Petrobras - Transferência Segura de Arquivos</p>
                  <p>Por favor, não responda este email.</p>
                </div>
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
            name: data.supervisorName,
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
  }): EmailMessage {
    const baseUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin

    return {
      subject: `🔐 Código de Acesso - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp-box { background: white; padding: 30px; text-align: center; border: 2px dashed #28a745; border-radius: 8px; margin: 20px 0; }
              .otp-code { font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
              .info-box { background: white; padding: 20px; border-left: 4px solid #006494; margin: 20px 0; border-radius: 4px; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
              .footer { text-align: center; color: #6c757d; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin:0;">✅ Compartilhamento Aprovado</h1>
              </div>
              <div class="content">
                <p>Olá,</p>
                <p><strong>${data.senderName}</strong> compartilhou arquivos com você através da plataforma segura da Petrobras.</p>
                
                <div class="info-box">
                  <h3 style="margin-top:0; color:#006494;">📋 Detalhes do Compartilhamento</h3>
                  <p><strong>Arquivo:</strong> ${data.fileName}</p>
                  <p><strong>Remetente:</strong> ${data.senderName}</p>
                  <p><strong>Validade:</strong> ${data.expirationHours} horas</p>
                </div>

                <div class="otp-box">
                  <h3 style="margin-top:0;">🔐 Seu Código de Acesso</h3>
                  <div class="otp-code">${data.otpCode}</div>
                  <p style="margin-bottom:0; color:#6c757d;">Guarde este código em local seguro</p>
                </div>

                <div class="warning-box">
                  <p style="margin:0;"><strong>⚠️ Importante:</strong> Este código expira em ${data.expirationHours} horas. Use o link abaixo para acessar os arquivos.</p>
                </div>

                <center>
                  <a href="${baseUrl}/external-verify?email=${encodeURIComponent(data.recipientEmail)}" class="button">Acessar Arquivos</a>
                </center>

                <p><strong>Como acessar:</strong></p>
                <ol>
                  <li>Clique no botão "Acessar Arquivos" acima</li>
                  <li>Confirme seu email: ${data.recipientEmail}</li>
                  <li>Digite o código de 6 dígitos fornecido acima</li>
                  <li>Baixe os arquivos compartilhados com segurança</li>
                </ol>

                <div class="footer">
                  <p>Este é um email automático da Petrobras - Transferência Segura de Arquivos</p>
                  <p>Se você não solicitou este compartilhamento, ignore este email.</p>
                  <p>Por favor, não responda este email.</p>
                </div>
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
