"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Home, HardDrive, Target, Database, ArrowLeftRight, Info, Server, Container, Wrench, KeyRound, TerminalSquare } from "lucide-react"
import Link from "next/link"

export default function WikiDevPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const wikiCategories = [
    {
      title: "Roadmap do Projeto",
      description: "Plano visual com todas as fases, entregas, prazos e progresso do projeto - Timeline interativa",
      icon: Target,
      href: "/wiki-dev/roadmap",
      color: "from-indigo-500 to-blue-600",
      topics: ["Fases", "Entregas", "Prazos", "Progresso", "Milestones"],
      category: "gestao",
    },
    {
      title: "Instalar e Rodar o Backend (local)",
      description: "Passo a passo do zero: instalar Python, baixar o projeto, configurar .env e rodar a API no seu computador",
      icon: Wrench,
      href: "/wiki-dev/instalar-backend",
      color: "from-green-500 to-emerald-600",
      topics: ["Python", "FastAPI", "Instalacao", "Para Iniciantes"],
      category: "setup",
    },
    {
      title: "Variaveis de Ambiente (.env)",
      description: "Todas as variaveis do Frontend (Vercel) e Backend (Render/local) com valores reais - pasta ENV pronta para copiar",
      icon: KeyRound,
      href: "/wiki-dev/variaveis-ambiente",
      color: "from-amber-500 to-orange-500",
      topics: ["Frontend", "Backend", "Vercel", "Render", "Local", ".env"],
      category: "setup",
    },
    {
      title: "SQL Explorer - Consultar Banco ao Vivo",
      description: "Visualize tabelas, colunas e execute SELECTs direto no banco Neon PostgreSQL em tempo real",
      icon: TerminalSquare,
      href: "/wiki-dev/sql-explorer",
      color: "from-emerald-500 to-cyan-500",
      topics: ["SELECT", "Tabelas", "Colunas", "Tempo Real", "Somente Leitura"],
      category: "banco",
    },
    {
      title: "PostgreSQL (Neon) - Schema Completo",
      description: "Documentacao de todas as 19 tabelas do banco de dados Neon PostgreSQL - colunas, tipos, FK e relacionamentos",
      icon: Database,
      href: "/wiki-dev/postgresql-neon",
      color: "from-blue-600 to-cyan-500",
      topics: ["PostgreSQL", "Neon", "19 Tabelas", "Schema", "SQLModel"],
      category: "banco",
    },
    {
      title: "Integracoes Front x Back x Banco",
      description: "Mapa completo de todas as rotas entre Next.js (Frontend), FastAPI Python (Backend) e Neon PostgreSQL (Banco)",
      icon: ArrowLeftRight,
      href: "/wiki-dev/integracoes",
      color: "from-green-500 to-blue-600",
      topics: ["48 Rotas", "13 Routers", "Audit Logs", "100% Integrado"],
      category: "integracao",
    },
    {
      title: "Deploy em Containers - Front + Back na AWS",
      description: "Guia completo para publicar Next.js e FastAPI em Docker/ECS na AWS, contornando problemas com Nexus",
      icon: Container,
      href: "/wiki-dev/deploy-containers",
      color: "from-blue-600 to-cyan-500",
      topics: ["Docker", "AWS ECS", "ECR", "Nexus Fix", "Fargate"],
      category: "deploy",
    },
    {
      title: "Deploy Backend no Render.com",
      description: "Guia passo a passo para hospedar a API Python/FastAPI no Render, conectada ao Neon PostgreSQL",
      icon: Server,
      href: "/wiki-dev/deploy-render",
      color: "from-violet-500 to-purple-600",
      topics: ["Render", "Deploy", "FastAPI", "Passo a Passo"],
      category: "deploy",
    },
    {
      title: "DynamoDB na AWS - Guia Completo",
      description: "Referencia para configuracao de DynamoDB na AWS - Tabelas NoSQL, indices GSI, TTL e boas praticas",
      icon: HardDrive,
      href: "/wiki-dev/dynamodb-aws",
      color: "from-amber-500 to-orange-600",
      topics: ["DynamoDB", "AWS", "NoSQL", "Referencia"],
      category: "aws",
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
              <Info className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-slate-900">Documentacao Tecnica</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Esta Wiki contem a documentacao tecnica do sistema: instalacao local do backend, variaveis de
                ambiente (pasta ENV), roadmap do projeto, schema do banco PostgreSQL (Neon), mapa de integracoes
                Front x Back x Banco, guias de deploy em containers na AWS e no Render.com, e referencia DynamoDB.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
