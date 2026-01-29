import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useNotificationStore } from "./notification-store"
import { useAuditLogStore } from "./audit-log-store"
import { otpService } from "@/lib/auth/otp-service"
import { showAlert } from "./alert-store"
import { getAccessToken } from "@/lib/auth/get-access-token"

export interface ExpirationLog {
  timestamp: string
  changedBy: string
  previousValue: number | null
  newValue: number
  reason?: string
}

export interface FileUpload {
  id: string
  file: {
    name: string
    type: string
    size: string
    uploadDate: string
    status: string
  }
  sender: {
    id: string
    name: string
    email: string
    role: string
    avatar: string | null
    manager?: {
      name: string
      email: string
    }
    employeeId: string
  }
  name: string
  recipient: string
  description: string
  files: Array<{
    name: string
    size: string
    type: string
    url?: string
  }>
  status: "pending" | "approved" | "rejected" | "cancelled"
  uploadDate: string
  approvalDate?: string
  approvedBy?: string
  rejectionReason?: string
  cancellationDate?: string
  cancelledBy?: string
  cancellationReason?: string
  expirationHours: number
  expiresAt?: string
  expiresIn?: number
  expirationLogs: ExpirationLog[]
  currentStep: number
  totalSteps: number
  steps: Array<{
    title: string
    status: "pending" | "approved" | "rejected" | "in_progress"
    date?: string
    comments?: string
  }>
}

interface WorkflowState {
  uploads: FileUpload[]
  mockZipUrl: string | null
  mockZipBlob: Blob | null
  initializeMockZip: () => Promise<void>
  addUpload: (upload: Omit<FileUpload, "id" | "status" | "uploadDate" | "expirationLogs">) => void
  approveUpload: (id: string, approvedBy: string) => void
  rejectUpload: (id: string, rejectedBy: string, reason: string) => void
  cancelUpload: (id: string, cancelledBy: string, reason?: string) => void
  updateExpiration: (id: string, newHours: number, changedBy: string, reason?: string) => void
  checkIfExpired: (id: string) => boolean
  getUploadsByStatus: (status: FileUpload["status"]) => FileUpload[]
  getUploadById: (id: string) => FileUpload | undefined
  getUploadsByRecipient: (recipientEmail: string) => FileUpload[]
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      uploads: [],

      mockZipUrl: null,
      mockZipBlob: null,

