"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { usePermissions, checkAnyPermission } from "@/lib/auth/permissions"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardCheck, Shield } from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { PageHeader } from "@/components/shared/page-header"
import { ApprovalMetricsCards } from "@/components/supervisor/approval-metrics-cards"
import { ApprovalFilters } from "@/components/supervisor/approval-filters"
import { ApprovalList } from "@/components/supervisor/approval-list"
import { ExportCsvDialog } from "@/components/shared/export-csv-dialog"

const SUPERVISOR_SHARES_EXPORT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Nome" },
  { key: "status", label: "Status" },
  { key: "recipient_email", label: "Destinatário" },
  { key: "description", label: "Descrição" },
  { key: "sender_name", label: "Solicitante" },
  { key: "sender_email", label: "Email do solicitante" },
  { key: "sender_department", label: "Departamento" },
  { key: "files_count", label: "Qtd. Arquivos" },
  { key: "expiration_hours", label: "Horas de expiração" },
  { key: "created_at", label: "Criado em" },
  { key: "approved_at", label: "Aprovado em" },
  { key: "rejected_at", label: "Rejeitado em" },
  { key: "rejection_reason", label: "Motivo da rejeição" },
  { key: "expires_at", label: "Expira em" },
]

export default function SupervisorPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, loadAllSupervisorShares } = useWorkflowStore()
  const { hasPermission } = usePermissions()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("aprovacoes")


  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated) { router.push("/"); return }
      // Guard por permissao granular (CAv4). Fallback para userType em sessoes antigas.
      const hasGestorPermission = checkAnyPermission(user?.permissions, ["shares:approve", "shares:reject"])
      const hasGestorByRole = user?.userType === "supervisor"
      if (!hasGestorPermission && !hasGestorByRole) {
        router.push("/")
      } else {
        loadAllSupervisorShares()
        setIsLoading(false)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router, loadAllSupervisorShares])

  const pendingCount = uploads.filter((u) => u.status === "pending").length
  const approvedCount = uploads.filter((u) => u.status === "approved").length
  const rejectedCount = uploads.filter((u) => u.status === "rejected").length
  const totalCount = uploads.length

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.recipient?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || upload.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSelectMetric = (filter: string) => {
    setStatusFilter(filter)
    setActiveTab("aprovacoes")
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
  }

  if (isLoading) {
    return <FullPageLoader message="Carregando painel do gestor..." subMessage="Buscando compartilhamentos e dados" />
  }

  // Render guard alinhado ao useEffect: permissao granular + fallback por role
  const hasGestorAccess = checkAnyPermission(user?.permissions, ["shares:approve", "shares:reject"]) || user?.userType === "supervisor"
  if (!isAuthenticated || !hasGestorAccess) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Solução de Compartilhamento de Arquivos Confidenciais" />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav
          items={[{ label: "Inicio", href: "/supervisor" }, { label: "Painel do Gestor" }]}
          dashboardLink="/supervisor"
        />

        <PageHeader
          icon={Shield}
          title="Painel do Gestor"
          subtitle="Gerencie aprovações, compartilhamentos e visualize logs do sistema"
        />

        <ApprovalMetricsCards
          total={totalCount}
          pending={pendingCount}
          approved={approvedCount}
          rejected={rejectedCount}
          activeFilter={statusFilter}
          onSelect={handleSelectMetric}
        />

        {/* Aprovacoes */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted/50">
            <TabsTrigger
              value="aprovacoes"
              className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ClipboardCheck className="h-5 w-5" />
              Aprovacoes
              {pendingCount > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs px-2">{pendingCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aprovacoes" className="space-y-6">
            <div className="flex justify-end">
              <ExportCsvDialog
                endpoint="/supervisor/export/shares"
                filenamePrefix="compartilhamentos_gestor"
                title="Exportar compartilhamentos em CSV"
                columns={SUPERVISOR_SHARES_EXPORT_COLUMNS}
                initialFilters={{ search: searchQuery, status: statusFilter }}
                filters={[
                  { type: "text", key: "search", label: "Busca (nome/destinatário)", placeholder: "Filtrar..." },
                  {
                    type: "select",
                    key: "status",
                    label: "Status",
                    options: [
                      { value: "all", label: "Todos" },
                      { value: "pending", label: "Pendente" },
                      { value: "approved", label: "Aprovado" },
                      { value: "rejected", label: "Rejeitado" },
                    ],
                  },
                  { type: "date", key: "start_date", label: "Data inicial" },
                  { type: "date", key: "end_date", label: "Data final" },
                ]}
              />
            </div>

            <ApprovalFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              onReset={handleResetFilters}
            />

            <ApprovalList
              uploads={filteredUploads}
              onViewDetails={(id) => router.push(`/supervisor/detalhes/${id}`)}
              onClearFilters={handleResetFilters}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
