"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { HistoryTimeline } from "@/components/history/history-timeline"
import { HistoryFilters } from "@/components/history/history-filters"
import { ActivityDetailModal } from "@/components/history/activity-detail-modal"
import type { Activity, ActivityType } from "@/types/activity"

export default function HistoricoPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activities, setActivities] = useState<Activity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isExternalUser = user?.userType === "external"

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Mock data - Em produção, buscar do backend
    const mockActivities: Activity[] = [
      {
        id: "1",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "upload",
        description: "Upload de arquivo Relatorio_Anual_2023.pdf",
        timestamp: new Date("2024-07-15T14:32:00"),
        metadata: {
          fileName: "Relatorio_Anual_2023.pdf",
          fileSize: "12.8 MB",
          recipient: "sistema.interno@petrobras.com.br",
        },
      },
      {
        id: "2",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "download",
        description: "Download de arquivo Contrato_Servicos.docx",
        timestamp: new Date("2024-07-14T10:15:00"),
        metadata: {
          fileName: "Contrato_Servicos.docx",
          fileSize: "128 KB",
        },
      },
      {
        id: "3",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "approval",
        description: "Documento aprovado: DRIVE_SHARE_2024.zip",
        timestamp: new Date("2024-07-13T16:45:00"),
        metadata: {
          fileName: "DRIVE_SHARE_2024.zip",
          fileSize: "780 KB",
          status: "approved",
        },
      },
      {
        id: "4",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "login",
        description: "Login realizado no sistema",
        timestamp: new Date("2024-07-13T09:00:00"),
        metadata: {
          ipAddress: "192.168.1.1",
          device: "Chrome - Windows 10",
        },
      },
      {
        id: "5",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "share",
        description: "Arquivo compartilhado com 3 usuários",
        timestamp: new Date("2024-07-12T11:30:00"),
        metadata: {
          fileName: "Apresentacao_Projeto.pptx",
          fileSize: "15.2 MB",
          sharedWith: ["Carlos Pereira", "Mariana Costa", "Ana Silva"],
        },
      },
      {
        id: "6",
        userId: user?.id || "",
        userName: user?.name || "",
        userEmail: user?.email || "",
        type: "delete",
        description: "Arquivo excluído: Rascunho_2023.pdf",
        timestamp: new Date("2024-07-11T15:20:00"),
        metadata: {
          fileName: "Rascunho_2023.pdf",
          fileSize: "5.4 MB",
        },
      },
    ]

    const filteredMockActivities = isExternalUser
      ? mockActivities.filter((activity) => activity.type === "download")
      : mockActivities

    setActivities(filteredMockActivities)
    setFilteredActivities(filteredMockActivities)
  }, [isAuthenticated, router, user, isExternalUser])

  const handleFilterChange = (filters: {
    type: ActivityType | "all"
    dateRange: { start: Date | null; end: Date | null }
    search: string
  }) => {
    let filtered = [...activities]

    // Filtro por tipo
    if (filters.type !== "all") {
      filtered = filtered.filter((a) => a.type === filters.type)
    }

    // Filtro por busca
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.description.toLowerCase().includes(search) ||
          a.userName.toLowerCase().includes(search) ||
          a.userEmail.toLowerCase().includes(search),
      )
    }

    // Filtro por data
    if (filters.dateRange.start) {
      filtered = filtered.filter((a) => a.timestamp >= filters.dateRange.start!)
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter((a) => a.timestamp <= filters.dateRange.end!)
    }

    setFilteredActivities(filtered)
  }

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity)
    setIsModalOpen(true)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle="Histórico de Atividades" />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isExternalUser ? "Histórico de Downloads" : "Histórico de Atividades"}
          </h1>
          <p className="text-muted-foreground">
            {isExternalUser
              ? "Visualize todos os seus downloads realizados no sistema"
              : "Visualize todas as suas ações e atividades realizadas no sistema"}
          </p>
        </div>

        <HistoryFilters onFilterChange={handleFilterChange} totalActivities={filteredActivities.length} />

        <HistoryTimeline activities={filteredActivities} onViewDetails={handleViewDetails} />

        <ActivityDetailModal activity={selectedActivity} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </main>
    </div>
  )
}
