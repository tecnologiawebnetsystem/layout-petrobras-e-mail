"use client"

import { useEffect, useState } from "react"
import {
  ShieldCheck,
  ClipboardCheck,
  Send,
  Download,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react"
import { getUserTypeLabel, type FrontendUserType } from "@/lib/auth/cav4-config"

// ---------------------------------------------------------------------------
// Configuracao visual por perfil
// ---------------------------------------------------------------------------

interface RoleVisual {
  icon: LucideIcon
  description: string
  /** Cor primaria do perfil (classe Tailwind de bg). */
  iconBg: string
  /** Cor primaria do perfil em hex — usada no anel SVG animado. */
  ringColor: string
  /** Classe de texto colorido para o badge do perfil. */
  badgeClass: string
  /** Itens de progresso especificos do perfil. */
  steps: string[]
}

const ROLE_VISUALS: Record<FrontendUserType, RoleVisual> = {
  admin: {
    icon: ShieldCheck,
    description: "Auditoria, logs, relatorios e gestao completa do sistema.",
    iconBg: "bg-[#003f7f]",
    ringColor: "#003f7f",
    badgeClass: "bg-[#003f7f]/10 text-[#003f7f] dark:bg-[#003f7f]/30 dark:text-blue-300",
    steps: [
      "Validando credenciais",
      "Carregando permissoes de auditoria",
      "Preparando painel do auditor",
    ],
  },
  supervisor: {
    icon: ClipboardCheck,
    description: "Aprovacao de compartilhamentos, upload e visualizacao de logs.",
    iconBg: "bg-emerald-600",
    ringColor: "#059669",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    steps: [
      "Validando credenciais",
      "Carregando compartilhamentos pendentes",
      "Preparando painel do gestor",
    ],
  },
  internal: {
    icon: Send,
    description: "Envio seguro de arquivos para destinatarios externos.",
    iconBg: "bg-[#00a859]",
    ringColor: "#00a859",
    badgeClass: "bg-[#00a859]/10 text-[#00a859] dark:bg-[#00a859]/20 dark:text-green-400",
    steps: [
      "Validando credenciais",
      "Verificando gestor direto",
      "Preparando area de envio",
    ],
  },
  external: {
    icon: Download,
    description: "Download seguro dos arquivos compartilhados com voce.",
    iconBg: "bg-amber-500",
    ringColor: "#f59e0b",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    steps: [
      "Validando credenciais",
      "Localizando arquivos disponiveis",
      "Preparando area de download",
    ],
  },
}

// ---------------------------------------------------------------------------
// Subcomponente: anel SVG rotativo
// ---------------------------------------------------------------------------

function SpinRing({ color, size = 72 }: { color: string; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-spin"
      style={{ animationDuration: "2.4s" }}
      aria-hidden="true"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeOpacity={0.15}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray={`${circ * 0.25} ${circ * 0.75}`}
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Subcomponente: linha de passo com animacao sequencial
// ---------------------------------------------------------------------------

function StepLine({ label, state }: { label: string; state: "done" | "active" | "idle" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-4 h-4 flex items-center justify-center">
        {state === "done" && (
          <CheckCircle2 className="w-4 h-4 text-[#00a859]" aria-hidden="true" />
        )}
        {state === "active" && (
          <span className="block w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin text-muted-foreground" />
        )}
        {state === "idle" && (
          <span className="block w-2 h-2 rounded-full bg-border" />
        )}
      </div>
      <span
        className={
          state === "idle"
            ? "text-xs text-muted-foreground/50"
            : state === "active"
              ? "text-xs font-medium text-foreground"
              : "text-xs text-muted-foreground line-through"
        }
      >
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface RoleRedirectScreenProps {
  /**
   * Perfil de destino. Quando null exibe o estado inicial de verificacao
   * (ainda nao sabemos para qual area o usuario vai).
   */
  targetType: FrontendUserType | null
}

/**
 * Tela elegante de carregamento/redirecionamento exibida apos o login.
 * Diferencia visualmente cada perfil (Remetente, Gestor, Auditor, Externo)
 * com cor, icone, descricao e passos de progresso proprios.
 */
export function RoleRedirectScreen({ targetType }: RoleRedirectScreenProps) {
  const visual = targetType ? ROLE_VISUALS[targetType] : null
  const Icon = visual?.icon ?? ShieldCheck

  // Avanca os passos sequencialmente para dar sensacao de progresso real.
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!visual) return
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 900)
    const t2 = setTimeout(() => setStep(2), 2000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [targetType]) // eslint-disable-line react-hooks/exhaustive-deps

  const ringColor = visual?.ringColor ?? "#00a859"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
      role="status"
      aria-live="polite"
      aria-label="Carregando perfil de acesso"
    >
      {/* Fundo sutil — dois pontos de luz nas extremidades */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-80 w-80 rounded-full blur-3xl opacity-30"
          style={{ background: ringColor }}
        />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-20 bg-[#003f7f]" />
      </div>

      {/* Card central */}
      <div className="relative z-10 w-full max-w-[340px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">

        {/* Faixa superior colorida (4px) */}
        <div
          className="h-1 w-full"
          style={{ background: `linear-gradient(90deg, ${ringColor} 0%, #fdb913 100%)` }}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-6 px-8 py-8">

          {/* Logo */}
          <img
            src="/images/petrobras-full-logo.png"
            alt="Petrobras"
            className="h-7 w-auto opacity-90"
            width={112}
            height={28}
          />

          {/* Icone com anel */}
          <div className="relative flex items-center justify-center" aria-hidden="true">
            <div className="absolute">
              <SpinRing color={ringColor} size={80} />
            </div>
            <div
              className={`h-14 w-14 rounded-xl ${visual?.iconBg ?? "bg-[#00a859]"} flex items-center justify-center shadow-lg`}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Perfil ou estado inicial */}
          {targetType && visual ? (
            <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-400">
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest ${visual.badgeClass}`}
              >
                {getUserTypeLabel(targetType)}
              </span>
              <p className="text-sm text-muted-foreground text-pretty leading-relaxed">
                {visual.description}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-base font-semibold text-foreground">Autenticando</p>
              <p className="text-sm text-muted-foreground">Validando suas credenciais corporativas</p>
            </div>
          )}

          {/* Passos de progresso */}
          {visual && (
            <div className="w-full space-y-2.5 border-t border-border pt-5">
              {visual.steps.map((label, i) => (
                <StepLine
                  key={i}
                  label={label}
                  state={i < step ? "done" : i === step ? "active" : "idle"}
                />
              ))}
            </div>
          )}

          {/* Barra de progresso inferior */}
          {!visual && (
            <div className="w-full h-1 rounded-full overflow-hidden bg-muted">
              <div className="progress-petrobras h-full w-full rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
