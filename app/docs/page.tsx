"use client"

import { useEffect } from "react"
import Script from "next/script"

export default function DocsPage() {
  useEffect(() => {
    // Inicializa o SwaggerUI quando os scripts estiverem carregados
    const initSwagger = () => {
      if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: "/openapi.yaml",
          dom_id: "#swagger-ui",
          presets: [
            (window as any).SwaggerUIBundle.presets.apis,
            (window as any).SwaggerUIStandalonePreset,
          ],
          layout: "StandaloneLayout",
        })
      }
    }

    // Tenta inicializar após um pequeno delay para garantir que os scripts carregaram
    const timer = setTimeout(initSwagger, 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
            (window as any).SwaggerUIBundle({
              url: "/openapi.yaml",
              dom_id: "#swagger-ui",
              presets: [
                (window as any).SwaggerUIBundle.presets.apis,
                (window as any).SwaggerUIStandalonePreset,
              ],
              layout: "StandaloneLayout",
            })
          }
        }}
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css"
      />
      <div id="swagger-ui" className="min-h-screen" />
    </>
  )
}
