"use client"

import { useState } from "react"
import type React from "react"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, FileText, Clock, CheckCircle, XCircle } from "lucide-react"
import { MetricDetailModal } from "./metric-detail-modal"

interface MetricCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    isPositive: boolean
  }
  icon: React.ReactNode
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
}

export function MetricsDashboard({ total, pending, approved, rejected, userType }: MetricsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  const getMockFiles = (status: string) => {
    const mockFiles = {
      total: [
        {
          id: "1",
          name: "Relatorio_Anual_2024.pdf",
          size: "2.5 MB",
          date: "15/01/2025",
          recipient: "cliente@gmail.com",
          status: "approved",
          category: "Financeiro",
        },
        {
          id: "2",
          name: "Contrato_Servicos.docx",
          size: "128 KB",
          date: "14/01/2025",
          recipient: "fornecedor@empresa.com",
          status: "pending",
          category: "Contratos",
        },
        {
          id: "3",
          name: "Apresentacao_Projeto.pptx",
          size: "15.2 MB",
          date: "13/01/2025",
          recipient: "parceiro@corp.com",
          status: "approved",
          category: "Técnico",
        },
      ],
      pending: [
        {
          id: "2",
          name: "Contrato_Servicos.docx",
          size: "128 KB",
          date: "14/01/2025",
          recipient: "fornecedor@empresa.com",
          status: "pending",
          category: "Contratos",
        },
        {
          id: "4",
          name: "Planilha_Custos.xlsx",
          size: "780 KB",
          date: "12/01/2025",
          recipient: "contabilidade@external.com",
          status: "pending",
          category: "Financeiro",
        },
      ],
      approved: [
        {
          id: "1",
          name: "Relatorio_Anual_2024.pdf",
          size: "2.5 MB",
          date: "15/01/2025",
          recipient: "cliente@gmail.com",
          status: "approved",
          category: "Financeiro",
        },
        {
          id: "3",
          name: "Apresentacao_Projeto.pptx",
          size: "15.2 MB",
          date: "13/01/2025",
          recipient: "parceiro@corp.com",
          status: "approved",
          category: "Técnico",
        },
      ],
      rejected: [
        {
          id: "5",
          name: "Documento_Invalido.pdf",
          size: "1.2 MB",
          date: "10/01/2025",
          recipient: "teste@email.com",
          status: "rejected",
          category: "Outros",
        },
      ],
    }

    return mockFiles[status as keyof typeof mockFiles] || []
  }

  const getMetrics = () => {
    if (userType === "internal") {
      return [
        {
          title: "Total Enviados",
          value: total,
          change: { value: 12, isPositive: true },
          icon: <FileText className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
          onClick: () => setSelectedMetric("total"),
        },
        {
          title: "Aguardando Aprovação",
          value: pending,
          icon: <Clock className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
          onClick: () => setSelectedMetric("pending"),
        },
        {
          title: "Aprovados",
          value: approved,
          change: { value: 8, isPositive: true },
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
          onClick: () => setSelectedMetric("approved"),
        },
        {
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
          title: "Total Recebidos",
          value: total,
          icon: <FileText className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
          onClick: () => setSelectedMetric("total"),
        },
        {
          title: "Pendentes",
          value: pending,
          icon: <Clock className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
          onClick: () => setSelectedMetric("pending"),
        },
        {
          title: "Baixados",
          value: approved,
          change: { value: 15, isPositive: true },
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
          onClick: () => setSelectedMetric("approved"),
        },
        {
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
        title: "Total para Análise",
        value: total,
        icon: <FileText className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-[#00A99D] to-[#0047BB]",
        onClick: () => setSelectedMetric("total"),
      },
      {
        title: "Pendentes",
        value: pending,
        icon: <Clock className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
        onClick: () => setSelectedMetric("pending"),
      },
      {
        title: "Aprovados",
        value: approved,
        change: { value: 10, isPositive: true },
        icon: <CheckCircle className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-green-500 to-emerald-500",
        onClick: () => setSelectedMetric("approved"),
      },
      {
        title: "Rejeitados",
        value: rejected,
        icon: <XCircle className="h-6 w-6 text-white" />,
        gradient: "bg-gradient-to-br from-red-500 to-rose-500",
        onClick: () => setSelectedMetric("rejected"),
      },
    ]
  }

  const metrics = getMetrics()
  const currentMetric = metrics.find((m) => m.title.toLowerCase().includes(selectedMetric || ""))

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
          files={getMockFiles(selectedMetric)}
          gradient={currentMetric.gradient}
        />
      )}
    </>
  )
}
