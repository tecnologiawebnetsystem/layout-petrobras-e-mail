"use client"
import { useAlertStore } from "@/lib/stores/alert-store"
import { NotificationModal } from "./notification-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function GlobalAlertProvider() {
  const { alerts, closeAlert } = useAlertStore()

  return (
    <>
      {alerts.map((alert) => {
        // Se tem confirmação, usa AlertDialog
        if (alert.onConfirm) {
          return (
            <AlertDialog
              key={alert.id}
              open={true}
              onOpenChange={(open) => {
                if (!open) {
                  alert.onCancel?.()
                  closeAlert(alert.id)
                }
              }}
            >
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="space-y-4">
                  <div
                    className={cn(
                      "flex justify-center p-4 rounded-full w-fit mx-auto",
                      alert.type === "error" && "bg-red-50 dark:bg-red-950/20",
                      alert.type === "warning" && "bg-accent/10 dark:bg-accent/20",
                      alert.type === "info" && "bg-secondary/10 dark:bg-secondary/20",
                    )}
                  >
                    {alert.type === "error" && <XCircle className="h-16 w-16 text-red-500" />}
                    {alert.type === "warning" && <AlertCircle className="h-16 w-16 text-accent" />}
                    {alert.type === "info" && <Info className="h-16 w-16 text-secondary" />}
                  </div>
                  <AlertDialogTitle className="text-center text-2xl font-bold">{alert.title}</AlertDialogTitle>
                  <AlertDialogDescription className="text-center text-base leading-relaxed">
                    {alert.message}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      alert.onCancel?.()
                      closeAlert(alert.id)
                    }}
                  >
                    {alert.cancelText || "Cancelar"}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      alert.onConfirm?.()
                      closeAlert(alert.id)
                    }}
                    className={cn(
                      alert.type === "error" && "bg-red-600 hover:bg-red-700",
                      alert.type === "warning" && "bg-accent hover:bg-accent/90 text-black",
                    )}
                  >
                    {alert.confirmText || "Confirmar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )
        }

        // Caso contrário, usa NotificationModal simples
        return (
          <NotificationModal
            key={alert.id}
            open={true}
            onOpenChange={(open) => {
              if (!open) closeAlert(alert.id)
            }}
            type={alert.type}
            title={alert.title}
            message={alert.message}
          />
        )
      })}
    </>
  )
}
