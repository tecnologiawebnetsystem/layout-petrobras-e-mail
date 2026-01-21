"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Home,
  CheckSquare,
  Monitor,
  Server,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Download,
} from "lucide-react"

interface ChecklistItem {
  id: string
  title: string
  description: string
  priority: "critico" | "alto" | "medio"
  docs?: string
}

interface ChecklistSection {
  title: string
  icon: React.ReactNode
  color: string
  items: ChecklistItem[]
}

export default function ChecklistSegurancaPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const sections: ChecklistSection[] = [
    {
      title: "Front-End",
      icon: <Monitor className="h-5 w-5" />,
      color: "blue",
      items: [
        {
          id: "fe-1",
          title: "HTTPS obrigatorio",
          description: "Redirecionar todas as requisicoes HTTP para HTTPS",
          priority: "critico",
        },
        {
          id: "fe-2",
          title: "Content Security Policy (CSP)",
          description: "Configurar headers CSP no next.config.js para prevenir XSS",
          priority: "critico",
        },
        {
          id: "fe-3",
          title: "Sanitizacao de inputs",
          description: "Validar e sanitizar todos os campos de entrada do usuario",
          priority: "critico",
        },
        {
          id: "fe-4",
          title: "Timeout de sessao",
          description: "Sessao expira apos inatividade (8h interno, 3h externo)",
          priority: "alto",
        },
        {
          id: "fe-5",
          title: "Tokens em memoria",
          description: "Nao armazenar tokens sensiveis em localStorage, usar httpOnly cookies",
          priority: "alto",
        },
        {
          id: "fe-6",
          title: "Validacao de arquivos",
          description: "Verificar extensao, tamanho e tipo MIME antes do upload",
          priority: "alto",
        },
        {
          id: "fe-7",
          title: "Rate limiting no cliente",
          description: "Limitar tentativas de login/OTP no frontend",
          priority: "medio",
        },
        {
          id: "fe-8",
          title: "Mensagens de erro genericas",
          description: "Nao expor detalhes tecnicos em mensagens de erro",
          priority: "medio",
        },
        {
          id: "fe-9",
          title: "Desabilitar autocomplete em campos sensiveis",
          description: "autocomplete='off' em campos de OTP e senhas",
          priority: "medio",
        },
        {
          id: "fe-10",
          title: "Logs de auditoria no cliente",
          description: "Registrar acoes do usuario e enviar para o backend",
          priority: "alto",
        },
      ],
    },
    {
      title: "Back-End",
      icon: <Server className="h-5 w-5" />,
      color: "green",
      items: [
        {
          id: "be-1",
          title: "Rate Limiting",
          description: "Limitar requisicoes por IP (100/min) e por usuario (1000/hora)",
          priority: "critico",
        },
        {
          id: "be-2",
          title: "Validacao de entrada",
          description: "Validar TODOS os campos com Pydantic, rejeitar dados inesperados",
          priority: "critico",
        },
        {
          id: "be-3",
          title: "CORS restritivo",
          description: "Permitir apenas dominios autorizados (petrobras.com.br, vercel.app)",
          priority: "critico",
        },
        {
          id: "be-4",
          title: "Autenticacao JWT",
          description: "Tokens com expiracao curta (1h), refresh token seguro",
          priority: "critico",
        },
        {
          id: "be-5",
          title: "Validacao de token Entra ID",
          description: "Verificar assinatura, audience, issuer e expiracao",
          priority: "critico",
        },
        {
          id: "be-6",
          title: "OTP seguro",
          description: "6 digitos, 3 min expiracao, max 5 tentativas, cooldown 30s",
          priority: "alto",
        },
        {
          id: "be-7",
          title: "Scan de antivirus",
          description: "Verificar arquivos no upload com ClamAV ou similar",
          priority: "alto",
        },
        {
          id: "be-8",
          title: "Hash de arquivos",
          description: "Calcular SHA-256 de todos os arquivos para integridade",
          priority: "alto",
        },
        {
          id: "be-9",
          title: "Logs estruturados",
          description: "Registrar todas as acoes com timestamp, user_id, ip, action",
          priority: "alto",
        },
        {
          id: "be-10",
          title: "Tratamento de excecoes",
          description: "Capturar erros e retornar mensagens genericas (nao expor stack trace)",
          priority: "medio",
        },
        {
          id: "be-11",
          title: "Timeout de requisicoes",
          description: "Limitar tempo de execucao de requests (30s max)",
          priority: "medio",
        },
        {
          id: "be-12",
          title: "Prevenir SQL/NoSQL Injection",
          description: "Usar parametros em queries, nunca concatenar strings",
          priority: "critico",
        },
      ],
    },
    {
      title: "AWS / Infraestrutura",
      icon: <Cloud className="h-5 w-5" />,
      color: "orange",
      items: [
        {
          id: "aws-1",
          title: "IAM com privilegio minimo",
          description: "Cada servico tem apenas as permissoes necessarias",
          priority: "critico",
        },
        {
          id: "aws-2",
          title: "S3 bucket privado",
          description: "Block Public Access habilitado, sem ACLs publicas",
          priority: "critico",
        },
        {
          id: "aws-3",
          title: "Criptografia S3 (SSE-KMS)",
          description: "Todos os arquivos criptografados em repouso com KMS",
          priority: "critico",
        },
        {
          id: "aws-4",
          title: "HTTPS no CloudFront",
          description: "TLS 1.2+, certificado ACM, redirect HTTP para HTTPS",
          priority: "critico",
        },
        {
          id: "aws-5",
          title: "DynamoDB criptografado",
          description: "Encryption at rest habilitado em todas as tabelas",
          priority: "alto",
        },
        {
          id: "aws-6",
          title: "VPC para recursos sensiveis",
          description: "Lambda e DynamoDB em VPC privada quando possivel",
          priority: "alto",
        },
        {
          id: "aws-7",
          title: "Security Groups restritivos",
          description: "Permitir apenas portas e IPs necessarios",
          priority: "alto",
        },
        {
          id: "aws-8",
          title: "CloudWatch Logs",
          description: "Todos os servicos enviando logs para CloudWatch",
          priority: "alto",
        },
        {
          id: "aws-9",
          title: "Retencao de logs",
          description: "Definir politica de retencao (ex: 5 anos para auditoria)",
          priority: "medio",
        },
        {
          id: "aws-10",
          title: "CloudTrail habilitado",
          description: "Registrar todas as chamadas de API da AWS",
          priority: "alto",
        },
        {
          id: "aws-11",
          title: "Alertas CloudWatch",
          description: "Alertas para erros 5xx, latencia alta, tentativas de acesso",
          priority: "medio",
        },
        {
          id: "aws-12",
          title: "Backup automatico",
          description: "Point-in-time recovery para DynamoDB, versionamento S3",
          priority: "alto",
        },
      ],
    },
    {
      title: "Compliance e LGPD",
      icon: <Shield className="h-5 w-5" />,
      color: "red",
      items: [
        {
          id: "lgpd-1",
          title: "Consentimento registrado",
          description: "Salvar aceite de termos com timestamp, IP e versao",
          priority: "critico",
        },
        {
          id: "lgpd-2",
          title: "Endpoint de exportacao de dados",
          description: "Usuario pode solicitar exportacao de seus dados (LGPD Art. 18)",
          priority: "alto",
        },
        {
          id: "lgpd-3",
          title: "Endpoint de exclusao de dados",
          description: "Usuario pode solicitar exclusao/anonimizacao (LGPD Art. 18)",
          priority: "alto",
        },
        {
          id: "lgpd-4",
          title: "Minimizacao de dados",
          description: "Coletar apenas dados necessarios para o servico",
          priority: "medio",
        },
        {
          id: "lgpd-5",
          title: "Retencao definida",
          description: "Dados expirados sao removidos automaticamente",
          priority: "alto",
        },
        {
          id: "lgpd-6",
          title: "Trilha de auditoria completa",
          description: "Registrar quem acessou o que, quando e de onde",
          priority: "critico",
        },
        {
          id: "lgpd-7",
          title: "Notificacao de incidentes",
          description: "Processo para notificar ANPD em caso de vazamento",
          priority: "alto",
        },
        {
          id: "lgpd-8",
          title: "DPO definido",
          description: "Encarregado de Protecao de Dados identificado",
          priority: "medio",
        },
      ],
    },
  ]

  const getTotalItems = () => sections.reduce((acc, section) => acc + section.items.length, 0)
  const getCheckedCount = () => checkedItems.size
  const getProgress = () => Math.round((getCheckedCount() / getTotalItems()) * 100)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critico":
        return "bg-red-500/20 text-red-600 border-red-500/30"
      case "alto":
        return "bg-orange-500/20 text-orange-600 border-orange-500/30"
      case "medio":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  const getSectionColor = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-500/30 bg-blue-500/5"
      case "green":
        return "border-green-500/30 bg-green-500/5"
      case "orange":
        return "border-orange-500/30 bg-orange-500/5"
      case "red":
        return "border-red-500/30 bg-red-500/5"
      default:
        return "border-gray-500/30 bg-gray-500/5"
    }
  }

  const exportChecklist = () => {
    const data = {
      exportDate: new Date().toISOString(),
      progress: getProgress(),
      checkedItems: Array.from(checkedItems),
      sections: sections.map((section) => ({
        title: section.title,
        items: section.items.map((item) => ({
          ...item,
          checked: checkedItems.has(item.id),
        })),
      })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `checklist-seguranca-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Wiki Dev
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-red-500" />
                <h1 className="text-xl font-bold">Checklist de Seguranca</h1>
              </div>
            </div>
            <Button onClick={exportChecklist} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{getProgress()}% Completo</h2>
                <p className="text-muted-foreground">
                  {getCheckedCount()} de {getTotalItems()} itens verificados
                </p>
              </div>
              <div className="flex items-center gap-4">
                {getProgress() === 100 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-semibold">Pronto para Producao!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-6 w-6" />
                    <span className="font-semibold">Em Andamento</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span>Critico</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Medio</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">Importante</p>
              <p className="text-sm text-muted-foreground mt-1">
                Todos os itens marcados como <strong>Critico</strong> devem estar implementados antes de ir para
                producao. Itens de prioridade <strong>Alta</strong> devem ser implementados no primeiro mes. Este
                checklist deve ser revisado a cada deploy.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => {
            const sectionChecked = section.items.filter((item) => checkedItems.has(item.id)).length
            const sectionTotal = section.items.length
            const sectionProgress = Math.round((sectionChecked / sectionTotal) * 100)

            return (
              <Card key={section.title} className={`${getSectionColor(section.color)}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${section.color === "blue" ? "bg-blue-500/20 text-blue-600" : section.color === "green" ? "bg-green-500/20 text-green-600" : section.color === "orange" ? "bg-orange-500/20 text-orange-600" : "bg-red-500/20 text-red-600"}`}
                      >
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle>{section.title}</CardTitle>
                        <CardDescription>
                          {sectionChecked} de {sectionTotal} itens ({sectionProgress}%)
                        </CardDescription>
                      </div>
                    </div>
                    {sectionProgress === 100 && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          checkedItems.has(item.id) ? "bg-green-500/10 border-green-500/30" : "bg-card hover:bg-muted/50"
                        }`}
                        onClick={() => toggleItem(item.id)}
                      >
                        <Checkbox checked={checkedItems.has(item.id)} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${checkedItems.has(item.id) ? "line-through text-muted-foreground" : ""}`}
                            >
                              {item.title}
                            </span>
                            <Badge variant="outline" className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          </div>
                          <p
                            className={`text-sm mt-1 ${checkedItems.has(item.id) ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                          >
                            {item.description}
                          </p>
                        </div>
                        {checkedItems.has(item.id) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Summary */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resumo por Prioridade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {["critico", "alto", "medio"].map((priority) => {
                const items = sections.flatMap((s) => s.items.filter((i) => i.priority === priority))
                const checked = items.filter((i) => checkedItems.has(i.id)).length
                const total = items.length
                const progress = total > 0 ? Math.round((checked / total) * 100) : 0

                return (
                  <div key={priority} className={`p-4 rounded-lg border ${getPriorityColor(priority)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold capitalize">{priority}</span>
                      <span className="text-sm">
                        {checked}/{total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${priority === "critico" ? "bg-red-500" : priority === "alto" ? "bg-orange-500" : "bg-yellow-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs mt-2 opacity-80">{progress}% completo</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
