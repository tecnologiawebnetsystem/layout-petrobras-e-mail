"use client"

import { ShieldCheck, ClipboardCheck, Send, Download, type LucideIcon } from "lucide-react"
import { getUserTypeLabel, type FrontendUserType } from "@/lib/auth/cav4-config"

interface RoleVisual {
  icon: LucideIcon
  description: string
  /** Classe de gradiente do circulo do icone. */
  gradient: string
  /** Cor de destaque (badge do perfil e anel animado). */
  accent: string
}

const ROLE_VISUALS: Record<FrontendUserType, RoleVisual> = {
  admin: {
    icon: ShieldCheck,
    description: "Acesso completo a auditoria, logs e gestao do sistema.",
    gradient: "from-primary to-secondary",
    accent: "text-primary",
  },
  supervisor: {
    icon: ClipboardCheck,
    description: "Aprovacao de compartilhamentos e envio de arquivos.",
    gradient: "from-emerald-500 to-teal-600",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
  internal: {
    icon: Send,
    description: "Envio seguro de arquivos para destinatarios externos.",
    gradient: "from-blue-500 to-indigo-600",
    accent: "text-blue-600 dark:text-blue-400",
  },
  external: {
    icon: Download,
    description: "Download seguro dos arquivos compartilhados com voce.",
    gradient: "from-amber-500 to-orange-600",
    accent: "text-amber-600 dark:text-amber-400",
  },
}

interface RoleRedirectScreenProps {
  /**
   * Perfil de destino. Quando null, exibe apenas o estado de verificacao
   * (ainda nao sabemos para qual area o usuario vai).
   */
  targetType: FrontendUserType | null
}

/**
 * Tela cheia exibida no login/redirecionamento. Mostra de forma elegante e
 * profissional o status ("Autenticando" / "Carregando") e, quando conhecido,
 * o PERFIL de destino do usuario (Administrador, Supervisor, Remetente ou
 * Usuario Externo).
 *
 * Usada tanto no AuthGate (retorno com sessao ativa) quanto no callback do
 * CAv4 (login novo), garantindo a mesma experiencia nos dois fluxos.
 */
export function RoleRedirectScreen({ targetType }: RoleRedirectScreenProps) {
  const visual = targetType ? ROLE_VISUALS[targetType] : null
  const Icon = visual?.icon

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/40 p-6"
      role="status"
      aria-live="polite"
    >
      {/* Brilho sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-2xl p-10 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
          <img
            src="/images/petrobras-full-logo.png"
            alt="Petrobras - Logo oficial"
            className="h-9 w-auto mb-8"
            width={140}
            height={36}
          />

          {/* Icone com aneis animados */}
          <div className="relative flex items-center justify-center mb-6">
            <span
              className={`absolute inline-flex h-24 w-24 rounded-full ${
                visual ? "bg-current opacity-10" : "bg-primary opacity-10"
              } ${visual?.accent ?? ""} animate-ping`}
              style={{ animationDuration: "2s" }}
              aria-hidden="true"
            />
            <span
              className={`absolute inline-flex h-24 w-24 rounded-full border-2 border-dashed ${
                visual?.accent ?? "text-primary"
              } opacity-30 animate-spin`}
              style={{ animationDuration: "8s", borderColor: "currentColor" }}
              aria-hidden="true"
            />
            <div
              className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br ${
                visual?.gradient ?? "from-primary to-secondary"
              } flex items-center justify-center shadow-xl`}
            >
              {Icon ? (
                <Icon className="h-9 w-9 text-white" aria-hidden="true" />
              ) : (
                <ShieldCheck className="h-9 w-9 text-white animate-pulse" aria-hidden="true" />
              )}
            </div>
          </div>

          {targetType && visual ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Seu perfil</p>
                <h1 className="text-2xl font-bold text-foreground text-balance">{getUserTypeLabel(targetType)}</h1>
              </div>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{visual.description}</p>
            </div>
          ) : (
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-foreground">Autenticando</h1>
              <p className="text-sm text-muted-foreground">Validando suas credenciais corporativas</p>
            </div>
          )}

          {/* Barra de progresso animada */}
          <div className="mt-8 w-full space-y-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="progress-petrobras h-full w-full rounded-full" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {targetType ? "Preparando seu ambiente de trabalho..." : "Carregando..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
