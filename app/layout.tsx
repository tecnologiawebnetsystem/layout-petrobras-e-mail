import type React from "react"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ExpirationMonitor } from "@/components/shared/expiration-monitor"
import { EntraProvider } from "@/components/auth/entra-provider"
import { GlobalAlertProvider } from "@/components/shared/global-alert-provider"
import "./globals.css"

// CRITICO: força renderização dinâmica por request.
// Sem isso o Next.js renderiza o layout UMA VEZ no build e cacheia —
// os valores injetados pelo ECS em runtime nunca seriam refletidos no window.__ENV__.
export const dynamic = "force-dynamic"

export const inter = localFont({
  src: [
    {
      path: "../public/fonts/inter/Inter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/inter/Inter-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/inter/Inter-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/inter/Inter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-inter",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00A859",
}

export const metadata: Metadata = {
  title: {
    default: "Petrobras File Transfer - Transferencia Segura de Arquivos",
    template: "%s | Petrobras File Transfer",
  },
  description:
    "Sistema corporativo de transferencia segura de arquivos para destinatarios externos. Compartilhe documentos de forma controlada, auditavel e em conformidade com as politicas de seguranca da Petrobras.",
  keywords: [
    "Petrobras",
    "transferencia de arquivos",
    "compartilhamento seguro",
    "documentos corporativos",
    "upload seguro",
    "download controlado",
  ],
  authors: [{ name: "Petrobras", url: "https://petrobras.com.br" }],
  creator: "Petrobras",
  publisher: "Petrobras",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://transfer.petrobras.com.br",
    siteName: "Petrobras File Transfer",
    title: "Petrobras File Transfer - Transferencia Segura de Arquivos",
    description:
      "Sistema corporativo de transferencia segura de arquivos para destinatarios externos com aprovacao supervisionada e auditoria completa.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Petrobras File Transfer",
    description: "Transferencia segura de arquivos para destinatarios externos",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Injeta variáveis públicas no window.__ENV__ para que Client Components
  // possam lê-las em runtime (ECS injetou os valores corretos via SSM/Secrets Manager).
  //
  // IMPORTANTE: usa notação de COLCHETES process.env['VAR'] em vez de process.env.VAR
  // O webpack DefinePlugin só substitui dot-notation (process.env.NEXT_PUBLIC_*) em
  // tempo de build. Com bracket notation os valores são lidos do process.env real em
  // runtime — os valores injetados pelo ECS Task Definition.
  //
  // Mapeamento ECS → window.__ENV__:
  //   NEXT_PUBLIC_APP_URL    (SSM)           → NEXT_PUBLIC_APP_URL
  //   NEXT_PUBLIC_AUTH_MODE  (SSM)           → NEXT_PUBLIC_AUTH_MODE
  //   ENTRA_CLIENT_ID        (secret, via valueFrom) → NEXT_PUBLIC_ENTRA_CLIENT_ID
  //   ENTRA_TENANT_ID        (secret, via valueFrom) → NEXT_PUBLIC_ENTRA_TENANT_ID
  //   NEXT_PUBLIC_ENTRA_REDIRECT_URI derivado do APP_URL
  const appUrl = (process.env['NEXT_PUBLIC_APP_URL'] ?? "") as string
  const publicEnv = {
    NEXT_PUBLIC_AUTH_MODE: (process.env['NEXT_PUBLIC_AUTH_MODE'] ?? "entra") as string,
    // No ECS as chaves da secret chegam sem prefixo (ENTRA_CLIENT_ID).
    // No .env local chegam com prefixo (NEXT_PUBLIC_ENTRA_CLIENT_ID).
    NEXT_PUBLIC_ENTRA_CLIENT_ID:
      ((process.env['NEXT_PUBLIC_ENTRA_CLIENT_ID'] || process.env['ENTRA_CLIENT_ID'] || "") as string),
    NEXT_PUBLIC_ENTRA_TENANT_ID:
      ((process.env['NEXT_PUBLIC_ENTRA_TENANT_ID'] || process.env['ENTRA_TENANT_ID'] || "") as string),
    // Derivado do APP_URL do próprio frontend (ENTRA_REDIRECT_URI da secret aponta para o backend)
    NEXT_PUBLIC_ENTRA_REDIRECT_URI:
      ((process.env['NEXT_PUBLIC_ENTRA_REDIRECT_URI'] || "") as string) ||
      (appUrl ? `${appUrl}/api/auth/internal/callback` : ""),
    NEXT_PUBLIC_APP_URL: appUrl,
  }

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script síncrono no <head>: executa antes do bundle React */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__ENV__ = ${JSON.stringify(publicEnv)}`,
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <EntraProvider>
          <ThemeProvider>
            {children}
            <ExpirationMonitor />
            <GlobalAlertProvider />
          </ThemeProvider>
        </EntraProvider>
        <Analytics />
      </body>
    </html>
  )
}
