"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Columns3,
  Database,
  Download,
  FileCheck2,
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

/** Fases da geração do arquivo, exibidas na tela de loading dedicada. */
type ExportPhase = "querying" | "building" | "downloading" | "done"

const EXPORT_STEPS: {
  id: ExportPhase
  label: string
  icon: typeof Database
}[] = [
  { id: "querying", label: "Consultando os dados", icon: Database },
  { id: "building", label: "Gerando o arquivo CSV", icon: FileSpreadsheet },
  { id: "downloading", label: "Preparando o download", icon: Download },
]

const PHASE_ORDER: ExportPhase[] = ["querying", "building", "downloading", "done"]

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
  const [phase, setPhase] = useState<ExportPhase>("querying")
  const [columnQuery, setColumnQuery] = useState("")
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Limpa timers pendentes ao desmontar para evitar updates em componente fora da tela.
  useEffect(() => {
    return () => {
      phaseTimers.current.forEach(clearTimeout)
    }
  }, [])

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

    // Reinicia timers/fase de execuções anteriores.
    phaseTimers.current.forEach(clearTimeout)
    phaseTimers.current = []
    setPhase("querying")
    setExporting(true)

    // Avança as fases visuais de forma progressiva enquanto a requisição roda,
    // dando um feedback rico da geração do arquivo (não é o progresso real do
    // download, mas garante uma percepção clara de cada etapa).
    phaseTimers.current.push(setTimeout(() => setPhase("building"), 550))
    phaseTimers.current.push(setTimeout(() => setPhase("downloading"), 1200))

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

      phaseTimers.current.forEach(clearTimeout)
      phaseTimers.current = []
      setPhase("done")
      // Pequena pausa para o usuário ver a etapa de conclusão antes de fechar.
      await new Promise((resolve) => setTimeout(resolve, 650))

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
      phaseTimers.current.forEach(clearTimeout)
      phaseTimers.current = []
      setExporting(false)
      setPhase("querying")
    }
  }

  const currentPhaseIndex = PHASE_ORDER.indexOf(phase)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Evita fechar acidentalmente enquanto o arquivo está sendo gerado.
        if (exporting) return
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg p-0 overflow-hidden gap-0"
        onInteractOutside={(e) => exporting && e.preventDefault()}
        onEscapeKeyDown={(e) => exporting && e.preventDefault()}
      >
        {exporting ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <DialogHeader className="sr-only">
              <DialogTitle>Gerando arquivo CSV</DialogTitle>
              <DialogDescription>
                Aguarde enquanto o relatório é gerado.
              </DialogDescription>
            </DialogHeader>

            {/* Ícone central animado — visual dedicado à geração do arquivo */}
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/10" />
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
              <span
                className="absolute inset-1.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
                style={{ animationDuration: "1.1s" }}
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                {phase === "done" ? (
                  <FileCheck2 className="h-7 w-7" />
                ) : (
                  <FileSpreadsheet className="h-7 w-7" />
                )}
              </span>
            </div>

            <p className="text-base font-semibold text-foreground">
              {phase === "done" ? "Arquivo pronto!" : "Gerando seu relatório"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {phase === "done"
                ? `${filename} foi gerado com sucesso.`
                : "Isso pode levar alguns segundos, não feche esta janela."}
            </p>

            {/* Barra de progresso por fases */}
            <div className="mt-6 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{
                  width: `${((currentPhaseIndex + 1) / PHASE_ORDER.length) * 100}%`,
                }}
              />
            </div>

            {/* Lista das etapas */}
            <ul className="mt-6 w-full max-w-xs space-y-2.5 text-left">
              {EXPORT_STEPS.map((step, index) => {
                const done = currentPhaseIndex > index || phase === "done"
                const active = currentPhaseIndex === index && phase !== "done"
                const StepIcon = step.icon
                return (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : active ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span
                      className={
                        done || active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <>
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
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={noneSelected}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
