/**
 * Email API functions
 * These will connect to the Python backend for email operations
 */

const API_BASE_URL = "/api"

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  content: string // base64 encoded
  content_type: string
}

export interface SendEmailRequest {
  to: EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  body: string
  html_body?: string
  attachments?: EmailAttachment[]
}

export interface SendEmailResponse {
  message_id: string
  status: "sent" | "queued" | "failed"
  recipients_count: number
}

export interface EmailStatus {
  message_id: string
  status: "sent" | "delivered" | "bounced" | "failed"
  sent_at: string
  delivered_at?: string
  error?: string
}

export async function sendEmail(token: string, emailData: SendEmailRequest): Promise<SendEmailResponse> {
  const response = await fetch(`${API_BASE_URL}/emails/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to send email")
  }

  return response.json()
}

export async function getEmailStatus(token: string, messageId: string): Promise<EmailStatus> {
  const response = await fetch(`${API_BASE_URL}/emails/${messageId}/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to get email status")
  }

  return response.json()
}

export async function getEmailHistory(
  token: string,
  page = 1,
  limit = 50,
): Promise<{ emails: EmailStatus[]; total: number; page: number }> {
  const response = await fetch(`${API_BASE_URL}/emails/history?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to get email history")
  }

  return response.json()
}
