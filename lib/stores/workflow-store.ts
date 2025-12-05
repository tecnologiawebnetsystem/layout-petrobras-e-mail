import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useNotificationStore } from "./notification-store"

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
  tags: string[]
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
}

interface WorkflowState {
  uploads: FileUpload[]
  addUpload: (upload: Omit<FileUpload, "id" | "status" | "uploadDate">) => void
  approveUpload: (id: string, approvedBy: string) => void
  rejectUpload: (id: string, rejectedBy: string, reason: string) => void
  getUploadsByStatus: (status: FileUpload["status"]) => FileUpload[]
  getUploadById: (id: string) => FileUpload | undefined
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      uploads: [
        // Mock data inicial
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
          tags: ["Financeiro", "Anual"],
          files: [
            { name: "Relatorio_Anual_2023.pdf", size: "12.8 MB", type: "PDF" },
            { name: "Anexo_Graficos.xlsx", size: "2.4 MB", type: "XLS" },
          ],
          status: "pending",
          uploadDate: "15/01/2025 - 14:32",
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
          tags: ["Contratos", "Jurídico"],
          files: [{ name: "Contrato_Servicos_2024.docx", size: "890 KB", type: "DOCX" }],
          status: "approved",
          uploadDate: "14/01/2025 - 10:15",
          approvalDate: "14/01/2025 - 15:20",
          approvedBy: "Carlos Mendes",
        },
      ],

      addUpload: (upload) => {
        const newUpload: FileUpload = {
          ...upload,
          id: `upload-${Date.now()}`,
          status: "pending",
          uploadDate: new Date().toLocaleString("pt-BR"),
        }

        set((state) => ({
          uploads: [newUpload, ...state.uploads],
        }))

        // Notificar supervisores
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

        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status: "approved" as const,
                  approvalDate: new Date().toLocaleString("pt-BR"),
                  approvedBy,
                }
              : u,
          ),
        }))

        useNotificationStore.getState().addNotification({
          type: "success",
          priority: "high",
          title: "Upload Aprovado!",
          message: `Seu envio "${upload.name}" para ${upload.recipient} foi aprovado por ${approvedBy}`,
          actionLabel: "Ver Histórico",
          actionUrl: "/historico",
        })

        console.log(`[v0] Email enviado para ${upload.recipient}:
          
Olá!

Você recebeu ${upload.files.length} arquivo(s) da Petrobras.

Remetente: ${upload.sender.name}
Assunto: ${upload.name}
Descrição: ${upload.description}

Acesse o link abaixo para fazer o download seguro:
https://petrobras-download.com/secure/${id}

Este link expira em 30 dias.

Atenciosamente,
Sistema de Transferência Segura de Arquivos - Petrobras`)
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

        useNotificationStore.getState().addNotification({
          type: "error",
          priority: "high",
          title: "Upload Rejeitado",
          message: `Seu envio "${upload.name}" foi rejeitado por ${rejectedBy}. Motivo: ${reason}`,
          actionLabel: "Revisar",
          actionUrl: "/upload",
        })
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
