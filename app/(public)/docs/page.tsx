"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Copy, Check, ExternalLink, Lock, Tag, Server, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import yaml from "js-yaml"

interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    description: string
    version: string
    contact?: { name?: string; email?: string }
  }
  servers?: Array<{ url: string; description: string }>
  tags?: Array<{ name: string; description: string }>
  paths: Record<string, Record<string, PathOperation>>
  components?: {
    schemas?: Record<string, SchemaObject>
    securitySchemes?: Record<string, SecurityScheme>
  }
}

interface PathOperation {
  tags?: string[]
  summary?: string
  description?: string
  operationId?: string
  requestBody?: {
    required?: boolean
    content?: Record<string, { schema: SchemaObject }>
  }
  responses?: Record<string, ResponseObject>
  security?: Array<Record<string, string[]>>
  parameters?: ParameterObject[]
}

interface ResponseObject {
  description: string
  content?: Record<string, { schema: SchemaObject }>
}

interface SchemaObject {
  type?: string
  format?: string
  properties?: Record<string, SchemaObject>
  items?: SchemaObject
  required?: string[]
  enum?: string[]
  description?: string
  example?: unknown
  $ref?: string
  allOf?: SchemaObject[]
  oneOf?: SchemaObject[]
  anyOf?: SchemaObject[]
}

interface ParameterObject {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: SchemaObject
}

interface SecurityScheme {
  type: string
  scheme?: string
  bearerFormat?: string
  description?: string
}

const methodColors: Record<string, string> = {
  get: "bg-emerald-500",
  post: "bg-blue-500",
  put: "bg-amber-500",
  patch: "bg-orange-500",
  delete: "bg-red-500",
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="p-1.5 rounded hover:bg-white/10 transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  )
}

function resolveRef(ref: string, spec: OpenAPISpec): SchemaObject | null {
  const parts = ref.replace("#/", "").split("/")
  let current: unknown = spec
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return null
    }
  }
  return current as SchemaObject
}

