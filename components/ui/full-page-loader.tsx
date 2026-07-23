"use client"

import { useEffect, useState } from "react"

interface FullPageLoaderProps {
  message?: string
  subMessage?: string
}

/**
 * Loader de tela cheia compacto e elegante.
 * Usado em paginas que precisam aguardar dados antes de renderizar
 * (ex: painel do gestor, painel do auditor, upload).
 */
export function FullPageLoader({
  message = "Carregando...",
  subMessage = "Aguarde enquanto preparamos sua area de trabalho",
}: FullPageLoaderProps) {
  // Tres pontos pulsantes em sequencia para indicar atividade
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % 3), 480)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      {/* Fundo sutil */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full blur-3xl opacity-20 bg-[#00a859]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Logo */}
        <img
          src="/images/petrobras-full-logo.png"
          alt="Petrobras"
          className="h-8 w-auto opacity-85"
          width={128}
          height={32}
        />

        {/* Spinner duplo refinado */}
        <div className="relative h-14 w-14" aria-hidden="true">
          {/* Anel externo lento */}
          <svg
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s" }}
            viewBox="0 0 56 56"
            fill="none"
          >
            <circle cx="28" cy="28" r="24" stroke="#003f7f" strokeWidth="2.5" strokeOpacity="0.18" />
            <circle
              cx="28"
              cy="28"
              r="24"
              stroke="#003f7f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24 * 0.22} ${2 * Math.PI * 24 * 0.78}`}
            />
          </svg>
          {/* Anel interno mais rapido */}
          <svg
            className="absolute inset-2 animate-spin"
            style={{ animationDuration: "1.2s", animationDirection: "reverse" }}
            viewBox="0 0 40 40"
            fill="none"
          >
            <circle cx="20" cy="20" r="16" stroke="#00a859" strokeWidth="2.5" strokeOpacity="0.18" />
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="#00a859"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16 * 0.3} ${2 * Math.PI * 16 * 0.7}`}
            />
          </svg>
          {/* Ponto central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-[#00a859] animate-pulse" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center space-y-1.5">
          <p className="text-base font-semibold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">{subMessage}</p>
        </div>

        {/* Tres pontos indicadores sequenciais */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === active ? "#00a859" : "#003f7f",
                opacity: i === active ? 1 : 0.25,
                transform: i === active ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
