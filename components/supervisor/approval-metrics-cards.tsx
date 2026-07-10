"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle, Clock, FileText, XCircle } from "lucide-react"

type StatusFilter = "all" | "pending" | "approved" | "rejected"

interface ApprovalMetricsCardsProps {
  total: number
  pending: number
  approved: number
  rejected: number
  /** Filtro atualmente selecionado (destaca o card correspondente). */
  activeFilter: string
  /** Chamado ao clicar em um card, com o filtro correspondente. */
  onSelect: (filter: StatusFilter) => void
}

/**
 * Grade de 4 cards de metricas do painel do supervisor (Total, Pendentes,
 * Aprovados, Rejeitados). Cada card e clicavel e aplica o filtro de status.
 * Extraido da pagina do supervisor mantendo o mesmo visual.
 */
export function ApprovalMetricsCards({
  total,
  pending,
  approved,
  rejected,
  activeFilter,
  onSelect,
}: ApprovalMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card
        className={`p-5 relative overflow-hidden card-hover cursor-pointer border-l-4 border-l-primary ${activeFilter === "all" ? "ring-2 ring-primary" : ""}`}
        onClick={() => onSelect("all")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-[0.07]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shrink-0">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground leading-none mb-1.5">{total}</p>
            <p className="text-xs text-muted-foreground">Total para Analise</p>
          </div>
        </div>
      </Card>

      <Card
        className={`p-5 relative overflow-hidden card-hover cursor-pointer border-l-4 border-l-amber-500 ${activeFilter === "pending" ? "ring-2 ring-amber-500" : ""}`}
        onClick={() => onSelect("pending")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-[0.07]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shrink-0">
            <Clock className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 leading-none mb-1.5">{pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>
      </Card>

      <Card
        className={`p-5 relative overflow-hidden card-hover cursor-pointer border-l-4 border-l-emerald-500 ${activeFilter === "approved" ? "ring-2 ring-emerald-500" : ""}`}
        onClick={() => onSelect("approved")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 opacity-[0.07]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md shrink-0">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none mb-1.5">{approved}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
        </div>
      </Card>

      <Card
        className={`p-5 relative overflow-hidden card-hover cursor-pointer border-l-4 border-l-red-500 ${activeFilter === "rejected" ? "ring-2 ring-red-500" : ""}`}
        onClick={() => onSelect("rejected")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-500 opacity-[0.07]" />
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-md shrink-0">
            <XCircle className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 leading-none mb-1.5">{rejected}</p>
            <p className="text-xs text-muted-foreground">Rejeitados</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
