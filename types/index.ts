export interface User {
  id: string
  email: string
  name: string
  created_at?: string
  employeeId?: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface EmailRecipient {
  email: string
  name?: string
}

export interface EmailMessage {
  to: EmailRecipient[]
  cc?: EmailRecipient[]
  bcc?: EmailRecipient[]
  subject: string
  body: string
  html_body?: string
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string
  content_type: string
  size?: number
}

export interface EmailStatus {
  message_id: string
  status: "sent" | "delivered" | "bounced" | "failed" | "pending"
  sent_at: string
  delivered_at?: string
  error?: string
  recipients: EmailRecipient[]
}
