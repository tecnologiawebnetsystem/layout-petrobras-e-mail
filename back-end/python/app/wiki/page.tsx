"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { AppHeader } from "@/components/shared/app-header"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Book, Upload, Download, CheckSquare, Settings, Clock, HelpCircle, ChevronRight } from "lucide-react"

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
    description: "Aprenda a usar o sistema de compartilhamento de arquivos",
    icon: Book,
    articles: 5,
    color: "text-[#00A859] bg-[#00A859]/10",
  },
  {
    id: "upload",
    title: "Envio de Arquivos",
    description: "Como fazer upload e compartilhar documentos com externos",
    icon: Upload,
    articles: 6,
    color: "text-[#003F7F] bg-[#003F7F]/10",
  },
  {
    id: "download",
    title: "Download de Documentos",
    description: "Acesse e baixe arquivos compartilhados com você",
    icon: Download,
    articles: 4,
    color: "text-[#FDB913] bg-[#FDB913]/20",
  },
  {
    id: "approval",
    title: "Sistema de Aprovação",
    description: "Como supervisores aprovam ou rejeitam documentos",
    icon: CheckSquare,
    articles: 5,
    color: "text-[#00A859] bg-[#00A859]/10",
  },
  {
    id: "historico",
    title: "Histórico e Auditoria",
    description: "Acompanhe todas as ações e movimentações",
    icon: Clock,
    articles: 4,
    color: "text-[#003F7F] bg-[#003F7F]/10",
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Personalize sua conta e preferências do sistema",
    icon: Settings,
    articles: 3,
    color: "text-[#FDB913] bg-[#FDB913]/20",
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    description: "Dúvidas comuns e suas respostas",
    icon: HelpCircle,
    articles: 8,
    color: "text-[#00A859] bg-[#00A859]/10",
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
            Bem-vindo à Wiki do sistema de compartilhamento de arquivos Petrobras. Encontre guias, tutoriais e respostas
            para suas dúvidas.
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
          <Card className="p-6 border-l-4 border-l-[#00A859]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total de Artigos</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalArticles}</p>
              </div>
              <Book className="h-12 w-12 text-[#00A859]" />
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-[#003F7F]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Categorias</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{wikiCategories.length}</p>
              </div>
              <Clock className="h-12 w-12 text-[#003F7F]" />
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
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#00A859] transition-colors">
                        {category.title}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#00A859] transition-colors" />
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
