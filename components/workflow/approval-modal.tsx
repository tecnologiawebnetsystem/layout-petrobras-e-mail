"use client"

import { useState } from "react"
import { Check, X, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ApprovalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentName: string
  onApprove: (comments: string) => void
  onReject: (comments: string) => void
  action: "approve" | "reject" | null
}

export function ApprovalModal({ open, onOpenChange, documentName, onApprove, onReject, action }: ApprovalModalProps) {
  const [comments, setComments] = useState("")

  const handleSubmit = () => {
    if (action === "approve") {
      onApprove(comments)
    } else if (action === "reject") {
      onReject(comments)
    }
    setComments("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "approve" ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                Aprovar Documento
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-red-600" />
                Rejeitar Documento
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Documento:</p>
            <p className="font-medium">{documentName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Comentários {action === "reject" && "(obrigatório)"}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                action === "approve"
                  ? "Adicione comentários sobre a aprovação (opcional)"
                  : "Explique o motivo da rejeição"
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[120px]"
              required={action === "reject"}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={action === "reject" && !comments.trim()}
            className={action === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
          >
            {action === "approve" ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Aprovação
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Confirmar Rejeição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
