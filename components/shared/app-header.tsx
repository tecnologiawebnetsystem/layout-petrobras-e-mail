"use client"

import { LogOut, Moon, Sun, User, History, Settings, Book } from "lucide-react"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useThemeStore } from "@/lib/stores/theme-store"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { GlobalSearch } from "@/components/search/global-search"

interface AppHeaderProps {
  subtitle?: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  const { user, clearAuth } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const router = useRouter()

  const handleLogout = () => {
    clearAuth()
    router.push("/")
  }

  const handleViewHistory = () => {
    router.push("/historico")
  }

  const handleViewSettings = () => {
    router.push("/configuracoes")
  }

  const handleViewWiki = () => {
    router.push("/wiki")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <PetrobrasLogo size="sm" />
          {subtitle && (
            <>
              <div className="h-6 w-px bg-border" />
              <span className="text-muted-foreground font-medium">{subtitle}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <GlobalSearch />
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewWiki}
            className="rounded-full"
            title="Central de Conhecimento"
          >
            <Book className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#0047BB] text-white text-sm">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.name || "Usuário"}</span>
                  <span className="text-xs text-muted-foreground">{user?.email || ""}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 shadow-xl"
            >
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:bg-teal-50 dark:focus:bg-teal-900/30 hover:text-[#00A99D] focus:text-[#00A99D]">
                <User className="h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleViewSettings}
                className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:bg-teal-50 dark:focus:bg-teal-900/30 hover:text-[#00A99D] focus:text-[#00A99D]"
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleViewHistory}
                className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 focus:bg-teal-50 dark:focus:bg-teal-900/30 hover:text-[#00A99D] focus:text-[#00A99D]"
              >
                <History className="h-4 w-4" />
                <span>Histórico de Atividades</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:bg-red-50 dark:focus:bg-red-900/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
