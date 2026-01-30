"use client"

import { useEffect, useState } from "react"
import Head from "next/head"

export default function DocsPage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Adiciona o CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css"
    document.head.appendChild(link)

    // Carrega os scripts na ordem correta
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = () => resolve()
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const initSwagger = async () => {
      try {
        await loadScript("https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js")
        await loadScript("https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js")

        if ((window as any).SwaggerUIBundle) {
          (window as any).SwaggerUIBundle({
            url: "/openapi.yaml",
            dom_id: "#swagger-ui",
            presets: [
              (window as any).SwaggerUIBundle.presets.apis,
              (window as any).SwaggerUIStandalonePreset,
            ],
            layout: "StandaloneLayout",
          })
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Erro ao carregar Swagger UI:", error)
        setIsLoading(false)
      }
    }

    initSwagger()

    return () => {
      // Cleanup
      link.remove()
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando documentacao...</p>
          </div>
        </div>
      )}
      <div id="swagger-ui" />
    </div>
  )
}
