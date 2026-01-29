export type NotificationType =
  | "upload_success"
  | "download_complete"
  | "file_expired"
  | "approval_pending"
  | "approval_approved"
  | "approval_rejected"
  | "security_alert"
  | "new_file"
  | "file_shared"

export type NotificationPriority = "low" | "medium" | "high" | "critical"

export interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  metadata?: {
    fileName?: string
    sender?: string
    fileId?: string
    userId?: string
  }
}
