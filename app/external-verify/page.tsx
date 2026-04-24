"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { otpService } from "@/lib/auth/otp-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { AlertCircle, Mail, Clock, CheckCircle2 } from "lucide-react"

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(180)
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push("/")
      return
    }

    const generatedCode = otpService.generateOTP(email)
    // console.log(`[DEV] Código OTP gerado para ${email}: ${generatedCode}`)
    setCodeSent(true)

    const interval = setInterval(() => {
      const remaining = otpService.getTimeRemaining(email)
      setTimeRemaining(remaining)

      if (remaining === 0) {
        clearInterval(interval)
        setError("Código expirado. Retorne à página inicial e solicite um novo código.")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [email, router])

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Por favor, insira o código de 6 dígitos.")
      return
    }

    setLoading(true)
    setError("")

    const result = otpService.validateOTP(email, code)

    if (result.valid) {
      setAuth(
        {
          id: `external-${Date.now()}`,
          name: email.split("@")[0],
          email: email,
          userType: "external",
        },
        "",  // external OTP não emite access_token JWT
        ""
      )

      router.push("/download")
    } else {
      setError(result.message)
      setCode("")
    }

    setLoading(false)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0047BB]/5 via-white to-[#FFB81C]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <PetrobrasLogo size="xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Verificação de Acesso</h1>
            <p className="text-muted-foreground mt-2">Solução de Compartilhamento de Arquivos Confidenciais</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-8 shadow-lg space-y-6">
          {codeSent && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">Código enviado!</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Um código de verificação foi enviado para <strong>{email}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Código de Verificação</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setCode(value)
                  setError("")
                }}
                className="pl-10 text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                disabled={loading || timeRemaining === 0}
              />
            </div>
            <p className="text-xs text-muted-foreground">Insira o código de 6 dígitos que foi enviado para seu email</p>
          </div>

          {timeRemaining > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              <span className="text-muted-foreground">restantes</span>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={loading || code.length !== 6 || timeRemaining === 0}
              className="w-full bg-[#0047BB] hover:bg-[#003A99]"
              size="lg"
            >
              {loading ? "Verificando..." : "Verificar Código"}
            </Button>

            <Button onClick={() => router.push("/")} variant="outline" className="w-full" size="lg">
              Voltar ao Início
            </Button>
          </div>

          <div className="pt-4 border-t text-center space-y-2">
            <p className="text-xs text-muted-foreground">Não recebeu o código?</p>
            <Button variant="link" className="text-xs" onClick={() => router.push("/")} disabled={timeRemaining > 0}>
              Solicitar novo código
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Este é um acesso seguro e temporário</p>
          <p>© 2025 Petrobras. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default function ExternalVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0047BB]/5 via-white to-[#FFB81C]/5 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-12 w-48 bg-muted rounded-lg mx-auto" />
            <div className="h-64 w-96 bg-muted rounded-lg" />
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
