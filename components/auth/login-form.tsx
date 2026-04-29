"use client"

import type { FormEvent } from "react"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { User, Lock, ArrowLeft, Loader2, Building2, Users, Headset, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginBackground } from "@/components/ui/login-background"
import { NotificationModal } from "@/components/shared/notification-modal"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useRouter } from "next/navigation"
import { getMsalInstance, loginRequest } from "@/lib/auth/msal-config"
import { getClientEnv } from "@/lib/env"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Tipos de modal de acesso disponíveis
type AccessModal = "interno" | "externo" | "suporte" | "supervisor" | null

export function LoginForm() {
  const [isRedirectingToMicrosoft, setIsRedirectingToMicrosoft] = useState(false)
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

  const { login } = useAuthStore()
  const router = useRouter()

  // Modal ativo
  const [activeModal, setActiveModal] = useState<AccessModal>(null)

  // Campos compartilhados dos modais de senha (interno, suporte, supervisor)
  const [modalEmail, setModalEmail] = useState("")
  const [modalSenha, setModalSenha] = useState("")
  const [modalLoading, setModalLoading] = useState(false)

  // Campos e estado do fluxo externo (OTP)
  const [externalEmail, setExternalEmail] = useState("")
  const [externalStep, setExternalStep] = useState<"email" | "code">("email")
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""])
  const [generatedCode, setGeneratedCode] = useState("")
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const [externalLoading, setExternalLoading] = useState(false)
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const showEntraIdButton = getClientEnv("NEXT_PUBLIC_AUTH_MODE") !== "dev"

  // Countdown para reenvio do código externo
  useEffect(() => {
    if (activeModal === "externo" && externalStep === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, externalStep, activeModal])

  const resetModal = () => {
    setModalEmail("")
    setModalSenha("")
    setModalLoading(false)
    setExternalEmail("")
    setExternalStep("email")
    setVerificationCode(["", "", "", "", "", ""])
    setGeneratedCode("")
    setCountdown(60)
  }

  const openModal = (type: AccessModal) => {
    resetModal()
    setActiveModal(type)
  }

  const closeModal = () => {
    if (!modalLoading && !externalLoading) {
      resetModal()
      setActiveModal(null)
    }
  }

  // --- Login com senha (interno, suporte, supervisor) ---
  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()

    if (!modalEmail.trim() || !modalSenha.trim()) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campos obrigatórios",
        message: "Informe o e-mail e a senha para continuar.",
      })
      return
    }

    setModalLoading(true)
    try {
      const result = await login(modalEmail.trim(), modalSenha)

      if (!result.success) {
        setNotification({
          show: true,
          type: "error",
          title: "Credenciais inválidas",
          message: result.error || "E-mail ou senha incorretos. Tente novamente.",
        })
        return
      }

      const { user: loggedUser } = useAuthStore.getState()

      // Valida se o userType corresponde ao acesso solicitado
      if (activeModal === "interno" && loggedUser?.userType !== "internal") {
        useAuthStore.getState().clearAuth()
        setNotification({
          show: true,
          type: "error",
          title: "Acesso negado",
          message: "Sua conta não possui permissão para acesso interno.",
        })
        return
      }

      if (activeModal === "suporte" && loggedUser?.userType !== "support") {
        useAuthStore.getState().clearAuth()
        setNotification({
          show: true,
          type: "error",
          title: "Acesso negado",
          message: "Sua conta não possui permissão para o painel de suporte.",
        })
        return
      }

      if (activeModal === "supervisor" && loggedUser?.userType !== "supervisor") {
        useAuthStore.getState().clearAuth()
        setNotification({
          show: true,
          type: "error",
          title: "Acesso negado",
          message: "Sua conta não possui permissão para o painel de supervisor.",
        })
        return
      }

      setActiveModal(null)
      resetModal()

      // Redireciona conforme o tipo de acesso
      if (activeModal === "interno") router.push("/compartilhamentos")
      else if (activeModal === "suporte") router.push("/suporte")
      else if (activeModal === "supervisor") router.push("/supervisor")
    } catch {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao autenticar",
        message: "Ocorreu um erro ao tentar autenticar. Tente novamente.",
      })
    } finally {
      setModalLoading(false)
    }
  }

  // --- Login com Entra ID (Microsoft) ---
  const handleEntraIdLogin = async () => {
    setModalLoading(true)
    setIsRedirectingToMicrosoft(true)
    try {
      const msal = await getMsalInstance()
      await msal.loginRedirect(loginRequest)
    } catch (error: unknown) {
      setModalLoading(false)
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

  // --- Fluxo externo OTP ---
  const handleSendCode = async () => {
    if (!externalEmail) return
    setExternalLoading(true)
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: externalEmail, validity_minutes: 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error?.message ?? "Erro ao enviar código")
      setExternalStep("code")
      setCountdown(60)
      setVerificationCode(["", "", "", "", "", ""])
      if (data.code) setGeneratedCode(data.code)
      setNotification({
        show: true,
        type: "success",
        title: "Código enviado!",
        message: `Um código de 6 dígitos foi enviado para ${externalEmail}`,
      })
    } catch (error: any) {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao enviar código",
        message: error.message || "Não foi possível enviar o código. Tente novamente.",
      })
    } finally {
      setExternalLoading(false)
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
      setExternalLoading(true)
      try {
        const res = await fetch("/api/auth/external/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: externalEmail, code: fullCode }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || "Código inválido")
        useAuthStore.getState().setAuth(
          { id: externalEmail, email: externalEmail, name: externalEmail, userType: "external" },
          data.token,
          data.token,
        )
        setNotification({
          show: true,
          type: "success",
          title: "Código verificado!",
          message: "Redirecionando para seus documentos...",
        })
        setActiveModal(null)
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
        setExternalLoading(false)
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
        body: JSON.stringify({ email: externalEmail, validity_minutes: 10 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? data.error?.message ?? "Erro ao reenviar código")
      if (data.code) setGeneratedCode(data.code)
      setNotification({
        show: true,
        type: "info",
        title: "Código reenviado",
        message: `Um novo código foi enviado para ${externalEmail}`,
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

  if (isRedirectingToMicrosoft) {
    return (
      <FullPageLoader
        message="Conectando com Microsoft..."
        subMessage="Voce sera redirecionado para a pagina de login da Microsoft"
      />
    )
  }

  // Configuração dos botões de acesso
  const accessButtons = [
    {
      id: "interno" as AccessModal,
      label: "Acesso Interno",
      description: "Colaboradores Petrobras",
      icon: <Building2 className="h-5 w-5" />,
      color: "from-[#0047BB] to-[#003A99]",
      border: "border-[#0047BB]/20 hover:border-[#0047BB]/50",
      text: "text-[#0047BB]",
      credential: { email: "jefferson.breno.prestserv@petrobras.com.br", senha: "internal@123" },
    },
    {
      id: "externo" as AccessModal,
      label: "Acesso Externo",
      description: "Destinatários externos",
      icon: <Users className="h-5 w-5" />,
      color: "from-[#00A859] to-[#008a48]",
      border: "border-[#00A859]/20 hover:border-[#00A859]/50",
      text: "text-[#00A859]",
      credential: { email: "destinatario@email.com", senha: "— (código por e-mail)" },
    },
    {
      id: "suporte" as AccessModal,
      label: "Acesso Suporte",
      description: "Painel de atendimento",
      icon: <Headset className="h-5 w-5" />,
      color: "from-[#F59E0B] to-[#D97706]",
      border: "border-[#F59E0B]/20 hover:border-[#F59E0B]/50",
      text: "text-[#D97706]",
      credential: { email: "suporte@petrobras.com.br", senha: "suporte@123" },
    },
    {
      id: "supervisor" as AccessModal,
      label: "Acesso Supervisor",
      description: "Aprovações de compartilhamento",
      icon: <ShieldCheck className="h-5 w-5" />,
      color: "from-[#00A99D] to-[#007d78]",
      border: "border-[#00A99D]/20 hover:border-[#00A99D]/50",
      text: "text-[#00A99D]",
      credential: { email: "supervisor@petrobras.com.br", senha: "supervisor@123" },
    },
  ]

  // Modal de senha genérico (interno, suporte, supervisor)
  const passwordModal = activeModal && activeModal !== "externo"
  const currentButton = accessButtons.find((b) => b.id === activeModal)

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

          {/* Botões de acesso */}
          <div className="grid grid-cols-2 gap-3">
            {accessButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => openModal(btn.id)}
                className={`group flex flex-col items-start gap-2 p-4 rounded-xl border-2 bg-background transition-all duration-200 hover:shadow-md ${btn.border}`}
              >
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${btn.color} flex items-center justify-center text-white shadow-sm`}>
                  {btn.icon}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${btn.text}`}>{btn.label}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{btn.description}</p>
                </div>
                {btn.credential && (
                  <div className="w-full mt-1 pt-2 border-t border-border/60 space-y-0.5">
                    <p className="text-[10px] text-muted-foreground/70 font-mono truncate w-full" title={btn.credential.email}>
                      {btn.credential.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 font-mono">
                      {btn.credential.senha}
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground/60 pt-2">
            <p>2025 Petrobras. Todos os direitos reservados.</p>
          </footer>
        </div>
      </div>

      {/* Modal de senha (Interno / Suporte / Supervisor) */}
      <Dialog open={!!passwordModal} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className={`inline-flex items-center gap-2 mb-1`}>
              <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${currentButton?.color} flex items-center justify-center text-white`}>
                {currentButton?.icon}
              </div>
              <DialogTitle className="text-xl font-bold">{currentButton?.label}</DialogTitle>
            </div>
            <DialogDescription>
              Informe suas credenciais para acessar o portal.
            </DialogDescription>
          </DialogHeader>

          {/* Credenciais de demonstração */}
          {currentButton?.credential && (
            <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Credenciais de demonstração</p>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs font-mono text-foreground/80 break-all">{currentButton.credential.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs font-mono text-foreground/80">{currentButton.credential.senha}</p>
              </div>
            </div>
          )}

          <form onSubmit={handlePasswordLogin} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-sm font-medium">E-mail</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="seu@petrobras.com.br"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="pl-10 h-11"
                  disabled={modalLoading}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-senha" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-senha"
                  type="password"
                  placeholder="Digite sua senha"
                  value={modalSenha}
                  onChange={(e) => setModalSenha(e.target.value)}
                  className="pl-10 h-11"
                  disabled={modalLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Botão Entra ID apenas para acesso interno */}
            {activeModal === "interno" && showEntraIdButton && (
              <>
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
                  disabled={modalLoading}
                  className="w-full h-11 font-medium border-2 hover:bg-accent bg-transparent"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="none">
                    <path d="M11.5 0L0 4.6V11.5C0 17.8 4.6 23 11.5 23C18.4 23 23 17.8 23 11.5V4.6L11.5 0Z" fill="#00A4EF" />
                  </svg>
                  Login com Microsoft
                </Button>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={closeModal}
                disabled={modalLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className={`flex-1 bg-gradient-to-r ${currentButton?.color} text-white font-semibold hover:opacity-90`}
                disabled={modalLoading}
              >
                {modalLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Acesso Externo (OTP) */}
      <Dialog open={activeModal === "externo"} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00A859] to-[#008a48] flex items-center justify-center text-white">
                <Users className="h-4 w-4" />
              </div>
              <DialogTitle className="text-xl font-bold">Acesso Externo</DialogTitle>
            </div>
            <DialogDescription>
              {externalStep === "email"
                ? "Informe seu e-mail para receber o código de acesso."
                : `Digite o código enviado para ${externalEmail}`}
            </DialogDescription>
          </DialogHeader>

          {externalStep === "email" ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendCode() }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="ext-email" className="text-sm font-medium">E-mail</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ext-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                    className="pl-10 h-11"
                    disabled={externalLoading}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={closeModal} disabled={externalLoading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={externalLoading}
                  className="flex-1 bg-gradient-to-r from-[#00A859] to-[#008a48] text-white font-semibold hover:opacity-90"
                >
                  {externalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
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

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExternalStep("email")
                  setVerificationCode(["", "", "", "", "", ""])
                  setGeneratedCode("")
                }}
                className="w-full h-11"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
