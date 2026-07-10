"use client"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Filter, Search } from "lucide-react"

interface LogFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  actionFilter: string
  onActionFilterChange: (value: string) => void
  dateFilter: string
  onDateFilterChange: (value: string) => void
  /** Nivel ativo, exibido como chip (controlado pelos cards de estatistica). */
  levelFilter: string
  onLevelFilterChange: (value: string) => void
}

/**
 * Filtros da lista de logs: busca textual, filtro de acao, filtro de periodo
 * e chips de filtros ativos. Extraido da pagina de logs.
 */
export function LogFilters({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  dateFilter,
  onDateFilterChange,
  levelFilter,
  onLevelFilterChange,
}: LogFiltersProps) {
  const hasActiveFilters = search || levelFilter !== "all" || actionFilter !== "all" || dateFilter !== "all"

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por descricao, usuario, solicitacao..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-11 h-12"
          />
        </div>
        <Select value={actionFilter} onValueChange={onActionFilterChange}>
          <SelectTrigger className="w-full md:w-[180px] h-12">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Acao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Acoes</SelectItem>
            <SelectItem value="APROVAR">Aprovacoes</SelectItem>
            <SelectItem value="REJEITAR">Rejeicoes</SelectItem>
            <SelectItem value="UPLOAD">Uploads</SelectItem>
            <SelectItem value="DOWNLOAD">Downloads</SelectItem>
            <SelectItem value="LOGIN">Logins</SelectItem>
            <SelectItem value="EMAIL">E-mails</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={onDateFilterChange}>
          <SelectTrigger className="w-full md:w-[180px] h-12">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo Periodo</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Ultimos 7 dias</SelectItem>
            <SelectItem value="month">Ultimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Busca: {search}
              <button onClick={() => onSearchChange("")} className="ml-1 hover:text-destructive">
                x
              </button>
            </Badge>
          )}
          {levelFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Nivel: {levelFilter}
              <button onClick={() => onLevelFilterChange("all")} className="ml-1 hover:text-destructive">
                x
              </button>
            </Badge>
          )}
          {actionFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Acao: {actionFilter}
              <button onClick={() => onActionFilterChange("all")} className="ml-1 hover:text-destructive">
                x
              </button>
            </Badge>
          )}
          {dateFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Periodo: {dateFilter === "today" ? "Hoje" : dateFilter === "week" ? "7 dias" : "30 dias"}
              <button onClick={() => onDateFilterChange("all")} className="ml-1 hover:text-destructive">
                x
              </button>
            </Badge>
          )}
        </div>
      )}
    </>
  )
}
