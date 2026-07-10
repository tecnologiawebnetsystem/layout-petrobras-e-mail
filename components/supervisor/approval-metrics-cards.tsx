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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card
        className={`p-6 relative overflow-hidden card-hover cursor-pointer ${activeFilter === "all" ? "ring-2 ring-primary" : ""}`}
        onClick={() => onSelect("all")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{total}</p>
          <p className="text-sm text-muted-foreground">Total para Analise</p>
        </div>
      </Card>

      <Card
        className={`p-6 relative overflow-hidden card-hover cursor-pointer ${activeFilter === "pending" ? "ring-2 ring-yellow-500" : ""}`}
        onClick={() => onSelect("pending")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{pending}</p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
      </Card>

      <Card
        className={`p-6 relative overflow-hidden card-hover cursor-pointer ${activeFilter === "approved" ? "ring-2 ring-green-500" : ""}`}
        onClick={() => onSelect("approved")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{approved}</p>
          <p className="text-sm text-muted-foreground">Aprovados</p>
        </div>
      </Card>

      <Card
        className={`p-6 relative overflow-hidden card-hover cursor-pointer ${activeFilter === "rejected" ? "ring-2 ring-red-500" : ""}`}
        onClick={() => onSelect("rejected")}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-500 opacity-5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mb-1">{rejected}</p>
          <p className="text-sm text-muted-foreground">Rejeitados</p>
        </div>
      </Card>
    </div>
  )
}
