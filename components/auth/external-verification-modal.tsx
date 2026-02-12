"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { NotificationModal } from "@/components/shared/notification-modal"

interface ExternalVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (email: string) => void
  initialEmail?: string
}

export function ExternalVerificationModal({ open, onOpenChange, onSuccess, initialEmail }: ExternalVerificationModalProps) {
  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [generatedCode, setGeneratedCode] = useState("")

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

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  useEffect(() => {
    if (step === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, step])

  useEffect(() => {
    if (open) {
      if (initialEmail) {
        setEmail(initialEmail)
        setStep("email")
      } else {
        setStep("email")
        setEmail("")
      }
      setCode(["", "", "", "", "", ""])
      setCountdown(60)
      setGeneratedCode("")
    }
  }, [open, initialEmail])

  const handleSendCode = () => {
    if (!email) {
      setNotification({
        show: true,
        type: "error",
        title: "E-mail obrigatório",
        message: "Por favor, insira seu e-mail para continuar.",
      })
      return
    }

    const newCode = generateRandomCode()
    setGeneratedCode(newCode)
    setStep("code")
    setCountdown(60)
    setNotification({
      show: true,
      type: "success",
      title: "Código enviado!",
      message: `Um código de 6 dígitos foi enviado para ${email}`,
    })
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all 6 digits are entered
    if (index === 5 && value) {
      const fullCode = newCode.join("")
      if (fullCode === generatedCode) {
        setTimeout(() => {
          setNotification({
            show: true,
            type: "success",
            title: "Código verificado!",
            message: "Redirecionando para seus documentos...",
          })
          setTimeout(() => {
            onSuccess(email)
            onOpenChange(false)
          }, 1500)
        }, 300)
      } else {
        setNotification({
          show: true,
          type: "error",
          title: "Código inválido",
          message: "O código informado está incorreto. Tente novamente.",
        })
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResendCode = () => {
    setIsResending(true)
    setCountdown(60)
    setCode(["", "", "", "", "", ""])
    const newCode = generateRandomCode()
    setGeneratedCode(newCode)

    setTimeout(() => {
      setIsResending(false)
      setNotification({
        show: true,
        type: "info",
        title: "Código reenviado",
        message: `Um novo código foi enviado para ${email}`,
      })
    }, 1000)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          {step === "email" ? (
            <div className="space-y-6">
              {/* Email Step */}
              <div className="flex flex-col items-center space-y-4 pt-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A99D] to-[#00857A] flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Acesso de Usuário Externo</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Digite seu e-mail para receber o código de acesso aos documentos compartilhados.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="external-email" className="text-sm font-medium">
                    E-mail
                  </Label>
                  <Input
                    id="external-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-base"
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    autoFocus
                  />
                </div>

                <Button
                  onClick={handleSendCode}
                  className="w-full h-12 text-base font-medium bg-[#00A99D] hover:bg-[#00857A] text-white"
                >
                  Enviar código
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Code Verification Step */}
              <div className="flex flex-col items-center space-y-4 pt-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A99D] to-[#00857A] flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Verificação de Código</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Digite o código de 6 dígitos enviado para
                    <br />
                    <span className="text-[#00A99D] font-semibold">{email}</span>
                  </p>
                </div>
              </div>

              {/* Demo Code Display */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔒</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Código de demonstração:</p>
                    <p className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 tracking-wider">
                      {generatedCode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Code Input */}
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {code.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {/* Resend Code */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">Reenviar código em {countdown}s</p>
                  ) : (
                    <Button
                      variant="link"
                      onClick={handleResendCode}
                      disabled={isResending}
                      className="text-[#00A99D] hover:text-[#00857A]"
                    >
                      {isResending ? "Reenviando..." : "Reenviar código"}
                    </Button>
                  )}
                </div>

                {/* Back Button */}
                <Button
                  variant="outline"
                  onClick={() => setStep("email")}
                  className="w-full h-12 text-base font-medium"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar
                </Button>
              </div>
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
    </>
  )
}
