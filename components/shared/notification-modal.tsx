"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

export function NotificationModal({ open, onOpenChange, type, title, message }: NotificationModalProps) {
  const icons = {
    success: <CheckCircle2 className="h-12 w-12 text-green-500" />,
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertCircle className="h-12 w-12 text-yellow-500" />,
    info: <Info className="h-12 w-12 text-blue-500" />,
  }

  const backgrounds = {
    success: "bg-green-50 dark:bg-green-950/20",
    error: "bg-red-50 dark:bg-red-950/20",
    warning: "bg-yellow-50 dark:bg-yellow-950/20",
    info: "bg-blue-50 dark:bg-blue-950/20",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-4">
          <div className={cn("flex justify-center p-3 rounded-full w-fit mx-auto", backgrounds[type])}>
            {icons[type]}
          </div>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base">{message}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
