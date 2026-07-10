"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ArrowLeft, RefreshCcw } from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { PageHeader } from "@/components/shared/page-header"
import { LogStatsCards } from "@/components/logs/log-stats-cards"
import { LogFilters } from "@/components/logs/log-filters"
import { LogTimeline } from "@/components/logs/log-timeline"
import { LogPagination } from "@/components/logs/log-pagination"
import type { AuditLog, AuditPagination, AuditResponse } from "@/components/logs/log-utils"

export default function LogsPage() {
  const router = useRouter()
  const { user, isAuthenticated, _hasHydrated, accessToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<AuditPagination>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 50,
  })
  const [logFilter, setLogFilter] = useState("all")
  const [logSearch, setLogSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")

  // Carregar logs da API
  const fetchLogs = useCallback(
    async (page: number = 1) => {
      if (!accessToken) return

      setIsLoadingLogs(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("limit", "50")

        if (logFilter !== "all") {
          params.set("level", logFilter)
        }

        if (actionFilter !== "all") {
          params.set("action", actionFilter)
        }

        // Filtro de data
        if (dateFilter !== "all") {
          const now = new Date()
          let startDate: Date

          if (dateFilter === "today") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          } else if (dateFilter === "week") {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          } else if (dateFilter === "month") {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          } else {
            startDate = new Date(0)
          }

          params.set("start_date", startDate.toISOString())
        }

        const res = await fetch(`/api/audit/logs?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (res.ok) {
          const data: AuditResponse = await res.json()
          setLogs(data.logs)
          setPagination(data.pagination)
        }
      } catch (error) {
        console.error("[v0] Erro ao carregar logs:", error)
      } finally {
        setIsLoadingLogs(false)
      }
    },
    [accessToken, logFilter, actionFilter, dateFilter],
  )

  useEffect(() => {
    if (!_hasHydrated) return

    const timer = setTimeout(() => {
      if (!isAuthenticated || (user?.userType !== "supervisor" && user?.userType !== "admin")) {
        router.push("/")
      } else {
        setIsLoading(false)
        fetchLogs(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [_hasHydrated, isAuthenticated, user, router, fetchLogs])

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!isLoading && accessToken) {
      fetchLogs(1)
    }
  }, [logFilter, actionFilter, dateFilter])

  // Filtrar logs localmente pela busca
  const filteredLogs = logs.filter((log) => {
    if (!logSearch) return true

    const searchLower = logSearch.toLowerCase()
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.details?.description?.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      String(log.details?.target_id || "").includes(searchLower)
    )
  })

  // Estatisticas (baseadas nos logs carregados)
  const stats = {
    total: pagination.total_items,
    success: logs.filter((l) => l.level === "success" || l.level === "INFO").length,
    error: logs.filter((l) => l.level === "error" || l.level === "ERROR").length,
    warning: logs.filter((l) => l.level === "warning" || l.level === "WARNING").length,
    info: logs.filter((l) => l.level === "info" || l.level === "INFO" || !l.level).length,
  }

  if (isLoading) {
    return <FullPageLoader message="Carregando logs do sistema..." subMessage="Buscando registros de atividades" />
  }

  if (!_hasHydrated || !isAuthenticated || (user?.userType !== "supervisor" && user?.userType !== "admin")) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav
          items={[{ label: "Supervisor", href: "/supervisor" }, { label: "Logs e Rastreamento" }]}
          dashboardLink="/supervisor"
        />

        <PageHeader
          icon={Activity}
          title="Logs e Rastreamento"
          subtitle="Historico completo de acoes e eventos do sistema"
          reverseGradient
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(pagination.current_page)}
                disabled={isLoadingLogs}
                className="gap-2"
              >
                <RefreshCcw className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="outline" onClick={() => router.push("/supervisor")} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
            </>
          }
        />

        <LogStatsCards
          total={stats.total}
          success={stats.success}
          error={stats.error}
          warning={stats.warning}
          info={stats.info}
          activeFilter={logFilter}
          onSelect={setLogFilter}
        />

        {/* Card Principal */}
        <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl">Registros de Atividade</CardTitle>
                <CardDescription>
                  Exibindo {filteredLogs.length} de {pagination.total_items} registros
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setLogFilter("all")
                  setLogSearch("")
                  setDateFilter("all")
                  setActionFilter("all")
                }}
              >
                <RefreshCcw className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <LogFilters
              search={logSearch}
              onSearchChange={setLogSearch}
              actionFilter={actionFilter}
              onActionFilterChange={setActionFilter}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              levelFilter={logFilter}
              onLevelFilterChange={setLogFilter}
            />

            <LogTimeline logs={filteredLogs} isLoading={isLoadingLogs} />

            <LogPagination
              currentPage={pagination.current_page}
              totalPages={pagination.total_pages}
              isLoading={isLoadingLogs}
              onPageChange={fetchLogs}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
