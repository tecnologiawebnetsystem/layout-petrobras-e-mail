"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"

interface ExpirationSelectProps {
  /** Valor atual em horas. */
  value: number
  /** Callback ao alterar o valor (em horas). */
  onChange: (hours: number) => void
  disabled?: boolean
}

const OPTIONS = [
  { value: "24", label: "24 horas (1 dia)" },
  { value: "48", label: "48 horas (2 dias)" },
  { value: "72", label: "72 horas (3 dias)" },
  { value: "96", label: "96 horas (4 dias)" },
  { value: "120", label: "120 horas (5 dias)" },
  { value: "144", label: "144 horas (6 dias)" },
  { value: "168", label: "168 horas (7 dias)" },
]

/**
 * Seletor de tempo de disponibilidade (expiracao) de um compartilhamento.
 * Extraido da pagina de upload; reutilizavel em qualquer formulario de envio.
 */
export function ExpirationSelect({ value, onChange, disabled }: ExpirationSelectProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="expiration" className="text-base font-medium flex items-center gap-2">
        <Clock className="h-4 w-4 text-accent" />
        Tempo de Disponibilidade
      </Label>
      <Select
        value={value.toString()}
        onValueChange={(v) => onChange(Number(v))}
        disabled={disabled}
        aria-label="Tempo de disponibilidade dos arquivos"
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Os arquivos ficarao disponiveis para download por {value} horas apos a aprovacao. Maximo: 168 horas (7 dias).
      </p>
    </div>
  )
}
