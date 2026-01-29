"use client"

import type React from "react"

import { useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ToastProps {
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ type, title, message, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  }

  const colors = {
    success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
    warning: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    info: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
  }

  return (
    <div
      className={`
        ${colors[type]} 
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        animate-in slide-in-from-right-full duration-300
        max-w-md w-full
      `}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}
