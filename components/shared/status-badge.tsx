"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, XCircle, Ban } from "lucide-react"

type ShareStatus = "pending" | "approved" | "rejected" | "cancelled" | string

interface StatusBadgeProps {
  status: ShareStatus
}

/**
 * Badge de status de um compartilhamento (pendente / aprovado / rejeitado /
 * cancelado). Extraido do getStatusBadge que estava inline na pagina do
 * supervisor para poder ser reutilizado em qualquer lista/detalhe.
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      )
    case "approved":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      )
    case "cancelled":
      return (
        <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted">
          <Ban className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
