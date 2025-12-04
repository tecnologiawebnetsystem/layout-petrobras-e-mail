"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, AlertTriangle, CheckCircle } from "lucide-react"

interface SecurityVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  requiresPassword: boolean
  onVerified: () => void
}

export function SecurityVerificationModal({
  open,
  onOpenChange,
  documentName,
  requiresPassword,
  onVerified,
}: SecurityVerificationModalProps) {
  const [password, setPassword] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    setVerifying(true)
    setError("")

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock password check (in production, this would be an API call)
    if (requiresPassword && password !== "demo123") {
      setError("Senha incorreta. Tente novamente.")
      setVerifying(false)
      return
    }

    setVerifying(false)
    onVerified()
    onOpenChange(false)
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#00A99D]/10">
              <Shield className="h-6 w-6 text-[#00A99D]" />
            </div>
            <DialogTitle>Verificação de Segurança</DialogTitle>
          </div>
          <DialogDescription>Confirme sua identidade antes de baixar o documento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{documentName}</p>
                <p className="text-xs text-muted-foreground">Documento protegido</p>
              </div>
            </div>
          </div>

          {/* Security Checks */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Identidade verificada</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">IP autorizado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Certificado SSL ativo</span>
            </div>
          </div>

          {/* Password Input */}
          {requiresPassword && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha do Documento</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              Este download será registrado em log de auditoria para fins de segurança.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verifying || (requiresPassword && !password)}
            className="flex-1 bg-[#0047BB] hover:bg-[#003A99]"
          >
            {verifying ? "Verificando..." : "Confirmar Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
