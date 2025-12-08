"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { WorkflowTimeline } from "@/components/workflow/workflow-timeline"
import { ApprovalModal } from "@/components/workflow/approval-modal"
import { Download, CheckCircle2, CheckCircle, XCircle, Workflow, Clock } from "lucide-react"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { ExpirationEditorModal } from "@/components/workflow/expiration-editor-modal"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import type { ApprovalWorkflow } from "@/types/workflow"

const documentData = {
  file: {
    name: "Relatorio_Anual_Contratos_2023_Final.pdf",
    type: "Documento PDF",
    size: "12.8 MB",
    uploadDate: "15 de Julho, 2024 - 14:32",
    status: "Enviado com Sucesso",
  },
  sender: {
    name: "Ana Clara Santos",
    role: "Analista Financeira, Fornecedor XYZ",
    avatar: "/placeholder-user.jpg",
    totalSent: 42,
    successRate: 100,
  },
  sharedWith: [
    { name: "Carlos Pereira", role: "Supervisor de Contratos", avatar: null },
    { name: "Mariana Costa", role: "Gerente de Operações", avatar: null },
  ],
  history: [
    { name: "Relatorio_Mensal_Maio.pdf", date: "20/06/2024" },
    { name: "Ajuste_Contrato_4850.docx", date: "15/05/2024" },
    { name: "Nota_Fiscal_Servicos.xml", date: "02/05/2024" },
  ],
  metadata: {
    documentType: "Relatório Financeiro",
    contractNumber: "CTR-2023-4859",
    costCenter: "CC-EXP-RJ-01",
    fiscalPeriod: "2023",
  },
  description:
    'Segue o relatório anual consolidado de todos os contratos firmados no ano de 2023. O documento foi revisado pela equipe financeira e está pronto para aprovação final. Por favor, revisar com urgência para cumprirmos o prazo interno."',
}

const mockWorkflow: ApprovalWorkflow = {
  documentId: "1",
  currentStep: 1,
  totalSteps: 3,
  status: "in_progress",
  createdAt: new Date("2024-07-15"),
  updatedAt: new Date(),
  steps: [
    {
      id: "1",
      name: "Análise Técnica",
      approver: "Carlos Mendes",
      role: "Supervisor Técnico",
      status: "approved",
      date: "16/07/2024 10:30",
      comments: "Documento aprovado. Todos os requisitos técnicos foram atendidos.",
      order: 1,
    },
    {
      id: "2",
      name: "Aprovação Financeira",
      approver: "Maria Silva",
      role: "Gerente Financeiro",
      status: "pending",
      order: 2,
    },
    {
      id: "3",
      name: "Aprovação Final",
      approver: "Roberto Costa",
      role: "Diretor Executivo",
      status: "waiting",
      order: 3,
    },
  ],
}

