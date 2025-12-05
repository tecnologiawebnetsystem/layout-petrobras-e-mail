"use client"

import { FileX, Upload, Download, CheckCircle, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  type: "no-files" | "no-uploads" | "no-downloads" | "no-results" | "all-approved"
  onAction?: () => void
  actionLabel?: string
}

export function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const states = {
    "no-files": {
      icon: <FileX className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum arquivo encontrado",
      description: "Comece enviando seus primeiros documentos para compartilhar com segurança.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A859]/10 to-[#003F7F]/10 rounded-full blur-3xl" />
          <FileX className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-uploads": {
      icon: <Upload className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum envio pendente",
      description: "Não há arquivos aguardando aprovação no momento.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A859]/10 to-[#FDB913]/10 rounded-full blur-3xl animate-pulse" />
          <Upload className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-downloads": {
      icon: <Download className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum download disponível",
      description: "Você ainda não recebeu nenhum arquivo para download.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#003F7F]/10 to-[#00A859]/10 rounded-full blur-3xl" />
          <Download className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-results": {
      icon: <Search className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum resultado encontrado",
      description: "Tente ajustar os filtros ou termos de busca.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/5 rounded-full blur-3xl" />
          <Search className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "all-approved": {
      icon: <CheckCircle className="w-24 h-24 text-[#00A859]/60" />,
      title: "Tudo em ordem!",
      description: "Todos os envios foram processados. Excelente trabalho!",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00A859]/20 to-[#FDB913]/10 rounded-full blur-3xl animate-pulse" />
          <CheckCircle className="w-full h-full text-[#00A859]/30" />
        </div>
      ),
    },
  }

  const state = states[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {state.illustration}
      <h3 className="text-2xl font-bold text-foreground mb-3 text-balance text-center">{state.title}</h3>
      <p className="text-muted-foreground text-center text-pretty mb-6 max-w-md">{state.description}</p>
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-[#00A859] to-[#003F7F] hover:from-[#008A48] hover:to-[#00305D]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
