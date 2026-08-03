"use client"

import { useMemo, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
      const date = new Date().toISOString().slice(0, 10)
      const filename = `${filenamePrefix}-${date}.csv`

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Escolha as informações e os filtros e clique em exportar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {filters.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Filtros</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Colunas ({selectedColumns.size}/{columns.length})
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={toggleAll}
              >
                {allSelected ? "Limpar seleção" : "Selecionar todas"}
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {columns.map((column) => (
                <label
                  key={column.key}
                  htmlFor={`col-${column.key}`}
                  className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    id={`col-${column.key}`}
                    checked={selectedColumns.has(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  />
                  <span className="truncate">{column.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={exporting}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