export default function SupervisorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const { getUploadById, updateExpiration } = useWorkflowStore()
  const [isLoading, setIsLoading] = useState(true)
  const [workflow, setWorkflow] = useState<ApprovalWorkflow>(mockWorkflow)
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean
    action: "approve" | "reject" | null
  }>({
    open: false,
    action: null,
  })
  const [expirationModal, setExpirationModal] = useState(false)

  const uploadData = getUploadById(params.id as string)

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== "supervisor") {
      router.push("/")
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, router])

  if (isLoading) {
    return null
  }

  const handleApprove = (comments: string) => {
    const currentStepIndex = workflow.currentStep
    const updatedSteps = workflow.steps.map((step, index) => {
      if (index === currentStepIndex) {
        return {
          ...step,
          status: "approved" as const,
          date: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
          comments: comments || "Aprovado sem comentários",
        }
      }
      if (index === currentStepIndex + 1) {
        return {
          ...step,
          status: "pending" as const,
        }
      }
      return step
    })

    setWorkflow({
      ...workflow,
      currentStep: currentStepIndex + 1,
      steps: updatedSteps,
      status: currentStepIndex + 1 >= workflow.totalSteps ? "approved" : "in_progress",
    })

    addNotification({
      type: "approval_approved",
      priority: "medium",
      title: "Documento aprovado",
      message: `O documento foi aprovado e avançou para a próxima etapa do workflow`,
    })
  }

  const handleReject = (comments: string) => {
    const currentStepIndex = workflow.currentStep
    const updatedSteps = workflow.steps.map((step, index) => {
      if (index === currentStepIndex) {
        return {
          ...step,
          status: "rejected" as const,
          date: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR"),
          comments,
        }
      }
      return step
    })

    setWorkflow({
      ...workflow,
      steps: updatedSteps,
      status: "rejected",
    })

    addNotification({
      type: "approval_rejected",
      priority: "high",
      title: "Documento rejeitado",
      message: `O documento foi rejeitado no workflow de aprovação`,
    })
  }

  const handleUpdateExpiration = (newHours: number, reason: string) => {
    updateExpiration(params.id as string, newHours, user!.name, reason)

    addNotification({
      type: "info",
      priority: "medium",
      title: "Tempo de validade atualizado",
      message: `Você alterou o tempo de validade para ${newHours} horas`,
    })
  }

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
                <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {documentData.file.status}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-6">Informações gerais sobre o documento enviado.</p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome do Arquivo</p>
                  <p className="font-semibold text-foreground">{documentData.file.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                  <p className="font-semibold text-foreground">{documentData.file.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tamanho</p>
                  <p className="font-semibold text-foreground">{documentData.file.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data de Upload</p>
                  <p className="font-semibold text-foreground">{documentData.file.uploadDate}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h3 className="font-semibold text-foreground">Tempo de Disponibilidade</h3>
                      <p className="text-sm text-muted-foreground">
                        Arquivos ficam disponíveis por {uploadData?.expirationHours || 72} horas após aprovação
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpirationModal(true)}
                    className="border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950/40"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Ajustar Tempo
                  </Button>
                </div>

                {uploadData?.expiresAt && (
                  <p className="text-xs text-muted-foreground">Expira em: {uploadData.expiresAt}</p>
                )}

                {uploadData && uploadData.expirationLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800">
                    <p className="text-xs font-semibold text-foreground mb-2">Histórico de Alterações:</p>
                    <div className="space-y-1">
                      {uploadData.expirationLogs.map((log, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium">{log.changedBy}</span>
                          {log.previousValue !== null && (
                            <span>
                              {" "}
                              alterou de {log.previousValue}h para {log.newValue}h
                            </span>
                          )}
                          {log.previousValue === null && <span> definiu {log.newValue}h</span>}
                          <span className="text-muted-foreground/70"> - {log.timestamp}</span>
                          {log.reason && <p className="mt-0.5 italic text-muted-foreground/60">Motivo: {log.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex gap-3">
                <Button className="flex-1 bg-[#0047BB] hover:bg-[#003A99] text-white">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Arquivo Original
                </Button>
                <Button
                  onClick={() => setApprovalModal({ open: true, action: "approve" })}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={workflow.status !== "in_progress"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprovar Documento
                </Button>
                <Button
                  onClick={() => setApprovalModal({ open: true, action: "reject" })}
                  variant="destructive"
                  className="flex-1"
                  disabled={workflow.status !== "in_progress"}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Workflow className="h-6 w-6 text-[#00A99D]" />
                <h2 className="text-2xl font-bold text-foreground">Workflow de Aprovação</h2>
              </div>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Status do Workflow</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Etapa {workflow.currentStep + 1} de {workflow.totalSteps}
                    </p>
                  </div>
                  <Badge
                    className={
                      workflow.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : workflow.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {workflow.status === "approved" && "Aprovado"}
                    {workflow.status === "rejected" && "Rejeitado"}
                    {workflow.status === "in_progress" && "Em Andamento"}
                  </Badge>
                </div>
              </div>

              <WorkflowTimeline steps={workflow.steps} currentStep={workflow.currentStep} />
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Compartilhado Com</h2>

              <div className="space-y-4">
                {documentData.sharedWith.map((person, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={person.avatar || undefined} />
                      <AvatarFallback className="bg-[#00A99D] text-white">
                        {person.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{person.name}</p>
                      <p className="text-sm text-muted-foreground">{person.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Metadados</h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo de Documento</p>
                  <p className="font-semibold text-foreground">{documentData.metadata.documentType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número do Contrato</p>
                  <p className="font-semibold text-foreground">{documentData.metadata.contractNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Centro de Custo</p>
                  <p className="font-semibold text-foreground">{documentData.metadata.costCenter}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Período Fiscal</p>
                  <p className="font-semibold text-foreground">{documentData.metadata.fiscalPeriod}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">Descrição do Remetente</h2>
              <div className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-[#0047BB] p-4 rounded">
                <p className="text-foreground italic leading-relaxed">{documentData.description}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Informações do Remetente</h2>

              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={documentData.sender.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-[#00A99D] text-white text-xl">
                    {documentData.sender.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg text-foreground">{documentData.sender.name}</h3>
                <p className="text-sm text-muted-foreground">{documentData.sender.role}</p>
              </div>

              <Separator className="my-6" />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-[#0047BB] mb-1">{documentData.sender.totalSent}</p>
                  <p className="text-xs text-muted-foreground">Total de Envios</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-3xl font-bold text-green-600 mb-1">{documentData.sender.successRate}%</p>
                  <p className="text-xs text-muted-foreground">Arquivos Válidos</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Histórico de Envios</h2>

              <div className="space-y-4">
                {documentData.history.map((item, index) => (
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

      <ApprovalModal
        open={approvalModal.open}
        onOpenChange={(open) => setApprovalModal({ ...approvalModal, open })}
        documentName={documentData.file.name}
        onApprove={handleApprove}
        onReject={handleReject}
        action={approvalModal.action}
      />

      {uploadData && (
        <ExpirationEditorModal
          open={expirationModal}
          onOpenChange={setExpirationModal}
          currentHours={uploadData.expirationHours}
          onUpdate={handleUpdateExpiration}
        />
      )}
    </div>
  )
}
