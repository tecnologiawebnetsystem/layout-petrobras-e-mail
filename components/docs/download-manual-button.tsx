"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  variant?: "solid" | "outline"
  label?: string
}

/**
 * Botao que gera e baixa o PDF do Manual do Usuario (com logo Petrobras
 * no cabecalho e marca d'agua). A geracao acontece no navegador via jsPDF.
 */
export function DownloadManualButton({
  className,
  variant = "outline",
  label = "Baixar PDF",
}: Props) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (loading) return
    setLoading(true)
    try {
      // import dinamico para nao carregar o jsPDF no bundle inicial da pagina
      const { generateManualPdf } = await import("@/lib/docs/generate-manual-pdf")
      await generateManualPdf()
    } catch (err) {
      console.error("[v0] Falha ao gerar o PDF do manual:", err)
      alert("Nao foi possivel gerar o PDF. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      aria-busy={loading}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed",
        variant === "solid"
          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
          : "border bg-background hover:bg-muted",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? "Gerando PDF..." : label}
    </button>
  )
}
