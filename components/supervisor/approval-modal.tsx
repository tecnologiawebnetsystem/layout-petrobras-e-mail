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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle } from "lucide-react"

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "approve" ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Aprovar Documento
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-600" />
                Rejeitar Documento
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "approve"
              ? "Adicione comentários sobre a aprovação (opcional)"
              : "Explique o motivo da rejeição"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-semibold text-foreground">{documentName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários {action === "reject" && "*"}</Label>
            <Textarea
              id="comments"
              placeholder={
                action === "approve" ? "Adicione observações sobre a aprovação..." : "Explique o motivo da rejeição..."
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
            variant={action === "approve" ? "default" : "destructive"}
            disabled={action === "reject" && !comments.trim()}
            className={action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {action === "approve" ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Aprovação
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar Rejeição
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
