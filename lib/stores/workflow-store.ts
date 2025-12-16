import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useNotificationStore } from "./notification-store"
import { useAuditLogStore } from "./audit-log-store"

export interface ExpirationLog {
  timestamp: string
  changedBy: string
  previousValue: number | null
  newValue: number
  reason?: string
}

export interface FileUpload {
  id: string
  name: string
  sender: {
    id: string
    name: string
    email: string
  }
  recipient: string
  description: string
  files: Array<{
    name: string
    size: string
    type: string
  }>
  status: "pending" | "approved" | "rejected"
  uploadDate: string
  approvalDate?: string
  approvedBy?: string
  rejectionReason?: string
  expirationHours: number // Horas até expirar
  expiresAt?: string // Data/hora de expiração (calculada após aprovação)
  expirationLogs: ExpirationLog[] // Histórico de alterações
}

interface WorkflowState {
  uploads: FileUpload[]
  addUpload: (upload: Omit<FileUpload, "id" | "status" | "uploadDate" | "expirationLogs">) => void
  approveUpload: (id: string, approvedBy: string) => void
  rejectUpload: (id: string, rejectedBy: string, reason: string) => void
  updateExpiration: (id: string, newHours: number, changedBy: string, reason?: string) => void
  checkIfExpired: (id: string) => boolean
  getUploadsByStatus: (status: FileUpload["status"]) => FileUpload[]
  getUploadById: (id: string) => FileUpload | undefined
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      uploads: [
        {
          id: "upload-1",
          name: "Relatório Anual 2023",
          sender: {
            id: "user-1",
            name: "João Silva",
            email: "admin@petrobras.com.br",
          },
          recipient: "cliente@gmail.com",
          description: "Relatório financeiro consolidado do ano fiscal de 2023",
          files: [
            { name: "Relatorio_Anual_2023.pdf", size: "12.8 MB", type: "PDF" },
            { name: "Anexo_Graficos.xlsx", size: "2.4 MB", type: "XLS" },
          ],
          status: "pending",
          uploadDate: "15/01/2025 - 14:32",
          expirationHours: 72, // 3 dias
          expirationLogs: [],
        },
        {
          id: "upload-2",
          name: "Contrato de Serviços 2024",
          sender: {
            id: "user-1",
            name: "João Silva",
            email: "admin@petrobras.com.br",
          },
          recipient: "fornecedor@empresa.com.br",
          description: "Contrato de prestação de serviços técnicos para Q1 2024",
          files: [{ name: "Contrato_Servicos_2024.docx", size: "890 KB", type: "DOCX" }],
          status: "approved",
          uploadDate: "14/01/2025 - 10:15",
          approvalDate: "14/01/2025 - 15:20",
          approvedBy: "Carlos Mendes",
          expirationHours: 168, // 7 dias
          expiresAt: new Date(Date.now() + 168 * 60 * 60 * 1000).toLocaleString("pt-BR"),
          expirationLogs: [],
        },
      ],

      addUpload: (upload) => {
        const newUpload: FileUpload = {
          ...upload,
          id: `upload-${Date.now()}`,
          status: "pending",
          uploadDate: new Date().toLocaleString("pt-BR"),
          expirationLogs: [
            {
              timestamp: new Date().toLocaleString("pt-BR"),
              changedBy: upload.sender.name,
              previousValue: null,
              newValue: upload.expirationHours,
              reason: "Definição inicial pelo remetente",
            },
          ],
        }

        set((state) => ({
          uploads: [newUpload, ...state.uploads],
        }))

        useAuditLogStore.getState().addLog({
          action: "upload",
          level: "info",
          user: {
            id: upload.sender.id,
            name: upload.sender.name,
            email: upload.sender.email,
            type: "internal",
          },
          details: {
            targetId: newUpload.id,
            targetName: upload.name,
            description: `Arquivo "${upload.name}" enviado para aprovação`,
            metadata: {
              recipient: upload.recipient,
              fileCount: upload.files.length,
              expirationHours: upload.expirationHours,
            },
          },
        })

        useNotificationStore.getState().addNotification({
          type: "approval",
          priority: "medium",
          title: "Novo upload aguardando aprovação",
          message: `${upload.sender.name} enviou "${upload.name}" para aprovação`,
          actionLabel: "Revisar",
          actionUrl: "/supervisor",
        })
      },

