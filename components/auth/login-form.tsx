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

const DEMO_CREDENTIALS = {
  internal: {
    email: "admin@petrobras.com.br",
    password: "demo123",
    name: "João Silva",
  },
  external: {
    email: "cliente@empresa.com",
    password: "demo123",
    name: "Maria Santos",
  },
  supervisor: {
    email: "supervisor@petrobras.com.br",
    password: "demo123",
    name: "Carlos Mendes",
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

  const { setAuth } = useAuthStore()
  const router = useRouter()

  const isInternalUser = email.toLowerCase().includes("@petrobras")

  const handleQuickLogin = (userType: "internal" | "external" | "supervisor") => {
    const credentials = DEMO_CREDENTIALS[userType]

    // For external users, show verification modal instead of direct login
    if (userType === "external") {
      setShowExternalVerification(true)
      return
    }

    setEmail(credentials.email)
    setPassword(credentials.password)

    // Trigger login after setting credentials
    setTimeout(() => {
      setIsLoading(true)
      setAuth(
        {
          id: "demo-user-id",
          email: credentials.email,
          name: credentials.name,
          userType,
        },
        "demo-access-token",
        "demo-refresh-token",
      )

      useAuditLogStore.getState().addLog({
        action: "login",
        level: "success",
        user: {
          id: "demo-user-id",
          name: credentials.name,
          email: credentials.email,
          type: userType,
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
          userType === "internal" ? "/upload" : userType === "supervisor" ? "/supervisor" : "/download"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const isInternalDemo =
        email === DEMO_CREDENTIALS.internal.email && password === DEMO_CREDENTIALS.internal.password
      const isExternalDemo =
        email === DEMO_CREDENTIALS.external.email && password === DEMO_CREDENTIALS.external.password
      const isSupervisorDemo =
        email === DEMO_CREDENTIALS.supervisor.email && password === DEMO_CREDENTIALS.supervisor.password

      if (isInternalDemo || isExternalDemo || isSupervisorDemo) {
        const userType = isInternalDemo ? "internal" : isExternalDemo ? "external" : "supervisor"
        const demoUser = isInternalDemo
          ? DEMO_CREDENTIALS.internal
          : isExternalDemo
            ? DEMO_CREDENTIALS.external
            : DEMO_CREDENTIALS.supervisor

        setAuth(
          {
            id: "demo-user-id",
            email: demoUser.email,
            name: demoUser.name,
            userType,
          },
          "demo-access-token",
          "demo-refresh-token",
        )

        useAuditLogStore.getState().addLog({
          action: "login",
          level: "success",
          user: {
            id: "demo-user-id",
            name: demoUser.name,
            email: demoUser.email,
            type: userType,
          },
          details: {
            description: `Login realizado com sucesso via formulário`,
            ipAddress: "192.168.1.100",
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
            },
          },
        })

        setNotification({
          show: true,
          type: "error",
          title: "Credenciais inválidas",
          message: "E-mail ou senha incorretos. Use as credenciais de demonstração.",
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
      {/* Left Side - Gradient Background */}
      <LoginBackground />

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-start">
            <PetrobrasLogo />
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Acesse sua conta</h1>
            <p className="text-muted-foreground text-base">Faça o upload dos seus arquivos de forma segura.</p>
          </div>

          {/* Demo Credentials Info */}
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
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">admin@petrobras.com.br</span>
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
                onClick={() => handleQuickLogin("supervisor")}
                className="justify-start h-auto py-2 px-3 bg-white dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-left"
              >
                <div className="flex flex-col items-start w-full">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Supervisor</span>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300">supervisor@petrobras.com.br</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
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

            {/* Password Field */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium bg-[#0047BB] hover:bg-[#003A99] text-white"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Footer */}
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
