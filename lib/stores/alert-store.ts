import { create } from "zustand"

export type AlertType = "success" | "error" | "warning" | "info"

interface AlertData {
  id: string
  type: AlertType
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface AlertStore {
  alerts: AlertData[]
  showAlert: (alert: Omit<AlertData, "id">) => void
  closeAlert: (id: string) => void
  clearAll: () => void
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  showAlert: (alert) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id }],
    }))
  },
  closeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    }))
  },
  clearAll: () => set({ alerts: [] }),
}))

// Helper functions para facilitar o uso
export const showAlert = {
  success: (title: string, message: string) => {
    useAlertStore.getState().showAlert({ type: "success", title, message })
  },
  error: (title: string, message: string) => {
    useAlertStore.getState().showAlert({ type: "error", title, message })
  },
  warning: (title: string, message: string) => {
    useAlertStore.getState().showAlert({ type: "warning", title, message })
  },
  info: (title: string, message: string) => {
    useAlertStore.getState().showAlert({ type: "info", title, message })
  },
  confirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    useAlertStore.getState().showAlert({
      type: "warning",
      title,
      message,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      onConfirm,
      onCancel,
    })
  },
}
