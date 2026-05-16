"use client"

import { FileCheck, FileDown, FileClock, FileX } from "lucide-react"
import { Card } from "@/components/ui/card"

interface DownloadStatsProps {
  stats: {
    totalReceived: number
    downloaded: number
    pending: number
    expired: number
  }
}

export function DownloadStats({ stats }: DownloadStatsProps) {
  const statItems = [
    {
      label: "Total Recebidos",
      value: stats.totalReceived,
      icon: FileCheck,
      color: "text-[#00A99D]",
      bgColor: "bg-[#00A99D]/10",
    },
    {
      label: "Baixados",
      value: stats.downloaded,
      icon: FileDown,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      label: "Pendentes",
      value: stats.pending,
      icon: FileClock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    {
      label: "Expirados",
      value: stats.expired,
      icon: FileX,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${item.bgColor}`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
