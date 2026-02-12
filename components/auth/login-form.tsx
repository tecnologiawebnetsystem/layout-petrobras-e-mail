"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { Eye, EyeOff, User, Lock, ChevronDown, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginBackground } from "@/components/ui/login-background"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import { NotificationModal } from "@/components/shared/notification-modal"
import { ExternalVerificationModal } from "@/components/auth/external-verification-modal"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"
import { useRouter } from "next/navigation"
import { useMsal } from "@azure/msal-react"
import { loginRequest, checkEntraIdConfig } from "@/lib/auth/entra-config"
import { rateLimiter, generateIdentifier } from "@/lib/auth/rate-limiter"
import { captureSessionContext, saveSessionContext } from "@/lib/auth/session-binding"

const DEMO_CREDENTIALS = {
  internal: {
    email: "kleber.goncalves.prestserv@petrobras.com.br",
    password: "demo123",
    name: "Kleber Gonçalves",
  },
  external: {
    email: "cliente@empresa.com",
    password: "demo123",
    name: "Maria Santos",
  },
  externalEmpty: {
    email: "demo@exemplo.com.br",
    password: "demo123",
    name: "Pedro Teste",
  },
  supervisor: {
    email: "wagner.brazil@petrobras.com.br",
    password: "demo123",
    name: "Wagner Gaspar Brazil",
  },
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showExternalVerification, setShowExternalVerification] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [demoExternalMode, setDemoExternalMode] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  })

  const { instance } = useMsal()
  const { setAuth } = useAuthStore()
  const router = useRouter()

  const entraConfig = checkEntraIdConfig()
  const showEntraIdButton = entraConfig.configured

  const isInternalUser = email.toLowerCase().includes("@petrobras")

  const handleQuickLogin = (userType: "internal" | "external" | "supervisor" | "externalEmpty") => {
    const credentials = DEMO_CREDENTIALS[userType]

    if (userType === "external") {
      setEmail(credentials.email)
      setPassword("")
      setDemoExternalMode(true)
      return
    }

    const actualUserType = userType === "externalEmpty" ? "external" : userType

    setDemoExternalMode(false)
    setEmail(credentials.email)
    setPassword(credentials.password)

    setTimeout(() => {
      setIsLoading(true)
      setAuth(
        {
          id: userType === "externalEmpty" ? "demo-empty-user-id" : "demo-user-id",
          email: credentials.email,
          name: credentials.name,
          userType: actualUserType,
        },
        "demo-access-token",
        "demo-refresh-token",
      )

      useAuditLogStore.getState().addLog({
        action: "login",
        level: "success",
        user: {
          id: userType === "externalEmpty" ? "demo-empty-user-id" : "demo-user-id",
          name: credentials.name,
          email: credentials.email,
          type: actualUserType,
        },
        details: {
          description: `Login realizado com sucesso via acesso rápido`,
          ipAddress: "192.168.1.100",
        },
      })

      setNotification({
        show: true,
        type: "success",
        title: "Login realizado com sucesso!",
        message: `Bem-vindo, ${credentials.name}`,
      })

      setTimeout(() => {
        const redirectPath =
          actualUserType === "internal" ? "/upload" : actualUserType === "supervisor" ? "/supervisor" : "/download"
        router.push(redirectPath)
      }, 1500)
    }, 100)
  }

  const handleExternalVerificationSuccess = (email: string) => {
    setAuth(
      {
        id: "demo-external-user",
        email: email,
        name: "Maria Santos",
        userType: "external",
      },
      "demo-access-token",
      "demo-refresh-token",
    )

    useAuditLogStore.getState().addLog({
      action: "login",
      level: "success",
      user: {
        id: "demo-external-user",
        name: "Maria Santos",
        email: email,
        type: "external",
      },
      details: {
        description: `Login de usuário externo realizado com verificação por código`,
        ipAddress: "203.0.113.45",
      },
    })

    router.push("/download")
  }

  const handleEntraIdLogin = async () => {
    try {
      console.log("[v0] Iniciando login com Entra ID via popup")
      const response = await instance.loginPopup(loginRequest)
      console.log("[v0] Response do loginPopup recebido:", {
        hasAccount: !!response?.account,
        hasAccessToken: !!response?.accessToken,
        accountEmail: response?.account?.username,
      })

      // Disparar evento manualmente para o provider processar
      if (response && response.account) {
        console.log("[v0] Login bem-sucedido, conta salva no MSAL")
        console.log("[v0] Forçando evento de login para o provider processar")

        const event = new CustomEvent("msal-login-success", {
          detail: { response },
        })
        window.dispatchEvent(event)
      }
    } catch (error: any) {
      console.error("[v0] Erro no loginPopup:", error)

      if (error.errorCode === "user_cancelled" || error.message?.includes("user_cancelled")) {
        setNotification({
          show: true,
          type: "info",
          title: "Login cancelado",
          message: "Você cancelou o login. Clique novamente no botão quando quiser fazer login.",
        })
        return
      }

      setNotification({
        show: true,
        type: "error",
        title: "Erro ao fazer login",
        message: error.message || "Não foi possível conectar ao Entra ID",
      })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (demoExternalMode) {
      setShowExternalVerification(true)
      return
    }

    setIsLoading(true)

    try {
      const identifier = generateIdentifier("192.168.1.100", email)
      const rateLimitCheck = rateLimiter.recordAttempt(identifier)

      if (!rateLimitCheck.allowed) {
        setNotification({
          show: true,
          type: "error",
          title: "Muitas tentativas",
          message: `Você excedeu o número de tentativas. Tente novamente em ${rateLimitCheck.retryAfter} segundos.`,
        })
        setIsLoading(false)
        return
      }

      const isInternalDemo =
        email === DEMO_CREDENTIALS.internal.email && password === DEMO_CREDENTIALS.internal.password
      const isExternalDemo =
        email === DEMO_CREDENTIALS.external.email && password === DEMO_CREDENTIALS.external.password
      const isSupervisorDemo =
        email === DEMO_CREDENTIALS.supervisor.email && password === DEMO_CREDENTIALS.supervisor.password
      const isExternalEmptyDemo =
        email === DEMO_CREDENTIALS.externalEmpty.email && password === DEMO_CREDENTIALS.externalEmpty.password

      if (isInternalDemo || isExternalDemo || isSupervisorDemo || isExternalEmptyDemo) {
        rateLimiter.reset(identifier)

        const sessionContext = captureSessionContext()
        saveSessionContext(sessionContext)

        const userType = isInternalDemo
          ? "internal"
          : isExternalDemo
            ? "external"
            : isSupervisorDemo
              ? "supervisor"
              : "externalEmpty"
        const demoUser = isInternalDemo
          ? DEMO_CREDENTIALS.internal
          : isExternalDemo
            ? DEMO_CREDENTIALS.external
            : isSupervisorDemo
              ? DEMO_CREDENTIALS.supervisor
              : DEMO_CREDENTIALS.externalEmpty

        setAuth(
          {
            id: userType === "externalEmpty" ? "demo-empty-user-id" : "demo-user-id",
            email: demoUser.email,
            name: demoUser.name,
            userType: userType === "externalEmpty" ? "external" : userType,
          },
          "demo-access-token",
          "demo-refresh-token",
        )

        useAuditLogStore.getState().addLog({
          action: "login",
          level: "success",
          user: {
            id: userType === "externalEmpty" ? "demo-empty-user-id" : "demo-user-id",
            name: demoUser.name,
            email: demoUser.email,
            type: userType === "externalEmpty" ? "external" : userType,
          },
          details: {
            description: `Login realizado com sucesso via formulário`,
            ipAddress: "192.168.1.100",
            metadata: {
              attemptsRemaining: rateLimitCheck.attemptsRemaining,
            },
          },
        })

        setNotification({
          show: true,
          type: "success",
          title: "Login realizado com sucesso!",
          message: `Bem-vindo, ${demoUser.name}`,
        })

        setTimeout(() => {
          const redirectPath =
            userType === "internal" ? "/upload" : userType === "supervisor" ? "/supervisor" : "/download"
          router.push(redirectPath)
        }, 1500)
      } else {
        useAuditLogStore.getState().addLog({
          action: "login",
          level: "error",
          user: {
            id: "unknown",
            name: "Desconhecido",
            email: email,
            type: "external",
          },
          details: {
            description: `Tentativa de login com credenciais inválidas`,
            ipAddress: "192.168.1.100",
            metadata: {
              attemptedEmail: email,
              attemptsRemaining: rateLimitCheck.attemptsRemaining,
            },
          },
        })

        setNotification({
          show: true,
          type: "error",
          title: "Credenciais inválidas",
          message: `E-mail ou senha incorretos. Tentativas restantes: ${rateLimitCheck.attemptsRemaining}`,
        })
      }
    } catch (error) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao fazer login",
        message: "Ocorreu um erro. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex" role="main" aria-label="Pagina de login">
      <LoginBackground />
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/images/petrobras-full-logo.png"
              alt="Petrobras - Logo oficial"
              className="h-14 sm:h-16 w-auto"
              width={200}
              height={64}
            />
          </div>

          {/* Header */}
          <header className="space-y-3 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-balance">
              Acesse sua conta
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-pretty">
              Sistema de transferencia segura de arquivos para destinatarios externos.
            </p>
          </header>

          {/* Formulario principal */}
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Formulario de login">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail ou Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder="Digite seu e-mail ou usuário"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (demoExternalMode && e.target.value !== DEMO_CREDENTIALS.external.email) {
                      setDemoExternalMode(false)
                    }
                  }}
                  className="pl-10 h-12 bg-muted/50 border-border"
                  required
                />
              </div>
              {email && (
                <p className="text-xs text-muted-foreground">
                  Tipo de usuário:{" "}
                  <span className={isInternalUser ? "text-[#0047BB] font-semibold" : "text-[#00A99D] font-semibold"}>
                    {isInternalUser ? "Interno (Upload)" : "Externo (Download)"}
                  </span>
                </p>
              )}
            </div>
            {!demoExternalMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-[#0047BB] hover:text-[#003A99] transition-colors cursor-pointer hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 bg-muted/50 border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-[#00A859] hover:bg-[#008a48] text-white transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          {showEntraIdButton && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleEntraIdLogin}
                className="w-full h-12 text-base font-medium border-2 hover:bg-accent bg-transparent"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="none">
                  <path
                    d="M11.5 0L0 4.6V11.5C0 17.8 4.6 23 11.5 23C18.4 23 23 17.8 23 11.5V4.6L11.5 0Z"
                    fill="#00A4EF"
                  />
                </svg>
                Login com Microsoft
              </Button>
            </div>
          )}
          {/* Demo Section - Collapsible e Sutil */}
          <Collapsible open={isDemoOpen} onOpenChange={setIsDemoOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors group"
                aria-expanded={isDemoOpen}
                aria-controls="demo-content"
              >
                <TestTube2 className="h-3.5 w-3.5" />
                <span>Ambiente de demonstracao</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isDemoOpen ? "rotate-180" : ""}`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent id="demo-content" className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("external")}
                    className="flex items-center justify-between px-3 py-2 text-left text-xs rounded-md bg-background hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                  >
                    <span className="font-medium text-foreground/80">Usuario Externo</span>
                    <span className="text-muted-foreground text-[10px]">cliente@empresa.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("externalEmpty")}
                    className="flex items-center justify-between px-3 py-2 text-left text-xs rounded-md bg-background hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                  >
                    <span className="font-medium text-foreground/80">Usuario Externo (Vazio)</span>
                    <span className="text-muted-foreground text-[10px]">demo@exemplo.com.br</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("supervisor")}
                    className="flex items-center justify-between px-3 py-2 text-left text-xs rounded-md bg-background hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                  >
                    <span className="font-medium text-foreground/80">Supervisor</span>
                    <span className="text-muted-foreground text-[10px]">wagner.brazil@petrobras.com.br</span>
                  </button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground/60 pt-4">
            <p>2025 Petrobras. Todos os direitos reservados.</p>
          </footer>
        </div>
      </div>
      <ForgotPasswordModal open={showForgotPassword} onOpenChange={setShowForgotPassword} />
      <ExternalVerificationModal
        open={showExternalVerification}
        onOpenChange={(open) => {
          setShowExternalVerification(open)
          if (!open) setDemoExternalMode(false)
        }}
        onSuccess={handleExternalVerificationSuccess}
        initialEmail={demoExternalMode ? email : undefined}
      />
      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </main>
  )
}
