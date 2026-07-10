"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardCheck, Shield, Upload } from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { SupervisorUploadForm } from "@/components/supervisor/supervisor-upload-form"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { PageHeader } from "@/components/shared/page-header"
import { ApprovalMetricsCards } from "@/components/supervisor/approval-metrics-cards"
import { ApprovalFilters } from "@/components/supervisor/approval-filters"
import { ApprovalList } from "@/components/supervisor/approval-list"

export default function SupervisorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuthStore()
  const { uploads, loadAllSupervisorShares } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("aprovacoes")

  // Verifica parametro tab na URL
  useEffect(() => {
    const tabParam = searchParams.get("tab")
    if (tabParam && ["aprovacoes", "compartilhar"].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.userType !== "supervisor") {
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
    return <FullPageLoader message="Carregando painel do supervisor..." subMessage="Buscando compartilhamentos e dados" />
  }

  if (!isAuthenticated || user?.userType !== "supervisor") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Solucao de Compartilhamento de Arquivos Confidenciais" />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav
          items={[{ label: "Inicio", href: "/supervisor" }, { label: "Painel do Supervisor" }]}
          dashboardLink="/supervisor"
        />

        <PageHeader
          icon={Shield}
          title="Painel do Supervisor"
          subtitle="Gerencie aprovacoes, compartilhamentos e visualize logs do sistema"
        />

        <ApprovalMetricsCards
          total={totalCount}
          pending={pendingCount}
          approved={approvedCount}
          rejected={rejectedCount}
          activeFilter={statusFilter}
          onSelect={handleSelectMetric}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-14 p-1 bg-muted/50">
            <TabsTrigger
              value="aprovacoes"
              className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ClipboardCheck className="h-5 w-5" />
              Aprovacoes
              {pendingCount > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs px-2">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger
              value="compartilhar"
              className="gap-2 text-base data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Upload className="h-5 w-5" />
              Compartilhar
            </TabsTrigger>
          </TabsList>

          {/* Tab Aprovacoes */}
          <TabsContent value="aprovacoes" className="space-y-6">
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

          {/* Tab Compartilhar */}
          <TabsContent value="compartilhar" className="space-y-6">
            <SupervisorUploadForm />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
