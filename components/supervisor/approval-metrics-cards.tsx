"use client"

import type { ReactNode } from "react"

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

interface MetricCardProps {
  title: string
  value: number
  icon: ReactNode
  gradient: string
  active: boolean
  ring: string
  onClick: () => void
}

/**
 * Card individual com o MESMO visual dos cards do remetente
 * (components/dashboard/metrics-dashboard.tsx): fundo do card claro, gradiente
 * apenas como leve textura (opacity-5), icone colorido e numero legivel.
 */
function MetricCard({ title, value, icon, gradient, active, ring, onClick }: MetricCardProps) {
  return (
    <Card
      className={`p-6 relative overflow-hidden card-hover cursor-pointer ${active ? ring : ""}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 ${gradient} opacity-5`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl ${gradient} flex items-center justify-center`}>{icon}</div>
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
  )
}

/**
 * Grade de 4 cards de metricas do painel do supervisor (Total, Pendentes,
 * Aprovados, Rejeitados). Cada card e clicavel e aplica o filtro de status.
 * O visual e identico ao dashboard de metricas do remetente.
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
      <MetricCard
        title="Total para Analise"
        value={total}
        icon={<FileText className="h-6 w-6 text-white" />}
        gradient="bg-gradient-to-br from-primary to-secondary"
        active={activeFilter === "all"}
        ring="ring-2 ring-primary"
        onClick={() => onSelect("all")}
      />
      <MetricCard
        title="Pendentes"
        value={pending}
        icon={<Clock className="h-6 w-6 text-white" />}
        gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
        active={activeFilter === "pending"}
        ring="ring-2 ring-yellow-500"
        onClick={() => onSelect("pending")}
      />
      <MetricCard
        title="Aprovados"
        value={approved}
        icon={<CheckCircle className="h-6 w-6 text-white" />}
        gradient="bg-gradient-to-br from-green-500 to-emerald-500"
        active={activeFilter === "approved"}
        ring="ring-2 ring-green-500"
        onClick={() => onSelect("approved")}
      />
      <MetricCard
        title="Rejeitados"
        value={rejected}
        icon={<XCircle className="h-6 w-6 text-white" />}
        gradient="bg-gradient-to-br from-red-500 to-rose-500"
        active={activeFilter === "rejected"}
        ring="ring-2 ring-red-500"
        onClick={() => onSelect("rejected")}
      />
    </div>
  )
}
