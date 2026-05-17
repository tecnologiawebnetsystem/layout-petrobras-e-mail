"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { SuccessAnimation } from "./success-animation"

interface NotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
}

export function NotificationModal({ open, onOpenChange, type, title, message }: NotificationModalProps) {
  useEffect(() => {
    if (open && type === "success") {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [open, type, onOpenChange])

  const icons = {
    success: <CheckCircle2 className="h-16 w-16 text-primary" />,
    error: <XCircle className="h-16 w-16 text-red-500" />,
    warning: <AlertCircle className="h-16 w-16 text-accent" />,
    info: <Info className="h-16 w-16 text-secondary" />,
  }

  const backgrounds = {
    success: "bg-primary/10 dark:bg-primary/20",
    error: "bg-red-50 dark:bg-red-950/20",
    warning: "bg-accent/10 dark:bg-accent/20",
    info: "bg-secondary/10 dark:bg-secondary/20",
  }

  return (
    <>
      {type === "success" && <SuccessAnimation show={open} />}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-4">
            <div
              className={cn(
                "flex justify-center p-4 rounded-full w-fit mx-auto animate-in zoom-in-50 duration-300",
                backgrounds[type],
              )}
            >
              {icons[type]}
            </div>
            <DialogTitle className="text-center text-2xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed">{message}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
