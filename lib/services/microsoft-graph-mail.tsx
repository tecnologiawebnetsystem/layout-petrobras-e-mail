import { PublicClientApplication } from "@azure/msal-browser"
import { msalConfig, loginRequest } from "@/lib/auth/entra-config"

interface EmailAddress {
  address: string
}

interface Recipient {
  emailAddress: EmailAddress
}

interface EmailBody {
  contentType: "Text" | "HTML"
  content: string
}

interface Email {
  subject: string
  body: EmailBody
  toRecipients: Recipient[]
  importance: "Low" | "Normal" | "High"
}

interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

class MicrosoftGraphMailService {
  private msalInstance: PublicClientApplication

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig)
  }

  async sendEmail(email: Email): Promise<SendEmailResult> {
    try {
      const accounts = this.msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        return { success: false, error: "Nenhuma conta autenticada encontrada" }
      }

      const tokenResponse = await this.msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
        scopes: ["Mail.Send"],
      })

      const accessToken = tokenResponse.accessToken

      const response = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return { success: true }
    } catch (error) {
      console.error("[Microsoft Graph Mail] Erro ao enviar email:", error)
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
  }): Email {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #006494; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #006494; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #006494; }
          .button { display: inline-block; padding: 12px 24px; background-color: #006494; color: white !important; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Confirmação de Envio</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${data.senderName}</strong>,</p>
            <p>Seu compartilhamento foi enviado com sucesso e está aguardando aprovação do supervisor.</p>
            
            <div class="info-box">
              <div class="info-row"><span class="label">Arquivo:</span> ${data.fileName}</div>
              <div class="info-row"><span class="label">Destinatário:</span> ${data.recipient}</div>
              <div class="info-row"><span class="label">Quantidade de arquivos:</span> ${data.fileCount}</div>
              <div class="info-row"><span class="label">Validade após aprovação:</span> ${data.expirationHours} horas</div>
              <div class="info-row"><span class="label">Data do envio:</span> ${data.uploadDate}</div>
            </div>
            
            <p>Você receberá uma notificação assim que o supervisor revisar seu compartilhamento.</p>
            
            <div class="footer">
              <p>Sistema de Transferência Segura de Arquivos - Petrobras</p>
              <p>Este é um e-mail automático, não responda esta mensagem.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return {
      subject: `✅ Confirmação de Envio - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: htmlContent,
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
    description: string
    fileCount: number
    uploadDate: string
    uploadId: string
  }): Email {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://layout-petrobras-e-mail.vercel.app"

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FDB913; color: #333; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f5f5f5; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FDB913; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #006494; }
          .button { display: inline-block; padding: 12px 24px; background-color: #006494; color: white !important; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Novo Compartilhamento Aguardando Aprovação</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${data.supervisorName}</strong>,</p>
            <p>Você tem um novo compartilhamento de arquivos aguardando sua revisão e aprovação.</p>
            
            <div class="info-box">
              <div class="info-row"><span class="label">Enviado por:</span> ${data.senderName}</div>
              <div class="info-row"><span class="label">Arquivo:</span> ${data.fileName}</div>
              <div class="info-row"><span class="label">Destinatário:</span> ${data.recipient}</div>
              <div class="info-row"><span class="label">Descrição:</span> ${data.description || "Não informada"}</div>
              <div class="info-row"><span class="label">Quantidade de arquivos:</span> ${data.fileCount}</div>
              <div class="info-row"><span class="label">Data do envio:</span> ${data.uploadDate}</div>
            </div>
            
            <center>
              <a href="${baseUrl}/supervisor/detalhes/${data.uploadId}" class="button">Revisar e Aprovar</a>
            </center>
            
            <p style="margin-top: 20px;">Por favor, revise o compartilhamento o quanto antes para que o destinatário possa ter acesso aos arquivos.</p>
            
            <div class="footer">
              <p>Sistema de Transferência Segura de Arquivos - Petrobras</p>
              <p>Este é um e-mail automático, não responda esta mensagem.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    return {
      subject: `🔔 Aprovação Necessária - ${data.fileName}`,
      body: {
        contentType: "HTML",
        content: htmlContent,
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
}

export const microsoftGraphMailService = new MicrosoftGraphMailService()
