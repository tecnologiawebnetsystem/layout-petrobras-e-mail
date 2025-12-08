"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore, type FileUpload } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Eye, CheckCircle, XCircle, Clock, Filter, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { NotificationModal } from "@/components/shared/notification-modal"
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"

export default function SupervisorPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, approveUpload, rejectUpload } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionModal, setActionModal] = useState<{
    show: boolean
    action: "approve" | "reject"
    upload: FileUpload | null
  }>({
    show: false,
    action: "approve",
    upload: null,
  })
  const [rejectionReason, setRejectionReason] = useState("")
  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  })

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "supervisor") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  const getFileIcon = (type: string) => {
    const iconClass = "h-10 w-10"
    const colors: Record<string, string> = {
      PDF: "text-red-500",
      DOCX: "text-blue-500",
      XLS: "text-green-600",
      XLSX: "text-green-600",
      PPT: "text-orange-500",
      PPTX: "text-orange-500",
    }
    return <FileText className={`${iconClass} ${colors[type] || "text-gray-500"}`} />
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        )
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        )
    }
  }

  const handleAction = (action: "approve" | "reject", upload: FileUpload) => {
    setActionModal({ show: true, action, upload })
    setRejectionReason("")
  }

  const confirmAction = () => {
    if (!actionModal.upload || !user) return

    if (actionModal.action === "approve") {
      approveUpload(actionModal.upload.id, user.name)
      setNotification({
        show: true,
        type: "success",
        title: "Upload Aprovado!",
        message: `O envio foi aprovado. ${actionModal.upload.sender.name} e ${actionModal.upload.recipient} foram notificados.`,
      })
    } else {
      if (!rejectionReason.trim()) {
        setNotification({
          show: true,
          type: "warning",
          title: "Motivo obrigatório",
          message: "Por favor, informe o motivo da rejeição.",
        })
        return
      }
      rejectUpload(actionModal.upload.id, user.name, rejectionReason)
      setNotification({
        show: true,
        type: "error",
        title: "Upload Rejeitado",
        message: `O envio foi rejeitado. ${actionModal.upload.sender.name} foi notificado.`,
      })
    }

    setActionModal({ show: false, action: "approve", upload: null })
  }

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || upload.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = uploads.filter((u) => u.status === "pending").length
  const approvedCount = uploads.filter((u) => u.status === "approved").length
  const rejectedCount = uploads.filter((u) => u.status === "rejected").length

  if (!isAuthenticated || user?.userType !== "supervisor") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Módulo Supervisor" />

      <div className="container max-w-7xl mx-auto px-6 py-10 pb-20">
        <BreadcrumbNav
          items={[{ label: "Início", href: "/supervisor" }, { label: "Arquivos" }]}
          dashboardLink="/supervisor"
        />

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground leading-tight">Central de Aprovações</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">Gerencie e aprove envios de arquivos</p>
            </div>
          </div>
        </div>

        <MetricsDashboard
          total={uploads.length}
          pending={pendingCount}
          approved={approvedCount}
          rejected={rejectedCount}
          userType="supervisor"
        />

        {/* Filters */}
        <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Files Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredUploads.map((upload) => (
            <Card
              key={upload.id}
              className={`p-6 hover:shadow-xl transition-all bg-card/50 backdrop-blur-sm ${
                upload.status === "pending" ? "pulse-pending" : ""
              }`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">{getFileIcon(upload.files[0]?.type)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-foreground text-lg">{upload.name}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Remetente:</span>
                      <span className="font-medium text-foreground ml-2">{upload.sender.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Destinatário:</span>
                      <span className="font-medium text-foreground ml-2">{upload.recipient}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span>{upload.uploadDate}</span>
                      <span className="mx-2">•</span>
                      <span>{upload.files.length} arquivo(s)</span>
                    </div>
                    {/* Removed exibição de tags */}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(upload.status)}

                    <div className="flex gap-2">
                      {upload.status === "pending" ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction("approve", upload)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleAction("reject", upload)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/supervisor/detalhes/${upload.id}`)}
                          className="text-[#0047BB] border-[#0047BB]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredUploads.length === 0 && (
          <Card className="p-16 text-center bg-card/50">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum arquivo encontrado</h3>
            <p className="text-muted-foreground">Ajuste os filtros ou aguarde novos envios</p>
          </Card>
        )}
      </div>

      {/* Action Modal */}
      <Dialog open={actionModal.show} onOpenChange={(show) => setActionModal({ ...actionModal, show })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionModal.action === "approve" ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Aprovar Envio
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Rejeitar Envio
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold text-foreground mb-1">{actionModal.upload?.name}</p>
              <p className="text-sm text-muted-foreground">
                De: {actionModal.upload?.sender.name} → Para: {actionModal.upload?.recipient}
              </p>
            </div>

            {actionModal.action === "approve" ? (
              <p className="text-sm text-muted-foreground">
                Ao aprovar, o destinatário receberá um email com link seguro para download dos arquivos. O remetente
                também será notificado.
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Rejeição (obrigatório)</Label>
                <Textarea
                  id="reason"
                  placeholder="Explique o motivo da rejeição..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">O remetente receberá esta mensagem</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal({ ...actionModal, show: false })}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              className={
                actionModal.action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }
            >
              {actionModal.action === "approve" ? "Aprovar" : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Added button to scroll to top */}
      <ScrollToTop />
    </div>
  )
}
