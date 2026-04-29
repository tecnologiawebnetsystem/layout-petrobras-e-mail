"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import {
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Timer,
  RefreshCcw,
  User,
  Package,
} from "lucide-react"

interface DownloadFile {
  id: number
  name: string
  size: number
  downloaded: boolean
  downloaded_at: string | null
}

interface MyDownload {
  id: number
  name: string
  description: string | null
  status: string
  sender_name: string
  sender_email: string | null
  expiration_hours: number
  expires_at: string | null
  horas_restantes: number | null
  created_at: string
  approved_at: string | null
  files: DownloadFile[]
  files_count: number
  downloaded_count: number
  all_downloaded: boolean
}

export default function ExternoPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [downloads, setDownloads] = useState<MyDownload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDownloads = async () => {
    try {
      const token = (user as Record<string, unknown>)?.token as string | undefined
      const res = await fetch("/api/shares/my-downloads", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const json = await res.json()
        setDownloads(json?.downloads ?? [])
      }
    } catch {
      setDownloads([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.userType !== "external") {
        router.push("/")
      } else {
        fetchDownloads()
      }
    }, 1200)
    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDownloads()
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ativo":
      case "aprovado":
      case "active":
        return {
          label: "Disponivel",
          className: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          borderColor: "border-l-emerald-500",
        }
      case "pendente":
      case "pending":
        return {
          label: "Aguardando Aprovacao",
          className: "bg-amber-100 text-amber-700 border-amber-200",
          icon: <Clock className="h-3 w-3 mr-1" />,
          borderColor: "border-l-amber-500",
        }
      case "rejeitado":
      case "rejected":
        return {
          label: "Rejeitado",
          className: "bg-red-100 text-red-700 border-red-200",
          icon: <XCircle className="h-3 w-3 mr-1" />,
          borderColor: "border-l-red-500",
        }
      case "expirado":
      case "expired":
        return {
          label: "Expirado",
          className: "bg-slate-100 text-slate-600 border-slate-200",
          icon: <AlertTriangle className="h-3 w-3 mr-1" />,
          borderColor: "border-l-slate-400",
        }
      default:
        return {
          label: status,
          className: "bg-slate-100 text-slate-600 border-slate-200",
          icon: null,
          borderColor: "border-l-slate-400",
        }
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return "—"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const isAvailable = (d: MyDownload) =>
    (d.status === "ativo" || d.status === "aprovado" || d.status === "active") &&
    (d.horas_restantes == null || d.horas_restantes > 0)

  const totalDisponiveis = downloads.filter(isAvailable).length
  const totalBaixados = downloads.filter((d) => d.all_downloaded).length

  if (isLoading) {
    return (
      <FullPageLoader
        message="Carregando seus arquivos..."
        subMessage="Buscando compartilhamentos disponíveis"
      />
    )
  }

  if (!isAuthenticated || user?.userType !== "external") return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Portal do Usuario Externo" />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <BreadcrumbNav
          items={[{ label: "Inicio", href: "/externo" }, { label: "Meus Downloads" }]}
          dashboardLink="/externo"
        />

        {/* Header */}
        <div className="mb-8 mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center shadow-lg">
              <Download className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Meus Downloads</h1>
              <p className="text-muted-foreground">Arquivos compartilhados com voce</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCcw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 border shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#0047BB]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#0047BB]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{downloads.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{totalDisponiveis}</p>
                <p className="text-sm text-muted-foreground">Disponiveis</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/80 border shadow-sm">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#00A99D]/10 flex items-center justify-center">
                <Download className="h-5 w-5 text-[#00A99D]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#00A99D]">{totalBaixados}</p>
                <p className="text-sm text-muted-foreground">Concluidos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de downloads */}
        <div className="space-y-4">
          {downloads.length === 0 ? (
            <Card className="p-12 text-center bg-card/50">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium text-foreground mb-2">Nenhum arquivo disponivel</p>
              <p className="text-muted-foreground">
                Quando um colaborador interno compartilhar arquivos com voce, eles aparecerão aqui.
              </p>
            </Card>
          ) : (
            downloads.map((d) => {
              const sc = getStatusConfig(d.status)
              const available = isAvailable(d)
              return (
                <Card key={d.id} className={`overflow-hidden border-l-4 ${sc.borderColor} transition-all hover:shadow-md`}>
                  <CardContent className="p-5 space-y-4">
                    {/* Header do card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{d.name}</h3>
                          <Badge className={`flex items-center text-xs ${sc.className}`}>
                            {sc.icon}{sc.label}
                          </Badge>
                          {d.all_downloaded && (
                            <Badge className="bg-[#0047BB]/10 text-[#0047BB] border-[#0047BB]/20 text-xs">
                              Concluido
                            </Badge>
                          )}
                        </div>
                        {d.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Informacoes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span>Remetente: <span className="text-foreground">{d.sender_name}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span>{d.downloaded_count}/{d.files_count} arquivo(s) baixado(s)</span>
                      </div>
                      {d.horas_restantes != null && d.horas_restantes > 0 && (
                        <div className="flex items-center gap-2">
                          <Timer className={`h-4 w-4 flex-shrink-0 ${d.horas_restantes < 4 ? "text-red-500" : d.horas_restantes < 12 ? "text-amber-500" : "text-emerald-500"}`} />
                          <span className={`text-sm font-medium ${d.horas_restantes < 4 ? "text-red-600" : d.horas_restantes < 12 ? "text-amber-600" : "text-emerald-600"}`}>
                            {d.horas_restantes}h restantes para expirar
                          </span>
                        </div>
                      )}
                      {d.horas_restantes === 0 && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">Link expirado</span>
                        </div>
                      )}
                    </div>

                    {/* Barra de progresso de expiracao */}
                    {available && d.horas_restantes != null && d.expiration_hours > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tempo restante</span>
                          <span>{d.horas_restantes}h de {d.expiration_hours}h</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${d.horas_restantes < 4 ? "bg-red-500" : d.horas_restantes < 12 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, (d.horas_restantes / d.expiration_hours) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Lista de arquivos */}
                    {d.files.length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arquivos</p>
                        {d.files.map((f) => (
                          <div key={f.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate text-foreground">{f.name}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{formatBytes(f.size)}</span>
                            </div>
                            {f.downloaded ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium flex-shrink-0 ml-2">
                                <CheckCircle2 className="h-3 w-3" />
                                Baixado
                              </span>
                            ) : available ? (
                              <Button size="sm" variant="outline" className="h-7 text-xs ml-2 flex-shrink-0">
                                <Download className="h-3 w-3 mr-1" />
                                Baixar
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">Indisponivel</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
