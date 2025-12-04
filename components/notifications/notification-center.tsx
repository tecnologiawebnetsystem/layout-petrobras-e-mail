"use client"

import { Bell, CheckCheck, Download, Upload, AlertTriangle, FileCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useNotificationStore } from "@/lib/stores/notification-store"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { NotificationType } from "@/types/notification"

const notificationIcons: Record<NotificationType, any> = {
  upload_success: Upload,
  download_complete: Download,
  file_expired: AlertTriangle,
  approval_pending: FileCheck,
  approval_approved: CheckCheck,
  approval_rejected: X,
  security_alert: AlertTriangle,
  new_file: Download,
  file_shared: Upload,
}

const notificationColors: Record<NotificationType, string> = {
  upload_success: "text-green-600 bg-green-100 dark:bg-green-900/30",
  download_complete: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  file_expired: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  approval_pending: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  approval_approved: "text-green-600 bg-green-100 dark:bg-green-900/30",
  approval_rejected: "text-red-600 bg-red-100 dark:bg-red-900/30",
  security_alert: "text-red-600 bg-red-100 dark:bg-red-900/30",
  new_file: "text-[#00A99D] bg-teal-100 dark:bg-teal-900/30",
  file_shared: "text-[#0047BB] bg-blue-100 dark:bg-blue-900/30",
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotificationStore()
  const router = useRouter()

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[500px] overflow-y-auto bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-[#00A99D] hover:text-[#008a82]"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type]
              const colorClass = notificationColors[notification.type]

              return (
                <div
                  key={notification.id}
                  className={`p-4 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                    !notification.read ? "bg-teal-50/30 dark:bg-teal-900/10" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            clearNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        {!notification.read && (
                          <Badge variant="secondary" className="text-xs px-2 py-0 bg-[#00A99D]/10 text-[#00A99D]">
                            Nova
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
