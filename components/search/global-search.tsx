"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, FileText, User, Calendar, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SearchResult {
  id: string
  type: "file" | "user" | "activity"
  title: string
  subtitle: string
  description?: string
  date: Date
  category?: string
  url: string
}

interface SearchFilters {
  type: "all" | "file" | "user" | "activity"
  dateRange: "all" | "today" | "week" | "month"
  category: string
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    type: "all",
    dateRange: "all",
    category: "all",
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  const mockResults: SearchResult[] = [
    {
      id: "1",
      type: "file",
      title: "Relatorio_Anual_2023.pdf",
      subtitle: "Ana Silva",
      description: "Relatório financeiro consolidado do ano de 2023",
      date: new Date("2024-07-15"),
      category: "Financeiro",
      url: "/download",
    },
    {
      id: "2",
      type: "file",
      title: "Contrato_Servicos.docx",
      subtitle: "Carlos Pereira",
      description: "Contrato de prestação de serviços - Fornecedor XYZ",
      date: new Date("2024-07-12"),
      category: "Contratos",
      url: "/download",
    },
    {
      id: "3",
      type: "activity",
      title: "Upload de arquivo",
      subtitle: "João Silva fez upload de 3 arquivos",
      description: "Documentos enviados para cliente externo",
      date: new Date("2024-07-20"),
      url: "/historico",
    },
    {
      id: "4",
      type: "user",
      title: "Mariana Costa",
      subtitle: "mariana.costa@exemplo.com",
      description: "Gerente de Operações - 42 arquivos enviados",
      date: new Date("2024-07-10"),
      url: "/historico",
    },
  ]

  const performSearch = useCallback(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    setTimeout(() => {
      let filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase()),
      )

      if (filters.type !== "all") {
        filtered = filtered.filter((r) => r.type === filters.type)
      }

      if (filters.category !== "all") {
        filtered = filtered.filter((r) => r.category === filters.category)
      }

      if (filters.dateRange !== "all") {
        const now = new Date()
        const filterDate = new Date()

        if (filters.dateRange === "today") {
          filterDate.setHours(0, 0, 0, 0)
        } else if (filters.dateRange === "week") {
          filterDate.setDate(now.getDate() - 7)
        } else if (filters.dateRange === "month") {
          filterDate.setMonth(now.getMonth() - 1)
        }

        filtered = filtered.filter((r) => new Date(r.date) >= filterDate)
      }

      setResults(filtered)
      setIsSearching(false)
    }, 300)
  }, [query, filters])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false)
    router.push(result.url)
  }

  const clearFilters = () => {
    setFilters({
      type: "all",
      dateRange: "all",
      category: "all",
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "file":
        return FileText
      case "user":
        return User
      case "activity":
        return Calendar
      default:
        return FileText
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "file":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      case "user":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
      case "activity":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-64 justify-start text-muted-foreground bg-transparent"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl p-0 gap-0">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar arquivos, usuários, atividades..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-teal-100 text-[#00A99D] dark:bg-teal-900/30" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {showFilters && (
            <div className="px-4 py-3 border-t border-b bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 flex-wrap">
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value as any })}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="file">Arquivos</SelectItem>
                    <SelectItem value="user">Usuários</SelectItem>
                    <SelectItem value="activity">Atividades</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value as any })}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Qualquer data</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    <SelectItem value="Financeiro">Financeiro</SelectItem>
                    <SelectItem value="Contratos">Contratos</SelectItem>
                    <SelectItem value="Técnico">Técnico</SelectItem>
                  </SelectContent>
                </Select>

                {(filters.type !== "all" || filters.dateRange !== "all" || filters.category !== "all") && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto">
            {query && results.length === 0 && !isSearching && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum resultado encontrado</p>
                <p className="text-xs mt-1">Tente ajustar sua busca ou filtros</p>
              </div>
            )}

            {!query && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Digite para buscar</p>
                <p className="text-xs mt-1">Arquivos, usuários, atividades e muito mais</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="divide-y">
                {results.map((result) => {
                  const Icon = getTypeIcon(result.type)
                  const typeColor = getTypeColor(result.type)

                  return (
                    <div
                      key={result.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${typeColor}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {result.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{result.subtitle}</p>
                            </div>
                            <Badge variant="secondary" className="flex-shrink-0 text-xs">
                              {result.type === "file" && "Arquivo"}
                              {result.type === "user" && "Usuário"}
                              {result.type === "activity" && "Atividade"}
                            </Badge>
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDistanceToNow(result.date, {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                            {result.category && (
                              <Badge variant="outline" className="text-xs px-2 py-0">
                                {result.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-3 border-t bg-gray-50 dark:bg-slate-900/50 text-xs text-muted-foreground flex items-center justify-between">
            <span>Use ↑↓ para navegar, Enter para selecionar</span>
            <span>ESC para fechar</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
