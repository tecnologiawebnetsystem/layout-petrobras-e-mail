"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock } from "lucide-react"

interface RecipientFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * Campo de e-mail do destinatario externo.
 * Extraido da pagina de upload para reuso nos formularios de envio.
 */
export function RecipientField({ value, onChange, disabled }: RecipientFieldProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor="recipient" className="text-base font-medium flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        Destinatario Externo
      </Label>
      <Input
        id="recipient"
        type="email"
        placeholder="cliente@empresa.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        aria-label="E-mail do destinatario"
        disabled={disabled}
      />
      <p className="text-sm text-muted-foreground leading-relaxed">
        O destinatario recebera um email com link seguro para download
      </p>
    </div>
  )
}
