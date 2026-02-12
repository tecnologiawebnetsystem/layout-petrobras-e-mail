"use client"

import { useState, useMemo, useEffect } from "react"
import { useAuditLogStore, type LogAction, type LogLevel } from "@/lib/stores/audit-log-store"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Download,
  CheckCircle,
  XCircle,
  Upload,
  LogIn,
  LogOut,
  Eye,
  Clock,
  AlertTriangle,
  Shield,
  Trash2,
} from "lucide-react"

const actionIcons: Record<LogAction, any> = {
  login: LogIn,
  logout: LogOut,
  upload: Upload,
  approve: CheckCircle,
  reject: XCircle,
  download: Download,
  access: Eye,
  expiration_change: Clock,
  zip_validation: Shield,
  file_expired: Trash2,
  cancel: XCircle,
}

const actionLabels: Record<LogAction, string> = {
  login: "Login",
  logout: "Logout",
  upload: "Upload",
  approve: "Aprovação",
  reject: "Rejeição",
  download: "Download",
  access: "Acesso",
  expiration_change: "Alteração de Prazo",
  zip_validation: "Validacao de ZIP",
  file_expired: "Arquivo Expirado",
  cancel: "Cancelamento",
}

const levelColors: Record<LogLevel, string> = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-petrobras-green-light text-petrobras-green-dark border-petrobras-green",
  warning: "bg-petrobras-yellow-light text-amber-900 border-petrobras-yellow",
  error: "bg-red-100 text-red-800 border-red-200",
}

export default function AuditoriaPage() {
  const { logs, exportLogs, getLogsByAction, loadLogs } = useAuditLogStore()
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadLogs()
  }, [loadLogs])
  const [filterAction, setFilterAction] = useState<LogAction | "all">("all")
  const [filterLevel, setFilterLevel] = useState<LogLevel | "all">("all")

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.targetName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesAction = filterAction === "all" || log.action === filterAction
      const matchesLevel = filterLevel === "all" || log.level === filterLevel

      return matchesSearch && matchesAction && matchesLevel
    })
  }, [logs, searchTerm, filterAction, filterLevel])

  const handleExport = () => {
    const data = exportLogs()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    return {
      total: logs.length,
      logins: getLogsByAction("login").length,
      uploads: getLogsByAction("upload").length,
      approvals: getLogsByAction("approve").length,
      downloads: getLogsByAction("download").length,
      fileExpired: getLogsByAction("file_expired").length, // Adicionado stat para arquivos expirados
    }
  }, [logs, getLogsByAction])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-8 pb-16 px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 leading-tight">Auditoria e Logs</h1>
            <p className="mt-2 text-lg text-slate-600 leading-relaxed">
              Rastreabilidade completa de todas as ações do sistema
            </p>
          </div>
          <Button onClick={handleExport} className="bg-petrobras-green hover:bg-petrobras-green-dark">
            <Download className="mr-2 h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 border-none shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Uploads</p>
                <p className="text-4xl font-bold mt-2">{stats.uploads}</p>
              </div>
              <Upload className="h-10 w-10 opacity-80" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 border-none shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Downloads</p>
                <p className="text-4xl font-bold mt-2">{stats.downloads}</p>
              </div>
              <Download className="h-10 w-10 opacity-80" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 border-none shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90">Arquivos Expirados</p>
                <p className="text-4xl font-bold mt-2">{stats.fileExpired}</p>
              </div>
              <Trash2 className="h-10 w-10 opacity-80" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 shadow-lg border-slate-200">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por usuário, email ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value as LogAction | "all")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrobras-green"
            >
              <option value="all">Todas as Ações</option>
              {Object.entries(actionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | "all")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petrobras-green"
            >
              <option value="all">Todos os Níveis</option>
              <option value="info">Info</option>
              <option value="success">Sucesso</option>
              <option value="warning">Aviso</option>
              <option value="error">Erro</option>
            </select>
          </div>
        </Card>

        {/* Logs List */}
        <Card className="shadow-lg border-slate-200">
          <ScrollArea className="h-[600px]">
            <div className="p-6 space-y-4">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
                  <p className="mt-4 text-lg font-medium text-slate-600">Nenhum log encontrado</p>
                  <p className="text-sm text-slate-500">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const Icon = actionIcons[log.action]
                  const date = new Date(log.timestamp)
                  const formattedDate = date.toLocaleString("pt-BR")

                  return (
                    <Card
                      key={log.id}
                      className="p-4 hover:shadow-md transition-all duration-200 border-l-4"
                      style={{
                        borderLeftColor:
                          log.level === "success"
                            ? "#00A859"
                            : log.level === "error"
                              ? "#ef4444"
                              : log.level === "warning"
                                ? "#FDB913"
                                : "#3b82f6",
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`p-3 rounded-lg ${
                              log.level === "success"
                                ? "bg-petrobras-green-light"
                                : log.level === "error"
                                  ? "bg-red-100"
                                  : log.level === "warning"
                                    ? "bg-petrobras-yellow-light"
                                    : "bg-blue-100"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                log.level === "success"
                                  ? "text-petrobras-green-dark"
                                  : log.level === "error"
                                    ? "text-red-600"
                                    : log.level === "warning"
                                      ? "text-amber-700"
                                      : "text-blue-600"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={levelColors[log.level]} variant="outline">
                                  {actionLabels[log.action]}
                                </Badge>
                                <span className="text-xs text-slate-500">{formattedDate}</span>
                              </div>
                              <p className="text-sm font-medium text-slate-900 leading-relaxed">
                                {log.details.description}
                              </p>
                              {log.details.targetName && (
                                <p className="text-sm text-slate-600 mt-1">
                                  <span className="font-medium">Arquivo:</span> {log.details.targetName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-6 text-xs text-slate-600">
                            <div>
                              <span className="font-medium">Usuário:</span> {log.user.name}
                            </div>
                            <div>
                              <span className="font-medium">Email:</span> {log.user.email}
                            </div>
                            {log.details.ipAddress && (
                              <div>
                                <span className="font-medium">IP:</span> {log.details.ipAddress}
                              </div>
                            )}
                          </div>

                          {log.details.metadata && Object.keys(log.details.metadata).length > 0 && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs font-medium text-slate-700 mb-2">Metadados:</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                                {Object.entries(log.details.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium capitalize">{key}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
