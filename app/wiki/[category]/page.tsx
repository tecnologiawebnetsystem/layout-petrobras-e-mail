"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ArrowLeft, Clock, User, ChevronRight, FileText, Video, ImageIcon } from "lucide-react"

interface Article {
  id: string
  title: string
  description: string
  readTime: string
  author: string
  type: "article" | "video" | "tutorial"
  difficulty: "beginner" | "intermediate" | "advanced"
}

const mockArticles: Record<string, Article[]> = {
  "getting-started": [
    {
      id: "1",
      title: "Bem-vindo ao Sistema de E-mails Petrobras",
      description: "Introdução ao sistema e principais funcionalidades",
      readTime: "5 min",
      author: "Equipe Petrobras",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Como fazer seu primeiro login",
      description: "Guia passo a passo para acessar sua conta",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Entendendo os diferentes tipos de usuário",
      description: "Interno, Externo e Supervisor - diferenças e permissões",
      readTime: "7 min",
      author: "Equipe Petrobras",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "4",
      title: "Tour pelo sistema",
      description: "Vídeo tutorial mostrando a interface completa",
      readTime: "10 min",
      author: "Tutorial Team",
      type: "video",
      difficulty: "beginner",
    },
    {
      id: "5",
      title: "Configurando sua conta pela primeira vez",
      description: "Personalize seu perfil e preferências",
      readTime: "6 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
  ],
  upload: [
    {
      id: "1",
      title: "Como fazer upload de arquivos",
      description: "Passo a passo para enviar documentos",
      readTime: "5 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Adicionando tags aos documentos",
      description: "Organize seus arquivos com categorias",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Limites de tamanho e formatos suportados",
      description: "Especificações técnicas de upload",
      readTime: "3 min",
      author: "Documentação",
      type: "article",
      difficulty: "intermediate",
    },
  ],
}

export default function WikiCategoryPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    const categoryArticles = mockArticles[params.category as string] || []
    setArticles(categoryArticles)
  }, [isAuthenticated, params.category, router])

  if (!isAuthenticated) {
    return null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return FileText
      case "video":
        return Video
      case "tutorial":
        return ImageIcon
      default:
        return FileText
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "advanced":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      "getting-started": "Primeiros Passos",
      upload: "Envio de Arquivos",
      download: "Download de Documentos",
      approval: "Sistema de Aprovação",
      tags: "Tags e Categorias",
      security: "Segurança",
      notifications: "Notificações",
      settings: "Configurações",
      users: "Gerenciamento de Usuários",
      faq: "Perguntas Frequentes",
    }
    return titles[category] || category
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AppHeader subtitle="Wiki e Documentação" />

      <main className="container max-w-5xl mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/wiki" className="text-[#0047BB] hover:text-[#003A99]">
                Wiki
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-600 dark:text-gray-400">
                {getCategoryTitle(params.category as string)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/wiki")} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Wiki
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {getCategoryTitle(params.category as string)}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {articles.length} artigos disponíveis nesta categoria
          </p>
        </div>

        <div className="space-y-4">
          {articles.map((article) => {
            const TypeIcon = getTypeIcon(article.type)
            return (
              <Card
                key={article.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/wiki/${params.category}/${article.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#00A99D]/10 flex items-center justify-center">
                    <TypeIcon className="h-6 w-6 text-[#00A99D]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#00A99D] transition-colors">
                        {article.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00A99D] transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{article.description}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge className={getDifficultyColor(article.difficulty)}>
                        {article.difficulty === "beginner" && "Iniciante"}
                        {article.difficulty === "intermediate" && "Intermediário"}
                        {article.difficulty === "advanced" && "Avançado"}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{article.readTime}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {articles.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhum artigo disponível</h3>
            <p className="text-gray-600 dark:text-gray-400">Os artigos desta categoria estão sendo preparados</p>
          </Card>
        )}
      </main>
    </div>
  )
}
