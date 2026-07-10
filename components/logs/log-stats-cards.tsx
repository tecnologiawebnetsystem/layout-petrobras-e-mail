"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, History, XCircle } from "lucide-react"

interface LogStatsCardsProps {
  total: number
  success: number
  error: number
  warning: number
  info: number
  /** Filtro de nivel ativo (destaca o card). */
  activeFilter: string
  /** Chamado ao clicar em um card, com o nivel correspondente. */
  onSelect: (level: string) => void
}

/**
 * Cards de estatisticas dos logs (Total, Sucesso, Erro, Aviso, Info).
 * Cada card e clicavel e aplica o filtro de nivel. Extraido da pagina de logs.
 */
export function LogStatsCards({ total, success, error, warning, info, activeFilter, onSelect }: LogStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-secondary ${activeFilter === "all" ? "ring-2 ring-secondary" : ""}`}
        onClick={() => onSelect("all")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-md shrink-0">
              <History className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground leading-none mb-1">{total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-emerald-500 ${activeFilter === "success" ? "ring-2 ring-emerald-500" : ""}`}
        onClick={() => onSelect("success")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-1">{success}</p>
              <p className="text-xs text-muted-foreground">Sucesso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-red-500 ${activeFilter === "error" ? "ring-2 ring-red-500" : ""}`}
        onClick={() => onSelect("error")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md shrink-0">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 leading-none mb-1">{error}</p>
              <p className="text-xs text-muted-foreground">Erro</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-amber-500 ${activeFilter === "warning" ? "ring-2 ring-amber-500" : ""}`}
        onClick={() => onSelect("warning")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shrink-0">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-none mb-1">{warning}</p>
              <p className="text-xs text-muted-foreground">Aviso</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-l-4 border-l-blue-500 ${activeFilter === "info" ? "ring-2 ring-blue-500" : ""}`}
        onClick={() => onSelect("info")}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none mb-1">{info}</p>
              <p className="text-xs text-muted-foreground">Info</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
