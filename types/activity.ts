export type ActivityType = "upload" | "download" | "approval" | "rejection" | "share" | "login" | "logout" | "delete"

export interface Activity {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: ActivityType
  description: string
  timestamp: Date
  metadata?: Record<string, any>
}
