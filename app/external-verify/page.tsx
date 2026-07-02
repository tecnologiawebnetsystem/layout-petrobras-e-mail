"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PetrobrasLogo } from "@/components/ui/petrobras-logo"
import { FullPageLoader } from "@/components/ui/full-page-loader"
import { AlertCircle, Mail, Clock, CheckCircle2 } from "lucide-react"

function VerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email") || ""
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)

  const requestCode = useCallback(async () => {
    if (!email) return
    setRequesting(true)
    setError("")
    try {
      const res = await fetch("/api/auth/external/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, validity_minutes: 10 }),
      })
      const data = await res.json() as {
        message?: string
        expires_at?: string
        error?: { message?: string }
      }
      if (!res.ok) {
        setError(data.error?.message ?? "Erro ao solicitar cÃ³digo. Tente novamente.")
        return
      }
      setExpiresAt(new Date(data.expires_at!))
      setCodeSent(true)
    } catch {
      setError("NÃ£o foi possÃ­vel enviar o cÃ³digo. Verifique sua conexÃ£o.")
    } finally {
      setRequesting(false)
      setPageLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (!email) {
      router.push("/")
      return
    }
    requestCode()
  }, [email, router, requestCode])

  // Contagem regressiva baseada no expires_at retornado pelo backend
  useEffect(() => {
    if (!expiresAt) return
    const update = () => {
      const remaining = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000))
      setTimeRemaining(remaining)
      if (remaining === 0) {
        setError("CÃ³digo expirado. Solicite um novo cÃ³digo.")
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (pageLoading) {
    return (
      <FullPageLoader
        message="Preparando verificaÃ§Ã£o..."
        subMessage="Enviando cÃ³digo de acesso por e-mail"
      />
    )
  }

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError("Por favor, insira o cÃ³digo de 6 dÃ­gitos.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/external/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, access_valid_hours: 24 }),
      })
      const data = await res.json() as {
        token?: string
        expires_at?: string
        share_id?: number
        error?: { message?: string }
        detail?: string
      }

      if (!res.ok) {
        setError(data.error?.message ?? data.detail ?? "CÃ³digo invÃ¡lido. Tente novamente.")
        setCode("")
        return
      }

      // Armazena o token de acesso temporÃ¡rio emitido pelo backend no auth store
      setAuth(
        {
          id: `external-${email}`,
          name: email.split("@")[0],
          email,
          userType: "external",
        },
        data.token!,
        ""
      )

      router.push("/download")
    } catch {
      setError("Erro de conexÃ£o. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <PetrobrasLogo size="xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">VerificaÃ§Ã£o de Acesso</h1>
            <p className="text-muted-foreground mt-2">SoluÃ§Ã£o de Compartilhamento de Arquivos Confidenciais</p>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-8 shadow-lg space-y-6">
          {codeSent && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">CÃ³digo enviado!</p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Um cÃ³digo de verificaÃ§Ã£o foi enviado para <strong>{email}</strong>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">CÃ³digo de VerificaÃ§Ã£o</label>
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
            <p className="text-xs text-muted-foreground">Insira o cÃ³digo de 6 dÃ­gitos recebido no seu e-mail</p>
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
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
              size="lg"
            >
              {loading ? "Verificando..." : "Verificar CÃ³digo"}
            </Button>

            <Button onClick={() => router.push("/")} variant="outline" className="w-full" size="lg">
              Voltar ao InÃ­cio
            </Button>
          </div>

          <div className="pt-4 border-t text-center space-y-2">
            <p className="text-xs text-muted-foreground">NÃ£o recebeu o cÃ³digo?</p>
            <Button
              variant="link"
              className="text-xs"
              onClick={requestCode}
              disabled={requesting || timeRemaining > 0}
            >
              {requesting ? "Enviando..." : "Solicitar novo cÃ³digo"}
            </Button>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Este Ã© um acesso seguro e temporÃ¡rio</p>
          <p>Â© 2026 Petrobras. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default function ExternalVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5 flex items-center justify-center">
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
