"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Clock } from "lucide-react"

interface ExpirationEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentHours: number
  onUpdate: (hours: number) => void
}

export function ExpirationEditorModal({ open, onOpenChange, currentHours, onUpdate }: ExpirationEditorModalProps) {
  const [hours, setHours] = useState(currentHours)

  const handleUpdate = () => {
    onUpdate(hours)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-[#00A99D]" />
            Ajustar Tempo de Validade
          </DialogTitle>
          <DialogDescription>Defina por quantas horas os arquivos ficarão disponíveis após aprovação</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours">Tempo de Validade (horas)</Label>
            <Input
              id="hours"
              type="number"
              min="1"
              max="168"
              value={hours}
              onChange={(e) => setHours(Number.parseInt(e.target.value) || 72)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Mínimo: 1 hora | Máximo: 168 horas (7 dias)</p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tempo atual:</strong> {currentHours} horas
            </p>
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Novo tempo:</strong> {hours} horas
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdate} className="bg-[#00A99D] hover:bg-[#00A99D]/90">
            <Clock className="h-4 w-4 mr-2" />
            Atualizar Validade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
