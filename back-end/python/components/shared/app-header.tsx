"use client"

import { LogOut, Moon, Sun, Menu, FolderOpen, Building2, MapPin, User } from "lucide-react"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useThemeStore } from "@/lib/stores/theme-store"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GlobalSearch } from "@/components/search/global-search"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useState } from "react"
import { useMsal } from "@azure/msal-react"

interface AppHeaderProps {
  subtitle?: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  const { user, clearAuth } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { instance } = useMsal()

  const isExternalUser = user?.userType === "external"

  const handleLogout = async () => {
    try {
      console.log(" Fazendo logout do sistema")
      clearAuth()

      const accounts = instance.getAllAccounts()
      if (accounts.length > 0) {
        console.log(" Fazendo logout do Entra ID/MSAL")
        await instance.logoutPopup({
          account: accounts[0],
          postLogoutRedirectUri: window.location.origin,
        })
      }

      router.push("/")
      setMobileMenuOpen(false)
    } catch (error) {
      console.error(" Erro ao fazer logout:", error)
      router.push("/")
      setMobileMenuOpen(false)
    }
  }

  const handleViewCompartilhamentos = () => {
    router.push("/compartilhamentos")
    setMobileMenuOpen(false)
  }

  const handleViewWiki = () => {
    router.push("/wiki")
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
      <div className="container flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
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

        <div className="hidden md:flex flex-1 justify-center max-w-md mx-auto">
          {!isExternalUser && <GlobalSearch />}
        </div>

        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {!isExternalUser && user?.userType === "supervisor" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleViewWiki}
                    className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300"
                    aria-label="Wiki"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Wiki</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-all duration-300"
                  aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDark ? "Modo Claro" : "Modo Escuro"}</p>
              </TooltipContent>
            </Tooltip>

            <div className="h-8 w-px bg-border mx-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-3 px-3 h-12 text-foreground hover:bg-accent/10 transition-all duration-300 rounded-full"
                >
                  <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                    {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                      {user?.name || "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {user?.jobTitle || user?.email || ""}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 shadow-xl"
              >
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                      {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{user?.name || "Usuário"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email || ""}</p>
                      {user?.jobTitle && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{user.jobTitle}</p>
                        </div>
                      )}
                      {user?.department && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">{user.department}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>

                {user?.manager && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
                    <DropdownMenuLabel className="py-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Supervisor</p>
                          <p className="text-sm font-semibold text-foreground">{user.manager.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.manager.email}</p>
                          {user.manager.jobTitle && (
                            <p className="text-xs text-muted-foreground mt-0.5">{user.manager.jobTitle}</p>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </>
                )}

                <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />

                {!isExternalUser && (user?.userType === "internal" || user?.userType === "supervisor") && (
                  <>
                    <DropdownMenuItem
                      onClick={handleViewCompartilhamentos}
                      className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-100 focus:text-blue-900 dark:focus:text-blue-100 min-h-[44px]"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>Meus Compartilhamentos</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
                  </>
                )}
                {!isExternalUser && user?.userType === "supervisor" && (
                  <>
                    <DropdownMenuItem
                      onClick={handleViewWiki}
                      className="flex items-center gap-2 cursor-pointer text-gray-800 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:bg-blue-50 dark:focus:bg-blue-900/20 hover:text-blue-900 dark:hover:text-blue-100 focus:text-blue-900 dark:focus:text-blue-100 min-h-[44px]"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>Wiki</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-300 dark:bg-slate-600" />
                  </>
                )}
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
                      {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <SheetTitle className="text-foreground text-base">{user?.name || "Usuário"}</SheetTitle>
                      <SheetDescription className="text-muted-foreground text-sm truncate">
                        {user?.email || ""}
                      </SheetDescription>
                      {user?.jobTitle && <p className="text-xs text-muted-foreground mt-1">{user.jobTitle}</p>}
                    </div>
                  </div>

                  {user?.manager && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground">Supervisor</p>
                          <p className="text-sm font-semibold text-foreground">{user.manager.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.manager.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </SheetHeader>

                <div className="flex flex-col gap-2 p-4">
                  {!isExternalUser && (user?.userType === "internal" || user?.userType === "supervisor") && (
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base hover:bg-accent transition-colors min-h-[44px]"
                      onClick={handleViewCompartilhamentos}
                    >
                      <FolderOpen className="h-5 w-5 mr-3" />
                      Meus Compartilhamentos
                    </Button>
                  )}

                  {!isExternalUser && user?.userType === "supervisor" && (
                    <Button
                      variant="ghost"
                      className="justify-start h-12 text-base hover:bg-accent transition-colors min-h-[44px]"
                      onClick={handleViewWiki}
                    >
                      <FolderOpen className="h-5 w-5 mr-3" />
                      Wiki
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