      approveUpload: (id, approvedBy) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload) return

        const expiresAt = new Date(Date.now() + upload.expirationHours * 60 * 60 * 1000).toLocaleString("pt-BR")

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "approved" as const,
                  approvalDate: new Date().toLocaleString("pt-BR"),
                  approvedBy,
                  expiresAt,
                }
              : u,
          ),
        }))

        useAuditLogStore.getState().addLog({
          action: "approve",
          level: "success",
          user: {
            id: "supervisor-id",
            name: approvedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Upload "${upload.name}" aprovado e disponibilizado para ${upload.recipient}`,
            metadata: {
              sender: upload.sender.name,
              recipient: upload.recipient,
              expiresAt,
              expirationHours: upload.expirationHours,
            },
          },
        })

        useNotificationStore.getState().addNotification({
          type: "success",
          priority: "high",
          title: "Upload Aprovado!",
          message: `Seu envio "${upload.name}" para ${upload.recipient} foi aprovado por ${approvedBy}. Válido por ${upload.expirationHours}h.`,
          actionLabel: "Ver Histórico",
          actionUrl: "/historico",
        })
      },

      rejectUpload: (id, rejectedBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload) return

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "rejected" as const,
                  approvalDate: new Date().toLocaleString("pt-BR"),
                  approvedBy: rejectedBy,
                  rejectionReason: reason,
                }
              : u,
          ),
        }))

        useAuditLogStore.getState().addLog({
          action: "reject",
          level: "warning",
          user: {
            id: "supervisor-id",
            name: rejectedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Upload "${upload.name}" rejeitado. Motivo: ${reason}`,
            metadata: {
              sender: upload.sender.name,
              recipient: upload.recipient,
              rejectionReason: reason,
            },
          },
        })

        useNotificationStore.getState().addNotification({
          type: "error",
          priority: "high",
          title: "Upload Rejeitado",
          message: `Seu envio "${upload.name}" foi rejeitado por ${rejectedBy}. Motivo: ${reason}`,
          actionLabel: "Revisar",
          actionUrl: "/upload",
        })
      },

      updateExpiration: (id, newHours, changedBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload) return

        const previousValue = upload.expirationHours
        const newExpiresAt =
          upload.status === "approved"
            ? new Date(Date.now() + newHours * 60 * 60 * 1000).toLocaleString("pt-BR")
            : undefined

        const log: ExpirationLog = {
          timestamp: new Date().toLocaleString("pt-BR"),
          changedBy,
          previousValue,
          newValue: newHours,
          reason: reason || "Ajuste pelo supervisor",
        }

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  expirationHours: newHours,
                  expiresAt: newExpiresAt,
                  expirationLogs: [...u.expirationLogs, log],
                }
              : u,
          ),
        }))

        useAuditLogStore.getState().addLog({
          action: "expiration_change",
          level: "info",
          user: {
            id: "supervisor-id",
            name: changedBy,
            email: "supervisor@petrobras.com.br",
            type: "supervisor",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Tempo de expiração alterado de ${previousValue}h para ${newHours}h`,
            metadata: {
              previousValue,
              newValue: newHours,
              reason: reason || "Ajuste pelo supervisor",
              sender: upload.sender.name,
            },
          },
        })

        useNotificationStore.getState().addNotification({
          type: "info",
          priority: "medium",
          title: "Tempo de expiração alterado",
          message: `${changedBy} alterou o tempo de validade de "${upload.name}" de ${previousValue}h para ${newHours}h`,
          actionLabel: "Ver Detalhes",
          actionUrl: "/historico",
        })
      },

      checkIfExpired: (id) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload || !upload.expiresAt) return false

        const expirationDate = new Date(upload.expiresAt.split(" - ")[0].split("/").reverse().join("-"))
        return expirationDate < new Date()
      },

      getUploadsByStatus: (status) => {
        return get().uploads.filter((u) => u.status === status)
      },

      getUploadById: (id) => {
        return get().uploads.find((u) => u.id === id)
      },
    }),
    {
      name: "petrobras-workflow-storage",
    },
  ),
)
