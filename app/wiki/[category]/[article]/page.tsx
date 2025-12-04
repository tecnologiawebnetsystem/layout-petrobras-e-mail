"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Clock, User, ThumbsUp, Share2, BookmarkPlus } from "lucide-react"

export default function WikiArticlePage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      "getting-started": "Primeiros Passos",
      upload: "Envio de Arquivos",
    }
    return titles[category] || category
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AppHeader subtitle="Wiki e Documentação" />

      <main className="container max-w-4xl mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/wiki" className="text-[#0047BB] hover:text-[#003A99]">
                Wiki
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/wiki/${params.category}`} className="text-[#0047BB] hover:text-[#003A99]">
                {getCategoryTitle(params.category as string)}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-600 dark:text-gray-400">Artigo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Button variant="ghost" onClick={() => router.push(`/wiki/${params.category}`)} className="mb-6 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8">
          <div className="mb-6">
            <Badge className="mb-4">Iniciante</Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Bem-vindo ao Sistema de E-mails Petrobras
            </h1>
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Equipe Petrobras</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>5 min de leitura</span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="prose dark:prose-invert max-w-none">
            <h2>Introdução</h2>
            <p>
              O Sistema de E-mails da Petrobras é uma plataforma completa para gerenciamento de documentos, permitindo o
              envio seguro de arquivos para destinatários externos, workflow de aprovação multi-nível e controle total
              sobre downloads.
            </p>

            <h2>Principais Funcionalidades</h2>
            <ul>
              <li>
                <strong>Upload Seguro:</strong> Envie documentos com criptografia de ponta a ponta
              </li>
              <li>
                <strong>Tags e Categorias:</strong> Organize arquivos por categorias personalizadas
              </li>
              <li>
                <strong>Workflow de Aprovação:</strong> Sistema de aprovação com múltiplos níveis
              </li>
              <li>
                <strong>Notificações em Tempo Real:</strong> Seja notificado sobre todas as ações
              </li>
              <li>
                <strong>Busca Avançada:</strong> Encontre documentos rapidamente
              </li>
            </ul>

            <h2>Tipos de Usuário</h2>
            <h3>Usuário Interno</h3>
            <p>
              Funcionários da Petrobras que podem fazer upload de documentos e enviá-los para destinatários externos.
              Têm acesso ao módulo de upload completo.
            </p>

            <h3>Usuário Externo</h3>
            <p>
              Destinatários que recebem documentos. Podem fazer download de arquivos aprovados e visualizar histórico de
              recebimentos.
            </p>

            <h3>Supervisor</h3>
            <p>
              Responsáveis por aprovar ou rejeitar documentos no workflow de aprovação. Têm visão completa de todos os
              uploads e podem gerenciar permissões.
            </p>

            <h2>Próximos Passos</h2>
            <p>Agora que você conhece o sistema, recomendamos:</p>
            <ol>
              <li>Configurar seu perfil e preferências</li>
              <li>Explorar o módulo correspondente ao seu tipo de usuário</li>
              <li>Ler os guias específicos de cada funcionalidade</li>
            </ol>
          </div>

          <Separator className="my-6" />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Útil
              </Button>
              <Button variant="outline" size="sm">
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
