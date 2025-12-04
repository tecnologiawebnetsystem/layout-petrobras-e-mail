"use client"

import { Monitor, Smartphone, MapPin, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface AccessLog {
  id: string
  device: string
  deviceType: "desktop" | "mobile"
  location: string
  ip: string
  timestamp: Date
  success: boolean
}

export function AccessLogs() {
  const mockLogs: AccessLog[] = [
    {
      id: "1",
      device: "Chrome no Windows",
      deviceType: "desktop",
      location: "Rio de Janeiro, RJ",
      ip: "192.168.1.100",
      timestamp: new Date(),
      success: true,
    },
    {
      id: "2",
      device: "Safari no iPhone",
      deviceType: "mobile",
      location: "São Paulo, SP",
      ip: "192.168.1.101",
      timestamp: new Date(Date.now() - 3600000 * 2),
      success: true,
    },
    {
      id: "3",
      device: "Firefox no Windows",
      deviceType: "desktop",
      location: "Brasília, DF",
      ip: "192.168.1.102",
      timestamp: new Date(Date.now() - 86400000),
      success: false,
    },
    {
      id: "4",
      device: "Chrome no Android",
      deviceType: "mobile",
      location: "Curitiba, PR",
      ip: "192.168.1.103",
      timestamp: new Date(Date.now() - 86400000 * 2),
      success: true,
    },
  ]

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Logs de Acesso</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Histórico de acessos à sua conta nos últimos 30 dias
          </p>
        </div>

        <div className="space-y-4">
          {mockLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 rounded-lg border bg-white dark:bg-slate-900">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  log.success ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                {log.deviceType === "desktop" ? (
                  <Monitor className={`h-6 w-6 ${log.success ? "text-green-600" : "text-red-600"}`} />
                ) : (
                  <Smartphone className={`h-6 w-6 ${log.success ? "text-green-600" : "text-red-600"}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{log.device}</h4>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{log.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs">IP: {log.ip}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(log.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={log.success ? "default" : "destructive"}
                    className={log.success ? "bg-green-600" : ""}
                  >
                    {log.success ? "Sucesso" : "Falhou"}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
