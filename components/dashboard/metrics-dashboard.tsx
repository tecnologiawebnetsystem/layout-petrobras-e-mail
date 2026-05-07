"use client"

import { useState } from "react"
import type { ReactNode } from "react"

import { FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { MetricDetailModal } from "./metric-detail-modal"
import type { FileDetail } from "./metric-detail-modal"

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  iconBg: string
  cardBg: string
  onClick?: () => void
}

function MetricCard({ title, value, icon, iconBg, cardBg, onClick }: MetricCardProps) {
  return (
    <div
      className={`${cardBg} rounded-2xl p-6 flex flex-col gap-4 border border-transparent ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className={`h-14 w-14 rounded-2xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-foreground leading-none mb-1">{value}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{title}</p>
      </div>
    </div>
  )
}

interface MetricsDashboardProps {
  total: number
  pending: number
  approved: number
  rejected: number
  userType: "internal" | "external" | "supervisor"
  files?: FileDetail[]
}

export function MetricsDashboard({ total, pending, approved, rejected, userType, files = [] }: MetricsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<"total" | "pending" | "approved" | "rejected" | null>(null)

  const getFilesForMetric = (status: "total" | "pending" | "approved" | "rejected"): FileDetail[] => {
    if (status === "total") return files
    if (status === "pending") return files.filter((f) => f.status === "pending")
    if (status === "approved") {
      return userType === "external"
        ? files.filter((f) => f.status === "downloaded" || f.status === "approved")
        : files.filter((f) => f.status === "approved")
    }
    if (status === "rejected") return files.filter((f) => f.status === "rejected" || f.status === "expired")
    return []
  }

  const CARD_STYLES = {
    total:    { iconBg: "bg-[#0066CC]",    cardBg: "bg-[#EBF3FB]" },
    pending:  { iconBg: "bg-orange-500",   cardBg: "bg-orange-50"  },
    approved: { iconBg: "bg-green-500",    cardBg: "bg-green-50"   },
    rejected: { iconBg: "bg-red-500",      cardBg: "bg-red-50"     },
  }

  const getMetrics = () => {
    const labels = {
      internal: { total: "Total Enviados",      pending: "Aguardando Aprovação", approved: "Aprovados",  rejected: "Rejeitados" },
      external: { total: "Total Recebidos",     pending: "Pendentes",            approved: "Baixados",   rejected: "Expirados"  },
      supervisor:{ total: "Total para Análise", pending: "Pendentes",            approved: "Aprovados",  rejected: "Rejeitados" },
    }

    const l = labels[userType] ?? labels.internal

    return [
      {
        type: "total" as const,
        title: l.total,
        value: total,
        icon: <FileText className="h-7 w-7 text-white" />,
        ...CARD_STYLES.total,
        onClick: () => setSelectedMetric("total"),
      },
      {
        type: "pending" as const,
        title: l.pending,
        value: pending,
        icon: <Clock className="h-7 w-7 text-white" />,
        ...CARD_STYLES.pending,
        onClick: () => setSelectedMetric("pending"),
      },
      {
        type: "approved" as const,
        title: l.approved,
        value: approved,
        icon: <CheckCircle className="h-7 w-7 text-white" />,
        ...CARD_STYLES.approved,
        onClick: () => setSelectedMetric("approved"),
      },
      {
        type: "rejected" as const,
        title: l.rejected,
        value: rejected,
        icon: <XCircle className="h-7 w-7 text-white" />,
        ...CARD_STYLES.rejected,
        onClick: () => setSelectedMetric("rejected"),
      },
    ]
  }

  const metrics = getMetrics()
  const currentMetric = metrics.find((m) => m.type === selectedMetric)

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {selectedMetric && currentMetric && (
        <MetricDetailModal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          title={currentMetric.title}
          files={getFilesForMetric(selectedMetric)}
          gradient={currentMetric.gradient}
        />
      )}
    </>
  )
}
