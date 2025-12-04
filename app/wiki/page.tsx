"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Book,
  Upload,
  Download,
  CheckSquare,
  Settings,
  Bell,
  Tags,
  Shield,
  Users,
  HelpCircle,
  ChevronRight,
} from "lucide-react"

interface WikiCategory {
  id: string
  title: string
  description: string
  icon: any
  articles: number
  color: string
}

const wikiCategories: WikiCategory[] = [
  {
    id: "getting-started",
    title: "Primeiros Passos",
    description: "Aprenda o básico do sistema de e-mails da Petrobras",
    icon: Book,
    articles: 5,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    id: "upload",
    title: "Envio de Arquivos",
    description: "Como fazer upload e compartilhar documentos",
    icon: Upload,
    articles: 8,
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    id: "download",
    title: "Download de Documentos",
    description: "Baixe arquivos de forma segura e organizada",
    icon: Download,
    articles: 6,
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  },
  {
    id: "approval",
    title: "Sistema de Aprovação",
    description: "Workflow de aprovação multi-nível e gerenciamento",
    icon: CheckSquare,
    articles: 7,
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  },
  {
    id: "tags",
    title: "Tags e Categorias",
    description: "Organize documentos com tags personalizadas",
    icon: Tags,
    articles: 4,
    color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30",
  },
  {
    id: "security",
    title: "Segurança",
    description: "Recursos de segurança e proteção de dados",
    icon: Shield,
    articles: 9,
    color: "text-red-600 bg-red-100 dark:bg-red-900/30",
  },
  {
    id: "notifications",
    title: "Notificações",
    description: "Configure e gerencie suas notificações",
    icon: Bell,
    articles: 5,
    color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Personalize sua conta e preferências",
    icon: Settings,
    articles: 6,
    color: "text-gray-600 bg-gray-100 dark:bg-gray-900/30",
  },
  {
    id: "users",
    title: "Gerenciamento de Usuários",
    description: "Perfis e permissões de usuários",
    icon: Users,
    articles: 4,
    color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    description: "Respostas para dúvidas comuns",
    icon: HelpCircle,
    articles: 12,
    color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30",
  },
]

export default function WikiPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const filteredCategories = wikiCategories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalArticles = wikiCategories.reduce((acc, cat) => acc + cat.articles, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <AppHeader subtitle="Wiki e Documentação" />

      <main className="container max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00A99D] mb-4">
            <Book className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Central de Conhecimento</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bem-vindo à Wiki do sistema de e-mails Petrobras. Encontre guias, tutoriais e respostas para suas dúvidas.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar artigos, tutoriais, perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Artigos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalArticles}</p>
              </div>
              <Book className="h-12 w-12 text-[#00A99D]" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categorias</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{wikiCategories.length}</p>
              </div>
              <Tags className="h-12 w-12 text-[#0047BB]" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => router.push(`/wiki/${category.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#00A99D] transition-colors">
                        {category.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00A99D] transition-colors" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{category.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {category.articles} artigos
                    </Badge>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nenhuma categoria encontrada</h3>
            <p className="text-gray-600 dark:text-gray-400">Tente ajustar sua busca</p>
          </div>
        )}
      </main>
    </div>
  )
}
