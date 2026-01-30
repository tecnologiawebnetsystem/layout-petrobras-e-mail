import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation - Petrobras Email System",
  description: "Documentação da API do Sistema de E-mail Petrobras",
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
