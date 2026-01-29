"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, CheckCircle2, XCircle, Calendar, User, Mail, Ban, AlertCircle } from "lucide-react"
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
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function CompartilhamentosPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, cancelUpload } = useWorkflowStore()
  const router = useRouter()

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [selectedUploadId, setSelectedUploadId] = useState<string>("")
  const [cancellationReason, setCancellationReason] = useState("")

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

  const userUploads = uploads.filter((u) => u.sender.id === user?.id)

  const pendingUploads = userUploads.filter((u) => u.status === "pending")
  const approvedUploads = userUploads.filter((u) => u.status === "approved")
  const rejectedUploads = userUploads.filter((u) => u.status === "rejected")
  const cancelledUploads = userUploads.filter((u) => u.status === "cancelled")

  return (
    <ProtectedRoute allowedUserTypes={["internal"]}>
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Meus Compartilhamentos" />

        <main className="container mx-auto px-6 py-8">
          <BreadcrumbNav
            items={[{ label: "Início", href: "/upload" }, { label: "Meus Compartilhamentos" }]}
            dashboardLink="/upload"
          />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Meus Compartilhamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os compartilhamentos que você realizou</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingUploads.length}</p>
                  <p className="text-sm text-muted-foreground">Aguardando</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedUploads.length}</p>
                  <p className="text-sm text-muted-foreground">Aprovados</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{rejectedUploads.length}</p>
                  <p className="text-sm text-muted-foreground">Rejeitados</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                  <Ban className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{cancelledUploads.length}</p>
                  <p className="text-sm text-muted-foreground">Cancelados</p>
                </div>
              </div>
            </Card>
          </div>

          {pendingUploads.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-700" />
                Aguardando Aprovação ({pendingUploads.length})
              </h2>
              <div className="grid gap-4">
                {pendingUploads.map((upload) => (
                  <Card key={upload.id} className="p-6 border-l-4 border-l-amber-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-amber-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-amber-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{upload.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{upload.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Destinatário:</span>
                              <span className="font-medium">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Enviado em:</span>
                              <span className="font-medium">{upload.uploadDate}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-lg mb-4">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <p className="text-sm text-amber-700">
                        Este compartilhamento está aguardando aprovação do supervisor. Você pode cancelá-lo a qualquer
                        momento.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="destructive" size="sm" onClick={() => handleCancelClick(upload.id)}>
                        <Ban className="w-4 h-4 mr-2" />
                        Cancelar Compartilhamento
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {approvedUploads.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-700" />
                Aprovados ({approvedUploads.length})
              </h2>
              <div className="grid gap-4">
                {approvedUploads.map((upload) => (
                  <Card key={upload.id} className="p-6 border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{upload.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{upload.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Destinatário:</span>
                              <span className="font-medium">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Enviado em:</span>
                              <span className="font-medium">{upload.uploadDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                            <User className="w-4 h-4 text-green-700" />
                            <span className="text-sm text-green-700">
                              Aprovado por {upload.approvedBy} em {upload.approvalDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {rejectedUploads.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-700" />
                Rejeitados ({rejectedUploads.length})
              </h2>
              <div className="grid gap-4">
                {rejectedUploads.map((upload) => (
                  <Card key={upload.id} className="p-6 border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-red-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-red-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{upload.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{upload.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Destinatário:</span>
                              <span className="font-medium">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Enviado em:</span>
                              <span className="font-medium">{upload.uploadDate}</span>
                            </div>
                          </div>

                          {upload.rejectionReason && (
                            <div className="p-3 bg-red-500/10 rounded-lg">
                              <p className="text-sm text-red-700">
                                <strong>Motivo da rejeição:</strong> {upload.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {cancelledUploads.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Ban className="w-5 h-5 text-gray-700" />
                Cancelados ({cancelledUploads.length})
              </h2>
              <div className="grid gap-4">
                {cancelledUploads.map((upload) => (
                  <Card key={upload.id} className="p-6 border-l-4 border-l-gray-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-gray-500/10 rounded-lg">
                          <FileText className="w-6 h-6 text-gray-700" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{upload.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{upload.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Destinatário:</span>
                              <span className="font-medium">{upload.recipient}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Enviado em:</span>
                              <span className="font-medium">{upload.uploadDate}</span>
                            </div>
                          </div>

                          <div className="p-3 bg-gray-500/10 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>Cancelado por:</strong> {upload.cancelledBy} em {upload.cancellationDate}
                            </p>
                            {upload.cancellationReason && (
                              <p className="text-sm text-gray-700 mt-2">
                                <strong>Motivo:</strong> {upload.cancellationReason}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(upload.status)}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {userUploads.length === 0 && (
            <Card className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum compartilhamento encontrado</h3>
              <p className="text-muted-foreground mb-6">Você ainda não realizou nenhum compartilhamento.</p>
              <Button onClick={() => router.push("/upload")}>Fazer Primeiro Compartilhamento</Button>
            </Card>
          )}
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
                <p className="text-sm text-muted-foreground">
                  Informar o motivo ajuda o supervisor a entender melhor sua decisão.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleConfirmCancel}>
                <Ban className="w-4 h-4 mr-2" />
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
