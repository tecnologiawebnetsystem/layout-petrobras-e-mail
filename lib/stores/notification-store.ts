import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Notification } from "@/types/notification"
import { apiFetch } from "@/lib/services/api-fetch"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean

  // API actions
  loadNotifications: () => Promise<void>

  // Local + API actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

/**
 * Mapeia tipo de notificacao da API Python para o tipo do frontend.
 */
function mapNotificationType(apiType: string): Notification["type"] {
  const typeMap: Record<string, Notification["type"]> = {
    approval: "approval_pending",
    success: "approval_approved",
    error: "approval_rejected",
    info: "new_file",
    warning: "security_alert",
    upload: "upload_success",
    download: "download_complete",
    expiration: "file_expired",
    share: "file_shared",
  }
  return typeMap[apiType] || "new_file"
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,

      /**
       * Carrega notificacoes do backend Python.
       * GET /api/notifications
       */
      loadNotifications: async () => {
        set({ isLoading: true })
        try {
          const data = await apiFetch<{
            notifications: Array<{
              id: number
              type: string
              priority: string
              title: string
              message: string
              read: boolean
              timestamp: string
              action_label?: string
              action_url?: string
              metadata?: string
            }>
            unread_count: number
          }>("/notifications?limit=50")

          const notifications: Notification[] = data.notifications.map((n) => ({
            id: String(n.id),
            type: mapNotificationType(n.type),
            priority: (n.priority || "medium") as Notification["priority"],
            title: n.title,
            message: n.message,
            read: n.read,
            timestamp: new Date(n.timestamp),
            actionUrl: n.action_url,
            metadata: n.metadata ? JSON.parse(n.metadata) : undefined,
          }))

          set({
            notifications,
            unreadCount: data.unread_count,
            isLoading: false,
          })
        } catch (err) {
          console.error("[v0] Erro ao carregar notificacoes:", err)
          set({ isLoading: false })
          // Mantem dados locais no caso de erro
        }
      },

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false,
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }))

        // Chama API real
        apiFetch(`/notifications/${id}/read`, { method: "PATCH" }).catch(
          (err) => {
            console.error("[v0] Erro ao marcar notificacao como lida:", err)
          }
        )
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))

        // Chama API real
        apiFetch("/notifications/read-all", { method: "PUT" }).catch((err) => {
          console.error("[v0] Erro ao marcar todas como lidas:", err)
        })
      },

      clearNotification: (id) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount:
              notification && !notification.read
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
          }
        })
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        })
      },

      getUnreadCount: () => get().unreadCount,
    }),
    {
      name: "petrobras-notifications-storage",
    },
  ),
)
