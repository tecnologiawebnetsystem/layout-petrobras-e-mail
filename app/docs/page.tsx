"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando documentacao...</p>
      </div>
    </div>
  )
})

export default function DocsPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documentacao...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .swagger-ui {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 30px 0;
        }
        .swagger-ui .info .title {
          color: #006633;
        }
        .swagger-ui .info .title small.version-stamp {
          background-color: #006633;
        }
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #22c55e;
        }
        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
          background: #a855f7;
        }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }
        .swagger-ui .btn.execute {
          background-color: #006633;
          border-color: #006633;
        }
        .swagger-ui .btn.execute:hover {
          background-color: #004d26;
        }
        .swagger-ui section.models {
          border-color: #e5e7eb;
        }
        .swagger-ui section.models h4 {
          color: #374151;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        <SwaggerUI url="/openapi.yaml" />
      </div>
    </>
  )
}
