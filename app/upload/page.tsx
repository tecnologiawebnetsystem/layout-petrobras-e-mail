"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { DragDropZone } from "@/components/upload/drag-drop-zone"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/components/shared/notification-modal"
import { Lock, Send, Sparkles, Clock, AlertTriangle, Ticket, CheckCircle2, XCircle, Timer, FileCheck, ChevronRight, History } from "lucide-react"
import type { MyTicket } from "@/app/api/support/my-tickets/route"
import { MetricsDashboard } from "@/components/dashboard/metrics-dashboard"
import type { FileDetail } from "@/components/dashboard/metric-detail-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { UploadSuccessModal } from "@/components/upload/upload-success-modal"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function UploadPage() {
  const { user, isAuthenticated } = useAuthStore()
  const { addUpload, uploads, loadUploads } = useWorkflowStore()
  const router = useRouter()
  // Chamados do suporte vinculados ao usuario interno
  const [myTickets, setMyTickets] = useState<MyTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<MyTicket | null>(null)
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("novo")
  const [supervisorManual, setSupervisorManual] = useState("")

const [recipient, setRecipient] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [expirationHours, setExpirationHours] = useState<number>(168) // Padrão: 7 dias
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
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

const [uploadSuccessData, setUploadSuccessData] = useState<{
    name: string
    recipient: string
    files: Array<{ name: string; size: string; type: string }>
    expirationHours: number
    senderEmail: string // Adicionado campo senderEmail
  } | null>(null)
// Validação de e-mail
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
useEffect(() => {
    if (!isAuthenticated || user?.userType !== "internal") {
      router.push("/")
    }
  }, [isAuthenticated, user, router])

  useEffect(() => {
    loadUploads()
  }, [])

  // Busca chamados ativos do suporte para o usuario interno logado
  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "internal") return

    const fetchTickets = async () => {
      setTicketsLoading(true)
      try {
        const token = (user as Record<string, unknown>)?.token as string | undefined
        const res = await fetch("/api/support/my-tickets", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        const tickets: MyTicket[] = json?.data ?? []
        setMyTickets(tickets)
        if (tickets.length === 1) {
          setSelectedTicket(tickets[0])
          setRecipient(tickets[0].email_usuario_externo)
        }
      } catch {
        setMyTickets([])
      } finally {
        setTicketsLoading(false)
      }
    }

    fetchTickets()
  }, [isAuthenticated, user])

const handleFilesSelected = async (newFiles: File[]) => {
    const dangerousExtensions = [".exe", ".dll", ".bat", ".cmd", ".com", ".msi", ".scr", ".vbs", ".ps1", ".sh"]
    const blockedFiles: string[] = []

  for (const file of newFiles) {
      const extension = "." + file.name.split(".").pop()?.toLowerCase()
      if (dangerousExtensions.includes(extension)) {
        blockedFiles.push(file.name)
      }
    }

  if (blockedFiles.length > 0) {
      setNotification({
        show: true,
        type: "error",
        title: "Arquivos Bloqueados por Segurança",
        message: `Os seguintes arquivos não podem ser enviados por motivos de segurança: ${blockedFiles.join(", ")}. Extensões bloqueadas: .exe, .dll, .bat, .cmd, .com, .msi, .scr, .vbs, .ps1, .sh`,
      })
      return
    }

  setFiles((prev) => [...prev, ...newFiles])
  }

