"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ActivityType } from "@/types/activity"

interface HistoryFiltersProps {
  onFilterChange: (filters: {
    type: ActivityType | "all"
    dateRange: { start: Date | null; end: Date | null }
    search: string
  }) => void
  totalActivities: number
}

export function HistoryFilters({ onFilterChange, totalActivities }: HistoryFiltersProps) {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<ActivityType | "all">("all")

  const handleSearchChange = (value: string) => {
    setSearch(value)
    onFilterChange({
      type,
      dateRange: { start: null, end: null },
      search: value,
    })
  }

  const handleTypeChange = (value: string) => {
    const newType = value as ActivityType | "all"
    setType(newType)
    onFilterChange({
      type: newType,
      dateRange: { start: null, end: null },
      search,
    })
  }

  return (
    <div className="bg-card border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#00A99D]" />
          <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalActivities} {totalActivities === 1 ? "atividade encontrada" : "atividades encontradas"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, usuário ou email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={type} onValueChange={handleTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo de atividade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as atividades</SelectItem>
            <SelectItem value="upload">Upload</SelectItem>
            <SelectItem value="download">Download</SelectItem>
            <SelectItem value="approval">Aprovação</SelectItem>
            <SelectItem value="rejection">Rejeição</SelectItem>
            <SelectItem value="share">Compartilhamento</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="delete">Exclusão</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
