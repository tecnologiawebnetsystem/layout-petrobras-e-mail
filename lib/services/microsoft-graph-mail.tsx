import { msalInstance, loginRequest } from "@/lib/auth/entra-config"

export interface EmailRecipient {
  emailAddress: {
    address: string
    name?: string
  }
}

export interface EmailMessage {
  subject: string
  body: {
    contentType: "HTML" | "Text"
    content: string
  }
  toRecipients: EmailRecipient[]
  ccRecipients?: EmailRecipient[]
  importance?: "Low" | "Normal" | "High"
}

export class MicrosoftGraphMailService {
  private async getAccessToken(): Promise<string> {
    try {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        throw new Error("Nenhuma conta autenticada encontrada")
      }

      const request = {
        ...loginRequest,
        account: accounts[0],
        scopes: ["Mail.Send"],
      }

      const response = await msalInstance.acquireTokenSilent(request)
      return response.accessToken
    } catch (error) {
      console.error("[v0] Erro ao obter token para envio de email:", error)
      throw new Error("Não foi possível autenticar para envio de email")
    }
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log("[v0] Iniciando envio de email via Microsoft Graph API")
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
        console.error("[v0] Erro ao enviar email:", errorText)
        return {
          success: false,
          error: `Erro ao enviar email: ${response.status} - ${errorText}`,
        }
      }

      console.log("[v0] Email enviado com sucesso")
      return {
        success: true,
        messageId: response.headers.get("x-ms-request-id") || undefined,
      }
    } catch (error) {
      console.error("[v0] Erro crítico ao enviar email:", error)
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
    return {
      subject: `✅ Confirmação de Envio - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00A99D 0%, #0047BB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #00A99D; border-radius: 5px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .button { background: #0047BB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📦 Envio Confirmado</h1>
                  <p>Seu arquivo foi enviado para aprovação</p>
                </div>
                <div class="content">
                  <p>Olá <strong>${data.senderName}</strong>,</p>
                  <p>Seu envio foi registrado com sucesso e está aguardando aprovação do supervisor.</p>
                  
                  <div class="info-box">
                    <p><strong>📄 Arquivo:</strong> ${data.fileName}</p>
                    <p><strong>📧 Destinatário:</strong> ${data.recipient}</p>
                    <p><strong>📁 Quantidade de arquivos:</strong> ${data.fileCount}</p>
                    <p><strong>⏱️ Validade após aprovação:</strong> ${data.expirationHours} horas</p>
                    <p><strong>📅 Data do envio:</strong> ${data.uploadDate}</p>
                  </div>

                  <p><strong>Próximos passos:</strong></p>
                  <ol>
                    <li>Seu supervisor receberá uma notificação para aprovar o envio</li>
                    <li>Após aprovação, o destinatário receberá um email com link e código de acesso</li>
                    <li>O arquivo ficará disponível por ${data.expirationHours} horas após a aprovação</li>
                  </ol>

                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://layout-petro-e-mail.vercel.app"}/compartilhamentos" class="button">
                    Ver Meus Compartilhamentos
                  </a>
                </div>
                <div class="footer">
                  <p>© 2025 Petrobras - Sistema de Transferência Segura de Arquivos</p>
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
            address: data.senderName.includes("@") ? data.senderName : `${data.senderName}@petrobras.com.br`,
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
    return {
      subject: `🔔 Novo Upload para Aprovação - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #FDB913 0%, #FF6B00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FDB913; border-radius: 5px; }
                .urgent { background: #FFF3CD; border-left-color: #FF6B00; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .button { background: #0047BB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Aprovação Necessária</h1>
                  <p>Um novo compartilhamento aguarda sua análise</p>
                </div>
                <div class="content">
                  <p>Olá <strong>${data.supervisorName}</strong>,</p>
                  <p>Um membro de sua equipe enviou um arquivo para destinatário externo e aguarda sua aprovação.</p>
                  
                  <div class="info-box">
                    <p><strong>👤 Remetente:</strong> ${data.senderName}</p>
                    <p><strong>📄 Arquivo:</strong> ${data.fileName}</p>
                    <p><strong>📧 Destinatário externo:</strong> ${data.recipient}</p>
                    <p><strong>📁 Quantidade de arquivos:</strong> ${data.fileCount}</p>
                    <p><strong>📅 Data do envio:</strong> ${data.uploadDate}</p>
                  </div>

                  <div class="urgent">
                    <p><strong>📝 Descrição:</strong></p>
                    <p>${data.description}</p>
                  </div>

                  <p><strong>Ação necessária:</strong></p>
                  <p>Por favor, revise o compartilhamento e aprove ou rejeite conforme as políticas de segurança da Petrobras.</p>

                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://layout-petro-e-mail.vercel.app"}/supervisor/detalhes/${data.uploadId}" class="button">
                    Revisar e Aprovar
                  </a>
                </div>
                <div class="footer">
                  <p>© 2025 Petrobras - Sistema de Transferência Segura de Arquivos</p>
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
    return {
      subject: `🔐 Seu código de acesso - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #00A99D 0%, #0047BB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .otp-box { background: #0047BB; color: white; padding: 30px; margin: 20px 0; text-align: center; border-radius: 10px; font-size: 32px; letter-spacing: 8px; font-weight: bold; }
                .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #00A99D; border-radius: 5px; }
                .warning { background: #FFF3CD; border-left: 4px solid #FDB913; padding: 15px; margin: 15px 0; border-radius: 5px; }
                .button { background: #0047BB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📥 Arquivo Disponível para Download</h1>
                  <p>Você recebeu um compartilhamento seguro da Petrobras</p>
                </div>
                <div class="content">
                  <p>Olá,</p>
                  <p><strong>${data.senderName}</strong> compartilhou um arquivo com você através do sistema seguro da Petrobras.</p>
                  
                  <div class="info-box">
                    <p><strong>📄 Arquivo:</strong> ${data.fileName}</p>
                    <p><strong>👤 Enviado por:</strong> ${data.senderName}</p>
                    <p><strong>⏱️ Validade:</strong> ${data.expirationHours} horas</p>
                  </div>

                  <p><strong>Seu código de acesso:</strong></p>
                  <div class="otp-box">
                    ${data.otpCode}
                  </div>

                  <div class="warning">
                    <p><strong>⚠️ Importante:</strong></p>
                    <ul>
                      <li>Este código é válido por 10 minutos</li>
                      <li>Não compartilhe este código com terceiros</li>
                      <li>O arquivo estará disponível por ${data.expirationHours} horas</li>
                    </ul>
                  </div>

                  <p><strong>Como acessar:</strong></p>
                  <ol>
                    <li>Clique no botão abaixo para acessar o sistema</li>
                    <li>Digite seu email: <strong>${data.recipientEmail}</strong></li>
                    <li>Insira o código de 6 dígitos acima</li>
                    <li>Faça o download dos arquivos</li>
                  </ol>

                  <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://layout-petro-e-mail.vercel.app"}/download" class="button">
                    Acessar Sistema e Baixar
                  </a>
                </div>
                <div class="footer">
                  <p>© 2025 Petrobras - Sistema de Transferência Segura de Arquivos</p>
                  <p>Se você não esperava este email, pode ignorá-lo com segurança.</p>
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
