"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Home, Search, Copy, Check, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

export default function ComponentesReactPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const components = [
    // AUTENTICACAO
    {
      category: "Autenticacao",
      items: [
        {
          name: "LoginForm",
          path: "components/auth/login-form.tsx",
          description: "Formulario de login com opcoes de Entra ID e login demo",
          props: [
            { name: "onSuccess", type: "() => void", required: false, description: "Callback apos login bem sucedido" },
          ],
          example: `import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <LoginForm onSuccess={() => console.log("Logado!")} />
  )
}`,
          usage: "Usado na pagina inicial para autenticacao de usuarios internos e supervisores via Microsoft Entra ID ou modo demo.",
        },
        {
          name: "EntraProvider",
          path: "components/auth/entra-provider.tsx",
          description: "Provider do Microsoft Entra ID que gerencia autenticacao SSO",
          props: [
            { name: "children", type: "React.ReactNode", required: true, description: "Componentes filhos" },
          ],
          example: `import { EntraProvider } from "@/components/auth/entra-provider"

export default function RootLayout({ children }) {
  return (
    <EntraProvider>
      {children}
    </EntraProvider>
  )
}`,
          usage: "Deve envolver toda a aplicacao no layout.tsx para gerenciar o estado de autenticacao.",
        },
        {
          name: "OtpInput",
          path: "components/auth/otp-input.tsx",
          description: "Input de codigo OTP com 6 digitos para usuarios externos",
          props: [
            { name: "value", type: "string", required: true, description: "Valor atual do codigo" },
            { name: "onChange", type: "(value: string) => void", required: true, description: "Callback de mudanca" },
            { name: "disabled", type: "boolean", required: false, description: "Desabilita o input" },
            { name: "error", type: "boolean", required: false, description: "Mostra estado de erro" },
          ],
          example: `import { OtpInput } from "@/components/auth/otp-input"

const [otp, setOtp] = useState("")

<OtpInput
  value={otp}
  onChange={setOtp}
  disabled={isLoading}
  error={hasError}
/>`,
          usage: "Usado na tela de verificacao de usuario externo para digitar o codigo recebido por email.",
        },
      ],
    },
    // UPLOAD E COMPARTILHAMENTO
    {
      category: "Upload e Compartilhamento",
      items: [
        {
          name: "UploadForm",
          path: "components/upload/upload-form.tsx",
          description: "Formulario completo de compartilhamento de arquivos",
          props: [
            { name: "onSuccess", type: "() => void", required: false, description: "Callback apos upload bem sucedido" },
          ],
          example: `import { UploadForm } from "@/components/upload/upload-form"

export default function UploadPage() {
  return (
    <UploadForm onSuccess={() => router.push("/meus-compartilhamentos")} />
  )
}`,
          usage: "Formulario principal para usuarios internos criarem compartilhamentos. Inclui selecao de arquivos, destinatarios, motivo e tempo de expiracao.",
        },
        {
          name: "DragDropZone",
          path: "components/upload/drag-drop-zone.tsx",
          description: "Zona de arrastar e soltar arquivos com validacao",
          props: [
            { name: "onFilesSelected", type: "(files: File[]) => void", required: true, description: "Callback quando arquivos sao selecionados" },
            { name: "maxSize", type: "number", required: false, description: "Tamanho maximo em bytes (default: 500MB)" },
            { name: "accept", type: "string[]", required: false, description: "Extensoes aceitas" },
            { name: "disabled", type: "boolean", required: false, description: "Desabilita a zona" },
          ],
          example: `import { DragDropZone } from "@/components/upload/drag-drop-zone"

<DragDropZone
  onFilesSelected={(files) => setSelectedFiles(files)}
  maxSize={500 * 1024 * 1024}
  accept={[".pdf", ".docx", ".xlsx"]}
/>`,
          usage: "Componente de upload que valida extensoes bloqueadas (.exe, .bat, etc) e tamanho maximo do arquivo.",
        },
        {
          name: "FileList",
          path: "components/upload/file-list.tsx",
          description: "Lista de arquivos selecionados com opcao de remover",
          props: [
            { name: "files", type: "File[]", required: true, description: "Array de arquivos" },
            { name: "onRemove", type: "(index: number) => void", required: true, description: "Callback para remover arquivo" },
          ],
          example: `import { FileList } from "@/components/upload/file-list"

<FileList
  files={selectedFiles}
  onRemove={(index) => removeFile(index)}
/>`,
          usage: "Exibe os arquivos selecionados para upload com nome, tamanho e botao de remover.",
        },
        {
          name: "RecipientInput",
          path: "components/upload/recipient-input.tsx",
          description: "Input para adicionar destinatarios externos por email",
          props: [
            { name: "recipients", type: "string[]", required: true, description: "Lista de emails" },
            { name: "onChange", type: "(recipients: string[]) => void", required: true, description: "Callback de mudanca" },
            { name: "maxRecipients", type: "number", required: false, description: "Maximo de destinatarios (default: 10)" },
          ],
          example: `import { RecipientInput } from "@/components/upload/recipient-input"

<RecipientInput
  recipients={emails}
  onChange={setEmails}
  maxRecipients={5}
/>`,
          usage: "Permite adicionar multiplos emails de destinatarios externos. Valida formato de email e bloqueia dominios internos.",
        },
      ],
    },
    // SUPERVISOR
    {
      category: "Supervisor",
      items: [
        {
          name: "PendingApprovalsTable",
          path: "components/supervisor/pending-approvals-table.tsx",
          description: "Tabela de compartilhamentos pendentes de aprovacao",
          props: [
            { name: "onApprove", type: "(id: string) => void", required: true, description: "Callback de aprovacao" },
            { name: "onReject", type: "(id: string, reason: string) => void", required: true, description: "Callback de rejeicao" },
          ],
          example: `import { PendingApprovalsTable } from "@/components/supervisor/pending-approvals-table"

<PendingApprovalsTable
  onApprove={(id) => handleApprove(id)}
  onReject={(id, reason) => handleReject(id, reason)}
/>`,
          usage: "Exibe lista de compartilhamentos aguardando aprovacao do supervisor com acoes de aprovar/rejeitar.",
        },
        {
          name: "ApprovalDialog",
          path: "components/supervisor/approval-dialog.tsx",
          description: "Dialog de confirmacao de aprovacao/rejeicao",
          props: [
            { name: "open", type: "boolean", required: true, description: "Estado de abertura" },
            { name: "onOpenChange", type: "(open: boolean) => void", required: true, description: "Callback de mudanca" },
            { name: "share", type: "Share", required: true, description: "Dados do compartilhamento" },
            { name: "action", type: "'approve' | 'reject'", required: true, description: "Tipo de acao" },
            { name: "onConfirm", type: "(reason?: string) => void", required: true, description: "Callback de confirmacao" },
          ],
          example: `import { ApprovalDialog } from "@/components/supervisor/approval-dialog"

<ApprovalDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  share={selectedShare}
  action="approve"
  onConfirm={() => confirmApproval()}
/>`,
          usage: "Modal que solicita confirmacao antes de aprovar ou rejeitar. Para rejeicao, exige motivo obrigatorio.",
        },
        {
          name: "SupervisorStats",
          path: "components/supervisor/supervisor-stats.tsx",
          description: "Cards de estatisticas do supervisor",
          props: [],
          example: `import { SupervisorStats } from "@/components/supervisor/supervisor-stats"

<SupervisorStats />`,
          usage: "Exibe metricas: total de pendentes, aprovados hoje, rejeitados, taxa de aprovacao.",
        },
      ],
    },
    // DOWNLOAD EXTERNO
    {
      category: "Download Externo",
      items: [
        {
          name: "ExternalVerifyForm",
          path: "components/external/external-verify-form.tsx",
          description: "Formulario de verificacao de email externo",
          props: [
            { name: "onVerified", type: "(email: string) => void", required: true, description: "Callback apos verificacao" },
          ],
          example: `import { ExternalVerifyForm } from "@/components/external/external-verify-form"

<ExternalVerifyForm
  onVerified={(email) => router.push("/download")}
/>`,
          usage: "Primeira etapa do fluxo externo: usuario informa email e recebe codigo OTP.",
        },
        {
          name: "DownloadCard",
          path: "components/external/download-card.tsx",
          description: "Card de arquivo disponivel para download",
          props: [
            { name: "file", type: "File", required: true, description: "Dados do arquivo" },
            { name: "onDownload", type: "() => void", required: true, description: "Callback de download" },
            { name: "onPreview", type: "() => void", required: false, description: "Callback de preview" },
          ],
          example: `import { DownloadCard } from "@/components/external/download-card"

<DownloadCard
  file={fileData}
  onDownload={() => handleDownload()}
  onPreview={() => handlePreview()}
/>`,
          usage: "Exibe informacoes do arquivo (nome, tamanho, remetente, expiracao) com botoes de acao.",
        },
        {
          name: "TermsAcceptance",
          path: "components/external/terms-acceptance.tsx",
          description: "Checkbox de aceite dos termos de uso",
          props: [
            { name: "accepted", type: "boolean", required: true, description: "Estado de aceite" },
            { name: "onChange", type: "(accepted: boolean) => void", required: true, description: "Callback de mudanca" },
          ],
          example: `import { TermsAcceptance } from "@/components/external/terms-acceptance"

<TermsAcceptance
  accepted={termsAccepted}
  onChange={setTermsAccepted}
/>`,
          usage: "Usuario externo deve aceitar os termos antes de baixar. O aceite e registrado para auditoria.",
        },
      ],
    },
    // SHARED / COMUM
    {
      category: "Compartilhados",
      items: [
        {
          name: "AppHeader",
          path: "components/shared/app-header.tsx",
          description: "Header da aplicacao com menu do usuario",
          props: [],
          example: `import { AppHeader } from "@/components/shared/app-header"

<AppHeader />`,
          usage: "Header padrao com logo Petrobras, busca, notificacoes e menu do usuario com opcoes de logout.",
        },
        {
          name: "ExpirationBadge",
          path: "components/shared/expiration-badge.tsx",
          description: "Badge que mostra tempo restante ate expiracao",
          props: [
            { name: "expiresAt", type: "Date | string", required: true, description: "Data de expiracao" },
            { name: "showIcon", type: "boolean", required: false, description: "Mostra icone de relogio" },
          ],
          example: `import { ExpirationBadge } from "@/components/shared/expiration-badge"

<ExpirationBadge
  expiresAt={share.expiresAt}
  showIcon={true}
/>`,
          usage: "Muda de cor conforme urgencia: verde (>24h), amarelo (>6h), vermelho (<6h), cinza (expirado).",
        },
        {
          name: "StatusBadge",
          path: "components/shared/status-badge.tsx",
          description: "Badge de status do compartilhamento",
          props: [
            { name: "status", type: "'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled'", required: true, description: "Status atual" },
          ],
          example: `import { StatusBadge } from "@/components/shared/status-badge"

<StatusBadge status="pending" />`,
          usage: "Exibe status com cor e icone apropriados: amarelo (pendente), verde (aprovado), vermelho (rejeitado).",
        },
        {
          name: "LoadingSpinner",
          path: "components/shared/loading-spinner.tsx",
          description: "Spinner de carregamento animado",
          props: [
            { name: "size", type: "'sm' | 'md' | 'lg'", required: false, description: "Tamanho (default: md)" },
            { name: "text", type: "string", required: false, description: "Texto abaixo do spinner" },
          ],
          example: `import { LoadingSpinner } from "@/components/shared/loading-spinner"

<LoadingSpinner size="lg" text="Carregando..." />`,
          usage: "Usado em estados de loading de paginas e componentes.",
        },
        {
          name: "EmptyState",
          path: "components/shared/empty-state.tsx",
          description: "Estado vazio com icone e mensagem",
          props: [
            { name: "icon", type: "LucideIcon", required: true, description: "Icone a exibir" },
            { name: "title", type: "string", required: true, description: "Titulo principal" },
            { name: "description", type: "string", required: false, description: "Descricao secundaria" },
            { name: "action", type: "React.ReactNode", required: false, description: "Botao de acao" },
          ],
          example: `import { EmptyState } from "@/components/shared/empty-state"
import { FileX } from "lucide-react"

<EmptyState
  icon={FileX}
  title="Nenhum arquivo encontrado"
  description="Voce ainda nao tem compartilhamentos"
  action={<Button>Criar Primeiro</Button>}
/>`,
          usage: "Exibido quando listas estao vazias (sem compartilhamentos, sem notificacoes, etc).",
        },
      ],
    },
  ]

  const filteredComponents = components.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar para Wiki
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Guia de Componentes React</h1>
            <p className="text-slate-600">
              Documentacao completa de todos os componentes do sistema com props, exemplos e casos de uso
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar componente..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Components */}
          <div className="space-y-8">
            {filteredComponents.map((category) => (
              <div key={category.category}>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="h-6 w-1 bg-blue-500 rounded-full" />
                  {category.category}
                </h2>
                
                <div className="space-y-4">
                  {category.items.map((component) => (
                    <Card key={component.name} className="overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedComponent(
                          expandedComponent === component.name ? null : component.name
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <code className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-base">
                                {`<${component.name} />`}
                              </code>
                            </CardTitle>
                            <CardDescription className="mt-1">{component.description}</CardDescription>
                            <p className="text-xs text-slate-400 mt-1 font-mono">{component.path}</p>
                          </div>
                          {expandedComponent === component.name ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedComponent === component.name && (
                        <CardContent className="border-t bg-slate-50/50">
                          {/* Props */}
                          {component.props.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-slate-700 mb-3">Props</h4>
                              <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-100">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium">Prop</th>
                                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                                      <th className="px-4 py-2 text-left font-medium">Obrigatorio</th>
                                      <th className="px-4 py-2 text-left font-medium">Descricao</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {component.props.map((prop) => (
                                      <tr key={prop.name} className="border-t">
                                        <td className="px-4 py-2 font-mono text-blue-600">{prop.name}</td>
                                        <td className="px-4 py-2 font-mono text-xs text-slate-600">{prop.type}</td>
                                        <td className="px-4 py-2">
                                          <Badge variant={prop.required ? "default" : "secondary"}>
                                            {prop.required ? "Sim" : "Nao"}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600">{prop.description}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Exemplo */}
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-slate-700">Exemplo de Uso</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(component.example, component.name)}
                              >
                                {copiedId === component.name ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                              <code>{component.example}</code>
                            </pre>
                          </div>

                          {/* Uso */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-1">Quando Usar</h4>
                            <p className="text-sm text-blue-700">{component.usage}</p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Suspense>
  )
}
