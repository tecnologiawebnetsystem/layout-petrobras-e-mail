"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RefreshCcw, Search } from "lucide-react"

interface ApprovalFiltersProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  /** Limpa busca e status. */
  onReset: () => void
}

/**
 * Barra de busca + filtro de status + chips de filtro ativo do painel do
 * supervisor. Extraida da pagina do supervisor sem alterar o comportamento.
 */
export function ApprovalFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onReset,
}: ApprovalFiltersProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, remetente, destinatario..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full md:w-[180px] h-12">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={onReset}>
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {(searchQuery || statusFilter !== "all") && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Busca: {searchQuery}
                <button onClick={() => onSearchChange("")} className="ml-1 hover:text-destructive">
                  x
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Status:{" "}
                {statusFilter === "pending" ? "Pendentes" : statusFilter === "approved" ? "Aprovados" : "Rejeitados"}
                <button onClick={() => onStatusChange("all")} className="ml-1 hover:text-destructive">
                  x
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
