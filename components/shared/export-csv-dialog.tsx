"use client"

import { useMemo, useState } from "react"
import {
  Check,
  Columns3,
  Download,
  FileSpreadsheet,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { downloadFile } from "@/lib/services/download-csv"

export interface CsvColumn {
  key: string
  label: string
}

export type CsvFilterField =
  | { type: "text"; key: string; label: string; placeholder?: string }
  | { type: "date"; key: string; label: string }
  | {
      type: "select"
      key: string
      label: string
      options: { value: string; label: string }[]
    }

interface ExportCsvDialogProps {
  /** Endpoint do proxy, ex.: "/admin/export/users" */
  endpoint: string
  /** Prefixo do nome do arquivo, ex.: "usuarios" */
  filenamePrefix: string
  /** Colunas disponíveis (todas selecionadas por padrão) */
  columns: CsvColumn[]
  /** Campos de filtro opcionais */
  filters?: CsvFilterField[]
  /** Valores iniciais dos filtros (ex.: herdados da tela) */
  initialFilters?: Record<string, string>
  /** Texto do botão que abre o diálogo */
  triggerLabel?: string
  /** Título do diálogo */
  title?: string
}

/** Valor "todos"/vazio que não deve ser enviado como filtro. */
const EMPTY_FILTER_VALUES = new Set(["", "all"])

/** Retorna true quando o valor do filtro é considerado "ativo" (será enviado). */
function isActiveFilterValue(value: string | undefined): boolean {
  return !EMPTY_FILTER_VALUES.has((value ?? "").trim())
}

export function ExportCsvDialog({
  endpoint,
  filenamePrefix,
  columns,
  filters = [],
  initialFilters = {},
  triggerLabel = "Exportar CSV",
  title = "Exportar relatório em CSV",
}: ExportCsvDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [columnQuery, setColumnQuery] = useState("")

  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    () => new Set(columns.map((c) => c.key)),
  )
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    () => ({ ...initialFilters }),
  )

  const allSelected = selectedColumns.size === columns.length
  const noneSelected = selectedColumns.size === 0

  const selectedList = useMemo(
    () => columns.filter((c) => selectedColumns.has(c.key)).map((c) => c.key),
    [columns, selectedColumns],
  )

  const visibleColumns = useMemo(() => {
    const query = columnQuery.trim().toLowerCase()
    if (!query) return columns
    return columns.filter((c) => c.label.toLowerCase().includes(query))
  }, [columns, columnQuery])

  const activeFilterCount = useMemo(
    () => filters.filter((f) => isActiveFilterValue(filterValues[f.key])).length,
    [filters, filterValues],
  )

  const date = new Date().toISOString().slice(0, 10)
  const filename = `${filenamePrefix}-${date}.csv`

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedColumns((prev) =>
      prev.size === columns.length ? new Set() : new Set(columns.map((c) => c.key)),
    )
  }

  const setFilter = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilterValues(
      filters.reduce<Record<string, string>>((acc, f) => {
        acc[f.key] = f.type === "select" ? "all" : ""
        return acc
      }, {}),
    )
  }

  const handleExport = async () => {
    if (noneSelected) {
      toast({
        variant: "destructive",
        title: "Selecione ao menos uma coluna",
        description: "Escolha quais informações deseja exportar.",
      })
      return
    }

    setExporting(true)
    try {
      const params = new URLSearchParams()
      // Envia colunas apenas se não estiverem todas selecionadas (todas = default do backend)
      if (!allSelected) params.set("columns", selectedList.join(","))

      for (const filter of filters) {
        const value = (filterValues[filter.key] ?? "").trim()
        if (!EMPTY_FILTER_VALUES.has(value)) params.set(filter.key, value)
      }

      const query = params.toString()

      await downloadFile(`${endpoint}${query ? `?${query}` : ""}`, filename)

      toast({
        title: "Exportação concluída",
        description: `O arquivo ${filename} foi gerado com sucesso.`,
      })
      setOpen(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha ao exportar",
        description:
          error instanceof Error ? error.message : "Não foi possível gerar o CSV.",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="space-y-3 border-b border-border p-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="text-sm">
                Escolha as informações e os filtros e clique em exportar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6">
          {filters.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  Filtros
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {activeFilterCount} ativo{activeFilterCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </h4>
                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={clearFilters}
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filters.map((filter) => (
                  <div key={filter.key} className="space-y-1.5">
                    <Label htmlFor={`filter-${filter.key}`} className="text-xs">
                      {filter.label}
                    </Label>
                    {filter.type === "select" ? (
                      <Select
                        value={filterValues[filter.key] ?? "all"}
                        onValueChange={(v) => setFilter(filter.key, v)}
                      >
                        <SelectTrigger id={`filter-${filter.key}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`filter-${filter.key}`}
                        type={filter.type === "date" ? "date" : "text"}
                        placeholder={
                          filter.type === "text" ? filter.placeholder : undefined
                        }
                        value={filterValues[filter.key] ?? ""}
                        onChange={(e) => setFilter(filter.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {filters.length > 0 && <Separator />}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Columns3 className="h-4 w-4 text-muted-foreground" />
                Colunas
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {selectedColumns.size}/{columns.length}
                </Badge>
              </h4>
              <label
                htmlFor="col-select-all"
                className="flex cursor-pointer select-none items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <Checkbox
                  id="col-select-all"
                  checked={allSelected ? true : noneSelected ? false : "indeterminate"}
                  onCheckedChange={toggleAll}
                />
                {allSelected ? "Limpar seleção" : "Selecionar todas"}
              </label>
            </div>

            {columns.length > 6 && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={columnQuery}
                  onChange={(e) => setColumnQuery(e.target.value)}
                  placeholder="Buscar coluna..."
                  className="h-9 pl-8"
                  aria-label="Buscar coluna"
                />
              </div>
            )}

            <ScrollArea className="max-h-56 rounded-md">
              <div className="grid grid-cols-1 gap-2 pr-3 sm:grid-cols-2">
                {visibleColumns.length === 0 ? (
                  <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
                    Nenhuma coluna encontrada para “{columnQuery}”.
                  </p>
                ) : (
                  visibleColumns.map((column) => {
                    const checked = selectedColumns.has(column.key)
                    return (
                      <label
                        key={column.key}
                        htmlFor={`col-${column.key}`}
                        className={`flex items-center gap-2 rounded-md border p-2.5 text-sm transition-colors cursor-pointer ${
                          checked
                            ? "border-primary/40 bg-primary/5"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          id={`col-${column.key}`}
                          checked={checked}
                          onCheckedChange={() => toggleColumn(column.key)}
                        />
                        <span className="truncate">{column.label}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </section>
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {noneSelected ? (
                "Selecione ao menos uma coluna"
              ) : (
                <>
                  <span className="font-medium text-foreground">{filename}</span>
                  {" · "}
                  {selectedColumns.size} coluna{selectedColumns.size > 1 ? "s" : ""}
                </>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={exporting}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || noneSelected}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
