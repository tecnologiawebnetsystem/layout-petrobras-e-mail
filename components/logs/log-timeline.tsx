"use client"

import { Badge } from "@/components/ui/badge"
import { Clock, History, Loader2, User } from "lucide-react"
import {
  type AuditLog,
  formatAction,
  getLogBorderColor,
  getLogIcon,
  getLogLevel,
  getLogStatusColor,
} from "@/components/logs/log-utils"

interface LogTimelineProps {
  logs: AuditLog[]
  isLoading: boolean
}

/**
 * Lista (timeline) de registros de auditoria, com estados de carregamento e
 * vazio. Extraida da pagina de logs mantendo exatamente o mesmo visual.
 */
export function LogTimeline({ logs, isLoading }: LogTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando logs...</span>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Nenhum log encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 mt-6">
      {logs.map((log) => {
        const level = getLogLevel(log)
        return (
          <div
            key={log.id}
            className={`bg-background/50 border border-l-4 ${getLogBorderColor(level)} rounded-xl p-4 hover:bg-background/80 transition-colors`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${getLogStatusColor(level)}`}>{getLogIcon(log.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-foreground">{formatAction(log.action)}</span>
                  <Badge variant="outline" className={`text-xs ${getLogStatusColor(level)}`}>
                    {log.action}
                  </Badge>
                  {log.details?.target_id && (
                    <Badge variant="outline" className="text-xs font-mono">
                      ID: {log.details.target_id}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{log.details?.description || "Sem descricao"}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {log.user?.name || log.user?.email || "Sistema"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.timestamp).toLocaleString("pt-BR")}
                  </span>
                  {log.details?.ip_address && (
                    <span className="flex items-center gap-1 font-mono">IP: {log.details.ip_address}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
