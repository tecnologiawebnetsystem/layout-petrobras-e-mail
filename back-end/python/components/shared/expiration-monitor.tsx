"use client"

import { useEffect } from "react"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { useAuthStore } from "@/lib/stores/auth-store"

export function ExpirationMonitor() {
  const { uploads } = useWorkflowStore()
  const { addNotification } = useNotificationStore()
  const { addLog } = useAuditLogStore()
  const { user } = useAuthStore()

  useEffect(() => {
    const checkExpiredFiles = () => {
      const now = new Date()

      uploads.forEach((upload) => {
        if (upload.status !== "approved" || !upload.expiresAt || typeof upload.expiresAt !== "string") return

        try {
          // Parse da data de expiração
          const [datePart, timePart] = upload.expiresAt.split(" - ")

          // Validar se temos as partes necessárias
          if (!datePart || !timePart) return

          const [day, month, year] = datePart.split("/")
          const [hours, minutes, seconds] = timePart.split(":")

          // Validar se todos os valores existem
          if (!day || !month || !year || !hours || !minutes) return

          const expirationDate = new Date(
            Number.parseInt(year),
            Number.parseInt(month) - 1,
            Number.parseInt(day),
            Number.parseInt(hours),
            Number.parseInt(minutes),
            seconds ? Number.parseInt(seconds) : 0,
          )

          // Verificar se a data é válida
          if (isNaN(expirationDate.getTime())) return

          // Verificar se expirou
          if (expirationDate < now) {
            const alreadyNotified = localStorage.getItem(`expired-${upload.id}`)
            if (!alreadyNotified) {
              addNotification({
                type: "error",
                priority: "high",
                title: "Arquivos Removidos - Prazo Expirado",
                message: `Os arquivos "${upload.name}" enviados para ${upload.recipient} foram automaticamente removidos. O prazo de ${upload.expirationHours}h expirou.`,
                actionLabel: "Ver Detalhes",
                actionUrl: "/historico",
              })

              addLog({
                action: "file_expired",
                level: "warning",
                user: {
                  id: upload.sender.id,
                  name: upload.sender.name,
                  email: upload.sender.email,
                  type: "internal",
                },
                details: {
                  targetId: upload.id,
                  targetName: upload.name,
                  description: `Arquivos "${upload.name}" foram removidos automaticamente. Prazo de ${upload.expirationHours}h expirado.`,
                  metadata: {
                    recipient: upload.recipient,
                    expirationDate: upload.expiresAt,
                    fileCount: upload.files.length,
                    approvedBy: upload.approvedBy,
                  },
                },
              })

              addLog({
                action: "file_expired",
                level: "info",
                user: {
                  id: "system",
                  name: "Sistema",
                  email: "system@petrobras.com.br",
                  type: "supervisor",
                },
                details: {
                  targetId: upload.id,
                  targetName: upload.name,
                  description: `Arquivos "${upload.name}" foram removidos automaticamente por expiração de prazo`,
                  metadata: {
                    sender: upload.sender.name,
                    recipient: upload.recipient,
                    expirationDate: upload.expiresAt,
                    approvedBy: upload.approvedBy,
                    originalExpirationHours: upload.expirationHours,
                  },
                },
              })

              // Marcar como já notificado
              localStorage.setItem(`expired-${upload.id}`, "true")
            }
          }

          const hoursUntilExpiration = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60)
          if (hoursUntilExpiration > 0 && hoursUntilExpiration <= 24) {
            const warningKey = `warning-24h-${upload.id}`
            const alreadyWarned = localStorage.getItem(warningKey)

            if (!alreadyWarned) {
              addNotification({
                type: "warning",
                priority: "medium",
                title: "Arquivos expirando em breve",
                message: `Os arquivos "${upload.name}" expiram em menos de 24 horas. Destinatário: ${upload.recipient}`,
                actionLabel: "Ver Detalhes",
                actionUrl: "/historico",
              })

              addLog({
                action: "expiration_change",
                level: "warning",
                user: {
                  id: "system",
                  name: "Sistema",
                  email: "system@petrobras.com.br",
                  type: "internal",
                },
                details: {
                  targetId: upload.id,
                  targetName: upload.name,
                  description: `Aviso: Arquivos "${upload.name}" expiram em ${Math.floor(hoursUntilExpiration)} horas`,
                  metadata: {
                    sender: upload.sender.name,
                    recipient: upload.recipient,
                    hoursRemaining: Math.floor(hoursUntilExpiration),
                  },
                },
              })

              localStorage.setItem(warningKey, "true")
            }
          }
        } catch (error) {
          console.error("Erro ao processar expiração:", error)
        }
      })
    }

    // Executar verificação imediatamente e depois a cada minuto
    checkExpiredFiles()
    const interval = setInterval(checkExpiredFiles, 60000) // 1 minuto

    return () => clearInterval(interval)
  }, [uploads, addNotification, addLog, user])

  // Componente invisível, apenas monitora
  return null
}
