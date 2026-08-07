"use client"

import { LogOut, Moon, Sun, Menu, Building2, MapPin, User, Briefcase, ShieldAlert, Eye } from "lucide-react"
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
import { useRouter, usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useState } from "react"
import { getNavItems } from "@/lib/auth/nav-items"
import { cn } from "@/lib/utils"

// ─── Tema por perfil ──────────────────────────────────────────────────────────

type ProfileTheme = {
  /** Label exibido no badge de perfil */
  label: string
  /** Ícone do perfil */
  Icon: React.ElementType
  /** Gradiente do cabeçalho do dropdown/sheet */
  headerGradient: string
  /** Cor do badge de perfil */
  badgeBg: string
  badgeText: string
  /** Cor do avatar ring */
  avatarRing: string
  /** Fundo do item ativo */
  activeBg: string
  /** Texto do item ativo */
  activeText: string
  /** Hover dos itens */
  hoverBg: string
  hoverText: string
  /** Cor do ponto indicador de ativo */
  dotColor: string
  /** Cor do separador decorativo */
  dividerColor: string
}

function getProfileTheme(userType: string | undefined): ProfileTheme {
  switch (userType) {
    case "supervisor":
      return {
        label: "Gestor",
        Icon: ShieldAlert,
        headerGradient: "from-amber-600 via-amber-500 to-yellow-400",
        badgeBg: "bg-amber-100 dark:bg-amber-900/40",
        badgeText: "text-amber-800 dark:text-amber-300",
        avatarRing: "ring-amber-400/60",
        activeBg: "bg-amber-50 dark:bg-amber-900/25",
        activeText: "text-amber-800 dark:text-amber-300",
        hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-900/20 focus:bg-amber-50 dark:focus:bg-amber-900/20",
        hoverText: "hover:text-amber-900 dark:hover:text-amber-200 focus:text-amber-900 dark:focus:text-amber-200",
        dotColor: "bg-amber-500",
        dividerColor: "border-amber-200/60 dark:border-amber-800/40",
      }
    case "admin":
      return {
        label: "Monitor",
        Icon: Eye,
        headerGradient: "from-violet-700 via-violet-500 to-indigo-400",
        badgeBg: "bg-violet-100 dark:bg-violet-900/40",
        badgeText: "text-violet-800 dark:text-violet-300",
        avatarRing: "ring-violet-400/60",
        activeBg: "bg-violet-50 dark:bg-violet-900/25",
        activeText: "text-violet-800 dark:text-violet-300",
        hoverBg: "hover:bg-violet-50 dark:hover:bg-violet-900/20 focus:bg-violet-50 dark:focus:bg-violet-900/20",
        hoverText: "hover:text-violet-900 dark:hover:text-violet-200 focus:text-violet-900 dark:focus:text-violet-200",
        dotColor: "bg-violet-500",
        dividerColor: "border-violet-200/60 dark:border-violet-800/40",
      }
    default:
      // internal / Remetente
      return {
        label: "Remetente",
        Icon: Briefcase,
        headerGradient: "from-sky-700 via-sky-500 to-cyan-400",
        badgeBg: "bg-sky-100 dark:bg-sky-900/40",
        badgeText: "text-sky-800 dark:text-sky-300",
        avatarRing: "ring-sky-400/60",
        activeBg: "bg-sky-50 dark:bg-sky-900/25",
        activeText: "text-sky-800 dark:text-sky-300",
        hoverBg: "hover:bg-sky-50 dark:hover:bg-sky-900/20 focus:bg-sky-50 dark:focus:bg-sky-900/20",
        hoverText: "hover:text-sky-900 dark:hover:text-sky-200 focus:text-sky-900 dark:focus:text-sky-200",
        dotColor: "bg-sky-500",
        dividerColor: "border-sky-200/60 dark:border-sky-800/40",
      }
  }
}

interface AppHeaderProps {
  subtitle?: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Lista de modulos disponiveis calculada a partir das permissoes do usuario (CAv4).
  // Atualiza automaticamente quando o store muda (ex: apos alterar permissoes).
  const navItems = getNavItems(user)

