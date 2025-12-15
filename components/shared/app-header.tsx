"use client"

import { LogOut, Moon, Sun, History, Shield, Menu } from "lucide-react"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useThemeStore } from "@/lib/stores/theme-store"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { GlobalSearch } from "@/components/search/global-search"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useState } from "react"

interface AppHeaderProps {
  subtitle?: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  const { user, clearAuth } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isExternalUser = user?.userType === "external"

  const handleLogout = () => {
    clearAuth()
    router.push("/")
    setMobileMenuOpen(false)
  }

  const handleViewHistory = () => {
    router.push("/historico")
    setMobileMenuOpen(false)
  }

  const handleViewWiki = () => {
    router.push("/wiki")
    setMobileMenuOpen(false)
  }

  const handleViewAuditoria = () => {
    router.push("/auditoria")
    setMobileMenuOpen(false)
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <PetrobrasLogo size="sm" showText={false} />
          {subtitle && (
            <>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <span className="text-foreground font-semibold text-sm sm:text-base tracking-tight truncate">
                {subtitle}
              </span>
            </>
          )}
        </div>

        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2">
            {!isExternalUser && <GlobalSearch />}

            {!isExternalUser && <NotificationCenter />}

            {!isExternalUser && (user?.userType === "supervisor" || user?.userType === "internal") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleViewAuditoria}
                    className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300 transform hover:scale-110 active:scale-95"
                    aria-label="Auditoria e Logs"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auditoria e Logs</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDark ? "Modo Claro" : "Modo Escuro"}</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 px-2 h-11 text-foreground hover:bg-accent/10 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[150px]">
                      {user?.name || "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email || ""}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 shadow-xl"
              >
                <DropdownMenuItem
                  onClick={handleViewHistory}
                  className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-100 focus:text-blue-900 dark:focus:text-blue-100 min-h-[44px]"
                >
                  <History className="h-4 w-4" />
                  <span>Histórico de Atividades</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 focus:bg-red-100 dark:focus:bg-red-900/40 hover:text-red-900 dark:hover:text-red-200 focus:text-red-900 dark:focus:text-red-200 min-h-[44px]"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipProvider>

        <TooltipProvider>
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300 min-h-[44px] min-w-[44px]"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300 min-h-[44px] min-w-[44px]"
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <SheetHeader className="p-6 bg-muted border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <SheetTitle className="text-foreground text-base">{user?.name || "Usuário"}</SheetTitle>
                      <SheetDescription className="text-muted-foreground text-sm">{user?.email || ""}</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex flex-col gap-2 p-4">
                  <Button
                    variant="ghost"
                    className="justify-start h-12 text-base hover:bg-accent transition-colors min-h-[44px]"
                    onClick={handleViewHistory}
                  >
                    <History className="h-5 w-5 mr-3" />
                    Histórico de Atividades
                  </Button>

                  {!isExternalUser && (user?.userType === "supervisor" || user?.userType === "internal") && (
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base hover:bg-accent transition-colors min-h-[44px]"
                      onClick={handleViewAuditoria}
                    >
                      <Shield className="h-5 w-5 mr-3" />
                      Auditoria e Logs
                    </Button>
                  )}

                  <div className="h-px bg-border my-2" />

                  <Button
                    variant="ghost"
                    className="justify-start h-12 text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
