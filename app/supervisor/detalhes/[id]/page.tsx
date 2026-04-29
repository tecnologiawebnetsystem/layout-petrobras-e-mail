"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, CheckCircle2, XCircle, Clock, FileText, Search, CheckCircle, Ticket, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ZipViewerModal } from "@/components/supervisor/zip-viewer-modal"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import { AppHeader } from "@/components/shared/app-header"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { Separator } from "@/components/ui/separator"

export default function SupervisorDetailsPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { uploads, approveUpload, rejectUpload, initializeMockZip, mockZipBlob, loadAllSupervisorShares } = useWorkflowStore()
  const { user } = useAuthStore()

  const [id, setId] = useState<string>("")
  const [uploadData, setUploadData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zipViewerOpen, setZipViewerOpen] = useState(false)
  const [selectedZipFile, setSelectedZipFile] = useState<{ name: string; url?: string; blob?: Blob } | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [individualApprovalMode, setIndividualApprovalMode] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set())

  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolvedParams = await params
        setId(resolvedParams.id)
      } else {
        setId(params.id)
      }
    }

    resolveParams()
  }, [params])

  useEffect(() => {
    if (!id) return

    const init = async () => {
      await initializeMockZip()
      // Se o store não tiver os dados (acesso direto / refresh), busca da API
      let foundUpload = uploads.find((u) => u.id === id)
      if (!foundUpload) {
        await loadAllSupervisorShares()
        foundUpload = useWorkflowStore.getState().uploads.find((u) => u.id === id)
      }
      setUploadData(foundUpload || null)
      setIsLoading(false)
    }

    init()
  }, [id, uploads, initializeMockZip])

  const handleApprove = () => {
    if (!uploadData) return

    const supervisorName = user?.name || "Supervisor"
    approveUpload(uploadData.id, supervisorName)

    toast({
      title: "Documento aprovado",
      description: `O documento foi aprovado com sucesso`,
    })

    router.push("/supervisor")
  }

  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo da rejeição",
        variant: "destructive",
      })
      return
    }

    if (!uploadData) return

    rejectUpload(uploadData.id, "Carlos Mendes", rejectionReason)

    toast({
      title: "Upload Rejeitado",
      description: `O envio foi rejeitado. ${uploadData.sender?.name || "Remetente"} foi notificado.`,
      variant: "destructive",
    })

    setShowRejectDialog(false)
    setRejectionReason("")
    router.push("/supervisor")
  }

  const handleOpenZipViewer = (fileName: string, fileUrl?: string, blob?: Blob) => {
    setSelectedZipFile({ name: fileName, url: fileUrl, blob })
    setZipViewerOpen(true)
  }

  const toggleFileSelection = (index: number) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedFiles(newSelected)
  }

  const selectAllFiles = () => {
    if (uploadData?.files) {
      setSelectedFiles(new Set(uploadData.files.map((_: any, i: number) => i)))
    }
  }

  const deselectAllFiles = () => {
    setSelectedFiles(new Set())
  }

  const handleApproveSelected = () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para aprovar",
        variant: "destructive",
      })
      return
    }

    if (!uploadData?.files) return

    const fileNames = uploadData.files
      .filter((_: any, i: number) => selectedFiles.has(i))
      .map((f: any) => f.name)
      .join(", ")

    toast({
      title: `${selectedFiles.size} arquivo(s) aprovado(s)`,
      description: `Arquivos aprovados: ${fileNames}`,
    })

    setIndividualApprovalMode(false)
    setSelectedFiles(new Set())
  }

  const handleRejectSelected = () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para rejeitar",
        variant: "destructive",
      })
      return
    }

    setShowRejectDialog(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Módulo Supervisor" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Carregando detalhes do documento...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!uploadData) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader subtitle="Módulo Supervisor" />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Documento não encontrado</p>
              <Button onClick={() => router.push("/supervisor")} className="mt-4">
                Voltar para Supervisor
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const files = uploadData.files || []
  const sender = uploadData.sender || { name: "Desconhecido", email: "", role: "" }
  const history = uploadData.history || []

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Módulo Supervisor" />

      <div className="container max-w-7xl mx-auto px-6 py-8">
        <BreadcrumbNav
          items={[
            { label: "Início", href: "/supervisor" },
            { label: "Arquivos", href: "/supervisor" },
            { label: "Detalhe do Arquivo" },
          ]}
          dashboardLink="/supervisor"
        />

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Visualização de Documento</h1>
          <p className="text-muted-foreground text-lg">
            Visualize os detalhes do arquivo enviado e seu compartilhamento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Detalhes do Arquivo</h2>
                <Badge
                  className={
                    uploadData.status === "approved"
                      ? "bg-green-100 text-green-800 border-green-300"
                      : uploadData.status === "rejected"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                  }
                >
                  {uploadData.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                  {uploadData.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {uploadData.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                  {uploadData.status === "pending"
                    ? "Pendente"
                    : uploadData.status === "approved"
                      ? "Aprovado"
                      : "Rejeitado"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome do Arquivo</p>
                  <p className="font-semibold text-foreground text-lg">{uploadData.name}</p>
                </div>

                <div className="flex gap-6 flex-wrap">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Remetente</p>
                    <p className="font-medium text-foreground">{sender.name}</p>
                    <p className="text-sm text-muted-foreground">{sender.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Destinatario</p>
                    <p className="font-medium text-foreground">{uploadData.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Upload</p>
                    <p className="font-medium text-foreground">{uploadData.uploadDate}</p>
                  </div>
                  {uploadData.horasPendente != null && uploadData.status === "pending" && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tempo Pendente</p>
                      <p className={`font-semibold flex items-center gap-1 ${uploadData.horasPendente > 24 ? "text-red-600" : uploadData.horasPendente > 8 ? "text-amber-600" : "text-emerald-600"}`}>
                        <Timer className="h-4 w-4" />
                        {uploadData.horasPendente}h
                      </p>
                    </div>
                  )}
                </div>

                {uploadData.chamado && (
                  <div className="bg-[#0047BB]/5 border border-[#0047BB]/20 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-[#0047BB] flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      Chamado do Suporte vinculado
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Numero</p>
                        <p className="font-mono font-semibold text-foreground">#{uploadData.chamado.numero_solicitacao}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Solicitante</p>
                        <p className="text-foreground truncate">{uploadData.chamado.email_solicitante}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Usuario Externo</p>
                        <p className="text-foreground truncate">{uploadData.chamado.email_usuario_externo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cadastrado por</p>
                        <p className="text-foreground">{uploadData.chamado.cadastrado_por}</p>
                      </div>
                    </div>
                  </div>
                )}

                {uploadData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-foreground">{uploadData.description}</p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex gap-3">
                <Button className="flex-1 bg-[#0047BB] hover:bg-[#003A99] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivos
                </Button>

                {uploadData.status === "pending" && (
                  <>
                    <Button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button onClick={() => setShowRejectDialog(true)} variant="destructive" className="flex-1">
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
              </div>

              {files.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Arquivos no pacote ({files.length})
                    </h3>
                    {uploadData.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIndividualApprovalMode(!individualApprovalMode)
                          if (individualApprovalMode) {
                            setSelectedFiles(new Set())
                          }
                        }}
                      >
                        {individualApprovalMode ? "Cancelar Seleção" : "Aprovar Individual"}
                      </Button>
                    )}
                  </div>

                  {individualApprovalMode && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                        Selecione os arquivos que deseja aprovar ou rejeitar individualmente
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={selectAllFiles}>
                          Selecionar Todos
                        </Button>
                        <Button size="sm" variant="outline" onClick={deselectAllFiles}>
                          Desmarcar Todos
                        </Button>
                        {selectedFiles.size > 0 && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={handleApproveSelected}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Aprovar {selectedFiles.size}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={handleRejectSelected}>
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeitar {selectedFiles.size}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {files.map((file: any, index: number) => {
                      const isZip = file.name?.toLowerCase().endsWith(".zip")
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded transition-colors ${
                            individualApprovalMode
                              ? selectedFiles.has(index)
                                ? "bg-blue-100 dark:bg-blue-950/40 border-2 border-blue-500"
                                : "bg-background hover:bg-muted cursor-pointer border-2 border-transparent"
                              : "bg-background"
                          }`}
                          onClick={() => individualApprovalMode && toggleFileSelection(index)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {individualApprovalMode && (
                              <Checkbox
                                checked={selectedFiles.has(index)}
                                onCheckedChange={() => toggleFileSelection(index)}
                              />
                            )}
                            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground truncate">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.size} • {file.type}
                              </p>
                            </div>
                          </div>
                          {isZip && file.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenZipViewer(file.name, file.url, mockZipBlob || undefined)
                              }}
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Ver Conteúdo
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Remetente</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">{sender.name}</h3>
                  <p className="text-sm text-muted-foreground">{sender.email}</p>
                  <p className="text-sm text-muted-foreground">{sender.role}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Histórico de Envios</h2>
              <div className="space-y-4">
                {history.map((item: any, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Enviado em {item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Upload</DialogTitle>
            <DialogDescription>Informe o motivo da rejeição para notificar o remetente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Rejeição *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o motivo da rejeição..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmRejection}>
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedZipFile && (
        <ZipViewerModal
          isOpen={zipViewerOpen}
          onClose={() => {
            setZipViewerOpen(false)
            setSelectedZipFile(null)
          }}
          fileName={selectedZipFile.name}
          fileUrl={selectedZipFile.url}
          fileBlob={selectedZipFile.blob}
        />
      )}
    </div>
  )
}