function SchemaDisplay({ schema, spec, depth = 0 }: { schema: SchemaObject; spec: OpenAPISpec; depth?: number }) {
  if (schema.$ref) {
    const resolved = resolveRef(schema.$ref, spec)
    if (resolved) {
      return <SchemaDisplay schema={resolved} spec={spec} depth={depth} />
    }
    return <span className="text-gray-400">{schema.$ref.split("/").pop()}</span>
  }

  if (schema.allOf) {
    const merged: SchemaObject = { type: "object", properties: {}, required: [] }
    for (const s of schema.allOf) {
      const resolved = s.$ref ? resolveRef(s.$ref, spec) : s
      if (resolved?.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties }
      }
      if (resolved?.required) {
        merged.required = [...(merged.required || []), ...resolved.required]
      }
    }
    return <SchemaDisplay schema={merged} spec={spec} depth={depth} />
  }

  if (schema.type === "object" && schema.properties) {
    return (
      <div className={cn("space-y-1", depth > 0 && "ml-4 pl-3 border-l border-gray-700")}>
        {Object.entries(schema.properties).map(([name, prop]) => (
          <div key={name} className="text-sm">
            <span className="text-cyan-400">{name}</span>
            {schema.required?.includes(name) && <span className="text-red-400 ml-1">*</span>}
            <span className="text-gray-500 ml-2">
              {prop.$ref ? prop.$ref.split("/").pop() : prop.type}
              {prop.format && <span className="text-gray-600">({prop.format})</span>}
            </span>
            {prop.description && <span className="text-gray-500 ml-2">- {prop.description}</span>}
            {prop.type === "object" && prop.properties && (
              <SchemaDisplay schema={prop} spec={spec} depth={depth + 1} />
            )}
            {prop.type === "array" && prop.items && (
              <div className="ml-4 text-gray-500">
                items: <SchemaDisplay schema={prop.items} spec={spec} depth={depth + 1} />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (schema.type === "array" && schema.items) {
    return (
      <span>
        array of <SchemaDisplay schema={schema.items} spec={spec} depth={depth} />
      </span>
    )
  }

  return <span className="text-purple-400">{schema.type || "any"}</span>
}

function EndpointCard({ 
  path, 
  method, 
  operation, 
  spec 
}: { 
  path: string
  method: string
  operation: PathOperation
  spec: OpenAPISpec
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-800/50 transition-colors text-left"
      >
        <span className={cn("px-2 py-1 rounded text-xs font-bold text-white uppercase", methodColors[method])}>
          {method}
        </span>
        <code className="text-gray-300 font-mono text-sm flex-1">{path}</code>
        {operation.security && <Lock className="w-4 h-4 text-amber-400" />}
        <span className="text-gray-400 text-sm hidden md:block">{operation.summary}</span>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-800 p-4 space-y-4">
          {operation.description && (
            <p className="text-gray-400 text-sm">{operation.description}</p>
          )}

          {operation.parameters && operation.parameters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Parametros</h4>
              <div className="bg-gray-950 rounded p-3 space-y-2">
                {operation.parameters.map((param) => (
                  <div key={param.name} className="text-sm">
                    <span className="text-cyan-400">{param.name}</span>
                    {param.required && <span className="text-red-400 ml-1">*</span>}
                    <span className="text-gray-500 ml-2">({param.in})</span>
                    {param.description && <span className="text-gray-500 ml-2">- {param.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {operation.requestBody?.content && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Request Body</h4>
              <div className="bg-gray-950 rounded p-3">
                {Object.entries(operation.requestBody.content).map(([contentType, content]) => (
                  <div key={contentType}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">{contentType}</span>
                      <CopyButton text={JSON.stringify(content.schema, null, 2)} />
                    </div>
                    <SchemaDisplay schema={content.schema} spec={spec} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {operation.responses && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Respostas</h4>
              <div className="space-y-2">
                {Object.entries(operation.responses).map(([code, response]) => (
                  <div key={code} className="bg-gray-950 rounded p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-mono",
                        code.startsWith("2") ? "bg-emerald-500/20 text-emerald-400" :
                        code.startsWith("4") ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      )}>
                        {code}
                      </span>
                      <span className="text-gray-400 text-sm">{response.description}</span>
                    </div>
                    {response.content && Object.entries(response.content).map(([contentType, content]) => (
                      <div key={contentType} className="mt-2">
                        <span className="text-xs text-gray-500">{contentType}</span>
                        <SchemaDisplay schema={content.schema} spec={spec} />
                      </div>
                    ))}
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

function Sidebar({ 
  spec, 
  activeTag, 
  onTagSelect 
}: { 
  spec: OpenAPISpec
  activeTag: string | null
  onTagSelect: (tag: string | null) => void 
}) {
  return (
    <aside className="w-64 bg-[#1a1a2e] text-white h-screen overflow-y-auto fixed left-0 top-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">{spec.info.title}</h1>
        <p className="text-xs text-gray-400 mt-1">v{spec.info.version}</p>
      </div>

      <nav className="p-4">
        <button
          onClick={() => onTagSelect(null)}
          className={cn(
            "w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors",
            activeTag === null ? "bg-[#0066b3] text-white" : "hover:bg-gray-700/50 text-gray-300"
          )}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Visao Geral
        </button>

        <div className="mt-4">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">Endpoints</h3>
          {spec.tags?.map((tag) => (
            <button
              key={tag.name}
              onClick={() => onTagSelect(tag.name)}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm mb-1 transition-colors",
                activeTag === tag.name ? "bg-[#0066b3] text-white" : "hover:bg-gray-700/50 text-gray-300"
              )}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              {tag.name}
            </button>
          ))}
        </div>
      </nav>
    </aside>
  )
}

function Overview({ spec }: { spec: OpenAPISpec }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-100 mb-2">{spec.info.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">v{spec.info.version}</span>
          <span>OpenAPI {spec.openapi}</span>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <pre className="text-gray-300 whitespace-pre-wrap text-sm">{spec.info.description}</pre>
        </div>
      </div>

      {spec.servers && spec.servers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Servidores
          </h2>
          <div className="space-y-2">
            {spec.servers.map((server, i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <code className="text-cyan-400">{server.url}</code>
                  <p className="text-sm text-gray-500 mt-1">{server.description}</p>
                </div>
                <CopyButton text={server.url} />
              </div>
            ))}
          </div>
        </div>
      )}

      {spec.components?.securitySchemes && (
        <div>
          <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Autenticacao
          </h2>
          <div className="space-y-2">
            {Object.entries(spec.components.securitySchemes).map(([name, scheme]) => (
              <div key={name} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-200">{name}</span>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">{scheme.type}</span>
                </div>
                {scheme.description && <p className="text-sm text-gray-400">{scheme.description}</p>}
                {scheme.scheme && <p className="text-sm text-gray-500 mt-1">Scheme: {scheme.scheme}</p>}
                {scheme.bearerFormat && <p className="text-sm text-gray-500">Format: {scheme.bearerFormat}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TagSection({ tag, spec }: { tag: string; spec: OpenAPISpec }) {
  const tagInfo = spec.tags?.find((t) => t.name === tag)
  
  const endpoints = Object.entries(spec.paths).flatMap(([path, methods]) =>
    Object.entries(methods)
      .filter(([method, op]) => method !== "parameters" && op.tags?.includes(tag))
      .map(([method, op]) => ({ path, method, operation: op }))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{tag}</h1>
        {tagInfo?.description && (
          <p className="text-gray-400 mt-2">{tagInfo.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {endpoints.map(({ path, method, operation }) => (
          <EndpointCard
            key={`${method}-${path}`}
            path={path}
            method={method}
            operation={operation}
            spec={spec}
          />
        ))}
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSpec() {
      try {
        const res = await fetch("/openapi.yaml")
        if (!res.ok) throw new Error("Falha ao carregar especificacao")
        const text = await res.text()
        const parsed = yaml.load(text) as OpenAPISpec
        setSpec(parsed)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    loadSpec()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-gray-700 border-t-[#0066b3] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando documentacao...</p>
        </div>
      </div>
    )
  }

  if (error || !spec) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-red-400 mb-2">Erro ao carregar documentacao</h1>
          <p className="text-gray-400">{error || "Especificacao nao encontrada"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar spec={spec} activeTag={activeTag} onTagSelect={setActiveTag} />
      <main className="ml-64 p-8">
        {activeTag === null ? (
          <Overview spec={spec} />
        ) : (
          <TagSection tag={activeTag} spec={spec} />
        )}
      </main>
    </div>
  )
}
