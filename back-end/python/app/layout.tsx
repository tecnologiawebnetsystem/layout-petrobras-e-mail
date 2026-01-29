import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ExpirationMonitor } from "@/components/shared/expiration-monitor"
import { EntraProvider } from "@/components/auth/entra-provider"
import { GlobalAlertProvider } from "@/components/shared/global-alert-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Petrobras - Sistema de E-mail",
  description: "Sistema de envio de e-mails para domínios externos",
  generator: "Petrobras Email System",
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
  return (
    <html lang="pt-BR" suppressHydrationWarning>
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
