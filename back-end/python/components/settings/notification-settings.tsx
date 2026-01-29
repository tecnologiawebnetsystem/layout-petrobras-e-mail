"use client"

import { useState } from "react"
import { Save } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useNotificationStore } from "@/lib/stores/notification-store"

export function NotificationSettings() {
  const { addNotification } = useNotificationStore()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [fileUploaded, setFileUploaded] = useState(true)
  const [fileDownloaded, setFileDownloaded] = useState(true)
  const [approvalPending, setApprovalPending] = useState(true)
  const [approvalDecision, setApprovalDecision] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(false)

  const handleSave = () => {
    addNotification({
      type: "upload_success",
      priority: "low",
      title: "Preferências salvas",
      message: "Suas preferências de notificação foram atualizadas",
    })
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Preferências de Notificação</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Escolha como você deseja ser notificado</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Canais de notificação</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">E-mail</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receber notificações por e-mail</p>
                </div>
                <Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications">Push</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receber notificações no navegador</p>
                </div>
                <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 dark:text-white">Tipos de notificação</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="file-uploaded">Arquivo enviado</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quando você enviar um arquivo</p>
                </div>
                <Switch id="file-uploaded" checked={fileUploaded} onCheckedChange={setFileUploaded} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="file-downloaded">Arquivo baixado</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quando alguém baixar seu arquivo</p>
                </div>
                <Switch id="file-downloaded" checked={fileDownloaded} onCheckedChange={setFileDownloaded} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="approval-pending">Aprovação pendente</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quando houver arquivos para aprovar</p>
                </div>
                <Switch id="approval-pending" checked={approvalPending} onCheckedChange={setApprovalPending} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="approval-decision">Decisão de aprovação</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Quando seu arquivo for aprovado/rejeitado</p>
                </div>
                <Switch id="approval-decision" checked={approvalDecision} onCheckedChange={setApprovalDecision} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="security-alerts">Alertas de segurança</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avisos importantes sobre sua conta</p>
                </div>
                <Switch id="security-alerts" checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-report">Relatório semanal</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resumo semanal de atividades</p>
                </div>
                <Switch id="weekly-report" checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSave} className="bg-[#0047BB] hover:bg-[#003a99]">
            <Save className="h-4 w-4 mr-2" />
            Salvar preferências
          </Button>
        </div>
      </div>
    </Card>
  )
}
