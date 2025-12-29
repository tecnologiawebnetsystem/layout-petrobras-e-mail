"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, XCircle, Calendar, User, Mail, Ban } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function HistoricoPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, cancelUpload } = useWorkflowStore()
  const router = useRouter()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedUploadId, setSelectedUploadId] = useState<string>("")
  const [cancellationReason, setCancellationReason] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }
  }, [isAuthenticated, router])

  const handleCancelClick = (uploadId: string) => {
    setSelectedUploadId(uploadId)
    setCancellationReason("")
    setIsCancelModalOpen(true)
  }

  const handleConfirmCancel = () => {
    if (selectedUploadId && user) {
      cancelUpload(selectedUploadId, user.name, cancellationReason)
      setIsCancelModalOpen(false)
      setSelectedUploadId("")
      setCancellationReason("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando Aprovação
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprovado
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeitado
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 border-gray-500/20">
            <Ban className="w-3 h-3 mr-1" />
            Cancelado
          </Badge>
        )
      default:
        return null
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const userUploads = uploads.filter((u) => u.sender.id === user?.id)

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Histórico de Compartilhamentos" />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meus Compartilhamentos</h1>
          <p className="text-muted-foreground">Acompanhe todos os seus compartilhamentos e seus status</p>
        </div>

        <div className="grid gap-4">
          {userUploads.map((upload) => (
            <Card key={upload.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{upload.name}</h3>
                    <p className="text-sm text-muted-foreground">{upload.description}</p>
                  </div>
                </div>
                {getStatusBadge(upload.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Destinatário:</span>
                  <span className="font-medium">{upload.recipient}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Enviado:</span>
                  <span className="font-medium">{upload.uploadDate}</span>
                </div>
              </div>

              {upload.status === "approved" && (
                <div className="flex items-center gap-2 text-sm mb-4 p-3 bg-green-500/10 rounded-lg">
                  <User className="w-4 h-4 text-green-700" />
                  <span className="text-green-700">
                    Aprovado por {upload.approvedBy} em {upload.approvalDate}
                  </span>
                </div>
              )}

              {upload.status === "rejected" && upload.rejectionReason && (
                <div className="p-3 bg-red-500/10 rounded-lg mb-4">
                  <p className="text-sm text-red-700">
                    <strong>Motivo da rejeição:</strong> {upload.rejectionReason}
                  </p>
                </div>
              )}

              {upload.status === "cancelled" && (
                <div className="p-3 bg-gray-500/10 rounded-lg mb-4">
                  <p className="text-sm text-gray-700">
                    <strong>Cancelado por:</strong> {upload.cancelledBy} em {upload.cancellationDate}
                  </p>
                  {upload.cancellationReason && (
                    <p className="text-sm text-gray-700 mt-2">
                      <strong>Motivo:</strong> {upload.cancellationReason}
                    </p>
                  )}
                </div>
              )}

              {upload.status === "pending" && (
                <div className="flex justify-end gap-2">
                  <Button variant="destructive" size="sm" onClick={() => handleCancelClick(upload.id)}>
                    <Ban className="w-4 h-4 mr-2" />
                    Cancelar Compartilhamento
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {userUploads.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum compartilhamento encontrado</p>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Compartilhamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este compartilhamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do cancelamento (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ex: Arquivo errado, preciso enviar uma versão atualizada..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleConfirmCancel}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
