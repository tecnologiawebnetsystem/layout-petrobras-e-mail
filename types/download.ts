export interface Document {
  id: string
  name: string
  sender: string
  date: string
  size: string
  type: string
  downloaded: boolean
  downloadedAt?: string
  downloadCount: number
  expiresAt?: string
  requiresPassword?: boolean
  ipRestriction?: string[]
}

export interface DownloadStats {
  totalReceived: number
  downloaded: number
  pending: number
  expired: number
}

export interface DownloadLog {
  documentId: string
  documentName: string
  downloadedAt: string
  ipAddress: string
  userAgent: string
}
