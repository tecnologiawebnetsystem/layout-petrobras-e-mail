"use client"

import { Label } from "@/components/ui/label"
import { Lock, Sparkles } from "lucide-react"

interface ManagerInfo {
  name: string
  email: string
  jobTitle?: string
  department?: string
}

interface ApproverInfoCardProps {
  /** Tipo do usuario logado. Supervisores tem aprovacao automatica. */
  userType?: string
  /** Supervisor direto do remetente, quando identificado no AD. */
  manager?: ManagerInfo
}

/**
 * Bloco informativo sobre quem vai aprovar o compartilhamento.
 * Cobre os tres cenarios que existiam inline na pagina de upload:
 *  - Supervisor: aprovacao automatica
 *  - Remetente com supervisor identificado: card do aprovador
 *  - Remetente sem supervisor: aviso informativo
 */
export function ApproverInfoCard({ userType, manager }: ApproverInfoCardProps) {
  if (userType === "supervisor") {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 space-y-2">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-green-800 dark:text-green-400">Aprovacao automatica</p>
            <p className="text-sm text-green-700 dark:text-green-500 leading-relaxed">
              Como supervisor, este compartilhamento sera aprovado imediatamente e o destinatario recebera acesso aos
              arquivos assim que o envio for concluido.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (manager) {
    return (
      <div className="bg-muted/30 border border-border/50 rounded-xl p-5 space-y-3">
        <Label className="text-base font-medium flex items-center gap-2">
          <Lock className="h-4 w-4 text-secondary" />
          Aprovador
        </Label>
        <div className="bg-background/50 rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{manager.name}</p>
              <p className="text-sm text-muted-foreground">{manager.email}</p>
              {manager.jobTitle && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Cargo:</span> {manager.jobTitle}
                </p>
              )}
              {manager.department && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Departamento:</span> {manager.department}
                </p>
              )}
            </div>
            <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
              Supervisor Direto
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este compartilhamento sera enviado para aprovacao do seu supervisor direto.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5 space-y-2">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-blue-600 font-bold text-sm">i</span>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-blue-800 dark:text-blue-500">Supervisor nao identificado</p>
          <p className="text-sm text-blue-700 dark:text-blue-600 leading-relaxed">
            Nao foi possivel identificar seu supervisor no Active Directory. Voce pode continuar com o compartilhamento,
            mas recomendamos entrar em contato com o RH ou TI para atualizar seu cadastro hierarquico.
          </p>
        </div>
      </div>
    </div>
  )
}
