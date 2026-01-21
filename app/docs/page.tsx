"use client"

import { useState, useEffect } from "react"
import { openApiSpec } from "@/lib/openapi-spec"
import { ChevronDown, ChevronRight, Copy, Check, Lock, ExternalLink, Server, Tag, Code2, FileJson, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

type HttpMethod = "get" | "post" | "put" | "patch" | "delete"

const methodColors: Record<HttpMethod, { bg: string; text: string; border: string }> = {
  get: { bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/30" },
  post: { bg: "bg-green-500/10", text: "text-green-600", border: "border-green-500/30" },
  put: { bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30" },
  patch: { bg: "bg-purple-500/10", text: "text-purple-600", border: "border-purple-500/30" },
  delete: { bg: "bg-red-500/10", text: "text-red-600", border: "border-red-500/30" },
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-muted transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
    </button>
  )
}

function JsonViewer({ data, title }: { data: unknown; title?: string }) {
  const json = JSON.stringify(data, null, 2)

  return (
    <div className="rounded-lg border bg-slate-950 overflow-hidden">
      {title && (
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">{title}</span>
          <CopyButton text={json} />
        </div>
      )}
      <pre className="p-4 text-sm text-slate-300 overflow-x-auto">
        <code>{json}</code>
      </pre>
    </div>
  )
}

function EndpointCard({ path, method, operation }: { path: string; method: HttpMethod; operation: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const colors = methodColors[method]

  const hasRequestBody = !!operation.requestBody
  const hasParameters = operation.parameters && operation.parameters.length > 0
  const hasResponses = operation.responses && Object.keys(operation.responses).length > 0

  return (
    <div className={cn("border rounded-lg overflow-hidden", colors.border, isExpanded && "ring-2 ring-offset-2 ring-offset-background", isExpanded && colors.border.replace("border-", "ring-"))}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn("w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50", isExpanded && "bg-muted/30")}
      >
        <span className={cn("px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider", colors.bg, colors.text)}>
          {method}
        </span>
        <code className="text-sm font-mono flex-1">{path}</code>
        {operation.security && <Lock className="h-4 w-4 text-muted-foreground" />}
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-6 bg-card/50">
          {/* Summary */}
          <div>
            <h4 className="font-semibold text-lg">{operation.summary}</h4>
            {operation.description && (
              <div className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
                {operation.description}
              </div>
            )}
          </div>

          {/* Parameters */}
          {hasParameters && (
            <div>
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                Parâmetros
              </h5>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Nome</th>
                      <th className="px-4 py-2 text-left font-medium">Local</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Obrigatório</th>
                      <th className="px-4 py-2 text-left font-medium">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operation.parameters.map((param: any, idx: number) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs">{param.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded bg-muted text-xs">{param.in}</span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{param.schema?.type || "string"}</td>
                        <td className="px-4 py-2">
                          {param.required ? (
                            <span className="text-red-500 font-medium">Sim</span>
                          ) : (
                            <span className="text-muted-foreground">Não</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{param.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request Body */}
          {hasRequestBody && (
            <div>
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <FileJson className="h-4 w-4" />
                Request Body
              </h5>
              {operation.requestBody.content?.["application/json"]?.example && (
                <JsonViewer
                  data={operation.requestBody.content["application/json"].example}
                  title="Exemplo"
                />
              )}
              {operation.requestBody.content?.["application/json"]?.schema?.$ref && (
                <p className="text-sm text-muted-foreground mt-2">
                  Schema: <code className="bg-muted px-1 rounded">{operation.requestBody.content["application/json"].schema.$ref.split("/").pop()}</code>
                </p>
              )}
            </div>
          )}

          {/* Responses */}
          {hasResponses && (
            <div>
              <h5 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Respostas
              </h5>
              <div className="space-y-3">
                {Object.entries(operation.responses).map(([code, response]: [string, any]) => (
                  <div key={code} className="border rounded-lg overflow-hidden">
                    <div className={cn("px-4 py-2 flex items-center gap-2", code.startsWith("2") ? "bg-green-500/10" : code.startsWith("4") ? "bg-amber-500/10" : "bg-red-500/10")}>
                      <span className={cn("font-mono font-bold", code.startsWith("2") ? "text-green-600" : code.startsWith("4") ? "text-amber-600" : "text-red-600")}>
                        {code}
                      </span>
                      <span className="text-sm text-muted-foreground">{response.description}</span>
                    </div>
                    {response.content?.["application/json"]?.example && (
                      <div className="p-3 bg-muted/30">
                        <JsonViewer data={response.content["application/json"].example} />
                      </div>
                    )}
                    {response.content?.["application/json"]?.examples && (
                      <div className="p-3 bg-muted/30 space-y-3">
                        {Object.entries(response.content["application/json"].examples).map(([name, ex]: [string, any]) => (
                          <div key={name}>
                            <p className="text-xs text-muted-foreground mb-1">{ex.summary || name}</p>
                            <JsonViewer data={ex.value} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TagSection({ tag, endpoints }: { tag: any; endpoints: Array<{ path: string; method: HttpMethod; operation: any }> }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <Tag className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{tag.name}</h3>
          {tag.description && <p className="text-sm text-muted-foreground">{tag.description}</p>}
        </div>
        <span className="px-2 py-1 rounded-full bg-muted text-sm">{endpoints.length}</span>
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {isExpanded && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          {endpoints.map(({ path, method, operation }) => (
            <EndpointCard key={`${method}-${path}`} path={path} method={method} operation={operation} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SwaggerDocsPage() {
  const [selectedServer, setSelectedServer] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  const spec = openApiSpec as any

  // Agrupar endpoints por tag
  const endpointsByTag: Record<string, Array<{ path: string; method: HttpMethod; operation: any }>> = {}

  Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, operation]: [string, any]) => {
      const tags = operation.tags || ["Outros"]
      tags.forEach((tag: string) => {
        if (!endpointsByTag[tag]) endpointsByTag[tag] = []
        endpointsByTag[tag].push({ path, method: method as HttpMethod, operation })
      })
    })
  })

  // Filtrar por busca
  const filteredTags = spec.tags?.filter((tag: any) => {
    if (!searchQuery) return true
    const tagEndpoints = endpointsByTag[tag.name] || []
    return (
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tagEndpoints.some(
        (e) =>
          e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <FileJson className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{spec.info.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>v{spec.info.version}</span>
                  <span>•</span>
                  <span>OpenAPI 3.0</span>
                </div>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Voltar ao App
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Server Selection */}
            <div className="border rounded-xl p-4 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Servidor
              </h3>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                {spec.servers?.map((server: any, idx: number) => (
                  <option key={idx} value={idx}>
                    {server.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2 break-all font-mono">
                {spec.servers?.[selectedServer]?.url}
              </p>
            </div>

            {/* Search */}
            <div className="border rounded-xl p-4 bg-card">
              <input
                type="text"
                placeholder="Buscar endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>

            {/* Navigation */}
            <div className="border rounded-xl p-4 bg-card">
              <h3 className="font-semibold mb-3">Navegação</h3>
              <nav className="space-y-1">
                {spec.tags?.map((tag: any) => (
                  <a
                    key={tag.name}
                    href={`#${tag.name.toLowerCase().replace(/\s/g, "-")}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                  >
                    <span>{tag.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {endpointsByTag[tag.name]?.length || 0}
                    </span>
                  </a>
                ))}
              </nav>
            </div>

            {/* Authentication */}
            <div className="border rounded-xl p-4 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Autenticação
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">Bearer Token (JWT)</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuários internos via Entra ID
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">OTP Token</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usuários externos via email
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-8">
            {/* Description - Visao Geral */}
            <div className="border rounded-xl p-6 bg-card">
              <h2 className="text-2xl font-bold mb-6">Visao Geral</h2>
              
              <p className="text-muted-foreground mb-6">
                API RESTful para o sistema de transferencia segura de arquivos da Petrobras.
              </p>
              
              {/* Perfis de Usuario */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Esta API permite:</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">U</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400">Usuarios Internos</p>
                      <p className="text-sm text-muted-foreground">Criar compartilhamentos de arquivos para destinatarios externos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-medium text-amber-700 dark:text-amber-400">Supervisores</p>
                      <p className="text-sm text-muted-foreground">Aprovar/rejeitar compartilhamentos e gerenciar equipe</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-sm">E</span>
                    </div>
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">Usuarios Externos</p>
                      <p className="text-sm text-muted-foreground">Acessar arquivos compartilhados via autenticacao OTP</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Autenticacao */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Autenticacao</h3>
                <p className="text-sm text-muted-foreground mb-4">A API suporta dois metodos de autenticacao:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <p className="font-medium">Microsoft Entra ID</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Para usuarios internos e supervisores</p>
                    <code className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Authorization: Bearer {'{token}'}</code>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <p className="font-medium">OTP por Email</p>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Para usuarios externos</p>
                    <code className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">Codigo de 6 digitos - 3 min</code>
                  </div>
                </div>
              </div>

              {/* Fluxo Principal */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Fluxo Principal</h3>
                <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-muted/30 border overflow-x-auto">
                  <span className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-600 text-sm font-medium whitespace-nowrap">Usuario Interno</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="px-3 py-1.5 rounded-md bg-slate-500/20 text-slate-600 dark:text-slate-400 text-sm font-medium whitespace-nowrap">Cria Share</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-600 text-sm font-medium whitespace-nowrap">Supervisor Aprova</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="px-3 py-1.5 rounded-md bg-green-500/20 text-green-600 text-sm font-medium whitespace-nowrap">Usuario Externo Baixa</span>
                </div>
              </div>

              {/* Ambientes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Ambientes</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Ambiente</th>
                        <th className="px-4 py-3 text-left font-medium">URL Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded bg-green-500/20 text-green-600 text-xs font-medium">Producao</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">https://api.transfer.petrobras.com.br/api/v1</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-600 text-xs font-medium">Homologacao</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">https://api-hml.transfer.petrobras.com.br/api/v1</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-600 text-xs font-medium">Desenvolvimento</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">http://localhost:8000/api/v1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Endpoints by Tag */}
            {filteredTags?.map((tag: any) => {
              const tagEndpoints = endpointsByTag[tag.name] || []
              if (searchQuery && tagEndpoints.length === 0) return null

              const filteredEndpoints = searchQuery
                ? tagEndpoints.filter(
                    (e) =>
                      e.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      e.operation.summary?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : tagEndpoints

              if (filteredEndpoints.length === 0) return null

              return (
                <div key={tag.name} id={tag.name.toLowerCase().replace(/\s/g, "-")}>
                  <TagSection tag={tag} endpoints={filteredEndpoints} />
                </div>
              )
            })}

            {/* Schemas */}
            <div className="border rounded-xl overflow-hidden bg-card">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-lg">Schemas</h3>
                <p className="text-sm text-muted-foreground">Modelos de dados utilizados pela API</p>
              </div>
              <div className="p-4 grid gap-4">
                {Object.entries(spec.components?.schemas || {}).map(([name, schema]: [string, any]) => (
                  <details key={name} className="border rounded-lg overflow-hidden">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors font-mono text-sm">
                      {name}
                    </summary>
                    <div className="border-t p-4 bg-muted/20">
                      <JsonViewer data={schema} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-6">
        <div className="container mx-auto px-4" />
      </footer>
    </div>
  )
}
