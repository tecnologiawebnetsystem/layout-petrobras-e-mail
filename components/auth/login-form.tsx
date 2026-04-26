"use client"

import type { FormEvent } from "react"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { User, Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginBackground } from "@/components/ui/login-background"
import { NotificationModal } from "@/components/shared/notification-modal"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { getMsalInstance, loginRequest } from "@/lib/auth/msal-config"
import { getUserTypeFromEmail } from "@/lib/auth/entra-config"
import { getClientEnv } from "@/lib/env"


export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirectingToMicrosoft, setIsRedirectingToMicrosoft] = useState(false)
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

  const { setAuth, login } = useAuthStore()
  const router = useRouter()

  // Exibe o botão Entra ID em todos os modos exceto 'dev'
  // Usa getClientEnv() para ler o valor runtime ao invés do valor baked no bundle
  const showEntraIdButton = getClientEnv("NEXT_PUBLIC_AUTH_MODE") !== "dev"
  // Modo local: força login com senha (sem Entra ID)
  const isLocalMode = !showEntraIdButton

  const isExternalUser = email.trim().length > 0 && !email.toLowerCase().includes("@petrobras")
  const isInternalUser = !isExternalUser

  // Countdown timer for verification code
  useEffect(() => {
    if (externalStep === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, externalStep])

  const handleSendCode = async () => {
    if (!email) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, validity_minutes: 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error?.message ?? "Erro ao enviar código")
      setExternalStep("code")
      setCountdown(60)
      setVerificationCode(["", "", "", "", "", ""])
      // Em desenvolvimento, o backend retorna o código para facilitar os testes
      if (data.code) setGeneratedCode(data.code)
      setNotification({
        show: true,
        type: "success",
        title: "Código enviado!",
        message: `Um código de 6 dígitos foi enviado para ${email}`,
      })
    } catch (error: any) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar código",
        message: error.message || "Não foi possível enviar o código. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...verificationCode]
    newCode[index] = value
    setVerificationCode(newCode)

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus()
    }

    if (index === 5 && value) {
      const fullCode = newCode.join("")
      setIsLoading(true)
      try {
        const res = await fetch("/api/auth/external/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: fullCode }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || "Código inválido")
        // data = { token, expires_at, share_id }
        setAuth(
          { id: email, email, name: email, userType: "external" },
          data.token,
          data.token,
        )
        setNotification({
          show: true,
          type: "success",
          title: "Código verificado!",
          message: "Redirecionando para seus documentos...",
        })
        setTimeout(() => router.push("/download"), 1500)
      } catch (error: any) {
        setNotification({
          show: true,
          type: "error",
          title: "Código inválido",
          message: error.message || "O código informado está incorreto. Tente novamente.",
        })
        setVerificationCode(["", "", "", "", "", ""])
        codeInputRefs.current[0]?.focus()
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendCode = async () => {
    setIsResending(true)
    setCountdown(60)
    setVerificationCode(["", "", "", "", "", ""])
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, validity_minutes: 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error?.message ?? "Erro ao reenviar código")
      if (data.code) setGeneratedCode(data.code)
      setNotification({
        show: true,
        type: "info",
        title: "Código reenviado",
        message: `Um novo código foi enviado para ${email}`,
      })
    } catch (resendError: unknown) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao reenviar",
        message: resendError instanceof Error ? resendError.message : "Não foi possível reenviar o código. Tente novamente.",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleBackToEmail = () => {
    setExternalStep("email")
    setVerificationCode(["", "", "", "", "", ""])
    setGeneratedCode("")
  }

  const handleEntraIdLogin = async () => {
    setIsLoading(true)
    setIsRedirectingToMicrosoft(true)
    try {
      const msal = await getMsalInstance()
      // loginRedirect: navega a página inteira para a Microsoft.
      // O resultado é processado pelo EntraProvider via handleRedirectPromise()
      // quando a Microsoft redireciona de volta para localhost:3000.
      await msal.loginRedirect(loginRequest)
      // A página navega para fora daqui — nenhum código abaixo é executado.
    } catch (error: unknown) {
      // Só chega aqui se loginRedirect lançar (ex: popups bloqueados, config inválida).
      setIsLoading(false)
      setIsRedirectingToMicrosoft(false)
      const message =
        error instanceof Error ? error.message : "Nao foi possivel iniciar o login com a Microsoft."
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao autenticar",
        message,
      })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    // Usuários externos SEMPRE usam o fluxo OTP, independente do modo (dev/entra)
    if (isExternalUser) {
      await handleSendCode()
      return
    }
    // Login com email + senha para usuários internos
    if (!email || !password) return
    setIsLoading(true)
    const result = await login(email, password)
    setIsLoading(false)
    if (result.success) {
      const { user } = useAuthStore.getState()
      if (user?.userType === "supervisor") router.push("/supervisor")
      else if (user?.userType === "internal") router.push("/upload")
      else router.push("/download")
    } else {
      setNotification({
        show: true,
        type: "error",
        title: "Credenciais inválidas",
        message: result.error || "E-mail ou senha incorretos. Verifique e tente novamente.",
      })
    }
  }

  // Mostra loader em tela cheia quando está redirecionando para a Microsoft
  if (isRedirectingToMicrosoft) {
    return (
      <FullPageLoader 
        message="Conectando com Microsoft..."
        subMessage="Voce sera redirecionado para a pagina de login da Microsoft"
      />
    )
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
            {/* Campo de e-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (externalStep === "code") {
                      setExternalStep("email")
                      setVerificationCode(["", "", "", "", "", ""])
                      setGeneratedCode("")
                    }
                  }}
                  disabled={isExternalUser && externalStep === "code"}
                  className="pl-10 h-12 bg-muted/50 border-border disabled:opacity-60"
                  required
                />
              </div>
            </div>

            {/* Campo de senha – visível para usuários internos */}
            {isInternalUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border"
                    required
                  />
                </div>
              </div>
            )}

            {/* Botão de login para usuários internos */}
            {isInternalUser && (
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full h-12 text-base font-semibold bg-[#0047BB] hover:bg-[#003399] text-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            )}

            {/* Campos de código - aparecem abaixo do e-mail após o envio */}
            {isExternalUser && externalStep === "code" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center text-pretty">
                  Digite o código de 6 dígitos enviado para{" "}
                  <span className="text-[#00A99D] font-semibold">{email}</span>
                </p>

                {/* Código retornado pelo backend em ambiente dev */}
                {generatedCode && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Código (apenas em dev):</p>
                        <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                          {generatedCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inputs dos dígitos */}
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

                {/* Reenviar código */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">Reenviar codigo em {countdown}s</p>
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-[#00A99D] hover:text-[#00857A]"
                    >
                      {isResending ? "Reenviando..." : "Reenviar codigo"}
                    </Button>
                  )}
                </div>

                {/* Voltar */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToEmail}
                  className="w-full h-12 text-base font-medium"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
              </div>
            )}

            {/* Botão de envio - apenas para usuários externos na etapa de e-mail */}
            {isExternalUser && externalStep === "email" && (
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold bg-[#00A859] hover:bg-[#008a48] text-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? "Enviando..." : "Enviar código de acesso"}
              </Button>
            )}
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
          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground/60 pt-4">
            <p>2025 Petrobras. Todos os direitos reservados.</p>
          </footer>
        </div>
      </div>
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
