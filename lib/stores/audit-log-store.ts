import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  | "file_expired" // Adicionada nova ação de log para arquivos expirados

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
  }
  details: {
    targetId?: string
    targetName?: string
    description: string
    ipAddress?: string
    metadata?: Record<string, any>
  }
}

interface AuditLogState {
  logs: AuditLog[]
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
      logs: [
        // Logs mockados para demonstração
        {
          id: "log-1",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          action: "login",
          level: "success",
          user: {
            id: "user-1",
            name: "João Silva",
            email: "admin@petrobras.com.br",
            type: "internal",
          },
          details: {
            description: "Login realizado com sucesso",
            ipAddress: "192.168.1.100",
          },
        },
        {
          id: "log-2",
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
          action: "upload",
          level: "info",
          user: {
            id: "user-1",
            name: "João Silva",
            email: "admin@petrobras.com.br",
            type: "internal",
          },
          details: {
            targetId: "upload-1",
            targetName: "Relatório Anual 2023",
            description: "Arquivo enviado para aprovação",
            metadata: {
              recipient: "cliente@gmail.com",
              fileCount: 2,
              totalSize: "15.2 MB",
            },
          },
        },
        {
          id: "log-3",
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          action: "approve",
          level: "success",
          user: {
            id: "user-2",
            name: "Carlos Mendes",
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: "upload-1",
            targetName: "Relatório Anual 2023",
            description: "Upload aprovado pelo supervisor",
            ipAddress: "192.168.1.150",
          },
        },
      ],

      addLog: (log) => {
        const newLog: AuditLog = {
          ...log,
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          logs: [newLog, ...state.logs],
        }))

        console.log("[v0] Audit Log:", newLog)
      },

      getLogsByUser: (userId) => {
        return get().logs.filter((log) => log.user.id === userId)
      },

      getLogsByAction: (action) => {
        return get().logs.filter((log) => log.action === action)
      },

      getLogsByTarget: (targetId) => {
        return get().logs.filter((log) => log.details.targetId === targetId)
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
