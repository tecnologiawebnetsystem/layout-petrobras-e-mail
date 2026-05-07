"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Hash,
  User,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Inbox,
  Loader2,
} from "lucide-react"

export interface SolicitacaoItem {
  id: string
  numero_solicitacao: string
  email_solicitante: string
  email_usuario_externo: string
  status: string
  created_at: string
  created_by: string | null
}

interface SolicitacaoPickerModalProps {
  open: boolean
  onClose: () => void
  solicitacoes: SolicitacaoItem[]
  loading: boolean
  onSelect: (sol: SolicitacaoItem) => void
  selectedId?: string
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function getInitials(email: string) {
  const name = email.split("@")[0]
  const parts = name.split(/[._-]/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

export function SolicitacaoPickerModal({
  open,
  onClose,
  solicitacoes,
  loading,
  onSelect,
  selectedId,
}: SolicitacaoPickerModalProps) {
  const [search, setSearch] = useState("")
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(selectedId ?? null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return solicitacoes
    return solicitacoes.filter(
      (s) =>
        s.numero_solicitacao.toLowerCase().includes(q) ||
        s.email_usuario_externo.toLowerCase().includes(q) ||
        s.email_solicitante.toLowerCase().includes(q)
    )
  }, [solicitacoes, search])

  const handleConfirm = () => {
    const sol = solicitacoes.find((s) => s.id === pendingId)
    if (sol) {
      onSelect(sol)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl w-full p-0 gap-0 overflow-hidden rounded-2xl border-border bg-card">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center flex-shrink-0">
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground leading-tight">
                Selecionar Solicitação
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Escolha o chamado que origina este compartilhamento
              </DialogDescription>
            </div>
          </div>

          {/* Busca */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por número, e-mail do solicitante ou destinatário..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border rounded-xl h-10 text-sm"
              autoFocus
            />
          </div>
        </DialogHeader>

        {/* Lista de cards */}
        <div className="overflow-y-auto max-h-[420px] px-4 py-4 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#0047BB]" />
              <p className="text-sm text-muted-foreground">Carregando solicitações...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <Inbox className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm">
                {search ? "Nenhuma solicitação encontrada" : "Nenhuma solicitação ativa"}
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs leading-relaxed">
                {search
                  ? "Tente buscar por outro termo."
                  : "Entre em contato com o Suporte para cadastrar uma solicitação vinculada ao seu e-mail."}
              </p>
            </div>
          ) : (
            filtered.map((sol) => {
              const isSelected = pendingId === sol.id
              const isHovered = hoveredId === sol.id

              return (
                <button
                  key={sol.id}
                  type="button"
                  onClick={() => setPendingId(sol.id)}
                  onMouseEnter={() => setHoveredId(sol.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={[
                    "w-full text-left rounded-xl border p-4 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0047BB]",
                    isSelected
                      ? "border-[#0047BB] bg-[#EBF3FB] dark:bg-[#0c1e35] shadow-sm"
                      : isHovered
                      ? "border-border bg-muted/40"
                      : "border-border bg-background",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start gap-3">

                    {/* Avatar inicial */}
                    <div
                      className={[
                        "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-colors",
                        isSelected
                          ? "bg-[#0047BB] text-white"
                          : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {getInitials(sol.email_solicitante)}
                    </div>

                    {/* Conteudo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={[
                            "font-mono font-bold text-base tracking-wide",
                            isSelected ? "text-[#0047BB]" : "text-foreground",
                          ].join(" ")}
                        >
                          {sol.numero_solicitacao}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-2 py-0 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-0 font-medium"
                        >
                          Ativo
                        </Badge>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-[#0047BB] ml-auto flex-shrink-0" />
                        )}
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            <span className="font-medium text-foreground/70">Solicitante:</span>{" "}
                            {sol.email_solicitante}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            <span className="font-medium text-foreground/70">Destinatário:</span>{" "}
                            {sol.email_usuario_externo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/70">Aberto em:</span>{" "}
                            {formatDate(sol.created_at)}
                            {sol.created_by && (
                              <span className="ml-1">por {sol.created_by}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} solicitaç{filtered.length === 1 ? "ão" : "ões"} disponíve{filtered.length === 1 ? "l" : "is"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!pendingId}
              onClick={handleConfirm}
              className="rounded-xl bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:opacity-90 text-white gap-2"
            >
              Confirmar Seleção
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
