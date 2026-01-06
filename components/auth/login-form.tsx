"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { LoginBackground } from "@/components/ui/login-background"
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
      setShowExternalVerification(true)
      return
    }

    const actualUserType = userType === "externalEmpty" ? "external" : userType

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
      const response = await instance.loginPopup(loginRequest)
    } catch (error: any) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="min-h-screen flex">
      <LoginBackground />
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-start">
            <PetrobrasLogo />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Acesse sua conta</h1>
            <p className="text-muted-foreground text-base">Faça o upload dos seus arquivos de forma segura.</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Acesso Rápido - Demonstração:</p>
            <div className="grid grid-cols-1 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin("internal")}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-left"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Usuário Interno</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">
                    kleber.goncalves.prestserv@petrobras.com.br
                  </span>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin("external")}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-left"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Usuário Externo</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">cliente@empresa.com</span>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin("externalEmpty")}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-left"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                    Usuário Externo (Vazio)
                  </span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">demo@exemplo.com.br</span>
                </div>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleQuickLogin("supervisor")}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-left"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Supervisor</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">wagner.brazil@petrobras.com.br</span>
                </div>
              </Button>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  onChange={(e) => setEmail(e.target.value)}
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
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium bg-[#0047BB] hover:bg-[#003A99] text-white"
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
          <div className="text-center text-sm text-muted-foreground pt-8">
            © 2025 Petrobras. Todos os direitos reservados.
          </div>
        </div>
      </div>
      <ForgotPasswordModal open={showForgotPassword} onOpenChange={setShowForgotPassword} />
      <ExternalVerificationModal
        open={showExternalVerification}
        onOpenChange={setShowExternalVerification}
        onSuccess={handleExternalVerificationSuccess}
      />
      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  )
}
