"use client"

import type { Activity } from "@/types/activity"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Share2,
  LogIn,
  LogOut,
  Trash2,
  User,
  Mail,
  Clock,
  FileText,
  HardDrive,
  Users,
  Monitor,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ActivityDetailModalProps {
  activity: Activity | null
  isOpen: boolean
  onClose: () => void
}

export function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  if (!activity) return null

  const getIcon = (type: Activity["type"]) => {
    const iconClass = "h-6 w-6"
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
      upload: "Upload de Arquivo",
      download: "Download de Arquivo",
      approval: "Aprovação de Documento",
      rejection: "Rejeição de Documento",
      share: "Compartilhamento",
      login: "Login no Sistema",
      logout: "Logout do Sistema",
      delete: "Exclusão de Arquivo",
    }
    return labels[type]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`rounded-full p-3 ${getIconColor(activity.type)}`}>{getIcon(activity.type)}</div>
            <div>
              <div className="text-xl font-bold">{getTypeLabel(activity.type)}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {format(activity.timestamp, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Descrição */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</h3>
            <p className="text-base text-foreground">{activity.description}</p>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Informações do Usuário
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Nome:</span>{" "}
                  <span className="font-medium">{activity.userName}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Email:</span>{" "}
                  <span className="font-medium">{activity.userEmail}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Metadados */}
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Detalhes Adicionais
              </h3>
              <div className="space-y-3">
                {activity.metadata.fileName && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Arquivo:</span>
                      <p className="font-medium">{activity.metadata.fileName}</p>
                    </div>
                  </div>
                )}
                {activity.metadata.fileSize && (
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Tamanho:</span>{" "}
                      <span className="font-medium">{activity.metadata.fileSize}</span>
                    </span>
                  </div>
                )}
                {activity.metadata.recipient && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Destinatário:</span>
                      <p className="font-medium">{activity.metadata.recipient}</p>
                    </div>
                  </div>
                )}
                {activity.metadata.sharedWith && activity.metadata.sharedWith.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <span className="text-sm text-muted-foreground">Compartilhado com:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {activity.metadata.sharedWith.map((person: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {person}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {activity.metadata.status && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant={activity.metadata.status === "approved" ? "default" : "destructive"}>
                        {activity.metadata.status === "approved" ? "Aprovado" : "Rejeitado"}
                      </Badge>
                    </span>
                  </div>
                )}
                {activity.metadata.device && (
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="text-muted-foreground">Dispositivo:</span>{" "}
                      <span className="font-medium">{activity.metadata.device}</span>
                    </span>
                  </div>
                )}
                {activity.metadata.ipAddress && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <span className="text-muted-foreground">IP:</span>{" "}
                      <span className="font-mono font-medium">{activity.metadata.ipAddress}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data e Hora */}
          <div className="flex items-center gap-2 pt-4 border-t">
            <Clock className="h-4 w-4 text-[#00A99D]" />
            <span className="text-sm text-muted-foreground">
              Realizado em {format(activity.timestamp, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
