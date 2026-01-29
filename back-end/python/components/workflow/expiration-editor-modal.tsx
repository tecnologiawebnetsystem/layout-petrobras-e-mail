"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, AlertCircle } from "lucide-react"

interface ExpirationEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentHours: number
  onUpdate: (newHours: number, reason: string) => void
}

export function ExpirationEditorModal({ open, onOpenChange, currentHours, onUpdate }: ExpirationEditorModalProps) {
  const [newHours, setNewHours] = useState<number>(currentHours)
  const [reason, setReason] = useState("")

  const handleUpdate = () => {
    if (!reason.trim()) {
      return
    }
    onUpdate(newHours, reason)
    onOpenChange(false)
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#FDB913]" />
            Alterar Tempo de Validade
          </DialogTitle>
          <DialogDescription>
            Ajuste o tempo que os arquivos ficarão disponíveis para download após a aprovação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="current-time">Tempo Atual</Label>
            <div className="px-4 py-3 bg-muted rounded-lg">
              <p className="font-semibold text-foreground">{currentHours} horas</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-time">Novo Tempo de Validade</Label>
            <Select value={newHours.toString()} onValueChange={(v) => setNewHours(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 horas (1 dia)</SelectItem>
                <SelectItem value="48">48 horas (2 dias)</SelectItem>
                <SelectItem value="72">72 horas (3 dias)</SelectItem>
                <SelectItem value="120">120 horas (5 dias)</SelectItem>
                <SelectItem value="168">168 horas (7 dias)</SelectItem>
                <SelectItem value="336">336 horas (14 dias)</SelectItem>
                <SelectItem value="720">720 horas (30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Alteração (obrigatório)</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo da alteração do tempo de validade..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">Atenção:</p>
              <p>
                Esta alteração será registrada no log do sistema e o remetente será notificado automaticamente sobre a
                mudança.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!reason.trim() || newHours === currentHours}
            className="bg-[#FDB913] hover:bg-[#FDB913]/90 text-black"
          >
            <Clock className="h-4 w-4 mr-2" />
            Atualizar Tempo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
