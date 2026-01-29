"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Cloud, Server, Shield, Home, Layers, Workflow, Lock, Container, HardDrive, FolderOpen, Code, Package } from "lucide-react"
import Link from "next/link"

export default function WikiDevPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const wikiCategories = [
    // =============================================
    // AWS / INFRAESTRUTURA
    // =============================================
    {
      title: "Seguranca AWS",
      description: "Politicas IAM, KMS para criptografia, VPC, Security Groups e boas praticas de seguranca",
      icon: Lock,
      href: "/wiki-dev/seguranca-aws",
      color: "from-red-500 to-rose-600",
      topics: ["IAM", "KMS", "VPC", "Security Groups", "Policies"],
      category: "aws",
    },
    {
      title: "Deploy AWS com Dominio Provisorio",
      description: "Guia completo para publicar Next.js na AWS com dominio provisorio para HML e Producao",
      icon: Layers,
      href: "/wiki-dev/deploy-aws",
      color: "from-green-500 to-emerald-600",
      topics: ["Amplify", "S3 + CloudFront", "ECS Fargate", "Dominio", "Custos"],
      category: "aws",
    },
    {
      title: "Desenvolvimento Local AWS",
      description: "Como rodar DynamoDB, S3, SES localmente sem custo - Docker e LocalStack",
      icon: Server,
      href: "/wiki-dev/local-development",
      color: "from-emerald-500 to-teal-500",
      topics: ["DynamoDB Local", "LocalStack", "Docker", "Zero Custo"],
      category: "aws",
    },
    {
      title: "Docker Local - Front e Back",
      description: "Guia completo passo a passo para configurar Docker na maquina local: Front-End React e Back-End Python",
      icon: Container,
      href: "/wiki-dev/docker-local",
      color: "from-blue-500 to-indigo-600",
      topics: ["Docker", "React", "Python", "docker-compose", "Localhost"],
      category: "aws",
    },
    {
      title: "Docker na AWS - ECS/Fargate",
      description: "Guia completo passo a passo para configurar Docker na AWS com ECS e Fargate para Front e Back",
      icon: Cloud,
      href: "/wiki-dev/docker-aws",
      color: "from-orange-600 to-red-600",
      topics: ["AWS", "ECS", "Fargate", "ECR", "Load Balancer", "Docker"],
      category: "aws",
    },
    {
      title: "DynamoDB na AWS - Guia Completo",
      description: "Como criar e configurar DynamoDB na AWS: tabelas, indices, permissoes, acesso e boas praticas",
      icon: HardDrive,
      href: "/wiki-dev/dynamodb-aws",
      color: "from-amber-500 to-orange-600",
      topics: ["DynamoDB", "AWS", "Tabelas", "Indices", "IAM", "Permissoes"],
      category: "aws",
    },
    {
      title: "S3 - Como Configurar",
      description: "Passo a passo completo para configurar S3 na AWS: criar buckets, permissoes, CORS e upload/download",
      icon: FolderOpen,
      href: "/wiki-dev/s3-aws",
      color: "from-green-500 to-teal-600",
      topics: ["S3", "AWS", "Buckets", "CORS", "IAM", "Upload/Download"],
      category: "aws",
    },
    // =============================================
    // REPOSITORIOS E DEPENDENCIAS
    // =============================================
    {
      title: "Nexus Repository Manager",
      description: "Guia completo para configurar o Nexus: npm, pip, Docker e integracao com AWS (CodeBuild, ECS)",
      icon: Package,
      href: "/wiki-dev/nexus-repository",
      color: "from-orange-500 to-red-600",
      topics: ["Nexus", "npm", "pip", "Docker Registry", "AWS", "CI/CD"],
      category: "repositorios",
    },
    // =============================================
    // BACK-END / API
    // =============================================
    {
      title: "API Endpoints - Documentacao Back-End",
      description: "Documentacao completa de todos os endpoints que o Back-End Python precisa implementar para integrar com o Front-End",
      icon: Code,
      href: "/wiki-dev/api-endpoints",
      color: "from-violet-500 to-purple-600",
      topics: ["REST API", "Endpoints", "Request/Response", "Autenticacao", "Erros"],
      category: "backend",
    },
    // =============================================
    // INTEGRACAO
    // =============================================
    {
      title: "ServiceNow - Integracao",
      description: "Guia completo dos endpoints ServiceNow: como usar, autenticacao, exemplos praticos",
      icon: Workflow,
      href: "/wiki-dev/servicenow",
      color: "from-teal-500 to-cyan-600",
      topics: ["ServiceNow", "ITSM", "Tickets", "API REST", "Integracao"],
      category: "integracao",
    },
    // =============================================
    // AUTENTICACAO
    // =============================================
    {
      title: "Microsoft Entra ID",
      description: "SSO corporativo com Microsoft Entra ID (Azure AD) - Codigo completo pronto",
      icon: Shield,
      href: "/wiki-dev/entra-id",
      color: "from-blue-600 to-indigo-600",
      topics: ["SSO", "Azure AD", "Autenticacao", "Documento Formal"],
      category: "autenticacao",
    },
    {
      title: "Deploy e Ambientes",
      description: "Como fazer deploy em DEV, HML e Producao com checklist e rollback",
      icon: Layers,
      href: "/wiki-dev/deploy-ambientes",
      color: "from-green-600 to-emerald-600",
      topics: ["DEV", "HML", "PRD", "Rollback", "Checklist"],
      category: "deploy",
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
          <p className="text-lg text-slate-600">Documentação técnica essencial para configuração e deploy do sistema</p>
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
        <div className="grid gap-6 md:grid-cols-2">
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
              <h3 className="mb-1 font-semibold text-slate-900">Documentação Essencial</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Esta Wiki contém a documentação técnica essencial para configurar autenticação, fazer deploy na AWS e
                desenvolver localmente. Todas as informações estão sincronizadas com a versão atual do código.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