const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

  if (myTickets.length === 0 || !selectedTicket) {
      setNotification({
        show: true,
        type: "warning",
        title: "Chamado obrigatorio",
        message: "E necessario ter um chamado ativo aberto pelo suporte para realizar o compartilhamento.",
      })
      return
    }

  if (!recipient) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, informe o destinatário.",
      })
      return
    }
  if (!isValidEmail(recipient)) {
      setNotification({
        show: true,
        type: "warning",
        title: "E-mail inválido",
        message: "Por favor, informe um e-mail de destinatário válido.",
      })
      return
    }
  if (files.length === 0) {
      setNotification({
        show: true,
        type: "warning",
        title: "Nenhum arquivo",
        message: "Por favor, selecione pelo menos um arquivo.",
      })
      return
    }

  if (!description) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatório",
        message: "Por favor, descreva o conteúdo dos arquivos.",
      })
      return
    }

  setIsLoading(true)

  try {
      const uploadData = {
        name: description.substring(0, 50),
        sender: {
          id: user!.id,
          name: user!.name,
          email: user!.email,
        },
        recipient,
        description,
        files: files.map((f) => ({
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
          type: f.name.split(".").pop()?.toUpperCase() || "FILE",
        })),
        expirationHours,
        support_registration_id: selectedTicket?.id ?? null,
      }

    await new Promise((resolve) => setTimeout(resolve, 2000))

    addUpload({ ...uploadData, rawFiles: files })

    setUploadSuccessData({
        name: uploadData.name,
        recipient: uploadData.recipient,
        files: uploadData.files,
        expirationHours: uploadData.expirationHours,
        senderEmail: user!.email, // Adicionado email do remetente
      })

    setShowSuccess(true)

    setTimeout(() => {
        setRecipient("")
        setDescription("")
        setFiles([])
        setExpirationHours(168)
        setShowSuccess(false)
      }, 1000)
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar arquivos",
        message: "Ocorreu um erro. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

const uploadStats = {
    total: uploads.length,
    pending: uploads.filter((u) => u.status === "pending").length,
    approved: uploads.filter((u) => u.status === "approved").length,
    rejected: uploads.filter((u) => u.status === "rejected").length,
  }

const uploadFiles: FileDetail[] = uploads.flatMap((u) =>
    (u.files ?? []).map((f, i) => ({
      id: `${u.id}-${i}`,
      name: f.name,
      size: f.size,
      date: u.uploadDate,
      recipient: u.recipient,
      status: u.status,
    }))
  )

return (
    <ProtectedRoute allowedUserTypes={["internal"]}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppHeader subtitle="Solução de Compartilhamento de Arquivos Confidenciais" />

      <main className="container max-w-5xl mx-auto px-6 py-10 pb-20">
          <BreadcrumbNav
            items={[{ label: "Início", href: "/upload" }, { label: "Upload de Arquivos" }]}
            dashboardLink="/upload"
          />

        <MetricsDashboard {...uploadStats} userType="internal" files={uploadFiles} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2 h-12 p-1 bg-muted/50">
            <TabsTrigger value="novo" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Send className="h-4 w-4" />
              Novo Envio
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <History className="h-4 w-4" />
              Meus Envios
              {uploadStats.pending > 0 && (
                <Badge className="ml-1 bg-amber-500 text-white text-xs px-1.5">{uploadStats.pending}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="novo">
            {/* Tela de bloqueio total: sem chamado ativo, o usuario nao ve o formulario */}
            {!ticketsLoading && myTickets.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[480px] bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border p-10 text-center space-y-6">
                <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-2xl font-bold text-foreground">Acesso nao autorizado</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Voce nao possui nenhum chamado ativo aberto pelo suporte com o seu e-mail.
                    Para realizar um compartilhamento de arquivos, e necessario que o suporte abra um chamado com seu e-mail de solicitante.
                  </p>
                </div>
                <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-2 w-full max-w-sm text-left">
                  <p className="text-sm font-semibold text-foreground">O que fazer?</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Entre em contato com o time de suporte</li>
                    <li>Informe o numero do seu chamado ou solicitacao</li>
                    <li>Aguarde o cadastro ser realizado</li>
                    <li>O acesso e liberado por ate 7 dias por chamado</li>
                  </ul>
                </div>
                <a
                  href="mailto:suporte@petrobras.com.br"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0047BB] text-white font-semibold text-sm hover:bg-[#003A99] transition-colors"
                >
                  Contatar Suporte
                </a>
              </div>
            )}

            {(ticketsLoading || myTickets.length > 0) && (
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl shadow-xl border p-10 space-y-8 relative overflow-hidden">
            <div className="relative">
              <div className="flex items-center gap-4 mb-3">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground leading-tight">Transferência Segura de Arquivos</h1>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Envie documentos para destinatários externos com segurança
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-7">
              {user?.manager && (
                <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-3">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#0047BB]" />
                    Aprovador
                  </Label>
                  <div className="bg-background/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{user.manager.name}</p>
                        <p className="text-sm text-muted-foreground">{user.manager.email}</p>
                        {user.manager.jobTitle && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Cargo:</span> {user.manager.jobTitle}
                          </p>
                        )}
                        {user.manager.department && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Departamento:</span> {user.manager.department}
                          </p>
                        )}
                      </div>
                      <div className="px-3 py-1.5 bg-[#0047BB]/10 text-[#0047BB] rounded-full text-xs font-medium">
                        Supervisor Direto
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Este compartilhamento será enviado para aprovação do seu supervisor direto.
                  </p>
                </div>
              )}
            {!user?.manager && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-blue-800 dark:text-blue-500">Supervisor nao identificado</p>
                      <p className="text-sm text-blue-700 dark:text-blue-600 leading-relaxed">
                        Nao foi possivel identificar seu supervisor no Active Directory. Informe o e-mail do supervisor
                        manualmente para que o compartilhamento seja encaminhado para aprovacao.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor-manual" className="text-sm font-medium text-blue-800 dark:text-blue-400">
                      E-mail do Supervisor (obrigatorio)
                    </Label>
                    <Input
                      id="supervisor-manual"
                      type="email"
                      placeholder="supervisor@petrobras.com.br"
                      value={supervisorManual}
                      onChange={(e) => setSupervisorManual(e.target.value)}
                      className="bg-white/50 border-blue-300"
                      disabled={isLoading || showSuccess}
                    />
                  </div>
                </div>
              )}

            {/* Bloco de chamados do suporte */}
              {ticketsLoading ? (
                <div className="flex items-center gap-3 p-5 rounded-xl border border-border/50 bg-muted/20">
                  <div className="h-5 w-5 border-2 border-[#0047BB] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Verificando chamados ativos...</span>
                </div>
              ) : myTickets.length > 0 ? (
                <div className="space-y-4">
                  {/* Seletor de chamado */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Ticket className="h-4 w-4 text-[#0047BB]" />
                      Chamado do Suporte
                    </Label>
                    <Select
                      value={selectedTicket ? String(selectedTicket.id) : ""}
                      onValueChange={(val) => {
                        const ticket = myTickets.find((t) => String(t.id) === val) ?? null
                        setSelectedTicket(ticket)
                        setRecipient(ticket?.email_usuario_externo ?? "")
                      }}
                      disabled={isLoading || showSuccess}
                      aria-label="Selecione o chamado do suporte"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um chamado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {myTickets.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            #{t.numero_solicitacao} — {t.email_usuario_externo}
                            {t.dias_restantes != null && ` (${t.dias_restantes}d restante${t.dias_restantes !== 1 ? "s" : ""})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Selecione o chamado aberto pelo suporte para este compartilhamento.
                    </p>
                  </div>

                  {/* Campo destinatario somente leitura */}
                  <div className="space-y-3">
                    <Label htmlFor="recipient" className="text-base font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-[#00A99D]" />
                      Destinatario Externo
                    </Label>
                    <Input
                      id="recipient"
                      type="email"
                      value={recipient}
                      readOnly
                      aria-label="E-mail do destinatario (somente leitura)"
                      className="bg-muted/40 cursor-not-allowed select-none"
                      tabIndex={-1}
                    />
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      O e-mail e preenchido automaticamente a partir do chamado selecionado e nao pode ser alterado.
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Label className="text-base font-medium">Anexar Arquivos</Label>
                <DragDropZone
                  onFilesSelected={handleFilesSelected}
                  selectedFiles={files}
                  onRemoveFile={handleFileRemove}
                  aria-label="Área para anexar arquivos"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="expiration" className="text-base font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#FDB913]" />
                  Tempo de Disponibilidade
                </Label>
                <Select
                  value={expirationHours.toString()}
                  onValueChange={(v) => setExpirationHours(Number(v))}
                  disabled={isLoading || showSuccess}
                  aria-label="Tempo de disponibilidade dos arquivos"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 horas (1 dia)</SelectItem>
                    <SelectItem value="48">48 horas (2 dias)</SelectItem>
                    <SelectItem value="72">72 horas (3 dias)</SelectItem>
                    <SelectItem value="96">96 horas (4 dias)</SelectItem>
                    <SelectItem value="120">120 horas (5 dias)</SelectItem>
                    <SelectItem value="144">144 horas (6 dias)</SelectItem>
                    <SelectItem value="168">168 horas (7 dias)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Os arquivos ficarão disponíveis para download por {expirationHours} horas após a aprovação. Máximo: 168 horas (7 dias).
                </p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="text-base font-medium">
                  Descrição do Envio (obrigatório)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o conteúdo e a finalidade dos arquivos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] resize-none text-base"
                  required
                  aria-label="Descrição do envio"
                  disabled={isLoading || showSuccess}
                />
              </div>
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || showSuccess || myTickets.length === 0 || !selectedTicket || ticketsLoading}
                  size="lg"
                  className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white font-semibold px-10 text-base shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Enviar arquivos para aprovação"
                >
                  {isLoading && (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  )}
                  {showSuccess && <Sparkles className="h-5 w-5 mr-2" />}
                  <Send className="h-5 w-5 mr-2" />
                  {isLoading ? "Enviando..." : showSuccess ? "Enviado!" : "Enviar para Aprovação"}
                </Button>
              </div>
            </form>
          </div>
            )}
          </TabsContent>

          {/* Aba: Meus Envios */}
          <TabsContent value="historico" className="space-y-4">
            {uploads.length === 0 ? (
              <Card className="p-12 text-center bg-card/50">
                <FileCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-xl font-medium text-foreground mb-2">Nenhum envio encontrado</p>
                <p className="text-muted-foreground">Seus compartilhamentos aparecerão aqui.</p>
              </Card>
            ) : (
              uploads.map((u) => {
                const statusConfig = {
                  pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <Clock className="h-3 w-3 mr-1" /> },
                  approved: { label: "Aprovado", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
                  rejected: { label: "Rejeitado", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3 mr-1" /> },
                  cancelled: { label: "Cancelado", className: "bg-slate-100 text-slate-600 border-slate-200", icon: null },
                }
                const sc = statusConfig[u.status] ?? statusConfig.pending
                return (
                  <Card key={u.id} className={`overflow-hidden border-l-4 ${u.status === "pending" ? "border-l-amber-500" : u.status === "approved" ? "border-l-emerald-500" : u.status === "rejected" ? "border-l-red-500" : "border-l-slate-400"}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground truncate">{u.name || `Compartilhamento #${u.id}`}</span>
                            <Badge className={`${sc.className} flex items-center text-xs`}>
                              {sc.icon}{sc.label}
                            </Badge>
                            {u.chamado && (
                              <span className="inline-flex items-center gap-1 text-xs bg-[#0047BB]/10 text-[#0047BB] border border-[#0047BB]/20 px-2 py-0.5 rounded-full font-medium">
                                <Ticket className="h-3 w-3" />
                                #{u.chamado.numero_solicitacao}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Destinatario: <span className="text-foreground">{u.recipient}</span></p>
                            <p>Enviado em: <span className="text-foreground">{u.uploadDate}</span></p>
                            {u.expiresAt && <p>Expira em: <span className="text-foreground">{u.expiresAt}</span></p>}
                            {u.status === "pending" && u.horasPendente != null && (
                              <p className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                <span className={u.horasPendente > 24 ? "text-red-600 font-medium" : u.horasPendente > 8 ? "text-amber-600" : "text-emerald-600"}>
                                  {u.horasPendente}h aguardando aprovacao
                                </span>
                              </p>
                            )}
                            {u.status === "rejected" && u.rejectionReason && (
                              <p className="text-red-600">Motivo: {u.rejectionReason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{u.files?.length ?? 0} arq.</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
        </main>
        <ScrollToTop />
        <NotificationModal
          open={notification.show}
          onOpenChange={(show) => setNotification({ ...notification, show })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
        {uploadSuccessData && (
          <UploadSuccessModal
            open={uploadSuccessData !== null}
            onOpenChange={(open) => {
              if (!open) setUploadSuccessData(null)
            }}
            uploadData={uploadSuccessData}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
