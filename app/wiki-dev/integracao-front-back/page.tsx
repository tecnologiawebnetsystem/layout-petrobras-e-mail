"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Database, ArrowLeftRight, CheckSquare, Code, Table, Workflow, Calendar } from "lucide-react"
import Link from "next/link"

export default function IntegracaoFrontBackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/wiki-dev" className="hover:text-slate-900 transition-colors">
            Wiki-Dev
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">Integração Front-End e Back-End</span>
        </div>

        {/* Header com botão voltar */}
        <div className="flex items-start justify-between">
          <div className="space-y-4 flex-1">
            <Link href="/wiki-dev">
              <Button variant="outline" size="sm" className="mb-4 bg-transparent">
                <Home className="mr-2 h-4 w-4" />
                Voltar para Wiki-Dev
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
                <ArrowLeftRight className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Integração Front-End e Back-End</h1>
                <p className="text-lg text-slate-600 mt-2">
                  Guia completo para sincronização 100% entre Next.js e FastAPI Python
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline de Implementação */}
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-amber-600 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Meta: Integração Completa em 1 Semana (7 dias)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium text-amber-800">Dias 1-2</div>
                  <div className="text-amber-700">Contrato de Dados + Schemas</div>
                </div>
                <div>
                  <div className="font-medium text-amber-800">Dias 3-4</div>
                  <div className="text-amber-700">Endpoints API + Rotas</div>
                </div>
                <div>
                  <div className="font-medium text-amber-800">Dias 5-6</div>
                  <div className="text-amber-700">Integração + Testes</div>
                </div>
                <div>
                  <div className="font-medium text-amber-800">Dia 7</div>
                  <div className="text-amber-700">Ajustes Finais + Deploy</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="contrato" className="w-full">
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="contrato" className="flex flex-col gap-2 py-3">
              <Database className="h-5 w-5" />
              <span className="text-xs">Contrato de Dados</span>
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="flex flex-col gap-2 py-3">
              <Code className="h-5 w-5" />
              <span className="text-xs">Endpoints API</span>
            </TabsTrigger>
            <TabsTrigger value="tabelas" className="flex flex-col gap-2 py-3">
              <Table className="h-5 w-5" />
              <span className="text-xs">Estrutura Tabelas</span>
            </TabsTrigger>
            <TabsTrigger value="fluxos" className="flex flex-col gap-2 py-3">
              <Workflow className="h-5 w-5" />
              <span className="text-xs">Fluxos Completos</span>
            </TabsTrigger>
            <TabsTrigger value="implementacao" className="flex flex-col gap-2 py-3">
              <CheckSquare className="h-5 w-5" />
              <span className="text-xs">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="exemplos" className="flex flex-col gap-2 py-3">
              <Code className="h-5 w-5" />
              <span className="text-xs">Exemplos Código</span>
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo continua aqui com todas as abas detalhadas */}
          {/* Implementação das abas aqui */}
        </Tabs>
      </div>
    </div>
  )
}
