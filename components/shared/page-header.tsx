"use client"

import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface PageHeaderProps {
  /** Icone exibido dentro do quadrado com gradiente. */
  icon: LucideIcon
  /** Titulo principal da pagina. */
  title: string
  /** Texto de apoio abaixo do titulo. */
  subtitle?: string
  /** Acoes opcionais alinhadas a direita (ex.: botoes). */
  actions?: ReactNode
  /**
   * Inverte o gradiente do icone (from-secondary to-primary).
   * Usado na pagina de logs para manter a identidade visual original.
   */
  reverseGradient?: boolean
}

/**
 * Cabecalho padrao das paginas internas: quadrado com gradiente + icone,
 * titulo e subtitulo, com area opcional de acoes a direita.
 *
 * Mantem exatamente o mesmo visual que estava inline nas paginas de
 * upload, supervisor e logs, apenas centralizado para reuso.
 */
export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  actions,
  reverseGradient = false,
}: PageHeaderProps) {
  return (
    <div className="mb-8 mt-4">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-muted/30 p-6 shadow-sm">
        {/* Faixa de destaque lateral */}
        <div
          className={`absolute inset-y-0 left-0 w-1.5 ${
            reverseGradient ? "bg-gradient-to-b from-secondary to-primary" : "bg-gradient-to-b from-primary to-secondary"
          }`}
          aria-hidden="true"
        />
        {/* Brilho decorativo sutil */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 ${
                reverseGradient
                  ? "bg-gradient-to-br from-secondary to-primary"
                  : "bg-gradient-to-br from-primary to-secondary"
              }`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground text-balance">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
