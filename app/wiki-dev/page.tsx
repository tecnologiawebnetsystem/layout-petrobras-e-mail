"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Database, Cloud, Rocket, Server, FileCode, Shield, Users, Home } from "lucide-react"
import Link from "next/link"

export default function WikiDevPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const wikiCategories = [
    {
      title: "Implementação AWS",
      description: "Guia completo de todos os serviços AWS necessários para o sistema",
      icon: Cloud,
      href: "/wiki-dev/aws-implementation",
      color: "from-orange-500 to-amber-500",
      topics: ["23 Serviços AWS", "Configurações", "Custos", "Segurança"],
    },
    {
      title: "Modelos de Dados",
      description: "Estrutura completa das tabelas DynamoDB e relacionamentos",
      icon: Database,
      href: "/wiki-dev/data-models",
      color: "from-blue-500 to-cyan-500",
      topics: ["5 Tabelas DynamoDB", "Índices", "Campos", "Validações"],
    },
    {
      title: "Quick Start",
      description: "Deploy rápido do sistema em 1 dia com comandos prontos",
      icon: Rocket,
      href: "/wiki-dev/quick-start",
      color: "from-green-500 to-emerald-500",
      topics: ["CloudFormation", "Scripts", "Comandos AWS CLI", "Configuração"],
    },
    {
      title: "SQL & DynamoDB",
      description: "Documentação completa da estrutura de banco de dados",
      icon: FileCode,
      href: "/wiki-dev/sql-readme",
      color: "from-purple-500 to-pink-500",
      topics: ["Scripts Python", "Tabelas", "Funções", "Migrations"],
    },
    {
      title: "Deployment Guide",
      description: "Guia passo a passo para deploy em produção",
      icon: Server,
      href: "/wiki-dev/deployment",
      color: "from-red-500 to-rose-500",
      topics: ["Pré-requisitos", "Instalação", "Configuração", "Monitoramento"],
    },
    {
      title: "Credenciais Demo",
      description: "Usuários de teste e credenciais de demonstração",
      icon: Users,
      href: "/wiki-dev/credentials",
      color: "from-indigo-500 to-blue-500",
      topics: ["Usuário Interno", "Supervisor", "Externo", "Demo Vazio"],
    },
    {
      title: "Integração Front-Back",
      description: "Análise completa de compatibilidade e estratégia de integração",
      icon: Server,
      href: "/wiki-dev/integracao",
      color: "from-violet-500 to-purple-500",
      topics: ["Conflitos", "Campos Comuns", "Banco de Dados", "AWS", "Estratégia"],
    },
    {
      title: "ServiceNow Integration",
      description: "Integração completa com ServiceNow para autenticação e gestão de usuários",
      icon: Shield,
      href: "/wiki-dev/servicenow",
      color: "from-teal-500 to-cyan-500",
      topics: ["API Endpoints", "Autenticação", "Front-end", "Back-end Python", "AWS", "DynamoDB"],
    },
    {
      title: "Microsoft Entra ID",
      description: "SSO corporativo com Microsoft Entra ID (Azure AD) - Código completo pronto",
      icon: Shield,
      href: "/wiki-dev/entra-id",
      color: "from-blue-600 to-indigo-600",
      topics: ["SSO", "Azure AD", "Autenticação", "Documento Formal", "Código Pronto"],
    },
    {
      title: "Desenvolvimento Local AWS",
      description: "Como rodar DynamoDB, S3, SES, Lambda localmente sem custo - Guia completo para iniciantes",
      icon: Server,
      href: "/wiki-dev/local-development",
      color: "from-emerald-500 to-teal-500",
      topics: ["DynamoDB Local", "LocalStack", "Docker", "Python Config", "Zero Custo"],
    },
  ]

  const filteredCategories = wikiCategories.filter(
    (cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Home
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00A859] to-[#0080C8] shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Wiki de Desenvolvimento</h1>
          <p className="text-lg text-slate-600">Documentação técnica completa para implementação do sistema na AWS</p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <div className="relative mx-auto max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar na documentação..."
              className="h-14 pl-12 text-base shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.href} href={category.href}>
                <Card className="group h-full cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                  <CardHeader className="pb-4">
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${category.color} shadow-md transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-slate-900">{category.title}</CardTitle>
                    <CardDescription className="text-base">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {category.topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="py-20 text-center">
            <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900">Nenhum resultado encontrado</h3>
            <p className="text-slate-600">Tente buscar com outros termos</p>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900">Documentação Atualizada</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Esta Wiki contém toda a documentação técnica necessária para implementar, configurar e fazer deploy do
                sistema de transferência de arquivos na AWS. Todas as informações estão sincronizadas com a versão atual
                do código.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
