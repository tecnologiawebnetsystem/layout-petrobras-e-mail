"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, ChevronDown, ChevronRight, Users, Clock, Shield, FileText, Mail, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function RegrasNegocioPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>("perfis")

  const sections = [
    {
      id: "perfis",
      title: "Perfis de Usuario",
      icon: Users,
      color: "blue",
      content: (
        <div className="space-y-6">
          {/* Usuario Interno */}
          <div className="border rounded-lg p-4 bg-blue-50/50">
            <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
              <Badge className="bg-blue-500">Interno</Badge>
              Usuario Interno Petrobras
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-700">Quem e:</p>
                <p className="text-slate-600">Funcionario da Petrobras com email @petrobras.com.br</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Como se autentica:</p>
                <p className="text-slate-600">Microsoft Entra ID (SSO corporativo)</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">O que pode fazer:</p>
                <ul className="list-disc list-inside text-slate-600 ml-2">
                  <li>Criar compartilhamentos para destinatarios externos</li>
                  <li>Fazer upload de arquivos (max 500MB por arquivo)</li>
                  <li>Cancelar compartilhamentos pendentes (que ainda nao foram aprovados)</li>
                  <li>Ver historico dos seus compartilhamentos</li>
                  <li>Receber notificacoes de aprovacao/rejeicao</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">O que NAO pode fazer:</p>
                <ul className="list-disc list-inside text-red-600 ml-2">
                  <li>Aprovar seus proprios compartilhamentos</li>
                  <li>Cancelar compartilhamentos ja aprovados</li>
                  <li>Enviar para emails @petrobras (apenas externos)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Supervisor */}
          <div className="border rounded-lg p-4 bg-amber-50/50">
            <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <Badge className="bg-amber-500">Supervisor</Badge>
              Supervisor / Gerente
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-700">Quem e:</p>
                <p className="text-slate-600">Funcionario com cargo de gerencia/supervisao identificado pelo Entra ID</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Como e identificado:</p>
                <ul className="list-disc list-inside text-slate-600 ml-2">
                  <li>Email na lista de supervisores OU</li>
                  <li>Cargo (jobTitle) contendo: Gerente, Coordenador, Diretor, Superintendente, Chefe, Lider, Supervisor</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">O que pode fazer:</p>
                <ul className="list-disc list-inside text-slate-600 ml-2">
                  <li><strong>TUDO que o Usuario Interno pode</strong> (tambem pode criar compartilhamentos)</li>
                  <li>Ver compartilhamentos pendentes da sua equipe</li>
                  <li>Aprovar compartilhamentos</li>
                  <li>Rejeitar compartilhamentos (com motivo obrigatorio)</li>
                  <li>Alterar tempo de expiracao (24h, 48h, 72h)</li>
                  <li>Ver estatisticas de aprovacao</li>
                </ul>
              </div>
              <div className="p-3 bg-amber-100 rounded border border-amber-200">
                <p className="font-medium text-amber-800">IMPORTANTE: Perfil Duplo</p>
                <p className="text-sm text-amber-700">
                  O supervisor pode ter 2 funcoes simultaneas: como remetente (cria compartilhamentos) 
                  e como aprovador (aprova compartilhamentos de outros). Quando cria um compartilhamento, 
                  o supervisor dele (nivel acima) deve aprovar.
                </p>
              </div>
            </div>
          </div>

          {/* Usuario Externo */}
          <div className="border rounded-lg p-4 bg-green-50/50">
            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
              <Badge className="bg-green-500">Externo</Badge>
              Usuario Externo
            </h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-700">Quem e:</p>
                <p className="text-slate-600">Qualquer pessoa fora da Petrobras que recebeu um compartilhamento</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Como se autentica:</p>
                <p className="text-slate-600">Codigo OTP de 6 digitos enviado por email (valido por 3 minutos)</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">O que pode fazer:</p>
                <ul className="list-disc list-inside text-slate-600 ml-2">
                  <li>Verificar se tem arquivos disponiveis (informando email)</li>
                  <li>Solicitar codigo OTP</li>
                  <li>Aceitar termos de uso</li>
                  <li>Baixar arquivos compartilhados (dentro do prazo)</li>
                  <li>Visualizar preview de arquivos (se suportado)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-700">Restricoes:</p>
                <ul className="list-disc list-inside text-red-600 ml-2">
                  <li>Sessao expira em 3 horas</li>
                  <li>Maximo 5 tentativas de OTP errado (bloqueio de 15 min)</li>
                  <li>Deve aceitar termos antes de baixar</li>
                  <li>Nao pode criar compartilhamentos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "fluxo-aprovacao",
      title: "Fluxo de Aprovacao",
      icon: FileText,
      color: "green",
      content: (
        <div className="space-y-6">
          {/* Diagrama de Fluxo */}
          <div className="p-4 bg-slate-100 rounded-lg">
            <h4 className="font-semibold mb-4">Fluxo Completo</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="px-3 py-2 rounded bg-blue-500 text-white font-medium">1. Usuario cria share</span>
              <span className="text-slate-400">→</span>
              <span className="px-3 py-2 rounded bg-amber-500 text-white font-medium">2. Status: PENDING</span>
              <span className="text-slate-400">→</span>
              <span className="px-3 py-2 rounded bg-purple-500 text-white font-medium">3. Supervisor notificado</span>
              <span className="text-slate-400">→</span>
              <span className="px-3 py-2 rounded bg-green-500 text-white font-medium">4. Aprovado</span>
              <span className="text-slate-400">→</span>
              <span className="px-3 py-2 rounded bg-teal-500 text-white font-medium">5. Externo notificado</span>
            </div>
          </div>

          {/* Estados */}
          <div>
            <h4 className="font-semibold mb-3">Estados Possiveis</h4>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">pending</Badge>
                <div>
                  <p className="font-medium">Pendente</p>
                  <p className="text-sm text-slate-600">Aguardando aprovacao do supervisor. Pode ser cancelado pelo remetente.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">approved</Badge>
                <div>
                  <p className="font-medium">Aprovado</p>
                  <p className="text-sm text-slate-600">Disponivel para download pelo destinatario. Email enviado automaticamente.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">rejected</Badge>
                <div>
                  <p className="font-medium">Rejeitado</p>
                  <p className="text-sm text-slate-600">Nao aprovado. Motivo obrigatorio. Remetente notificado.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">expired</Badge>
                <div>
                  <p className="font-medium">Expirado</p>
                  <p className="text-sm text-slate-600">Passou do prazo de validade. Arquivo removido do S3.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">cancelled</Badge>
                <div>
                  <p className="font-medium">Cancelado</p>
                  <p className="text-sm text-slate-600">Cancelado pelo remetente antes da aprovacao.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Regras */}
          <div className="border rounded-lg p-4 bg-blue-50/50">
            <h4 className="font-semibold text-blue-800 mb-3">Regras de Aprovacao</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>Todo compartilhamento precisa de aprovacao do supervisor direto do remetente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>Se o remetente for supervisor, quem aprova e o supervisor dele (nivel acima)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>O supervisor e identificado automaticamente pelo Microsoft Entra ID (campo manager)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">4.</span>
                <span>Rejeicao exige motivo com minimo de 10 caracteres</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">5.</span>
                <span>Apos aprovacao, nao pode mais ser cancelado ou editado</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "expiracao",
      title: "Regras de Expiracao",
      icon: Clock,
      color: "amber",
      content: (
        <div className="space-y-6">
          {/* Opcoes */}
          <div>
            <h4 className="font-semibold mb-3">Tempos de Expiracao Disponiveis</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">24h</p>
                <p className="text-sm text-slate-600">1 dia</p>
              </div>
              <div className="border rounded-lg p-4 text-center bg-amber-50">
                <p className="text-3xl font-bold text-amber-600">48h</p>
                <p className="text-sm text-slate-600">2 dias</p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">72h</p>
                <p className="text-sm text-slate-600">3 dias (maximo)</p>
              </div>
            </div>
          </div>

          {/* Calculo */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="font-semibold mb-3">Como e Calculada</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Data de expiracao</strong> = Data de APROVACAO + Tempo selecionado</p>
              <p className="text-slate-600">
                Exemplo: Aprovado em 20/01/2026 as 10:00 com 48h = Expira em 22/01/2026 as 10:00
              </p>
            </div>
          </div>

          {/* Regras */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Alteracao de Expiracao</p>
                <p className="text-sm text-slate-600">
                  Apenas o supervisor pode alterar o tempo de expiracao. Pode aumentar ou reduzir dentro das opcoes (24h, 48h, 72h).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Apos Expiracao</p>
                <p className="text-sm text-slate-600">
                  Arquivo e removido do S3 automaticamente. Download nao e mais possivel. Status muda para "expired".
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Notificacao de Expiracao</p>
                <p className="text-sm text-slate-600">
                  Email enviado para o destinatario 24h antes de expirar (se ainda nao baixou).
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "otp",
      title: "Regras de OTP",
      icon: Shield,
      color: "purple",
      content: (
        <div className="space-y-6">
          {/* Parametros */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Tamanho do Codigo</p>
              <p className="text-2xl font-bold text-purple-600">6 digitos</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Validade</p>
              <p className="text-2xl font-bold text-purple-600">3 minutos</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Max Tentativas</p>
              <p className="text-2xl font-bold text-purple-600">5 tentativas</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Cooldown (apos erro)</p>
              <p className="text-2xl font-bold text-purple-600">30 segundos</p>
            </div>
          </div>

          {/* Fluxo */}
          <div className="border rounded-lg p-4 bg-purple-50/50">
            <h4 className="font-semibold text-purple-800 mb-3">Fluxo de Verificacao</h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <span>Usuario externo informa email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <span>Sistema verifica se email tem compartilhamentos aprovados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <span>Se sim, gera codigo OTP e envia por email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
                <span>Usuario tem 3 minutos para digitar o codigo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">5</span>
                <span>Se correto, sessao criada (valida por 3 horas)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-purple-200 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">6</span>
                <span>Se errado 5 vezes, bloqueio de 15 minutos</span>
              </li>
            </ol>
          </div>

          {/* Seguranca */}
          <div className="border rounded-lg p-4 bg-red-50/50">
            <h4 className="font-semibold text-red-800 mb-3">Medidas de Seguranca</h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>• Codigo gerado aleatoriamente a cada solicitacao</li>
              <li>• Codigo anterior invalidado ao gerar novo</li>
              <li>• Nao revela se email existe no sistema (mensagem generica)</li>
              <li>• Registro de todas as tentativas no log de auditoria</li>
              <li>• Rate limiting por IP (max 10 solicitacoes/hora)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "emails",
      title: "Emails Automaticos",
      icon: Mail,
      color: "teal",
      content: (
        <div className="space-y-4">
          {/* Lista de Emails */}
          {[
            {
              trigger: "Novo compartilhamento criado",
              destinatario: "Supervisor",
              assunto: "Nova solicitacao de compartilhamento aguardando aprovacao",
              conteudo: "Nome do remetente, destinatario(s), motivo, arquivos, link para aprovar",
            },
            {
              trigger: "Compartilhamento aprovado",
              destinatario: "Remetente",
              assunto: "Seu compartilhamento foi aprovado",
              conteudo: "Confirmacao, nome do aprovador, data de expiracao",
            },
            {
              trigger: "Compartilhamento aprovado",
              destinatario: "Usuario Externo",
              assunto: "Voce recebeu arquivos da Petrobras",
              conteudo: "Nome do remetente, motivo, link para acessar, data de expiracao",
            },
            {
              trigger: "Compartilhamento rejeitado",
              destinatario: "Remetente",
              assunto: "Seu compartilhamento foi rejeitado",
              conteudo: "Nome do aprovador, motivo da rejeicao",
            },
            {
              trigger: "Solicitacao de OTP",
              destinatario: "Usuario Externo",
              assunto: "Seu codigo de acesso - Petrobras",
              conteudo: "Codigo de 6 digitos, validade de 3 minutos",
            },
            {
              trigger: "24h antes de expirar",
              destinatario: "Usuario Externo",
              assunto: "Seu arquivo expira em 24 horas",
              conteudo: "Aviso de expiracao, link para acessar",
            },
            {
              trigger: "Download realizado",
              destinatario: "Remetente",
              assunto: "Seu arquivo foi baixado",
              conteudo: "Confirmacao, data/hora do download",
            },
          ].map((email, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">{email.trigger}</Badge>
                  <p className="font-medium">{email.assunto}</p>
                  <p className="text-sm text-slate-500">Para: {email.destinatario}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">{email.conteudo}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "arquivos",
      title: "Regras de Arquivos",
      icon: FileText,
      color: "slate",
      content: (
        <div className="space-y-6">
          {/* Limites */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Tamanho Maximo por Arquivo</p>
              <p className="text-2xl font-bold text-slate-700">500 MB</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-slate-500">Maximo de Arquivos por Share</p>
              <p className="text-2xl font-bold text-slate-700">10 arquivos</p>
            </div>
          </div>

          {/* Extensoes Bloqueadas */}
          <div className="border rounded-lg p-4 bg-red-50/50">
            <h4 className="font-semibold text-red-800 mb-3">Extensoes Bloqueadas</h4>
            <div className="flex flex-wrap gap-2">
              {[".exe", ".dll", ".bat", ".cmd", ".com", ".msi", ".scr", ".vbs", ".ps1", ".sh", ".jar", ".app"].map((ext) => (
                <Badge key={ext} variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  {ext}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-red-700 mt-3">
              Arquivos executaveis sao bloqueados por seguranca. Se necessario enviar, comprimir em .zip com senha.
            </p>
          </div>

          {/* Extensoes Permitidas (exemplos) */}
          <div className="border rounded-lg p-4 bg-green-50/50">
            <h4 className="font-semibold text-green-800 mb-3">Extensoes Comuns Permitidas</h4>
            <div className="flex flex-wrap gap-2">
              {[".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv", ".jpg", ".png", ".zip", ".rar"].map((ext) => (
                <Badge key={ext} variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  {ext}
                </Badge>
              ))}
            </div>
          </div>

          {/* Validacoes */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Validacoes Realizadas</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Verificacao de extensao (lista de bloqueio)</li>
              <li>• Verificacao de tamanho maximo</li>
              <li>• Scan de antivirus (em producao)</li>
              <li>• Hash SHA-256 para integridade</li>
              <li>• Compressao automatica no S3</li>
            </ul>
          </div>
        </div>
      ),
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      blue: { bg: "bg-blue-100", text: "text-blue-700" },
      green: { bg: "bg-green-100", text: "text-green-700" },
      amber: { bg: "bg-amber-100", text: "text-amber-700" },
      purple: { bg: "bg-purple-100", text: "text-purple-700" },
      teal: { bg: "bg-teal-100", text: "text-teal-700" },
      slate: { bg: "bg-slate-100", text: "text-slate-700" },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Regras de Negocio</h1>
          <p className="text-slate-600">
            Todas as regras do sistema: perfis, aprovacao, expiracao, OTP, emails e arquivos
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon
            const colors = getColorClasses(section.color)
            const isExpanded = expandedSection === section.id

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${colors.bg}`}>
                        <Icon className={`h-6 w-6 ${colors.text}`} />
                      </div>
                      <CardTitle>{section.title}</CardTitle>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="border-t pt-6">
                    {section.content}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