      initializeMockZip: async () => {
        if (get().mockZipUrl) return

        const { createMockZipFile } = await import("@/lib/utils/create-mock-zip")
        const { url, blob } = await createMockZipFile()

        set((state) => ({
          mockZipUrl: url,
          mockZipBlob: blob,
          uploads: state.uploads.map((u) =>
            u.id === "upload-3"
              ? {
                  ...u,
                  files: u.files.map((f) => (f.name === "Documentos_Tecnicos_Q4.zip" ? { ...f, url } : f)),
                }
              : u,
          ),
        }))
      },

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
          currentStep: 0,
          totalSteps: 3,
          steps: [
            { title: "Análise Inicial", status: "in_progress" },
            { title: "Revisão Técnica", status: "pending" },
            { title: "Aprovação Final", status: "pending" },
          ],
        }

        set((state) => ({
          uploads: [newUpload, ...state.uploads],
        }))

        const supervisorEmail = upload.sender.manager?.email || "supervisor@petrobras.com.br"
        const supervisorName = upload.sender.manager?.name || "Supervisor"

        useAuditLogStore.getState().addLog({
          action: "upload",
          level: "info",
          user: {
            id: upload.sender.id,
            name: upload.sender.name,
            email: upload.sender.email,
            type: "internal",
            employeeId: upload.sender.employeeId, // Adicionado employeeId
          },
          details: {
            targetId: newUpload.id,
            targetName: upload.name,
            description: `Arquivo "${upload.name}" enviado para aprovação`,
            metadata: {
              recipient: upload.recipient,
              fileCount: upload.files.length,
              expirationHours: upload.expirationHours,
              supervisorEmail,
              supervisorName,
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

        getAccessToken().then((accessToken) => {
          if (!accessToken) {
            showAlert.error("Erro de Autenticação", "Não foi possível obter token de acesso. Faça login novamente.")
            return
          }

          // Email para supervisor
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "supervisor",
              accessToken, // Adicionado token de acesso
              uploadData: {
                name: upload.name,
                sender: upload.sender,
                recipient: upload.recipient,
                description: upload.description,
                files: upload.files,
                expirationHours: upload.expirationHours,
                uploadDate: new Date().toLocaleString("pt-BR"),
                supervisorEmail,
                supervisorName,
                uploadId: newUpload.id,
              },
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                showAlert.error(
                  "Erro ao Enviar E-mail",
                  `Não foi possível enviar e-mail para o supervisor: ${data.error}`,
                )
              } else {
                console.log(" Email para supervisor enviado com sucesso")
              }
            })
            .catch((error) => {
              showAlert.error("Erro Crítico", `Erro crítico ao enviar e-mail para o supervisor: ${error.message}`)
            })

          // Email de confirmação para remetente
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "sender",
              accessToken, // Adicionado token de acesso
              uploadData: {
                name: upload.name,
                sender: upload.sender,
                recipient: upload.recipient,
                description: upload.description,
                files: upload.files,
                expirationHours: upload.expirationHours,
                uploadDate: new Date().toLocaleString("pt-BR"),
              },
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.error) {
                showAlert.error("Erro ao Enviar E-mail", `Não foi possível enviar e-mail de confirmação: ${data.error}`)
              } else {
                console.log(" Email de confirmação enviado com sucesso")
              }
            })
            .catch((error) => {
              showAlert.error("Erro Crítico", `Erro crítico ao enviar e-mail de confirmação: ${error.message}`)
            })
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
                  currentStep: u.totalSteps,
                }
              : u,
          ),
        }))

        const otpCode = otpService.generateOTP(upload.recipient)

        fetch("/api/send-otp-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: upload.recipient,
            code: otpCode,
            shareInfo: {
              senderName: upload.sender.name,
              fileName: upload.name,
              expirationHours: upload.expirationHours,
            },
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              showAlert.error(
                "Erro ao Enviar OTP",
                `Não foi possível enviar código de acesso para o destinatário: ${data.error}`,
              )
            } else {
              console.log(" Email OTP enviado com sucesso para destinatário")
            }
          })
          .catch((err) => {
            console.error("Erro ao enviar email OTP:", err)
            showAlert.error("Erro Crítico", "Erro crítico ao enviar código de acesso para o destinatário")
          })

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
              otpSent: true,
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

      cancelUpload: (id, cancelledBy, reason) => {
        const upload = get().uploads.find((u) => u.id === id)
        if (!upload) return

        if (upload.status === "approved") {
          showAlert.warning(
            "Não é Possível Cancelar",
            "Este compartilhamento já foi aprovado pelo supervisor e não pode ser cancelado.",
          )
          return
        }

        if (upload.status === "rejected") {
          showAlert.warning(
            "Não é Possível Cancelar",
            "Este compartilhamento já foi rejeitado pelo supervisor e não pode ser cancelado.",
          )
          return
        }

        if (upload.status === "cancelled") {
          showAlert.info("Já Cancelado", "Este compartilhamento já foi cancelado anteriormente.")
          return
        }

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "cancelled" as const,
                  cancellationDate: new Date().toLocaleString("pt-BR"),
                  cancelledBy,
                  cancellationReason: reason || "Cancelado pelo usuário",
                }
              : u,
          ),
        }))

        useAuditLogStore.getState().addLog({
          action: "cancel",
          level: "info",
          user: {
            id: upload.sender.id,
            name: cancelledBy,
            email: upload.sender.email,
            type: "internal",
          },
          details: {
            targetId: id,
            targetName: upload.name,
            description: `Compartilhamento "${upload.name}" cancelado pelo usuário. Motivo: ${reason || "Não informado"}`,
            metadata: {
              recipient: upload.recipient,
              cancellationReason: reason || "Não informado",
              uploadDate: upload.uploadDate,
            },
          },
        })

        useNotificationStore.getState().addNotification({
          type: "info",
          priority: "medium",
          title: "Compartilhamento Cancelado",
          message: `Seu compartilhamento "${upload.name}" foi cancelado com sucesso.`,
          actionLabel: "Ver Histórico",
          actionUrl: "/historico",
        })

        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: "kleber.goncalves.prestserv@petrobras.com.br",
            subject: `Compartilhamento Cancelado - ${upload.name}`,
            type: "cancellation",
            uploadData: {
              name: upload.name,
              sender: upload.sender,
              recipient: upload.recipient,
              cancellationDate: new Date().toLocaleString("pt-BR"),
              cancellationReason: reason || "Não informado",
            },
          }),
        }).catch((error) => {
          console.error("Erro ao enviar e-mail de cancelamento:", error)
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
                  expiresIn: newHours,
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

      getUploadsByRecipient: (recipientEmail: string) => {
        return get().uploads.filter((u) => u.recipient === recipientEmail && u.status === "approved")
      },
    }),
    {
      name: "petrobras-workflow-storage",
    },
  ),
)
