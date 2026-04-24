"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Search,
  ChevronRight,
  Copy,
  Check,
  Workflow,
  Key,
  FileText,
  Users,
  AlertCircle,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  List,
  Plus,
  RefreshCw,
  MessageSquare,
} from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function ServiceNowPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("all")
  const searchParams = useSearchParams()

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categories = [
    { id: "all", label: "Todos", icon: List },
    { id: "auth", label: "Autenticacao", icon: Key },
    { id: "incidents", label: "Incidents", icon: AlertCircle },
    { id: "requests", label: "Requests", icon: FileText },
    { id: "users", label: "Users", icon: Users },
    { id: "catalog", label: "Catalog", icon: Settings },
  ]

  const endpoints = [
    // AUTENTICACAO
    {
      id: "auth-token",
      category: "auth",
      method: "POST",
      path: "/oauth_token.do",
      title: "Obter Token OAuth",
      description: "Gera um token de acesso para autenticacao nas APIs do ServiceNow",
      request: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=password
&client_id=seu_client_id
&client_secret=seu_client_secret
&username=seu_usuario
&password=sua_senha`,
      },
      response: `{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR...",
  "refresh_token": "abc123xyz...",
  "scope": "useraccount",
  "token_type": "Bearer",
  "expires_in": 1799
}`,
      notes: [
        "Token expira em 30 minutos (1799 segundos)",
        "Use o refresh_token para renovar sem reautenticar",
        "Guarde o token de forma segura - nunca no frontend",
      ],
    },
    {
      id: "auth-refresh",
      category: "auth",
      method: "POST",
      path: "/oauth_token.do",
      title: "Renovar Token",
      description: "Renova o token de acesso usando o refresh_token",
      request: {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=refresh_token
&client_id=seu_client_id
&client_secret=seu_client_secret
&refresh_token=seu_refresh_token`,
      },
      response: `{
  "access_token": "novo_token_aqui...",
  "refresh_token": "novo_refresh_token...",
  "token_type": "Bearer",
  "expires_in": 1799
}`,
      notes: ["Use antes do token expirar para evitar reautenticacao"],
    },
    // INCIDENTS
    {
      id: "incident-list",
      category: "incidents",
      method: "GET",
      path: "/api/now/table/incident",
      title: "Listar Incidents",
      description: "Retorna lista de incidents com filtros e paginacao",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: `?sysparm_query=active=true
&sysparm_limit=10
&sysparm_offset=0
&sysparm_fields=sys_id,number,short_description,state,priority,assigned_to
&sysparm_display_value=true`,
      },
      response: `{
  "result": [
    {
      "sys_id": "a1b2c3d4e5f6...",
      "number": "INC0010001",
      "short_description": "Problema no sistema de arquivos",
      "state": "In Progress",
      "priority": "2 - High",
      "assigned_to": {
        "display_value": "Joao Silva",
        "link": "https://instance.service-now.com/api/now/table/sys_user/..."
      }
    }
  ]
}`,
      notes: [
        "sysparm_display_value=true retorna valores legiveis",
        "sysparm_query aceita operadores: =, !=, LIKE, IN, STARTSWITH",
        "Use sysparm_fields para limitar campos retornados",
      ],
    },
    {
      id: "incident-get",
      category: "incidents",
      method: "GET",
      path: "/api/now/table/incident/{sys_id}",
      title: "Buscar Incident por ID",
      description: "Retorna detalhes completos de um incident especifico",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: "?sysparm_display_value=true",
      },
      response: `{
  "result": {
    "sys_id": "a1b2c3d4e5f6...",
    "number": "INC0010001",
    "short_description": "Problema no sistema de arquivos",
    "description": "Descricao detalhada do problema...",
    "state": "In Progress",
    "priority": "2 - High",
    "urgency": "2 - High",
    "impact": "2 - Medium",
    "category": "Software",
    "subcategory": "Application",
    "assigned_to": "Joao Silva",
    "assignment_group": "Service Desk",
    "caller_id": "Maria Santos",
    "opened_at": "2026-01-20 10:30:00",
    "sys_created_on": "2026-01-20 10:30:00",
    "sys_updated_on": "2026-01-21 14:15:00",
    "close_code": "",
    "close_notes": "",
    "resolved_at": "",
    "work_notes": "Analisando o problema...",
    "comments": "Usuario reportou que o sistema esta lento"
  }
}`,
      notes: ["sys_id e o identificador unico do registro", "Use sysparm_display_value=all para todos os campos"],
    },
    {
      id: "incident-create",
      category: "incidents",
      method: "POST",
      path: "/api/now/table/incident",
      title: "Criar Incident",
      description: "Cria um novo incident no ServiceNow",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        body: `{
  "short_description": "Erro ao transferir arquivos",
  "description": "Usuario nao consegue fazer upload de arquivos para o sistema",
  "caller_id": "email.usuario@petrobras.com.br",
  "category": "Software",
  "subcategory": "Application",
  "urgency": "2",
  "impact": "2",
  "assignment_group": "Service Desk"
}`,
      },
      response: `{
  "result": {
    "sys_id": "novo_sys_id_gerado...",
    "number": "INC0010002",
    "state": "New",
    "short_description": "Erro ao transferir arquivos",
    "sys_created_on": "2026-01-21 15:30:00"
  }
}`,
      notes: [
        "caller_id pode ser email ou sys_id do usuario",
        "Urgency: 1=High, 2=Medium, 3=Low",
        "Impact: 1=High, 2=Medium, 3=Low",
        "Priority e calculado automaticamente (Urgency x Impact)",
      ],
    },
    {
      id: "incident-update",
      category: "incidents",
      method: "PATCH",
      path: "/api/now/table/incident/{sys_id}",
      title: "Atualizar Incident",
      description: "Atualiza campos de um incident existente",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        body: `{
  "state": "2",
  "assigned_to": "sys_id_do_tecnico",
  "work_notes": "Iniciando analise do problema",
  "comments": "Entrando em contato com o usuario"
}`,
      },
      response: `{
  "result": {
    "sys_id": "a1b2c3d4e5f6...",
    "number": "INC0010001",
    "state": "In Progress",
    "sys_updated_on": "2026-01-21 16:00:00"
  }
}`,
      notes: [
        "States: 1=New, 2=In Progress, 3=On Hold, 6=Resolved, 7=Closed",
        "work_notes sao internas (so tecnicos veem)",
        "comments sao visiveis para o usuario",
      ],
    },
    {
      id: "incident-resolve",
      category: "incidents",
      method: "PATCH",
      path: "/api/now/table/incident/{sys_id}",
      title: "Resolver Incident",
      description: "Marca um incident como resolvido",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        body: `{
  "state": "6",
  "close_code": "Solved (Permanently)",
  "close_notes": "Problema resolvido. Foi identificado erro na configuracao do firewall que bloqueava o upload.",
  "work_notes": "Ajustada regra de firewall. Testado com sucesso."
}`,
      },
      response: `{
  "result": {
    "sys_id": "a1b2c3d4e5f6...",
    "number": "INC0010001",
    "state": "Resolved",
    "resolved_at": "2026-01-21 17:30:00",
    "close_code": "Solved (Permanently)"
  }
}`,
      notes: [
        "close_code obrigatorio ao resolver",
        "Codigos comuns: Solved (Permanently), Solved (Workaround), Not Solved",
        "Usuario recebe notificacao automatica",
      ],
    },
    // SERVICE REQUESTS
    {
      id: "request-list",
      category: "requests",
      method: "GET",
      path: "/api/now/table/sc_request",
      title: "Listar Service Requests",
      description: "Retorna lista de solicitacoes de servico",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: `?sysparm_query=active=true
&sysparm_limit=10
&sysparm_display_value=true`,
      },
      response: `{
  "result": [
    {
      "sys_id": "req123...",
      "number": "REQ0010001",
      "short_description": "Solicitacao de acesso ao sistema",
      "request_state": "Approved",
      "requested_for": "Maria Santos",
      "opened_at": "2026-01-20 09:00:00"
    }
  ]
}`,
      notes: ["sc_request = Request, sc_req_item = Request Item", "Um Request pode ter varios Items"],
    },
    {
      id: "request-create",
      category: "requests",
      method: "POST",
      path: "/api/sn_sc/servicecatalog/items/{sys_id}/order_now",
      title: "Criar Service Request",
      description: "Cria uma nova solicitacao a partir de um item do catalogo",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        body: `{
  "sysparm_quantity": "1",
  "variables": {
    "requested_for": "email.usuario@petrobras.com.br",
    "justification": "Necessito acesso para realizar minhas atividades",
    "start_date": "2026-01-25"
  }
}`,
      },
      response: `{
  "result": {
    "sys_id": "novo_request_id...",
    "number": "REQ0010002",
    "request_number": "REQ0010002",
    "request_id": "novo_request_id...",
    "table": "sc_request"
  }
}`,
      notes: [
        "sys_id no path e o ID do catalog item",
        "variables depende de cada item do catalogo",
        "Consulte o catalogo para ver variaveis disponiveis",
      ],
    },
    // USERS
    {
      id: "user-get",
      category: "users",
      method: "GET",
      path: "/api/now/table/sys_user",
      title: "Buscar Usuario",
      description: "Busca usuarios por email, nome ou sys_id",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: `?sysparm_query=email=usuario@petrobras.com.br
&sysparm_fields=sys_id,user_name,email,name,department,title,manager
&sysparm_display_value=true`,
      },
      response: `{
  "result": [
    {
      "sys_id": "user123...",
      "user_name": "usuario.teste",
      "email": "usuario@petrobras.com.br",
      "name": "Usuario Teste",
      "department": "TI - Desenvolvimento",
      "title": "Analista de Sistemas",
      "manager": "Gerente Silva"
    }
  ]
}`,
      notes: [
        "user_name e o login do usuario",
        "Busque por email para integracao com Entra ID",
        "manager retorna o gestor direto",
      ],
    },
    {
      id: "user-groups",
      category: "users",
      method: "GET",
      path: "/api/now/table/sys_user_grmember",
      title: "Grupos do Usuario",
      description: "Lista todos os grupos de um usuario",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: `?sysparm_query=user=sys_id_do_usuario
&sysparm_display_value=true`,
      },
      response: `{
  "result": [
    {
      "sys_id": "member123...",
      "user": "Usuario Teste",
      "group": "Service Desk"
    },
    {
      "sys_id": "member124...",
      "user": "Usuario Teste",
      "group": "Change Management"
    }
  ]
}`,
      notes: ["Util para verificar permissoes", "Grupos controlam acesso a funcionalidades"],
    },
    // CATALOG
    {
      id: "catalog-list",
      category: "catalog",
      method: "GET",
      path: "/api/sn_sc/servicecatalog/catalogs",
      title: "Listar Catalogos",
      description: "Retorna todos os catalogos de servico disponiveis",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
      },
      response: `{
  "result": [
    {
      "sys_id": "cat123...",
      "title": "Service Catalog",
      "description": "Catalogo principal de servicos de TI"
    },
    {
      "sys_id": "cat124...",
      "title": "Hardware Catalog",
      "description": "Solicitacao de equipamentos"
    }
  ]
}`,
      notes: ["Cada catalogo tem categorias e items", "Use sys_id para buscar items do catalogo"],
    },
    {
      id: "catalog-items",
      category: "catalog",
      method: "GET",
      path: "/api/sn_sc/servicecatalog/items",
      title: "Listar Items do Catalogo",
      description: "Retorna items disponiveis para solicitacao",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
        queryParams: `?sysparm_catalog=sys_id_do_catalogo
&sysparm_category=sys_id_da_categoria
&sysparm_limit=20`,
      },
      response: `{
  "result": [
    {
      "sys_id": "item123...",
      "name": "Acesso ao Sistema de Transferencia",
      "short_description": "Solicitar acesso ao sistema de transferencia de arquivos",
      "category": "Acessos",
      "price": "$0.00",
      "picture": "url_da_imagem..."
    }
  ]
}`,
      notes: ["Use sys_id do item para criar request", "price pode ser $0.00 para servicos gratuitos"],
    },
    {
      id: "catalog-item-variables",
      category: "catalog",
      method: "GET",
      path: "/api/sn_sc/servicecatalog/items/{sys_id}/variables",
      title: "Variaveis do Item",
      description: "Retorna campos que devem ser preenchidos ao solicitar um item",
      request: {
        headers: {
          Authorization: "Bearer {access_token}",
          "Content-Type": "application/json",
        },
      },
      response: `{
  "result": [
    {
      "name": "requested_for",
      "label": "Solicitar para",
      "type": "reference",
      "mandatory": true,
      "reference": "sys_user"
    },
    {
      "name": "justification",
      "label": "Justificativa",
      "type": "textarea",
      "mandatory": true
    },
    {
      "name": "start_date",
      "label": "Data de Inicio",
      "type": "date",
      "mandatory": false
    }
  ]
}`,
      notes: [
        "Campos mandatory=true sao obrigatorios",
        "type=reference significa que aceita sys_id de outra tabela",
        "Use esses nomes no body do order_now",
      ],
    },
  ]

  const filteredEndpoints = endpoints.filter((ep) => {
    const matchesSearch =
      ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ep.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || ep.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-500/20 text-green-600 border-green-500/30"
      case "POST":
        return "bg-blue-500/20 text-blue-600 border-blue-500/30"
      case "PUT":
        return "bg-amber-500/20 text-amber-600 border-amber-500/30"
      case "PATCH":
        return "bg-purple-500/20 text-purple-600 border-purple-500/30"
      case "DELETE":
        return "bg-red-500/20 text-red-600 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-600 border-gray-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Wiki Dev
                </Button>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <h1 className="text-xl font-bold">ServiceNow - Integracao</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Intro */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Workflow className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">ServiceNow REST API</h2>
              <p className="text-muted-foreground mb-4">
                Guia completo para integracao com ServiceNow. Todos os endpoints, exemplos de request/response, e dicas
                praticas para criar incidents, requests e consultar dados.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background">
                  Table API
                </Badge>
                <Badge variant="outline" className="bg-background">
                  Service Catalog API
                </Badge>
                <Badge variant="outline" className="bg-background">
                  OAuth 2.0
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="mb-8 p-4 rounded-lg border bg-card">
          <h3 className="font-semibold mb-3">URL Base</h3>
          <div className="flex items-center gap-2 p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-sm">
            <code>https://sua-instancia.service-now.com</code>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-8 w-8 p-0 text-slate-400 hover:text-white"
              onClick={() => copyToClipboard("https://sua-instancia.service-now.com", "base-url")}
            >
              {copiedId === "base-url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Substitua <code className="bg-muted px-1 rounded">sua-instancia</code> pelo nome da sua instancia
            ServiceNow
          </p>
        </div>

        {/* Search and Categories */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
                className="gap-2"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-green-600">
              {endpoints.filter((e) => e.method === "GET").length}
            </div>
            <div className="text-sm text-muted-foreground">GET</div>
          </div>
          <div className="p-4 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {endpoints.filter((e) => e.method === "POST").length}
            </div>
            <div className="text-sm text-muted-foreground">POST</div>
          </div>
          <div className="p-4 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-purple-600">
              {endpoints.filter((e) => e.method === "PATCH").length}
            </div>
            <div className="text-sm text-muted-foreground">PATCH</div>
          </div>
          <div className="p-4 rounded-lg border bg-card text-center">
            <div className="text-2xl font-bold text-teal-600">{endpoints.length}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Endpoints List */}
        <div className="space-y-6">
          {filteredEndpoints.map((endpoint) => (
            <div key={endpoint.id} className="border rounded-xl overflow-hidden bg-card">
              {/* Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-start gap-3">
                  <Badge className={`${getMethodColor(endpoint.method)} border font-mono`}>{endpoint.method}</Badge>
                  <div className="flex-1">
                    <h3 className="font-semibold">{endpoint.title}</h3>
                    <code className="text-sm text-muted-foreground">{endpoint.path}</code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(endpoint.path, `path-${endpoint.id}`)}
                  >
                    {copiedId === `path-${endpoint.id}` ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{endpoint.description}</p>
              </div>

              {/* Request */}
              <div className="p-4 border-b">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-blue-500" />
                  Request
                </h4>

                {/* Headers */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Headers:</p>
                  <div className="p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
                    {Object.entries(endpoint.request.headers).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-cyan-400">{key}</span>
                        <span className="text-slate-400">: </span>
                        <span className="text-green-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Query Params or Body */}
                {endpoint.request.queryParams && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Query Parameters:</p>
                    <div className="relative">
                      <pre className="p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {endpoint.request.queryParams}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-400 hover:text-white"
                        onClick={() => copyToClipboard(endpoint.request.queryParams || "", `query-${endpoint.id}`)}
                      >
                        {copiedId === `query-${endpoint.id}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {endpoint.request.body && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Body:</p>
                    <div className="relative">
                      <pre className="p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                        {endpoint.request.body}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-400 hover:text-white"
                        onClick={() => copyToClipboard(endpoint.request.body || "", `body-${endpoint.id}`)}
                      >
                        {copiedId === `body-${endpoint.id}` ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Response */}
              <div className="p-4 border-b">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Response (200 OK)
                </h4>
                <div className="relative">
                  <pre className="p-3 rounded-md bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {endpoint.response}
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(endpoint.response, `response-${endpoint.id}`)}
                  >
                    {copiedId === `response-${endpoint.id}` ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Notes */}
              {endpoint.notes && endpoint.notes.length > 0 && (
                <div className="p-4 bg-amber-500/5">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Observacoes Importantes
                  </h4>
                  <ul className="space-y-1">
                    {endpoint.notes.map((note, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-amber-500 mt-1">*</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Common Errors */}
        <div className="mt-12 p-6 rounded-xl border bg-card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Erros Comuns
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
                  401
                </Badge>
                <span className="font-medium">Unauthorized</span>
              </div>
              <p className="text-sm text-muted-foreground">Token expirado ou invalido. Renove o token ou faca login novamente.</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
                  403
                </Badge>
                <span className="font-medium">Forbidden</span>
              </div>
              <p className="text-sm text-muted-foreground">Usuario nao tem permissao. Verifique os roles e grupos no ServiceNow.</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
                  404
                </Badge>
                <span className="font-medium">Not Found</span>
              </div>
              <p className="text-sm text-muted-foreground">Registro nao encontrado. Verifique o sys_id ou path do endpoint.</p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-red-500/20 text-red-600 border-red-500/30">
                  429
                </Badge>
                <span className="font-medium">Too Many Requests</span>
              </div>
              <p className="text-sm text-muted-foreground">Rate limit excedido. Aguarde alguns segundos e tente novamente.</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 p-6 rounded-xl border bg-card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Dicas para Integracao
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-medium mb-2">Cache de Tokens</h4>
              <p className="text-sm text-muted-foreground">
                Guarde o access_token e reutilize ate expirar. Evite gerar novo token a cada request.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-medium mb-2">Paginacao</h4>
              <p className="text-sm text-muted-foreground">
                Use sysparm_limit e sysparm_offset para paginar resultados grandes.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-medium mb-2">Display Values</h4>
              <p className="text-sm text-muted-foreground">
                Adicione sysparm_display_value=true para receber textos legiveis em vez de sys_ids.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-medium mb-2">Campos Especificos</h4>
              <p className="text-sm text-muted-foreground">
                Use sysparm_fields para retornar apenas os campos necessarios e melhorar performance.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export function Loading() {
  return null
}
