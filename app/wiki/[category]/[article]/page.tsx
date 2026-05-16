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

      <main className="container max-w-4xl mx-auto px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/wiki" className="text-[#003F7F] hover:text-[#00A859]">
                Wiki
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/wiki/${params.category}`} className="text-[#003F7F] hover:text-[#00A859]">
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
            <Badge className="mb-4 bg-[#00A859] text-white">Iniciante</Badge>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Bem-vindo ao Sistema de Compartilhamento Petrobras
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
              O Sistema de Compartilhamento de Arquivos da Petrobras é uma plataforma segura e moderna para envio de
              documentos para destinatários externos, com workflow de aprovação supervisionado, rastreabilidade completa
              e integração com ServiceNow e Microsoft Entra ID.
            </p>

            <h2>Principais Funcionalidades</h2>
            <ul>
              <li>
                <strong>Upload Seguro com Aprovação:</strong> Envie documentos que passam por aprovação de supervisor
                antes de serem liberados
              </li>
              <li>
                <strong>Notificações Automáticas:</strong> E-mails enviados via AWS SES para remetente, supervisor e
                destinatário
              </li>
              <li>
                <strong>Prazo de Validade:</strong> Defina por quanto tempo os arquivos ficam disponíveis para download
              </li>
              <li>
                <strong>Visualização de ZIP:</strong> Supervisores podem ver conteúdo de arquivos compactados antes de
                aprovar
              </li>
              <li>
                <strong>Histórico e Auditoria:</strong> Rastreabilidade completa de todas as ações no sistema
              </li>
              <li>
                <strong>Autenticação Corporativa:</strong> Login via Microsoft Entra ID (Azure AD) com SSO
              </li>
            </ul>

            <h2>Tipos de Usuário</h2>
            <h3>Usuário Interno</h3>
            <p>
              Funcionários da Petrobras que fazem upload de documentos para enviar a destinatários externos. Exemplo:
              Kleber Gonçalves (kleber.goncalves.prestserv@petrobras.com.br). Podem acessar o módulo de upload,
              histórico e configurações.
            </p>

            <h3>Usuário Externo</h3>
            <p>
              Destinatários que recebem documentos. Acessam apenas a área de download com link seguro recebido por
              e-mail. Podem baixar arquivos aprovados dentro do prazo de validade.
            </p>

            <h3>Supervisor</h3>
            <p>
              Responsáveis por aprovar ou rejeitar uploads antes de liberá-los para os destinatários externos. Exemplo:
              Wagner Gaspar Brazil (wagner.brazil@petrobras.com.br). Têm acesso à área de supervisão com visualização de
              arquivos ZIP e controle total do workflow.
            </p>

            <h2>Fluxo Completo</h2>
            <ol>
              <li>
                <strong>Upload:</strong> Usuário interno faz upload e preenche formulário com destinatário e validade
              </li>
              <li>
                <strong>Notificação:</strong> Sistema envia e-mail para o supervisor informando novo upload pendente
              </li>
              <li>
                <strong>Aprovação:</strong> Supervisor revisa e aprova ou rejeita o documento
              </li>
              <li>
                <strong>Liberação:</strong> Se aprovado, destinatário recebe e-mail com link de download
              </li>
              <li>
                <strong>Download:</strong> Destinatário acessa e baixa o arquivo dentro do prazo
              </li>
              <li>
                <strong>Auditoria:</strong> Todas as ações ficam registradas no histórico
              </li>
            </ol>

            <h2>Segurança e Compliance</h2>
            <p>
              O sistema utiliza AWS (DynamoDB, S3, SES) para armazenamento seguro e escalável. Integração com ServiceNow
              garante autenticação corporativa. Logs completos de auditoria para conformidade com políticas internas da
              Petrobras.
            </p>

            <h2>Próximos Passos</h2>
            <p>Agora que você conhece o sistema, recomendamos:</p>
            <ol>
              <li>Fazer login com suas credenciais corporativas (ServiceNow ou Entra ID)</li>
              <li>Explorar o dashboard do seu perfil de usuário</li>
              <li>Ler os tutoriais específicos para sua função (Interno, Externo ou Supervisor)</li>
              <li>Testar o envio de um documento de exemplo</li>
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
