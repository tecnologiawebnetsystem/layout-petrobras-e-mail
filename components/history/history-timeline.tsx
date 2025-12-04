"use client"

import type { Activity } from "@/types/activity"
import { Upload, Download, CheckCircle, XCircle, Share2, LogIn, LogOut, Trash2, Eye, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface HistoryTimelineProps {
  activities: Activity[]
  onViewDetails: (activity: Activity) => void
}

export function HistoryTimeline({ activities, onViewDetails }: HistoryTimelineProps) {
  const getIcon = (type: Activity["type"]) => {
    const iconClass = "h-5 w-5"
    switch (type) {
      case "upload":
        return <Upload className={iconClass} />
      case "download":
        return <Download className={iconClass} />
      case "approval":
        return <CheckCircle className={iconClass} />
      case "rejection":
        return <XCircle className={iconClass} />
      case "share":
        return <Share2 className={iconClass} />
      case "login":
        return <LogIn className={iconClass} />
      case "logout":
        return <LogOut className={iconClass} />
      case "delete":
        return <Trash2 className={iconClass} />
    }
  }

  const getIconColor = (type: Activity["type"]) => {
    switch (type) {
      case "upload":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
      case "download":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
      case "approval":
        return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "rejection":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      case "share":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
      case "login":
        return "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"
      case "logout":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      case "delete":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
    }
  }

  const getTypeLabel = (type: Activity["type"]) => {
    const labels = {
      upload: "Upload",
      download: "Download",
      approval: "Aprovação",
      rejection: "Rejeição",
      share: "Compartilhamento",
      login: "Login",
      logout: "Logout",
      delete: "Exclusão",
    }
    return labels[type]
  }

  if (activities.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma atividade encontrada</h3>
        <p className="text-muted-foreground">Não há atividades para exibir com os filtros selecionados</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`rounded-full p-3 ${getIconColor(activity.type)}`}>{getIcon(activity.type)}</div>
            {index < activities.length - 1 && <div className="w-0.5 flex-1 bg-border my-2 min-h-[40px]" />}
          </div>

          {/* Activity card */}
          <div className="flex-1 bg-card border rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00A99D]/10 text-[#00A99D]">
                    {getTypeLabel(activity.type)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(activity.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{activity.description}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Por: <span className="font-medium text-foreground">{activity.userName}</span>
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{activity.userEmail}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(activity)}
                className="flex items-center gap-2 hover:bg-teal-50 hover:text-[#00A99D] hover:border-[#00A99D] dark:hover:bg-teal-900/30"
              >
                <Eye className="h-4 w-4" />
                Detalhes
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
