import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiFetch } from "@/lib/services/api-fetch"

export type LogAction =
  | "login"
  | "logout"
  | "upload"
  | "approve"
  | "reject"
  | "download"
  | "access"
  | "expiration_change"
  | "zip_validation"
  | "file_expired"
  | "cancel"
  | "generate_otp"
  | "otp_expired"
  | "otp_max_attempts"
  | "otp_invalid"
  | "otp_validated"

export type LogLevel = "info" | "warning" | "error" | "success"

export interface AuditLog {
  id: string
  timestamp: string
  action: LogAction
  level: LogLevel
  user: {
    id: string
    name: string
    email: string
    type: "internal" | "external" | "supervisor"
    employeeId?: string
  }
  details: {
    targetId?: string
    targetName?: string
    description: string
    ipAddress?: string
    metadata?: Record<string, unknown>
  }
}

export interface AuditMetrics {
  total_uploads: number
  pending_approvals: number
  approved_files: number
  rejected_files: number
  cancelled_files: number
  expired_files: number
  total_downloads: number
  unique_downloaders: number
  active_users: number
  total_internal_users: number
  total_external_users: number
  storage_used: string
  storage_limit: string
  storage_percentage: number
  uploads_today: number
  uploads_this_week: number
  uploads_this_month: number
  top_senders: Array<{ name: string; email: string; count: number }>
  top_recipients: Array<{ email: string; count: number }>
}

/**
 * Mapeia nivel do audit da API para o tipo do frontend.
 */
function mapLevel(level: string): LogLevel {
  if (level === "SUCCESS" || level === "success") return "success"
  if (level === "WARNING" || level === "warning") return "warning"
  if (level === "ERROR" || level === "error") return "error"
  return "info"
}

function mapUserType(type: string): "internal" | "external" | "supervisor" {
  const t = (type || "").toLowerCase()
  if (t.includes("supervisor")) return "supervisor"
  if (t.includes("internal") || t.includes("interno")) return "internal"
  return "external"
}

interface AuditLogState {
  logs: AuditLog[]
  metrics: AuditMetrics | null
  isLoadingLogs: boolean
  isLoadingMetrics: boolean

  // API actions
  loadLogs: (filters?: Record<string, string>) => Promise<void>
  loadMetrics: (period?: string) => Promise<void>

  // Local actions
  addLog: (log: Omit<AuditLog, "id" | "timestamp">) => void
  getLogsByUser: (userId: string) => AuditLog[]
  getLogsByAction: (action: LogAction) => AuditLog[]
  getLogsByTarget: (targetId: string) => AuditLog[]
  getRecentLogs: (limit?: number) => AuditLog[]
  clearLogs: () => void
  exportLogs: () => string
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set, get) => ({
      logs: [],
      metrics: null,
      isLoadingLogs: false,
      isLoadingMetrics: false,

      /**
       * Carrega logs de auditoria do backend Python.
       * GET /api/audit/logs
       */
      loadLogs: async (filters?: Record<string, string>) => {
        set({ isLoadingLogs: true })
        try {
          const params = new URLSearchParams({ limit: "100", ...filters })
          const data = await apiFetch<{
            logs: Array<{
              id: number
              timestamp: string
              action: string
              level: string
              user: {
                id: number
                name: string
                email: string
                type: string
                employee_id?: string
              } | null
              details: {
                target_id?: number
                target_name?: string
                description?: string
                ip_address?: string
                metadata?: Record<string, unknown>
              }
            }>
          }>(`/audit/logs?${params.toString()}`)

          const logs: AuditLog[] = (data.logs || []).map((log) => ({
            id: String(log.id),
            timestamp: log.timestamp,
            action: (log.action || "access").toLowerCase() as LogAction,
            level: mapLevel(log.level),
            user: log.user
              ? {
                  id: String(log.user.id),
                  name: log.user.name,
                  email: log.user.email,
                  type: mapUserType(log.user.type),
                  employeeId: log.user.employee_id,
                }
              : {
                  id: "unknown",
                  name: "Sistema",
                  email: "",
                  type: "internal" as const,
                },
            details: {
              targetId: log.details.target_id
                ? String(log.details.target_id)
                : undefined,
              targetName: log.details.target_name || undefined,
              description: log.details.description || "",
              ipAddress: log.details.ip_address || undefined,
              metadata: log.details.metadata || undefined,
            },
          }))

          set({ logs, isLoadingLogs: false })
        } catch (err) {
          // console.error(" Erro ao carregar audit logs:", err)
          set({ isLoadingLogs: false })
        }
      },

      /**
       * Carrega metricas do backend Python.
       * GET /api/audit/metrics
       */
      loadMetrics: async (period = "30d") => {
        set({ isLoadingMetrics: true })
        try {
          const data = await apiFetch<AuditMetrics>(
            `/audit/metrics?period=${period}`
          )
          set({ metrics: data, isLoadingMetrics: false })
        } catch (err) {
          // console.error(" Erro ao carregar metricas:", err)
          set({ isLoadingMetrics: false })
        }
      },

      addLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          logs: [newLog, ...state.logs],
        }))
      },

      getLogsByUser: (userId) => {
        return get().logs.filter((log) => log.user.id === userId)
      },

      getLogsByAction: (action) => {
        return get().logs.filter((log) => log.action === action)
      },

      getLogsByTarget: (targetId) => {
        return get().logs.filter(
          (log) => log.details.targetId === targetId
        )
      },

      getRecentLogs: (limit = 50) => {
        return get().logs.slice(0, limit)
      },

      clearLogs: () => {
        set({ logs: [] })
      },

      exportLogs: () => {
        const logs = get().logs
        return JSON.stringify(logs, null, 2)
      },
    }),
    {
      name: "petrobras-audit-logs",
    },
  ),
)
