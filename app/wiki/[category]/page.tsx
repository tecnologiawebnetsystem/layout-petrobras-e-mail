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
      title: "Bem-vindo ao Sistema de Compartilhamento Petrobras",
      description: "Introdução ao sistema e principais funcionalidades",
      readTime: "5 min",
      author: "Equipe Petrobras",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Como fazer seu primeiro login",
      description: "Guia passo a passo para acessar sua conta via ServiceNow ou Entra ID",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Entendendo os perfis de usuário",
      description: "Interno, Externo e Supervisor - diferenças e permissões",
      readTime: "7 min",
      author: "Equipe Petrobras",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "4",
      title: "Navegando pelo Dashboard",
      description: "Conheça os widgets e informações da tela principal",
      readTime: "6 min",
      author: "Tutorial Team",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "5",
      title: "Configurando notificações por e-mail",
      description: "Receba alertas sobre uploads, aprovações e downloads",
      readTime: "4 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
  ],
  upload: [
    {
      id: "1",
      title: "Como fazer upload de arquivos",
      description: "Passo a passo completo para enviar documentos para externos",
      readTime: "5 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Preenchendo os campos do formulário",
      description: "Destinatário, validade, descrição e anexos",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Adicionando múltiplos arquivos",
      description: "Como anexar vários documentos de uma vez",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "4",
      title: "Definindo prazo de validade",
      description: "Configure por quanto tempo o arquivo ficará disponível",
      readTime: "3 min",
      author: "Documentação",
      type: "article",
      difficulty: "intermediate",
    },
    {
      id: "5",
      title: "Enviando arquivos ZIP",
      description: "Como visualizar conteúdo de arquivos compactados",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "intermediate",
    },
    {
      id: "6",
      title: "E-mails de confirmação",
      description: "Entenda os e-mails enviados após o upload",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
  ],
  download: [
    {
      id: "1",
      title: "Acessando a área de download",
      description: "Como usuários externos acessam os arquivos",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Baixando documentos",
      description: "Passo a passo para fazer download seguro",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Verificando integridade dos arquivos",
      description: "Como garantir que o download foi completo e seguro",
      readTime: "5 min",
      author: "Segurança",
      type: "article",
      difficulty: "intermediate",
    },
    {
      id: "4",
      title: "O que fazer se o link expirou",
      description: "Prazo de validade vencido - próximos passos",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
  ],
  approval: [
    {
      id: "1",
      title: "Como funciona o workflow de aprovação",
      description: "Entenda o processo completo desde o upload até a aprovação",
      readTime: "6 min",
      author: "Equipe Técnica",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Aprovando documentos como supervisor",
      description: "Passo a passo para revisar e aprovar uploads",
      readTime: "5 min",
      author: "Wagner Gaspar Brazil",
      type: "tutorial",
      difficulty: "intermediate",
    },
    {
      id: "3",
      title: "Rejeitando uploads com motivo",
      description: "Como rejeitar documentos e informar o motivo",
      readTime: "4 min",
      author: "Wagner Gaspar Brazil",
      type: "tutorial",
      difficulty: "intermediate",
    },
    {
      id: "4",
      title: "Visualizando conteúdo de arquivos ZIP",
      description: "Aprove ou rejeite arquivos individuais dentro de um ZIP",
      readTime: "5 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "advanced",
    },
    {
      id: "5",
      title: "Notificações de aprovação",
      description: "E-mails automáticos para remetente e destinatário",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
  ],
  historico: [
    {
      id: "1",
      title: "Acessando o histórico de uploads",
      description: "Veja todos os documentos enviados e seu status",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Logs de auditoria",
      description: "Rastreabilidade completa de todas as ações",
      readTime: "5 min",
      author: "Auditoria",
      type: "article",
      difficulty: "intermediate",
    },
    {
      id: "3",
      title: "Filtrando por status e data",
      description: "Encontre rapidamente o que procura",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "4",
      title: "Exportando relatórios",
      description: "Gere relatórios de atividades para análise",
      readTime: "4 min",
      author: "Equipe Técnica",
      type: "tutorial",
      difficulty: "intermediate",
    },
  ],
  settings: [
    {
      id: "1",
      title: "Alterando suas preferências",
      description: "Personalize idioma, tema e notificações",
      readTime: "4 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Modo escuro e claro",
      description: "Escolha o tema que prefere",
      readTime: "2 min",
      author: "Equipe Design",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Gerenciando notificações",
      description: "Configure quais e-mails você quer receber",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
  ],
  faq: [
    {
      id: "1",
      title: "Não consigo fazer login",
      description: "Soluções para problemas de acesso",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "2",
      title: "Quanto tempo os arquivos ficam disponíveis?",
      description: "Entenda o prazo de validade padrão e customizado",
      readTime: "2 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "3",
      title: "Posso enviar arquivos maiores que 100MB?",
      description: "Limites de tamanho e como proceder",
      readTime: "3 min",
      author: "Equipe Técnica",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "4",
      title: "O destinatário não recebeu o e-mail",
      description: "Checklist de troubleshooting para e-mails",
      readTime: "4 min",
      author: "Suporte Técnico",
      type: "article",
      difficulty: "beginner",
    },
    {
      id: "5",
      title: "Como cancelar um upload pendente?",
      description: "Remova arquivos antes da aprovação",
      readTime: "2 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "6",
      title: "Posso reenviar um arquivo expirado?",
      description: "Como fazer um novo envio do mesmo documento",
      readTime: "3 min",
      author: "Suporte Técnico",
      type: "tutorial",
      difficulty: "beginner",
    },
    {
      id: "7",
      title: "O sistema tem integração com ServiceNow?",
      description: "Sim, entenda como funciona a autenticação",
      readTime: "5 min",
      author: "Equipe Técnica",
      type: "article",
      difficulty: "intermediate",
    },
    {
      id: "8",
      title: "Meus dados estão seguros?",
      description: "Segurança, criptografia e conformidade LGPD",
      readTime: "6 min",
      author: "Segurança da Informação",
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
      historico: "Histórico e Auditoria",
      settings: "Configurações",
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
              <BreadcrumbLink href="/wiki" className="text-[#003F7F] hover:text-[#00A859]">
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
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#00A859]/10 flex items-center justify-center">
                    <TypeIcon className="h-6 w-6 text-[#00A859]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-[#00A859] transition-colors">
                        {article.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00A859] transition-colors flex-shrink-0" />
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
