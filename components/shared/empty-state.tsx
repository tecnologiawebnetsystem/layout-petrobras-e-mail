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
      title: "Nenhum arquivo disponível",
      description:
        "Não há arquivos para visualizar no momento. Quando novos arquivos forem adicionados, eles aparecerão aqui.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse" />
          <FileX className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-uploads": {
      icon: <Upload className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum envio pendente",
      description: "Ótimas notícias! Não há arquivos aguardando aprovação. Você está em dia com suas atividades.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl animate-pulse" />
          <Upload className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-downloads": {
      icon: <Download className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum arquivo para download",
      description:
        "Você ainda não possui arquivos aprovados. Assim que novos documentos forem compartilhados com você e aprovados pelo supervisor, eles aparecerão aqui para download.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-3xl animate-pulse" />
          <Download className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "no-results": {
      icon: <Search className="w-24 h-24 text-muted-foreground/40" />,
      title: "Nenhum resultado encontrado",
      description:
        "Não encontramos arquivos que correspondam aos seus critérios de busca. Tente ajustar os filtros ou usar termos diferentes.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/5 rounded-full blur-3xl" />
          <Search className="w-full h-full text-muted-foreground/20" />
        </div>
      ),
    },
    "all-approved": {
      icon: <CheckCircle className="w-24 h-24 text-primary/60" />,
      title: "Parabéns! Tudo processado",
      description:
        "Todos os envios foram revisados e processados com sucesso. Continue o excelente trabalho mantendo o fluxo em dia.",
      illustration: (
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl animate-pulse" />
          <CheckCircle className="w-full h-full text-primary/30" />
        </div>
      ),
    },
  }

  const state = states[type]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {state.illustration}
      <h3 className="text-2xl font-bold text-foreground mb-3 text-balance text-center leading-tight">{state.title}</h3>
      <p className="text-muted-foreground text-center text-pretty mb-6 max-w-md text-base leading-relaxed">
        {state.description}
      </p>
      {onAction && actionLabel && (
        <Button
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl min-h-[44px] px-8"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
