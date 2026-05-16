"use client"

import { useEffect, useState } from "react"

interface FullPageLoaderProps {
  message?: string
  subMessage?: string
}

export function FullPageLoader({ 
  message = "Autenticando...", 
  subMessage = "Aguarde enquanto validamos suas credenciais" 
}: FullPageLoaderProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Background gradient sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00a859]/5 via-transparent to-[#003f7f]/5" />
      
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo Petrobras */}
        <img
          src="/images/petrobras-full-logo.png"
          alt="Petrobras"
          className="h-12 w-auto opacity-90"
        />

        {/* Spinner animado com cores Petrobras */}
        <div className="relative">
          {/* Anel externo */}
          <div className="w-16 h-16 rounded-full border-4 border-muted" />
          
          {/* Anel animado */}
          <div 
            className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-[#00a859] border-r-[#003f7f] animate-spin"
            style={{ animationDuration: "1s" }}
          />
          
          {/* Ponto central pulsante */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#00a859] animate-pulse" />
          </div>
        </div>

        {/* Mensagens */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">
            {message}{dots}
          </p>
          <p className="text-sm text-muted-foreground">
            {subMessage}
          </p>
        </div>

        {/* Barra de progresso indeterminada */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full progress-petrobras"
            style={{ width: "40%" }}
          />
        </div>
      </div>
    </div>
  )
}
