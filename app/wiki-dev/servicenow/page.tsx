"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Shield, Code2, Database, Cloud, GitBranch, Key, UserCheck, Server, Lock } from "lucide-react"
import Link from "next/link"

export default function ServiceNowPage() {
  const [activeTab, setActiveTab] = useState("visao-geral")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>

          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">ServiceNow Integration</h1>
          <p className="text-lg text-slate-600">
            Guia completo de integração com ServiceNow para autenticação corporativa e gestão de usuários
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger
              value="visao-geral"
              className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:border-teal-200 border-2 py-3"
            >
              <Shield className="mr-2 h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="endpoints"
              className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200 border-2 py-3"
            >
              <Code2 className="mr-2 h-4 w-4" />
              Endpoints API
            </TabsTrigger>
            <TabsTrigger
              value="frontend"
              className="data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:border-cyan-200 border-2 py-3"
            >
              <GitBranch className="mr-2 h-4 w-4" />
              Front-end
            </TabsTrigger>
            <TabsTrigger
              value="backend"
              className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:border-purple-200 border-2 py-3"
            >
              <Server className="mr-2 h-4 w-4" />
              Back-end Python
            </TabsTrigger>
            <TabsTrigger
              value="database"
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:border-indigo-200 border-2 py-3"
            >
              <Database className="mr-2 h-4 w-4" />
              DynamoDB
            </TabsTrigger>
            <TabsTrigger
              value="aws"
              className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200 border-2 py-3"
            >
              <Cloud className="mr-2 h-4 w-4" />
              AWS Services
            </TabsTrigger>
            <TabsTrigger
              value="implementacao"
              className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 border-2 py-3"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Implementação
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="visao-geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-teal-600" />O que é o ServiceNow?
                </CardTitle>
                <CardDescription>Explicação simples para qualquer pessoa entender</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-lg border-2 border-teal-200">
                  <p className="text-slate-800 leading-relaxed mb-4">
                    <strong>ServiceNow</strong> é como um <strong>"sistema de cadastro central"</strong> da Petrobras
                    onde ficam guardados todos os dados dos funcionários: nome, email, departamento, quem é o chefe de
                    cada um, etc.
                  </p>
                  <p className="text-slate-800 leading-relaxed">
                    Ao invés de cada sistema ter sua própria lista de usuários, todos os sistemas da empresa se conectam
                    ao ServiceNow para saber quem é quem. É como se fosse uma{" "}
                    <strong>"carteira de identidade digital"</strong>
                    única para toda a empresa.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border-l-4 border-teal-500 bg-teal-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-teal-900 mb-2">Sem ServiceNow (Problema)</h4>
                    <ul className="list-disc list-inside text-teal-700 space-y-1 text-sm">
                      <li>Cada sistema tem seu próprio cadastro de usuários</li>
                      <li>Usuário precisa criar conta em cada sistema</li>
                      <li>Difícil saber quem é supervisor de quem</li>
                      <li>Dados desatualizados e duplicados</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Com ServiceNow (Solução)</h4>
                    <ul className="list-disc list-inside text-green-700 space-y-1 text-sm">
                      <li>Uma única fonte de verdade sobre usuários</li>
                      <li>Login automático com credenciais corporativas</li>
                      <li>Sabe automaticamente quem é supervisor</li>
                      <li>Dados sempre atualizados e sincronizados</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3 text-lg">
                    Por que integrar nosso sistema com ServiceNow?
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600 mt-1">1</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">Autenticação Única (SSO)</p>
                        <p className="text-blue-700">
                          Funcionários da Petrobras fazem login com suas credenciais corporativas, sem precisar criar
                          nova senha
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600 mt-1">2</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">Identificação Automática de Perfis</p>
                        <p className="text-blue-700">
                          O sistema descobre automaticamente se o usuário é interno ou supervisor olhando os "roles" no
                          ServiceNow
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600 mt-1">3</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">Hierarquia Organizacional</p>
                        <p className="text-blue-700">
                          Sabe quem é o gestor/supervisor de cada funcionário, permitindo fluxos de aprovação
                          automáticos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="bg-blue-600 mt-1">4</Badge>
                      <div>
                        <p className="font-semibold text-blue-900">Dados Sempre Atualizados</p>
                        <p className="text-blue-700">
                          Se alguém muda de departamento ou supervisor no RH, a mudança aparece automaticamente no nosso
                          sistema
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Key className="h-6 w-6 text-yellow-700 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-bold text-yellow-900 mb-2">Conceito-chave: OAuth 2.0</h4>
                      <p className="text-yellow-800 text-sm leading-relaxed">
                        É como quando você entra num site e escolhe "Login com Google". Você não cria uma senha nova, o
                        Google confirma que você é você e pronto! Com ServiceNow é a mesma coisa, só que ao invés de
                        Google, é o sistema da Petrobras quem confirma sua identidade.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints API */}
          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-600" />
                  Endpoints da API ServiceNow
                </CardTitle>
                <CardDescription>
                  Lista completa de endpoints que vamos usar para autenticação e busca de dados de usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endpoint 1: Buscar Usuário */}
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-green-600">GET</Badge>
                    <code className="bg-blue-100 px-3 py-1 rounded text-sm font-mono">/api/now/table/sys_user</code>
                  </div>

                  <h4 className="font-semibold text-blue-900 mb-2">1. Buscar Dados do Usuário</h4>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Para que serve?</p>
                      <p className="text-blue-700">
                        Busca informações completas de um funcionário usando o email dele. É como procurar alguém na
                        agenda telefônica da empresa.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">URL Completa:</p>
                      <code className="bg-blue-100 px-2 py-1 rounded text-xs block overflow-x-auto">
                        https://petrobras.service-now.com/api/now/table/sys_user?sysparm_query=email=wagner.brazil@petrobras.com.br^active=true
                      </code>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">Parâmetros Importantes:</p>
                      <ul className="list-disc list-inside text-blue-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">email</code> - Email do funcionário que
                          queremos buscar
                        </li>
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">active=true</code> - Só busca funcionários
                          ativos (não demitidos)
                        </li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">O que retorna:</p>
                      <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-green-400">
                          {`{
  "result": [
    {
      "sys_id": "abc123xyz",          // ID único do usuário
      "email": "wagner.brazil@petrobras.com.br",
      "name": "Wagner Gaspar Brazil",
      "user_name": "wagner.brazil",   // Login de rede
      "department": {
        "value": "TI123",
        "display_value": "Tecnologia da Informação"
      },
      "title": "Supervisor de TI",   // Cargo
      "manager": {
        "value": "def456uvw",         // ID do gestor
        "display_value": "João Silva" // Nome do gestor
      },
      "active": "true",                // Funcionário ativo
      "phone": "+55 21 99999-9999"
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-blue-100 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-1">Explicação Simples:</p>
                      <p className="text-blue-800 text-sm">
                        É como perguntar: "ServiceNow, me dá todas as informações do Wagner Brazil". E ele responde com
                        nome, email, cargo, departamento, quem é o chefe dele, etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Endpoint 2: Verificar Roles */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-green-600">GET</Badge>
                    <code className="bg-purple-100 px-3 py-1 rounded text-sm font-mono">
                      /api/now/table/sys_user_has_role
                    </code>
                  </div>

                  <h4 className="font-semibold text-purple-900 mb-2">2. Verificar Perfil/Permissões do Usuário</h4>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-purple-800 mb-1">Para que serve?</p>
                      <p className="text-purple-700">
                        Descobre se o usuário é supervisor, admin, usuário comum, etc. É como verificar o "crachá" dele
                        para saber que portas ele pode abrir.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-purple-800 mb-1">URL Completa:</p>
                      <code className="bg-purple-100 px-2 py-1 rounded text-xs block overflow-x-auto">
                        https://petrobras.service-now.com/api/now/table/sys_user_has_role?sysparm_query=user.email=wagner.brazil@petrobras.com.br
                      </code>
                    </div>

                    <div>
                      <p className="font-medium text-purple-800 mb-1">O que retorna:</p>
                      <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-green-400">
                          {`{
  "result": [
    {
      "user": {
        "value": "abc123xyz",
        "display_value": "Wagner Gaspar Brazil"
      },
      "role": {
        "value": "supervisor_role_id",
        "display_value": "Supervisor"      // ESTE é o role que importa!
      }
    },
    {
      "user": {
        "value": "abc123xyz",
        "display_value": "Wagner Gaspar Brazil"
      },
      "role": {
        "value": "file_approver_id",
        "display_value": "File Approver"   // Pode ter vários roles
      }
    }
  ]
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-purple-100 p-3 rounded-lg">
                      <p className="font-semibold text-purple-900 mb-1">Como usar no nosso sistema:</p>
                      <ul className="list-disc list-inside text-purple-800 space-y-1 pl-4 text-sm">
                        <li>
                          Se encontrar role <code className="bg-purple-200 px-1 py-0.5 rounded">"Supervisor"</code> →
                          Redireciona para <code>/supervisor</code>
                        </li>
                        <li>
                          Se encontrar role <code className="bg-purple-200 px-1 py-0.5 rounded">"Internal User"</code> →
                          Redireciona para <code>/upload</code>
                        </li>
                        <li>Se não tiver nenhum role → Usuário externo (download apenas)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Endpoint 3: OAuth Token */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className="bg-blue-600">POST</Badge>
                    <code className="bg-orange-100 px-3 py-1 rounded text-sm font-mono">/oauth_token.do</code>
                  </div>

                  <h4 className="font-semibold text-orange-900 mb-2">3. Obter Token de Acesso (OAuth)</h4>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Para que serve?</p>
                      <p className="text-orange-700">
                        Troca as credenciais (email/senha) do usuário por um "token de acesso" que pode ser usado para
                        fazer outras chamadas ao ServiceNow. É como trocar dinheiro por fichas num cassino.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-orange-800 mb-1">URL Completa:</p>
                      <code className="bg-orange-100 px-2 py-1 rounded text-xs block overflow-x-auto">
                        https://petrobras.service-now.com/oauth_token.do
                      </code>
                    </div>

                    <div>
                      <p className="font-medium text-orange-800 mb-1">O que enviar (Body):</p>
                      <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-green-400">
                          {`{
  "grant_type": "password",              // Tipo de autenticação
  "client_id": "YOUR_CLIENT_ID",         // ID da nossa aplicação no ServiceNow
  "client_secret": "YOUR_CLIENT_SECRET", // Senha da nossa aplicação
  "username": "wagner.brazil",           // Login do usuário
  "password": "senha_do_usuario"         // Senha do usuário
}`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-orange-800 mb-1">O que retorna:</p>
                      <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-xs text-green-400">
                          {`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // Token que usamos nas próximas chamadas
  "refresh_token": "def50200abc...",                          // Token para renovar quando expirar
  "expires_in": 3600,                                         // Expira em 1 hora (3600 segundos)
  "token_type": "Bearer"                                      // Tipo do token
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-orange-100 p-3 rounded-lg">
                      <p className="font-semibold text-orange-900 mb-1">IMPORTANTE - Segurança:</p>
                      <p className="text-orange-800 text-sm">
                        <strong>NUNCA</strong> envie senha do usuário do front-end direto para ServiceNow! O fluxo
                        correto é: Front-end → Nosso Back-end Python → ServiceNow. Assim as credenciais corporativas
                        ficam protegidas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabela Resumo */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-4 border-b">
                    <h4 className="font-bold text-slate-900">Resumo: Quando usar cada endpoint</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Endpoint</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">Quando usar</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-700">O que faz</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">/oauth_token.do</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">Na tela de login</td>
                          <td className="px-4 py-3 text-slate-600">Valida senha e gera token de acesso</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">/sys_user</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">Após login bem-sucedido</td>
                          <td className="px-4 py-3 text-slate-600">Busca dados completos: nome, cargo, departamento</td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <code className="bg-blue-100 px-2 py-1 rounded text-xs">/sys_user_has_role</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">Após buscar dados do usuário</td>
                          <td className="px-4 py-3 text-slate-600">Descobre se é supervisor ou usuário comum</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Front-end */}
          <TabsContent value="frontend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-cyan-600" />
                  Integração no Front-end (Next.js)
                </CardTitle>
                <CardDescription>Como conectar a tela de login ao ServiceNow via nosso back-end Python</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Explicação do Fluxo */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-lg border-2 border-cyan-200">
                  <h4 className="font-bold text-cyan-900 mb-4 text-lg">Fluxo de Autenticação Completo</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-900">Usuário digita email e senha no front-end</p>
                        <p className="text-cyan-700 text-sm">
                          Tela de login Next.js (
                          <code className="bg-cyan-100 px-1 py-0.5 rounded">components/auth/login-form.tsx</code>)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-2xl text-cyan-400">↓</div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-900">Front-end chama nosso back-end Python</p>
                        <p className="text-cyan-700 text-sm">
                          POST para <code className="bg-cyan-100 px-1 py-0.5 rounded">/api/auth/servicenow</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-2xl text-cyan-400">↓</div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-900">Back-end Python valida com ServiceNow</p>
                        <p className="text-cyan-700 text-sm">Chama endpoint OAuth do ServiceNow com credenciais</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-2xl text-cyan-400">↓</div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-white font-bold text-sm">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-cyan-900">Back-end busca dados e roles do usuário</p>
                        <p className="text-cyan-700 text-sm">
                          Chama <code className="bg-cyan-100 px-1 py-0.5 rounded">/sys_user</code> e{" "}
                          <code className="bg-cyan-100 px-1 py-0.5 rounded">/sys_user_has_role</code>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-2xl text-cyan-400">↓</div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold text-sm">
                        5
                      </div>
                      <div>
                        <p className="font-semibold text-green-900">Back-end retorna JWT nosso + dados do usuário</p>
                        <p className="text-green-700 text-sm">
                          Front-end recebe token, salva no Zustand e redireciona para página correta
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Código do Front-end */}
                <div className="border-l-4 border-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Código: Atualizar Login Form
                  </h4>

                  <div className="space-y-3">
                    <p className="text-sm text-cyan-800 mb-2">
                      Arquivo: <code className="bg-cyan-100 px-2 py-0.5 rounded">components/auth/login-form.tsx</code>
                    </p>

                    <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-xs text-green-400">
                        {`const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    // Chama nosso back-end Python que fala com ServiceNow
    const response = await fetch('/api/auth/servicenow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email, 
        password 
      })
    })

    if (!response.ok) {
      throw new Error('Credenciais inválidas')
    }

    const data = await response.json()
    // data = {
    //   user: { id, email, name, userType: "internal" | "supervisor" },
    //   accessToken: "jwt_token_nosso",
    //   refreshToken: "jwt_refresh"
    // }

    // Salva no Zustand
    setAuth(data.user, data.accessToken, data.refreshToken)

    // Registra log de auditoria
    useAuditLogStore.getState().addLog({
      action: 'login',
      level: 'success',
      user: data.user,
      details: { description: 'Login via ServiceNow' }
    })

    // Redireciona baseado no perfil
    const redirectPath = 
      data.user.userType === 'internal' ? '/upload' :
      data.user.userType === 'supervisor' ? '/supervisor' :
      '/download'
    
    router.push(redirectPath)

  } catch (error) {
    setNotification({
      show: true,
      type: 'error',
      title: 'Erro ao fazer login',
      message: 'Email ou senha inválidos'
    })
  } finally {
    setIsLoading(false)
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Explicação Simples */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Explicação para leigos:</h4>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Quando o usuário clica em "Entrar", o front-end não fala direto com o ServiceNow. Ele primeiro fala
                    com nosso servidor Python (que é mais seguro), e o servidor Python é quem conversa com ServiceNow.
                    Se tudo der certo, o servidor Python nos devolve as informações do usuário + um token de acesso
                    nosso (não o do ServiceNow) que usamos nas próximas requisições.
                  </p>
                </div>

                {/* Mudanças no Auth Store */}
                <div className="border-l-4 border-indigo-500 bg-indigo-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-indigo-900 mb-3">Mudanças no Auth Store (Zustand)</h4>

                  <p className="text-sm text-indigo-800 mb-2">
                    Arquivo: <code className="bg-indigo-100 px-2 py-0.5 rounded">lib/stores/auth-store.ts</code>
                  </p>

                  <p className="text-sm text-indigo-700 mb-3">
                    O Auth Store atual já está pronto! Não precisa mudar nada. Ele já guarda:
                  </p>

                  <ul className="list-disc list-inside text-indigo-700 space-y-1 pl-4 text-sm">
                    <li>
                      <code className="bg-indigo-100 px-1 py-0.5 rounded">user</code> - Dados do usuário do ServiceNow
                    </li>
                    <li>
                      <code className="bg-indigo-100 px-1 py-0.5 rounded">accessToken</code> - JWT do nosso sistema
                    </li>
                    <li>
                      <code className="bg-indigo-100 px-1 py-0.5 rounded">refreshToken</code> - Para renovar o token
                    </li>
                    <li>
                      <code className="bg-indigo-100 px-1 py-0.5 rounded">userType</code> - "internal", "external" ou
                      "supervisor"
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Back-end Python */}
          <TabsContent value="backend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  Implementação no Back-end (Python FastAPI)
                </CardTitle>
                <CardDescription>
                  Criar endpoint que recebe credenciais do front-end e valida com ServiceNow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estrutura de Arquivos */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-4 text-lg">
                    Arquivos que vamos criar no back-end Python
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">1</Badge>
                      <code className="bg-purple-100 px-2 py-0.5 rounded">app/routers/auth_servicenow.py</code>
                      <span className="text-purple-700">- Endpoint de autenticação</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">2</Badge>
                      <code className="bg-purple-100 px-2 py-0.5 rounded">app/services/servicenow_service.py</code>
                      <span className="text-purple-700">- Lógica de integração com ServiceNow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">3</Badge>
                      <code className="bg-purple-100 px-2 py-0.5 rounded">app/models/user.py</code>
                      <span className="text-purple-700">- Modelo de dados do usuário</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">4</Badge>
                      <code className="bg-purple-100 px-2 py-0.5 rounded">.env</code>
                      <span className="text-purple-700">- Variáveis de ambiente do ServiceNow</span>
                    </div>
                  </div>
                </div>

                {/* Código 1: Service */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Código 1: ServiceNow Service
                  </h4>

                  <p className="text-sm text-purple-800 mb-2">
                    Arquivo:{" "}
                    <code className="bg-purple-100 px-2 py-0.5 rounded">app/services/servicenow_service.py</code>
                  </p>

                  <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-green-400">
                      {`import httpx
from typing import Optional, Dict
from app.core.config import settings

class ServiceNowService:
    def __init__(self):
        self.base_url = settings.SERVICENOW_INSTANCE_URL  # https://petrobras.service-now.com
        self.client_id = settings.SERVICENOW_CLIENT_ID
        self.client_secret = settings.SERVICENOW_CLIENT_SECRET
    
    async def authenticate(self, email: str, password: str) -> Optional[Dict]:
        """
        Autentica usuário no ServiceNow e retorna dados + roles
        """
        try:
            # 1. Obter token OAuth do ServiceNow
            token_url = f"{self.base_url}/oauth_token.do"
            token_data = {
                "grant_type": "password",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "username": email.split('@')[0],  # Remove @petrobras.com.br
                "password": password
            }
            
            async with httpx.AsyncClient() as client:
                # Pega o token
                token_response = await client.post(token_url, data=token_data)
                
                if token_response.status_code != 200:
                    return None  # Credenciais inválidas
                
                access_token = token_response.json()["access_token"]
                headers = {"Authorization": f"Bearer {access_token}"}
                
                # 2. Buscar dados do usuário
                user_url = f"{self.base_url}/api/now/table/sys_user"
                user_params = {
                    "sysparm_query": f"email={email}^active=true"
                }
                user_response = await client.get(user_url, headers=headers, params=user_params)
                
                if not user_response.json()["result"]:
                    return None  # Usuário não encontrado
                
                user_data = user_response.json()["result"][0]
                
                # 3. Buscar roles do usuário
                roles_url = f"{self.base_url}/api/now/table/sys_user_has_role"
                roles_params = {
                    "sysparm_query": f"user.email={email}"
                }
                roles_response = await client.get(roles_url, headers=headers, params=roles_params)
                roles = [r["role"]["display_value"] for r in roles_response.json()["result"]]
                
                # 4. Determinar userType baseado nos roles
                user_type = "external"  # Padrão
                if "Supervisor" in roles or "File Approver" in roles:
                    user_type = "supervisor"
                elif "Internal User" in roles or email.endswith("@petrobras.com.br"):
                    user_type = "internal"
                
                # 5. Retornar dados consolidados
                return {
                    "sys_id": user_data["sys_id"],
                    "email": user_data["email"],
                    "name": user_data["name"],
                    "department": user_data.get("department", {}).get("display_value", ""),
                    "title": user_data.get("title", ""),
                    "phone": user_data.get("phone", ""),
                    "manager_name": user_data.get("manager", {}).get("display_value", ""),
                    "user_type": user_type,
                    "roles": roles
                }
        
        except Exception as e:
            print(f"ServiceNow authentication error: {str(e)}")
            return None`}
                    </pre>
                  </div>
                </div>

                {/* Código 2: Router */}
                <div className="border-l-4 border-pink-500 bg-pink-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                    <Code2 className="h-4 w-4" />
                    Código 2: API Router (Endpoint)
                  </h4>

                  <p className="text-sm text-pink-800 mb-2">
                    Arquivo: <code className="bg-pink-100 px-2 py-0.5 rounded">app/routers/auth_servicenow.py</code>
                  </p>

                  <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-green-400">
                      {`from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.services.servicenow_service import ServiceNowService
from app.core.security import create_access_token, create_refresh_token
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])

class ServiceNowLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ServiceNowLoginResponse(BaseModel):
    user: dict
    accessToken: str
    refreshToken: str

@router.post("/servicenow", response_model=ServiceNowLoginResponse)
async def login_servicenow(
    credentials: ServiceNowLoginRequest,
    sn_service: ServiceNowService = Depends()
):
    """
    Endpoint que o front-end Next.js chama para fazer login via ServiceNow
    """
    # 1. Validar com ServiceNow
    user_data = await sn_service.authenticate(
        credentials.email, 
        credentials.password
    )
    
    if not user_data:
        raise HTTPException(
            status_code=401, 
            detail="Credenciais inválidas ou usuário não encontrado no ServiceNow"
        )
    
    # 2. Criar nossos próprios tokens JWT
    access_token = create_access_token(
        data={"sub": user_data["sys_id"], "email": user_data["email"]},
        expires_delta=timedelta(hours=24)
    )
    refresh_token = create_refresh_token(
        data={"sub": user_data["sys_id"]},
        expires_delta=timedelta(days=30)
    )
    
    # 3. Salvar usuário no DynamoDB (cache)
    # await save_user_to_dynamodb(user_data)
    
    # 4. Retornar para o front-end
    return ServiceNowLoginResponse(
        user={
            "id": user_data["sys_id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "userType": user_data["user_type"],
            "department": user_data["department"],
            "phone": user_data["phone"]
        },
        accessToken=access_token,
        refreshToken=refresh_token
    )`}
                    </pre>
                  </div>
                </div>

                {/* Variáveis de Ambiente */}
                <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-yellow-900 mb-3">Variáveis de Ambiente (.env)</h4>

                  <div className="bg-slate-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-xs text-green-400">
                      {`# ServiceNow Configuration
SERVICENOW_INSTANCE_URL=https://petrobras.service-now.com
SERVICENOW_CLIENT_ID=your_client_id_here
SERVICENOW_CLIENT_SECRET=your_client_secret_here

# JWT Configuration (nossos tokens)
JWT_SECRET_KEY=your_super_secret_key_here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_HOURS=24
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30`}
                    </pre>
                  </div>

                  <div className="mt-3 bg-yellow-100 p-3 rounded">
                    <p className="font-semibold text-yellow-900 mb-1">Como obter Client ID e Secret?</p>
                    <p className="text-yellow-800 text-sm">
                      Você precisa pedir para o time de TI da Petrobras criar uma "OAuth Application" no ServiceNow para
                      o nosso sistema. Eles vão te dar o Client ID e Client Secret.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DynamoDB */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" />
                  Estrutura DynamoDB para Cache de Usuários
                </CardTitle>
                <CardDescription>Por que e como armazenar dados do ServiceNow no DynamoDB</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Por que fazer cache */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg border-2 border-indigo-200">
                  <h4 className="font-bold text-indigo-900 mb-4 text-lg">
                    Por que fazer cache dos dados do ServiceNow?
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-indigo-600 mt-1">1</Badge>
                      <div>
                        <p className="font-semibold text-indigo-900">Performance</p>
                        <p className="text-indigo-700">
                          Não precisamos chamar ServiceNow toda vez que o usuário faz uma ação. Salvamos os dados dele
                          no DynamoDB e consultamos de lá (muito mais rápido!).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="bg-indigo-600 mt-1">2</Badge>
                      <div>
                        <p className="font-semibold text-indigo-900">Disponibilidade</p>
                        <p className="text-indigo-700">
                          Se o ServiceNow ficar fora do ar, nosso sistema continua funcionando porque temos os dados no
                          DynamoDB.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Badge className="bg-indigo-600 mt-1">3</Badge>
                      <div>
                        <p className="font-semibold text-indigo-900">Auditoria</p>
                        <p className="text-indigo-700">
                          Podemos ver quem fez o quê mesmo que o usuário já tenha sido desligado da empresa (dados
                          históricos).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabela: servicenow_users_cache */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-indigo-100 p-4 border-b">
                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Nova Tabela: servicenow_users_cache
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-indigo-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-indigo-700">Campo (inglês)</th>
                          <th className="px-4 py-3 text-left font-semibold text-indigo-700">Tipo</th>
                          <th className="px-4 py-3 text-left font-semibold text-indigo-700">Para que serve</th>
                          <th className="px-4 py-3 text-left font-semibold text-indigo-700">Exemplo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">user_id</code>
                            <Badge className="ml-2 bg-yellow-600">PK</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">ID único do ServiceNow (sys_id)</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">abc123xyz789</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">email</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Email corporativo</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                              wagner.brazil@petrobras.com.br
                            </code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">name</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Nome completo</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">Wagner Gaspar Brazil</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">user_type</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Tipo de perfil no sistema</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">supervisor</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">department</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Departamento/área</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">Tecnologia da Informação</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">title</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Cargo na empresa</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">Supervisor de TI</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">manager_name</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Nome do gestor direto</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">João Silva</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">phone</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String</td>
                          <td className="px-4 py-3 text-slate-600">Telefone corporativo</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">+55 21 99999-9999</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">roles</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">List</td>
                          <td className="px-4 py-3 text-slate-600">Lista de permissões do ServiceNow</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                              ["Supervisor", "File Approver"]
                            </code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">created_at</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String (ISO)</td>
                          <td className="px-4 py-3 text-slate-600">Quando o cache foi criado</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">2025-12-18T14:30:00Z</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">updated_at</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">String (ISO)</td>
                          <td className="px-4 py-3 text-slate-600">Última atualização do cache</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">2025-12-18T15:45:00Z</code>
                          </td>
                        </tr>
                        <tr className="hover:bg-indigo-50">
                          <td className="px-4 py-3">
                            <code className="bg-indigo-100 px-2 py-1 rounded text-xs">ttl</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">Number</td>
                          <td className="px-4 py-3 text-slate-600">Quando o cache expira (timestamp Unix)</td>
                          <td className="px-4 py-3">
                            <code className="bg-slate-100 px-2 py-1 rounded text-xs">1734537600</code>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Explicação do TTL */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />O que é TTL (Time To Live)?
                  </h4>
                  <p className="text-blue-800 text-sm leading-relaxed mb-2">
                    TTL é como uma "data de validade". Configuramos o cache para expirar em 24 horas. Depois disso, o
                    DynamoDB deleta automaticamente o registro e na próxima vez que o usuário fizer login, buscamos os
                    dados atualizados do ServiceNow novamente.
                  </p>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    <strong>Por exemplo:</strong> Se um funcionário foi promovido a supervisor hoje, em até 24 horas o
                    sistema vai pegar essa mudança automaticamente quando o cache expirar.
                  </p>
                </div>

                {/* GSI por email */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-2">GSI (Índice Secundário): Buscar por Email</h4>
                  <p className="text-green-700 text-sm mb-3">
                    Além de buscar por <code className="bg-green-100 px-1 py-0.5 rounded">user_id</code> (chave
                    primária), também precisamos buscar por email. Para isso, criamos um GSI.
                  </p>
                  <div className="bg-green-100 p-3 rounded">
                    <p className="font-semibold text-green-900 text-sm mb-1">Nome do GSI:</p>
                    <code className="bg-green-200 px-2 py-1 rounded text-sm">email-index</code>
                    <p className="text-green-800 text-sm mt-2">
                      Permite fazer: "Me dê os dados do usuário com email wagner.brazil@petrobras.com.br"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AWS Services */}
          <TabsContent value="aws" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-orange-600" />
                  Serviços AWS Necessários
                </CardTitle>
                <CardDescription>Infraestrutura AWS para suportar autenticação com ServiceNow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AWS Secrets Manager */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    1. AWS Secrets Manager
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-orange-800 mb-1">Para que serve?</p>
                      <p className="text-orange-700">
                        Guarda de forma SEGURA as credenciais do ServiceNow (Client ID, Client Secret) sem deixar
                        visível no código ou no .env.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-orange-800 mb-1">O que armazenar:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">SERVICENOW_CLIENT_ID</code>
                        </li>
                        <li>
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">SERVICENOW_CLIENT_SECRET</code>
                        </li>
                        <li>
                          <code className="bg-orange-100 px-1.5 py-0.5 rounded">JWT_SECRET_KEY</code> (chave do nosso
                          JWT)
                        </li>
                      </ul>
                    </div>

                    <div className="bg-orange-100 p-3 rounded-lg">
                      <p className="font-semibold text-orange-900 mb-1">Como usar no código Python:</p>
                      <div className="bg-slate-900 p-3 rounded overflow-x-auto mt-2">
                        <pre className="text-xs text-green-400">
                          {`import boto3
import json

def get_servicenow_secrets():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    secret = client.get_secret_value(SecretId='servicenow-credentials')
    return json.loads(secret['SecretString'])

secrets = get_servicenow_secrets()
CLIENT_ID = secrets['SERVICENOW_CLIENT_ID']
CLIENT_SECRET = secrets['SERVICENOW_CLIENT_SECRET']`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DynamoDB */}
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    2. Amazon DynamoDB
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-blue-800 mb-1">Para que serve?</p>
                      <p className="text-blue-700">
                        Armazena cache dos usuários do ServiceNow e todos os dados do sistema (uploads, shares,
                        audit_logs).
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-blue-800 mb-1">Tabelas necessárias:</p>
                      <ul className="list-disc list-inside text-blue-700 space-y-1 pl-4">
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">servicenow_users_cache</code> - Cache de
                          usuários
                        </li>
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">shares</code> - Compartilhamentos de
                          arquivos
                        </li>
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">files</code> - Arquivos enviados
                        </li>
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">audit_logs</code> - Logs de auditoria
                        </li>
                        <li>
                          <code className="bg-blue-100 px-1.5 py-0.5 rounded">otp_codes</code> - Códigos OTP para
                          externos
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-100 p-3 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-1">Configuração Importante:</p>
                      <p className="text-blue-800 text-sm">
                        Ativar <strong>TTL</strong> na tabela{" "}
                        <code className="bg-blue-200 px-1 py-0.5 rounded">servicenow_users_cache</code> com campo{" "}
                        <code className="bg-blue-200 px-1 py-0.5 rounded">ttl</code> para expiração automática em 24h.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lambda (Opcional) */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    3. AWS Lambda (Opcional - para Sync Automático)
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-purple-800 mb-1">Para que serve?</p>
                      <p className="text-purple-700">
                        Sincroniza automaticamente dados do ServiceNow com DynamoDB toda noite (ex: 3h da manhã),
                        garantindo que mudanças organizacionais sejam refletidas.
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-purple-800 mb-1">O que faz:</p>
                      <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                        <li>Busca todos os usuários ativos no ServiceNow</li>
                        <li>Atualiza cache no DynamoDB</li>
                        <li>Envia email de alerta se encontrar mudanças críticas (ex: supervisor mudou)</li>
                      </ul>
                    </div>

                    <div className="bg-purple-100 p-3 rounded-lg">
                      <p className="font-semibold text-purple-900 mb-1">Quando usar:</p>
                      <p className="text-purple-800 text-sm">
                        Recomendado para produção, mas não é obrigatório. O cache já expira em 24h automaticamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CloudWatch */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-2">4. Amazon CloudWatch</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-green-700">Monitora:</p>
                    <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                      <li>Quantidade de chamadas ao ServiceNow por minuto</li>
                      <li>Erros de autenticação (credenciais inválidas)</li>
                      <li>Tempo de resposta do ServiceNow</li>
                      <li>Alertas se ServiceNow ficar fora do ar</li>
                    </ul>
                  </div>
                </div>

                {/* Diagrama de Arquitetura */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border-2 border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-4 text-lg">Diagrama de Arquitetura AWS + ServiceNow</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-cyan-500 flex items-center justify-center text-white font-bold">
                        FE
                      </div>
                      <div className="text-2xl text-slate-400">→</div>
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-purple-500 flex items-center justify-center text-white font-bold">
                        BE
                      </div>
                      <div className="text-2xl text-slate-400">→</div>
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-yellow-500 flex items-center justify-center text-white font-bold">
                        SM
                      </div>
                      <div className="text-2xl text-slate-400">→</div>
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-teal-500 flex items-center justify-center text-white font-bold">
                        SN
                      </div>
                    </div>

                    <div className="text-center text-2xl text-slate-400">↓</div>

                    <div className="flex items-center gap-3 justify-center">
                      <div className="h-12 w-12 shrink-0 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                        DB
                      </div>
                      <span className="text-slate-600 text-sm">(Cache 24h)</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>FE</strong> = Front-end Next.js
                    </div>
                    <div>
                      <strong>BE</strong> = Back-end Python FastAPI
                    </div>
                    <div>
                      <strong>SM</strong> = AWS Secrets Manager
                    </div>
                    <div>
                      <strong>SN</strong> = ServiceNow
                    </div>
                    <div>
                      <strong>DB</strong> = DynamoDB
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Implementação */}
          <TabsContent value="implementacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  Checklist de Implementação Completo
                </CardTitle>
                <CardDescription>
                  Passo a passo detalhado para implementar autenticação ServiceNow do zero
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fase 1: Preparação */}
                <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-green-600">Fase 1</Badge>
                    Preparação e Credenciais (Antes de programar)
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded border border-green-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-green-900">
                          <strong>1.1</strong> Solicitar Client ID e Client Secret do ServiceNow com TI da Petrobras
                        </span>
                      </label>
                      <p className="text-green-700 text-xs mt-1 pl-6">
                        Eles precisam criar uma "OAuth Application" no ServiceNow para nosso sistema
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-green-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-green-900">
                          <strong>1.2</strong> Confirmar URL da instância ServiceNow da Petrobras
                        </span>
                      </label>
                      <p className="text-green-700 text-xs mt-1 pl-6">
                        Exemplo: https://petrobras.service-now.com (confirmar com TI)
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-green-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-green-900">
                          <strong>1.3</strong> Definir quais "roles" do ServiceNow significam "Supervisor" e "Internal
                          User"
                        </span>
                      </label>
                      <p className="text-green-700 text-xs mt-1 pl-6">
                        Perguntar à TI: "Qual role identifica supervisores?" e "Qual role identifica funcionários
                        internos?"
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-green-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-green-900">
                          <strong>1.4</strong> Criar AWS Secrets Manager e guardar credenciais
                        </span>
                      </label>
                      <p className="text-green-700 text-xs mt-1 pl-6">
                        Nome do secret: <code className="bg-green-100 px-1 py-0.5 rounded">servicenow-credentials</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fase 2: Back-end */}
                <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-purple-600">Fase 2</Badge>
                    Implementar Back-end Python
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.1</strong> Criar tabela DynamoDB{" "}
                          <code className="bg-purple-100 px-1 py-0.5 rounded">servicenow_users_cache</code>
                        </span>
                      </label>
                      <p className="text-purple-700 text-xs mt-1 pl-6">
                        PK: user_id, GSI: email-index, TTL ativado no campo ttl
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.2</strong> Instalar dependências Python necessárias
                        </span>
                      </label>
                      <div className="bg-slate-900 p-2 rounded mt-2 ml-6 overflow-x-auto">
                        <pre className="text-xs text-green-400">pip install httpx boto3 python-jose[cryptography]</pre>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.3</strong> Criar arquivo{" "}
                          <code className="bg-purple-100 px-1 py-0.5 rounded">app/services/servicenow_service.py</code>
                        </span>
                      </label>
                      <p className="text-purple-700 text-xs mt-1 pl-6">
                        Copiar código da aba "Back-end Python" desta Wiki
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.4</strong> Criar endpoint{" "}
                          <code className="bg-purple-100 px-1 py-0.5 rounded">POST /auth/servicenow</code>
                        </span>
                      </label>
                      <p className="text-purple-700 text-xs mt-1 pl-6">
                        Em <code className="bg-purple-100 px-1 py-0.5 rounded">app/routers/auth_servicenow.py</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.5</strong> Implementar geração de JWT (nosso token)
                        </span>
                      </label>
                      <p className="text-purple-700 text-xs mt-1 pl-6">
                        Funções <code className="bg-purple-100 px-1 py-0.5 rounded">create_access_token()</code> e{" "}
                        <code className="bg-purple-100 px-1 py-0.5 rounded">create_refresh_token()</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-purple-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-purple-900">
                          <strong>2.6</strong> Testar endpoint com Postman ou curl
                        </span>
                      </label>
                      <div className="bg-slate-900 p-2 rounded mt-2 ml-6 overflow-x-auto">
                        <pre className="text-xs text-green-400">
                          {`curl -X POST http://localhost:8000/auth/servicenow \\
  -H "Content-Type: application/json" \\
  -d '{"email":"wagner.brazil@petrobras.com.br","password":"senha_teste"}'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fase 3: Front-end */}
                <div className="border-l-4 border-cyan-500 bg-cyan-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-cyan-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-cyan-600">Fase 3</Badge>
                    Atualizar Front-end Next.js
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded border border-cyan-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-cyan-900">
                          <strong>3.1</strong> Atualizar função{" "}
                          <code className="bg-cyan-100 px-1 py-0.5 rounded">handleSubmit</code> no login-form.tsx
                        </span>
                      </label>
                      <p className="text-cyan-700 text-xs mt-1 pl-6">
                        Substituir lógica de demo por chamada real ao{" "}
                        <code className="bg-cyan-100 px-1 py-0.5 rounded">/api/auth/servicenow</code>
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-cyan-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-cyan-900">
                          <strong>3.2</strong> Remover ou comentar botões de "Acesso Rápido" (demo)
                        </span>
                      </label>
                      <p className="text-cyan-700 text-xs mt-1 pl-6">
                        Manter apenas para desenvolvimento, remover em produção
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-cyan-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-cyan-900">
                          <strong>3.3</strong> Testar login com usuário real da Petrobras
                        </span>
                      </label>
                      <p className="text-cyan-700 text-xs mt-1 pl-6">
                        Usar credenciais corporativas reais (email @petrobras.com.br + senha)
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-cyan-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-cyan-900">
                          <strong>3.4</strong> Verificar se redirecionamento funciona corretamente
                        </span>
                      </label>
                      <p className="text-cyan-700 text-xs mt-1 pl-6">
                        Usuário interno → /upload | Supervisor → /supervisor | Externo → /download
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fase 4: Deploy e Monitoramento */}
                <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-lg">
                    <Badge className="bg-orange-600">Fase 4</Badge>
                    Deploy e Monitoramento
                  </h4>

                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded border border-orange-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-orange-900">
                          <strong>4.1</strong> Configurar variáveis de ambiente no Vercel (front-end)
                        </span>
                      </label>
                      <p className="text-orange-700 text-xs mt-1 pl-6">
                        <code className="bg-orange-100 px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> = URL do back-end
                        Python
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-orange-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-orange-900">
                          <strong>4.2</strong> Fazer deploy do back-end Python na AWS (ECS ou Lambda)
                        </span>
                      </label>
                      <p className="text-orange-700 text-xs mt-1 pl-6">
                        Garantir que IAM role tem permissão para acessar Secrets Manager e DynamoDB
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-orange-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-orange-900">
                          <strong>4.3</strong> Configurar CloudWatch Alarms
                        </span>
                      </label>
                      <p className="text-orange-700 text-xs mt-1 pl-6">
                        - Taxa de erros de autenticação {"> 10%"}
                        <br />- Latência do ServiceNow {"> 3 segundos"}
                        <br />- Quantidade de chamadas ao ServiceNow (para detectar loops)
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-orange-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-orange-900">
                          <strong>4.4</strong> Testar em produção com 5-10 usuários reais
                        </span>
                      </label>
                      <p className="text-orange-700 text-xs mt-1 pl-6">
                        Fazer testes com diferentes perfis: interno, supervisor, externo
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded border border-orange-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="h-4 w-4" />
                        <span className="text-orange-900">
                          <strong>4.5</strong> Documentar processo de troubleshooting
                        </span>
                      </label>
                      <p className="text-orange-700 text-xs mt-1 pl-6">
                        O que fazer se ServiceNow ficar fora? Como resetar cache? Etc.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resumo Final */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200">
                  <h4 className="font-bold text-green-900 mb-3 text-lg">Tempo Estimado de Implementação</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900 mb-1">Com toda a equipe focada:</p>
                      <p className="text-4xl font-bold text-green-600">3 dias</p>
                      <p className="text-green-700 text-sm mt-1">1 dev front + 1 dev back + 1 DevOps</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <p className="font-semibold text-green-900 mb-1">Trabalhando sozinho:</p>
                      <p className="text-4xl font-bold text-green-600">1 semana</p>
                      <p className="text-green-700 text-sm mt-1">Incluindo testes e documentação</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
