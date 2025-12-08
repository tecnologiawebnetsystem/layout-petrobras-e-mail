"use client"

import { LogOut, Moon, Sun, User, History, Book, Map } from "lucide-react"
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

  const handleViewWiki = () => {
    router.push("/wiki")
  }

  const handleViewRoadmap = () => {
    router.push("/roadmap")
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
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-[#00A859] to-[#003F7F] backdrop-blur supports-[backdrop-filter]:bg-gradient-to-r supports-[backdrop-filter]:from-[#00A859]/95 supports-[backdrop-filter]:to-[#003F7F]/95 shadow-md">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <PetrobrasLogo size="sm" showText={false} />
          {subtitle && (
            <>
              <div className="h-6 w-px bg-white/30" />
              <span className="text-white font-semibold text-base tracking-tight drop-shadow-md">{subtitle}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <GlobalSearch />
          <NotificationCenter />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewWiki}
            className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
            title="Central de Conhecimento"
          >
            <Book className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleViewRoadmap}
            className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
            title="Roadmap de Evolução"
          >
            <Map className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 h-10 text-white hover:bg-white/20 transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-white/50">
                  <AvatarFallback className="bg-white text-[#003F7F] text-xs font-bold">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-semibold text-white drop-shadow-md truncate max-w-[150px]">
                    {user?.name || "Usuário"}
                  </span>
                  <span className="text-xs text-white/90 drop-shadow-sm truncate max-w-[150px]">
                    {user?.email || ""}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 shadow-xl"
            >
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-100 focus:text-blue-900 dark:focus:text-blue-100">
                <User className="h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleViewHistory}
                className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-100 focus:text-blue-900 dark:focus:text-blue-100"
              >
                <History className="h-4 w-4" />
                <span>Histórico de Atividades</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 focus:bg-red-100 dark:focus:bg-red-900/40 hover:text-red-900 dark:hover:text-red-200 focus:text-red-900 dark:focus:text-red-200"
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