  // Tema visual baseado no perfil do usuário autenticado.
  const theme = getProfileTheme(user?.userType)
  const ProfileIcon = theme.Icon

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
      setMobileMenuOpen(false)
    } catch (error) {
      router.push("/")
      setMobileMenuOpen(false)
    }
  }

  const handleNavigate = (route: string) => {
    router.push(route)
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

        {/* <div className="hidden md:flex flex-1 justify-center max-w-md mx-auto">
          {!isExternalUser && <GlobalSearch />}
        </div> */}

        <TooltipProvider>
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
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
                  <Avatar className={cn("h-9 w-9 ring-2", theme.avatarRing)}>
                    {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                    <AvatarFallback className={cn("text-xs font-bold", theme.badgeBg, theme.badgeText)}>
                      {user?.name ? getInitials(user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                      {user?.name || "Usuário"}
                    </span>
                    <span className={cn("text-xs font-medium truncate max-w-[160px]", theme.badgeText)}>
                      {theme.label}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-72 overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl rounded-xl p-0"
              >
                {/* Cabeçalho com gradiente de perfil */}
                <div className={cn("bg-gradient-to-br p-4", theme.headerGradient)}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-md">
                      {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                      <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-tight">{user?.name || "Usuário"}</p>
                      <p className="text-xs text-white/75 truncate mt-0.5">{user?.email || ""}</p>
                      {/* Badge de perfil */}
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                        <ProfileIcon className="h-3 w-3" />
                        {theme.label}
                      </span>
                    </div>
                  </div>
                  {(user?.jobTitle || user?.department) && (
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-1">
                      {user?.jobTitle && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 text-white/70 flex-shrink-0" />
                          <p className="text-xs text-white/80 truncate">{user.jobTitle}</p>
                        </div>
                      )}
                      {user?.department && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-white/70 flex-shrink-0" />
                          <p className="text-xs text-white/80 truncate">{user.department}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Seção do Gestor (se houver) */}
                {user?.manager && (
                  <div className="px-3 py-2.5 border-b border-border/50">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">Gestor direto</p>
                        <p className="text-sm font-semibold text-foreground leading-tight">{user.manager.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.manager.email}</p>
                        {user.manager.jobTitle && (
                          <p className="text-xs text-muted-foreground mt-0.5">{user.manager.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Itens de navegação */}
                {navItems.length > 0 && (
                  <div className="py-1.5 px-1">
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Navegação
                    </p>
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.route
                      return (
                        <DropdownMenuItem
                          key={item.route}
                          onClick={() => handleNavigate(item.route)}
                          className={cn(
                            "flex items-center gap-2.5 cursor-pointer min-h-[40px] rounded-lg mx-1 px-3 transition-all duration-150",
                            isActive
                              ? cn(theme.activeBg, theme.activeText, "font-semibold")
                              : cn("text-foreground", theme.hoverBg, theme.hoverText),
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm">{item.label}</span>
                          {isActive && (
                            <span className={cn("ml-auto h-2 w-2 rounded-full", theme.dotColor)} />
                          )}
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                )}

                <div className="h-px bg-border mx-3 my-0.5" />

                {/* Botão de sair */}
                <div className="py-1.5 px-1">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 focus:bg-red-50 dark:focus:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 focus:text-red-700 dark:focus:text-red-300 min-h-[44px] rounded-lg mx-1 px-3 transition-all duration-150"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm font-medium">Sair</span>
                  </DropdownMenuItem>
                </div>
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
              <SheetContent side="right" className="w-80 p-0 overflow-hidden">
                {/* Cabeçalho com gradiente de perfil (mobile) */}
                <SheetHeader className={cn("p-5 bg-gradient-to-br border-b-0", theme.headerGradient)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/40 shadow-md">
                      {user?.photoUrl && <AvatarImage src={user.photoUrl || "/placeholder.svg"} alt={user.name} />}
                      <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
                        {user?.name ? getInitials(user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1 min-w-0">
                      <SheetTitle className="text-white text-base font-bold leading-tight">
                        {user?.name || "Usuário"}
                      </SheetTitle>
                      <SheetDescription className="text-white/70 text-xs truncate mt-0.5">
                        {user?.email || ""}
                      </SheetDescription>
                      <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                        <ProfileIcon className="h-3 w-3" />
                        {theme.label}
                      </span>
                    </div>
                  </div>

                  {user?.manager && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 text-white/70 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/70">Gestor direto</p>
                          <p className="text-sm font-semibold text-white leading-tight">{user.manager.name}</p>
                          <p className="text-xs text-white/70 truncate">{user.manager.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </SheetHeader>

                <div className="flex flex-col p-3">
                  {navItems.length > 0 && (
                    <>
                      <p className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        Navegação
                      </p>
                      {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.route
                        return (
                          <Button
                            key={item.route}
                            variant="ghost"
                            className={cn(
                              "justify-start h-12 text-sm min-h-[44px] transition-all duration-150 rounded-lg",
                              isActive
                                ? cn(theme.activeBg, theme.activeText, "font-semibold")
                                : cn("text-foreground", theme.hoverBg, theme.hoverText),
                            )}
                            onClick={() => handleNavigate(item.route)}
                          >
                            <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                            {item.label}
                            {isActive && (
                              <span className={cn("ml-auto h-2 w-2 rounded-full", theme.dotColor)} />
                            )}
                          </Button>
                        )
                      })}
                      <div className="h-px bg-border my-2 mx-2" />
                    </>
                  )}

                  <Button
                    variant="ghost"
                    className="justify-start h-12 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-all duration-150 min-h-[44px] rounded-lg"
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
