"use client"

import type { FormEvent } from "react"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, User, Lock, ChevronDown, TestTube2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginBackground } from "@/components/ui/login-background"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal"
import { NotificationModal } from "@/components/shared/notification-modal"
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
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [demoExternalMode, setDemoExternalMode] = useState(false)
  const [demoExternalType, setDemoExternalType] = useState<"external" | "externalEmpty">("external")
  const [externalStep, setExternalStep] = useState<"email" | "code">("email")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [generatedCode, setGeneratedCode] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])
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
  const { setAuth, login } = useAuthStore()
  const router = useRouter()

  const entraConfig = checkEntraIdConfig()
  const showEntraIdButton = entraConfig.configured

  const isInternalUser = email.toLowerCase().includes("@petrobras")

  // Countdown timer for verification code
  useEffect(() => {
    if (externalStep === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, externalStep])

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleSendCode = () => {
    if (!email) return
    const newCode = generateRandomCode()
    setGeneratedCode(newCode)
    setExternalStep("code")
    setCountdown(60)
    setVerificationCode(["", "", "", "", "", ""])
    setNotification({
      show: true,
      type: "success",
      title: "Codigo enviado!",
      message: `Um codigo de 6 digitos foi enviado para ${email}`,
    })
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }

    if (index === 5 && value) {
      const fullCode = newCode.join("")
      if (fullCode === generatedCode) {
        setTimeout(() => {
          setNotification({
            show: true,
            type: "success",
            title: "Codigo verificado!",
            message: "Redirecionando para seus documentos...",
          })
          setTimeout(() => {
            handleExternalVerificationSuccess(email)
          }, 1500)
        }, 300)
      } else {
        setNotification({
          show: true,
          type: "error",
          title: "Codigo invalido",
          message: "O codigo informado esta incorreto. Tente novamente.",
        })
        setVerificationCode(["", "", "", "", "", ""])
        codeInputRefs.current[0]?.focus()
      }
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendCode = () => {
    setIsResending(true)
    setCountdown(60)
    setVerificationCode(["", "", "", "", "", ""])
    const newCode = generateRandomCode()
    setGeneratedCode(newCode)
    setTimeout(() => {
      setIsResending(false)
      setNotification({
        show: true,
        type: "info",
        title: "Codigo reenviado",
        message: `Um novo codigo foi enviado para ${email}`,
      })
    }, 1000)
  }

  const handleBackToEmail = () => {
    setExternalStep("email")
    setVerificationCode(["", "", "", "", "", ""])
    setGeneratedCode("")
  }

  const handleQuickLogin = async (userType: "internal" | "external" | "supervisor" | "externalEmpty") => {
    const credentials = DEMO_CREDENTIALS[userType]

    if (userType === "external" || userType === "externalEmpty") {
      setEmail(credentials.email)
      setPassword("")
      setDemoExternalMode(true)
      setDemoExternalType(userType)
      setExternalStep("email")
      return
    }

    setDemoExternalMode(false)
    setEmail(credentials.email)
    setPassword(credentials.password)
    setIsLoading(true)

    // Chama API real de login
    const result = await login(credentials.email, credentials.password)

    if (result.success) {
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
    } else {
      setNotification({
        show: true,
        type: "error",
        title: "Erro no login",
        message: result.error || "Nao foi possivel fazer login",
      })
    }
    setIsLoading(false)
  }

  const handleExternalVerificationSuccess = (verifiedEmail: string) => {
    const credentials = DEMO_CREDENTIALS[demoExternalType]
    const userId = demoExternalType === "externalEmpty" ? "demo-empty-user-id" : "demo-external-user"

    setAuth(
      {
        id: userId,
        email: verifiedEmail,
        name: credentials.name,
        userType: "external",
      },
      "demo-access-token",
      "demo-refresh-token",
    )

    useAuditLogStore.getState().addLog({
      action: "login",
      level: "success",
      user: {
        id: userId,
        name: credentials.name,
        email: verifiedEmail,
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
      handleSendCode()
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
          message: `Voce excedeu o numero de tentativas. Tente novamente em ${rateLimitCheck.retryAfter} segundos.`,
        })
        setIsLoading(false)
        return
      }

      const sessionContext = captureSessionContext()
      saveSessionContext(sessionContext)

      // Chama API real de login no backend Python
      const result = await login(email, password)

      if (result.success) {
        rateLimiter.reset(identifier)

        const user = useAuthStore.getState().user
        setNotification({
          show: true,
          type: "success",
          title: "Login realizado com sucesso!",
          message: `Bem-vindo, ${user?.name || email}`,
        })

        setTimeout(() => {
          const userType = user?.userType || "external"
          const redirectPath =
            userType === "internal" ? "/upload" : userType === "supervisor" ? "/supervisor" : "/download"
          router.push(redirectPath)
        }, 1500)
      } else {
        setNotification({
          show: true,
          type: "error",
          title: "Credenciais invalidas",
          message: result.error || `E-mail ou senha incorretos. Tentativas restantes: ${rateLimitCheck.attemptsRemaining}`,
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

          {/* Formulario principal ou verificacao de codigo */}
          {demoExternalMode && externalStep === "code" ? (
            <div className="space-y-6">
              {/* Inline Code Verification */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00A99D] to-[#00857A] flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-foreground text-balance">Verificacao de Codigo</h2>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Digite o codigo de 6 digitos enviado para
                    <br />
                    <span className="text-[#00A99D] font-semibold">{email}</span>
                  </p>
                </div>
              </div>

              {/* Demo Code Display */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Codigo de demonstracao:</p>
                    <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                      {generatedCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Input */}
              <div className="flex justify-center gap-2">
                {verificationCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { codeInputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Resend Code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">Reenviar codigo em {countdown}s</p>
                ) : (
                  <Button
                    variant="link"
                    onClick={handleResendCode}
                    disabled={isResending}
                    className="text-[#00A99D] hover:text-[#00857A]"
                  >
                    {isResending ? "Reenviando..." : "Reenviar codigo"}
                  </Button>
                )}
              </div>

              {/* Back Button */}
              <Button
                variant="outline"
                onClick={handleBackToEmail}
                className="w-full h-12 text-base font-medium"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Voltar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" aria-label="Formulario de login">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {demoExternalMode ? "E-mail" : "E-mail ou Usuario"}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder={demoExternalMode ? "Digite seu e-mail" : "Digite seu e-mail ou usuario"}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (demoExternalMode && e.target.value !== DEMO_CREDENTIALS[demoExternalType].email) {
                        setDemoExternalMode(false)
                      }
                    }}
                    className="pl-10 h-12 bg-muted/50 border-border"
                    required
                  />
                </div>
                {email && (
                  <p className="text-xs text-muted-foreground">
                    Tipo de usuario:{" "}
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
                {isLoading ? "Entrando..." : demoExternalMode ? "Enviar codigo" : "Entrar"}
              </Button>
            </form>
          )}
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
