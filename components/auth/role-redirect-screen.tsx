"use client"

import { Loader2, ShieldCheck, ClipboardCheck, Send, Download, type LucideIcon } from "lucide-react"
import { getUserTypeLabel, type FrontendUserType } from "@/lib/auth/cav4-config"

interface RoleVisual {
  icon: LucideIcon
  description: string
  /** Classe de gradiente do circulo do icone. */
  gradient: string
}

const ROLE_VISUALS: Record<FrontendUserType, RoleVisual> = {
  admin: {
    icon: ShieldCheck,
    description: "Acesso completo: auditoria, logs e gestao do sistema.",
    gradient: "from-primary to-secondary",
  },
  supervisor: {
    icon: ClipboardCheck,
    description: "Aprovacao de compartilhamentos e envio de arquivos.",
    gradient: "from-emerald-500 to-teal-500",
  },
  internal: {
    icon: Send,
    description: "Envio seguro de arquivos para destinatarios externos.",
    gradient: "from-blue-500 to-indigo-500",
  },
  external: {
    icon: Download,
    description: "Download seguro dos arquivos compartilhados com voce.",
    gradient: "from-amber-500 to-orange-500",
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
 * Tela cheia exibida no login/redirecionamento, mostrando de forma clara e
 * visual para qual PERFIL o usuario esta sendo direcionado (Administrador,
 * Supervisor, Remetente ou Usuario Externo).
 *
 * Usada tanto no AuthGate (retorno com sessao ativa) quanto no callback do
 * CAv4 (login novo), garantindo a mesma experiencia nos dois fluxos.
 */
export function RoleRedirectScreen({ targetType }: RoleRedirectScreenProps) {
  const visual = targetType ? ROLE_VISUALS[targetType] : null
  const Icon = visual?.icon

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-6"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-8 text-center max-w-md">
        <img
          src="/images/petrobras-full-logo.png"
          alt="Petrobras - Logo oficial"
          className="h-10 w-auto"
          width={150}
          height={40}
        />

        {targetType && visual && Icon ? (
          <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
            <div
              className={`h-20 w-20 rounded-3xl bg-gradient-to-br ${visual.gradient} flex items-center justify-center shadow-xl`}
            >
              <Icon className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Voce esta sendo direcionado para</p>
              <h1 className="text-3xl font-bold text-foreground text-balance">
                {getUserTypeLabel(targetType)}
              </h1>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{visual.description}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Validando seu acesso</h1>
            <p className="text-sm text-muted-foreground">Confirmando suas credenciais corporativas...</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm font-medium">
            {targetType ? "Preparando seu ambiente..." : "Aguarde um instante"}
          </span>
        </div>
      </div>
    </div>
  )
}
