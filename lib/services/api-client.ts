/**
 * Cliente HTTP para integração com backend Python na AWS
 * Preparado para substituir os stores Zustand quando o backend estiver pronto
 */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

interface RequestConfig {
  method: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string>
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  pagination?: {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api"
  }

  /**
   * Define o token de autenticacao.
   * Nota: o token principal e gerenciado pelo auth-store (Zustand com persist).
   * Este setter e um fallback para uso direto do apiClient.
   */
  setToken(token: string | null) {
    this.token = token
  }

  /**
   * Obtém o token atual
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Realiza requisição HTTP
   */
  private async request<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const { method, headers = {}, body, params } = config

    // Construir URL com query params
    let url = `${this.baseUrl}${endpoint}`
    if (params) {
      const queryString = new URLSearchParams(params).toString()
      url += `?${queryString}`
    }

    // Preparar headers
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    }

    // Adicionar token de autenticação se disponível
    if (this.token) {
      requestHeaders["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json()

      // Se token expirado, limpar e redirecionar para login
      if (response.status === 401) {
        this.setToken(null)
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }

      return data
    } catch (error) {
      console.error("[API Client] Request failed:", error)
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Não foi possível conectar ao servidor. Verifique sua conexão.",
        },
      }
    }
  }

  // ============================================
  // AUTENTICAÇÃO
  // ============================================

  async login(email: string, password: string) {
    return this.request<{
      token: string
      refreshToken: string
      user: {
        userId: string
        name: string
        email: string
        role: string
        department?: string
      }
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
  }

  async logout(sessionId: string) {
    return this.request("/auth/logout", {
      method: "POST",
      body: { sessionId },
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ token: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    })
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    })
  }

  // ============================================
  // USUÁRIOS
  // ============================================

  async getCurrentUser() {
    return this.request<{
      userId: string
      name: string
      email: string
      role: string
      department?: string
      createdAt: string
      lastLogin: string
    }>("/users/me", {
      method: "GET",
    })
  }

  async updateProfile(data: { name?: string; phone?: string }) {
    return this.request("/users/me", {
      method: "PUT",
      body: data,
    })
  }

  // ============================================
  // ARQUIVOS (UPLOAD)
  // ============================================

  async uploadFiles(formData: FormData) {
    const url = `${this.baseUrl}/files/upload`
    const headers: Record<string, string> = {}

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData, // Não definir Content-Type para multipart/form-data
      })

      return await response.json()
    } catch (error) {
      console.error("[API Client] Upload failed:", error)
      return {
        success: false,
        error: {
          code: "UPLOAD_ERROR",
          message: "Erro ao fazer upload dos arquivos",
        },
      }
    }
  }

  async getFiles(params?: {
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    order?: string
  }) {
    return this.request("/files", {
      method: "GET",
      params: params as Record<string, string>,
    })
  }

  async getFileById(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: "GET",
    })
  }

  async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: "DELETE",
    })
  }

  // ============================================
  // SUPERVISOR
  // ============================================

  async getPendingFiles() {
    return this.request("/supervisor/pending", {
      method: "GET",
    })
  }

  async approveFile(fileId: string, message?: string) {
    return this.request(`/supervisor/approve/${fileId}`, {
      method: "POST",
      body: { message },
    })
  }

  async rejectFile(fileId: string, reason: string) {
    return this.request(`/supervisor/reject/${fileId}`, {
      method: "POST",
      body: { reason },
    })
  }

  async extendExpiration(fileId: string, additionalHours: number, reason: string) {
    return this.request(`/supervisor/extend/${fileId}`, {
      method: "PUT",
      body: { additionalHours, reason },
    })
  }

  // ============================================
  // DOWNLOAD (USUÁRIO EXTERNO)
  // ============================================

  async verifyExternalAccess(email: string) {
    return this.request("/download/verify", {
      method: "POST",
      body: { email },
    })
  }

  async authenticateExternal(email: string, code: string) {
    return this.request<{ token: string; expiresIn: number }>("/download/authenticate", {
      method: "POST",
      body: { email, code },
    })
  }

  async getDownloadableFiles() {
    return this.request("/download/files", {
      method: "GET",
    })
  }

  async getDownloadUrl(fileId: string) {
    return this.request<{ downloadUrl: string; expiresIn: number }>(`/download/files/${fileId}/url`, {
      method: "GET",
    })
  }

  // ============================================
  // NOTIFICAÇÕES
  // ============================================

  async getNotifications(params?: {
    unreadOnly?: boolean
    page?: number
    limit?: number
  }) {
    return this.request("/notifications", {
      method: "GET",
      params: params as Record<string, string>,
    })
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: "PUT",
    })
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/read-all", {
      method: "PUT",
    })
  }

  // ============================================
  // AUDITORIA
  // ============================================

  async getAuditLogs(params?: {
    userId?: string
    action?: string
    fileId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    return this.request("/audit/logs", {
      method: "GET",
      params: params as Record<string, string>,
    })
  }

  async getMetrics() {
    return this.request<{
      totalUploads: number
      pendingApprovals: number
      approvedFiles: number
      rejectedFiles: number
      totalDownloads: number
      activeUsers: number
      storageUsed: string
    }>("/audit/metrics", {
      method: "GET",
    })
  }
}

// Exportar instância singleton
export const apiClient = new ApiClient()
