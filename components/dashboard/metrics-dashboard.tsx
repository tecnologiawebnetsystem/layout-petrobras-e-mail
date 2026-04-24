"use client"

import { useState } from "react"
import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { MetricDetailModal } from "./metric-detail-modal"
import type { FileDetail } from "./metric-detail-modal"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon: ReactNode
  gradient: string
  onClick?: () => void
}

function MetricCard({ title, value, change, icon, gradient, onClick }: MetricCardProps) {
  return (
    <Card className={`p-6 relative overflow-hidden card-hover ${onClick ? "cursor-pointer" : ""}`} onClick={onClick}>
      <div className={`absolute inset-0 ${gradient} opacity-5`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl ${gradient} flex items-center justify-center`}>{icon}</div>
          {change && (
            <div
              className={`flex items-center gap-1 text-sm font-semibold ${
                change.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {change.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(change.value)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </Card>
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

  const getMetrics = () => {
    if (userType === "internal") {
      return [
        {
          type: "total" as const,
          title: "Total Enviados",
          value: total,
          change: { value: 12, isPositive: true },
          icon: <FileText className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
          onClick: () => setSelectedMetric("total"),
        },
        {
          type: "pending" as const,
          title: "Aguardando Aprovação",
          value: pending,
          icon: <Clock className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
          onClick: () => setSelectedMetric("pending"),
        },
        {
          type: "approved" as const,
          title: "Aprovados",
          value: approved,
          change: { value: 8, isPositive: true },
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
          onClick: () => setSelectedMetric("approved"),
        },
        {
          type: "rejected" as const,
          title: "Rejeitados",
          value: rejected,
          icon: <XCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-red-500 to-rose-500",
          onClick: () => setSelectedMetric("rejected"),
        },
      ]
    }

    if (userType === "external") {
      return [
        {
          type: "total" as const,
          title: "Total Recebidos",
          value: total,
          icon: <FileText className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
          onClick: () => setSelectedMetric("total"),
        },
        {
          type: "pending" as const,
          title: "Pendentes",
          value: pending,
          icon: <Clock className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
          onClick: () => setSelectedMetric("pending"),
        },
        {
          type: "approved" as const,
          title: "Baixados",
          value: approved,
          change: { value: 15, isPositive: true },
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
          onClick: () => setSelectedMetric("approved"),
        },
        {
          type: "rejected" as const,
          title: "Expirados",
          value: rejected,
          icon: <XCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-red-500 to-rose-500",
          onClick: () => setSelectedMetric("rejected"),
        },
      ]
    }

    return [
      {
        type: "total" as const,
        title: "Total para Análise",
        value: total,
        icon: <FileText className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
        onClick: () => setSelectedMetric("total"),
      },
      {
        type: "pending" as const,
        title: "Pendentes",
        value: pending,
        icon: <Clock className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
        onClick: () => setSelectedMetric("pending"),
      },
      {
        type: "approved" as const,
        title: "Aprovados",
        value: approved,
        change: { value: 10, isPositive: true },
        icon: <CheckCircle className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
        onClick: () => setSelectedMetric("approved"),
      },
      {
        type: "rejected" as const,
        title: "Rejeitados",
        value: rejected,
        icon: <XCircle className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-red-500 to-rose-500",
        onClick: () => setSelectedMetric("rejected"),
      },
    ]
  }

  const metrics = getMetrics()
  const currentMetric = metrics.find((m) => m.type === selectedMetric)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
