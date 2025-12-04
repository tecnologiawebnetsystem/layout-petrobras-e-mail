"use client"

import { useState } from "react"
import { AppHeader } from "@/components/shared/app-header"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { User, Lock, Bell, Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { AccessLogs } from "@/components/settings/access-logs"

export default function ConfiguracoesPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AppHeader subtitle="Configurações" />

      <main className="container py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie seu perfil, segurança e preferências</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="access" className="gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Acessos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationSettings />
            </TabsContent>

            <TabsContent value="access" className="space-y-6">
              <AccessLogs />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
