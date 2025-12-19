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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 h-auto gap-2 bg-transparent p-0">
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

            <TabsTrigger
              value="aws-impl"
              className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200 border-2 py-3"
            >
              <Cloud className="mr-2 h-4 w-4" />
              AWS Passo a Passo
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

          <TabsContent value="aws-impl" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-red-600" />
                  Implementação AWS - Guia Completo para Leigos
                </CardTitle>
                <CardDescription>
                  Passo a passo detalhado explicando TUDO o que você precisa fazer na AWS do ZERO
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* O que é AWS? */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-lg border-2 border-red-200">
                  <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                    <Cloud className="h-6 w-6" />O que é AWS? (Explicação Simples)
                  </h3>

                  <div className="space-y-4 text-slate-800">
                    <p className="leading-relaxed">
                      <strong>AWS (Amazon Web Services)</strong> é como se fosse um{" "}
                      <strong>"shopping de serviços de computação"</strong>. Ao invés de você comprar computadores
                      físicos, servidores, bancos de dados e colocar tudo na sua empresa, você "aluga" esses recursos da
                      Amazon na nuvem.
                    </p>

                    <div className="bg-white p-4 rounded-lg border-2 border-red-200">
                      <p className="font-semibold text-red-900 mb-2">Analogia do Mundo Real:</p>
                      <p className="text-sm">
                        É como a diferença entre comprar uma casa (servidor próprio) vs alugar um apartamento (AWS). No
                        aluguel você paga só o que usa, não precisa se preocupar com manutenção, e pode mudar de tamanho
                        conforme precisa.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-red-100 p-4 rounded-lg">
                        <h4 className="font-bold text-red-900 mb-2">❌ Sem AWS (Problema)</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Comprar servidores físicos (caros!)</li>
                          <li>• Contratar equipe para manutenção</li>
                          <li>• Preocupar com energia, refrigeração</li>
                          <li>• Se quebrar, sistema cai</li>
                          <li>• Difícil escalar (precisa comprar mais)</li>
                        </ul>
                      </div>

                      <div className="bg-green-100 p-4 rounded-lg">
                        <h4 className="font-bold text-green-900 mb-2">✅ Com AWS (Solução)</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Paga só o que usa (como conta de luz)</li>
                          <li>• Amazon cuida da manutenção</li>
                          <li>• Alta disponibilidade automática</li>
                          <li>• Se algo falha, AWS resolve sozinho</li>
                          <li>• Escala com 1 clique</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serviços AWS que vamos usar */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Quais Serviços AWS vamos usar? (e por quê?)</h3>

                  <div className="space-y-4">
                    {/* DynamoDB */}
                    <div className="border-l-4 border-blue-500 bg-blue-50 p-5 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Database className="h-8 w-8 text-blue-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-blue-900 mb-2">1. DynamoDB - Banco de Dados NoSQL</h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-blue-800">O que é?</p>
                              <p className="text-blue-700">
                                É um banco de dados super rápido onde guardamos as informações dos arquivos
                                compartilhados, quem fez upload, quando expira, etc. É NoSQL (não usa SQL tradicional).
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-blue-800">Por que usar?</p>
                              <ul className="list-disc list-inside text-blue-700 space-y-1 pl-4">
                                <li>Extremamente rápido (milissegundos)</li>
                                <li>Escala automaticamente conforme cresce</li>
                                <li>Paga só pelo que usar</li>
                                <li>Não precisa gerenciar servidores</li>
                                <li>Perfeito para dados que expiram (TTL automático)</li>
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-blue-800">O que vamos guardar nele?</p>
                              <ul className="list-disc list-inside text-blue-700 space-y-1 pl-4">
                                <li>
                                  <code className="bg-blue-100 px-1.5 py-0.5 rounded">users</code> - Dados dos usuários
                                </li>
                                <li>
                                  <code className="bg-blue-100 px-1.5 py-0.5 rounded">file_shares</code> - Arquivos
                                  compartilhados
                                </li>
                                <li>
                                  <code className="bg-blue-100 px-1.5 py-0.5 rounded">audit_logs</code> - Logs de
                                  auditoria
                                </li>
                                <li>
                                  <code className="bg-blue-100 px-1.5 py-0.5 rounded">notifications</code> -
                                  Notificações
                                </li>
                                <li>
                                  <code className="bg-blue-100 px-1.5 py-0.5 rounded">sessions</code> - Sessões ativas
                                </li>
                              </ul>
                            </div>

                            <div className="bg-blue-100 p-3 rounded">
                              <p className="font-semibold text-blue-900">💡 Analogia Simples:</p>
                              <p className="text-blue-800 text-xs">
                                É como uma planilha Excel gigante na nuvem, mas que aguenta milhões de linhas e responde
                                em milissegundos. E ainda apaga automaticamente linhas antigas (arquivos expirados).
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* S3 */}
                    <div className="border-l-4 border-green-500 bg-green-50 p-5 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Server className="h-8 w-8 text-green-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-green-900 mb-2">
                            2. S3 (Simple Storage Service) - Armazenamento de Arquivos
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-green-800">O que é?</p>
                              <p className="text-green-700">
                                É como um HD externo gigante na nuvem onde guardamos os arquivos reais (PDFs, ZIPs,
                                etc). É praticamente infinito e super seguro.
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-green-800">Por que usar?</p>
                              <ul className="list-disc list-inside text-green-700 space-y-1 pl-4">
                                <li>Armazena arquivos de qualquer tamanho</li>
                                <li>99.999999999% de durabilidade (não perde arquivos)</li>
                                <li>Muito barato (poucos centavos por GB)</li>
                                <li>Gera URLs temporárias para download seguro</li>
                                <li>Criptografia automática</li>
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-green-800">Como funciona no nosso sistema?</p>
                              <ol className="list-decimal list-inside text-green-700 space-y-1 pl-4">
                                <li>Usuário faz upload de arquivo</li>
                                <li>Arquivo vai direto para S3</li>
                                <li>S3 retorna um ID único</li>
                                <li>Guardamos esse ID no DynamoDB</li>
                                <li>Quando alguém baixa, S3 gera URL temporária válida por 1 hora</li>
                              </ol>
                            </div>

                            <div className="bg-green-100 p-3 rounded">
                              <p className="font-semibold text-green-900">💡 Analogia Simples:</p>
                              <p className="text-green-800 text-xs">
                                É como o Google Drive da Amazon, mas feito para desenvolvedores. Você joga arquivos lá e
                                eles ficam guardados pra sempre (ou até você apagar).
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SES */}
                    <div className="border-l-4 border-purple-500 bg-purple-50 p-5 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Lock className="h-8 w-8 text-purple-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-purple-900 mb-2">
                            3. SES (Simple Email Service) - Envio de E-mails
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-purple-800">O que é?</p>
                              <p className="text-purple-700">
                                Serviço da Amazon para enviar e-mails em massa. É como ter seu próprio servidor de
                                e-mail profissional.
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-purple-800">Por que usar?</p>
                              <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                                <li>Muito mais barato que serviços como SendGrid</li>
                                <li>Integrado com outros serviços AWS</li>
                                <li>Alta taxa de entrega (não cai em spam)</li>
                                <li>Rastreamento de aberturas e cliques</li>
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-purple-800">Quando vamos enviar e-mails?</p>
                              <ul className="list-disc list-inside text-purple-700 space-y-1 pl-4">
                                <li>Notificar supervisor quando houver novo upload</li>
                                <li>Notificar remetente quando arquivo for aprovado</li>
                                <li>Enviar link de download para destinatário externo</li>
                                <li>Avisar quando arquivo estiver perto de expirar</li>
                                <li>Notificar quando arquivo for rejeitado</li>
                              </ul>
                            </div>

                            <div className="bg-purple-100 p-3 rounded">
                              <p className="font-semibold text-purple-900">💡 Nota Importante:</p>
                              <p className="text-purple-800 text-xs">
                                Atualmente estamos usando <strong>Resend</strong> para e-mails, mas podemos migrar para
                                AWS SES no futuro para reduzir custos e ter tudo centralizado na AWS.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secrets Manager */}
                    <div className="border-l-4 border-yellow-500 bg-yellow-50 p-5 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Key className="h-8 w-8 text-yellow-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-yellow-900 mb-2">
                            4. Secrets Manager - Gerenciamento de Senhas e Chaves
                          </h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-yellow-800">O que é?</p>
                              <p className="text-yellow-700">
                                É um cofre digital super seguro onde guardamos senhas, chaves de API, tokens, etc. Nunca
                                mais coloque senhas no código!
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-yellow-800">Por que usar?</p>
                              <ul className="list-disc list-inside text-yellow-700 space-y-1 pl-4">
                                <li>Senhas não ficam expostas no código</li>
                                <li>Rotação automática de senhas</li>
                                <li>Criptografia forte</li>
                                <li>Auditoria de quem acessou cada secret</li>
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-yellow-800">O que vamos guardar?</p>
                              <ul className="list-disc list-inside text-yellow-700 space-y-1 pl-4">
                                <li>
                                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">SERVICENOW_CLIENT_ID</code>
                                </li>
                                <li>
                                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">SERVICENOW_CLIENT_SECRET</code>
                                </li>
                                <li>
                                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">RESEND_API_KEY</code>
                                </li>
                                <li>
                                  <code className="bg-yellow-100 px-1.5 py-0.5 rounded">JWT_SECRET</code>
                                </li>
                              </ul>
                            </div>

                            <div className="bg-yellow-100 p-3 rounded">
                              <p className="font-semibold text-yellow-900">💡 Analogia Simples:</p>
                              <p className="text-yellow-800 text-xs">
                                É como um cofre de banco onde você guarda as chaves de casa. Ao invés de deixar a chave
                                embaixo do capacho (código), você guarda no cofre e só você tem acesso.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lambda */}
                    <div className="border-l-4 border-orange-500 bg-orange-50 p-5 rounded-r-lg">
                      <div className="flex items-start gap-3">
                        <Server className="h-8 w-8 text-orange-600 mt-1 shrink-0" />
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-orange-900 mb-2">5. Lambda - Funções Serverless</h4>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-orange-800">O que é?</p>
                              <p className="text-orange-700">
                                São pedaços de código que rodam "na nuvem" sem você precisar gerenciar servidores. Você
                                paga só pelos milissegundos que o código roda.
                              </p>
                            </div>

                            <div>
                              <p className="font-semibold text-orange-800">Por que usar?</p>
                              <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                                <li>Zero manutenção de servidores</li>
                                <li>Escala automaticamente</li>
                                <li>Muito barato (milhões de requests gratuitos/mês)</li>
                                <li>Ideal para tarefas pontuais e automações</li>
                              </ul>
                            </div>

                            <div>
                              <p className="font-semibold text-orange-800">O que vamos fazer com Lambda?</p>
                              <ul className="list-disc list-inside text-orange-700 space-y-1 pl-4">
                                <li>
                                  <strong>Limpeza automática:</strong> Apaga arquivos expirados do S3 todo dia à
                                  meia-noite
                                </li>
                                <li>
                                  <strong>Notificações:</strong> Envia e-mail quando arquivo vai expirar em 24h
                                </li>
                                <li>
                                  <strong>Processamento:</strong> Escaneia vírus em arquivos enviados
                                </li>
                                <li>
                                  <strong>Auditoria:</strong> Processa logs e gera relatórios
                                </li>
                              </ul>
                            </div>

                            <div className="bg-orange-100 p-3 rounded">
                              <p className="font-semibold text-orange-900">💡 Analogia Simples:</p>
                              <p className="text-orange-800 text-xs">
                                É como contratar um freelancer que trabalha só quando você precisa. Você não paga
                                salário mensal, só paga pelas horas trabalhadas. Lambda é assim: só paga quando o código
                                está rodando.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo a Passo de Implementação */}
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <GitBranch className="h-6 w-6 text-blue-600" />
                    Passo a Passo: Como Criar Tudo na AWS
                  </h3>

                  <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg mb-6">
                    <p className="text-blue-900 font-semibold mb-2">⏱️ Tempo estimado total: 2-3 horas</p>
                    <p className="text-blue-800 text-sm">
                      Vamos usar <strong>AWS CDK (Python)</strong> para criar tudo automaticamente. É como um "script
                      mágico" que cria toda a infraestrutura com 1 comando.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Passo 1: Pre-requisitos */}
                    <div className="border-2 border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
                          1
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Pré-requisitos (Instalar Ferramentas)</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div>
                          <p className="font-semibold text-slate-800 mb-2">
                            O que você precisa ter instalado no seu computador:
                          </p>

                          <div className="space-y-3">
                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="font-semibold text-slate-900 mb-1">1.1. Python 3.9 ou superior</p>
                              <p className="text-slate-700 mb-2">Verificar se já tem:</p>
                              <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block">
                                python3 --version
                              </code>
                              <p className="text-slate-600 text-xs mt-2">
                                Deve mostrar algo como "Python 3.11.5". Se não tiver, baixe em{" "}
                                <a href="https://python.org" className="text-blue-600 underline">
                                  python.org
                                </a>
                              </p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="font-semibold text-slate-900 mb-1">1.2. Node.js 18 ou superior</p>
                              <p className="text-slate-700 mb-2">Verificar se já tem:</p>
                              <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block">
                                node --version
                              </code>
                              <p className="text-slate-600 text-xs mt-2">
                                Deve mostrar algo como "v20.10.0". Se não tiver, baixe em{" "}
                                <a href="https://nodejs.org" className="text-blue-600 underline">
                                  nodejs.org
                                </a>
                              </p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="font-semibold text-slate-900 mb-1">1.3. AWS CLI (Command Line Interface)</p>
                              <p className="text-slate-700 mb-2">Instalar:</p>
                              <div className="space-y-1">
                                <p className="text-xs text-slate-600">Windows:</p>
                                <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                                  msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
                                </code>
                                <p className="text-xs text-slate-600 mt-2">Mac:</p>
                                <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                                  brew install awscli
                                </code>
                                <p className="text-xs text-slate-600 mt-2">Linux:</p>
                                <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                                  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" &&
                                  unzip awscliv2.zip && sudo ./aws/install
                                </code>
                              </div>
                              <p className="text-slate-600 text-xs mt-2">
                                Verificar instalação:{" "}
                                <code className="bg-slate-200 px-1 py-0.5 rounded">aws --version</code>
                              </p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg">
                              <p className="font-semibold text-slate-900 mb-1">1.4. AWS CDK</p>
                              <p className="text-slate-700 mb-2">Instalar globalmente:</p>
                              <code className="bg-slate-900 text-green-400 px-3 py-2 rounded">
                                npm install -g aws-cdk
                              </code>
                              <p className="text-slate-600 text-xs mt-2">
                                Verificar instalação:{" "}
                                <code className="bg-slate-200 px-1 py-0.5 rounded">cdk --version</code>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passo 2: Configurar Credenciais AWS */}
                    <div className="border-2 border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                          2
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Configurar Credenciais da AWS</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded-lg">
                          <p className="font-semibold text-yellow-900 mb-1">⚠️ Importante:</p>
                          <p className="text-yellow-800 text-xs">
                            Você precisa ter uma conta AWS e permissões de administrador para criar recursos. Se não
                            tiver, peça para alguém da equipe de infra da Petrobras criar para você.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">2.1. Obter Credenciais AWS</p>
                            <ol className="list-decimal list-inside text-slate-700 space-y-1 pl-4 text-xs">
                              <li>
                                Acesse{" "}
                                <a href="https://console.aws.amazon.com" className="text-blue-600 underline">
                                  console.aws.amazon.com
                                </a>
                              </li>
                              <li>Faça login com sua conta AWS</li>
                              <li>Clique no seu nome no canto superior direito → "Security Credentials"</li>
                              <li>Role até "Access keys" e clique em "Create access key"</li>
                              <li>Escolha "Command Line Interface (CLI)"</li>
                              <li>Confirme e clique em "Create access key"</li>
                              <li>
                                Copie o <strong>Access Key ID</strong> e o <strong>Secret Access Key</strong> (salve em
                                lugar seguro!)
                              </li>
                            </ol>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">2.2. Configurar no Terminal</p>
                            <p className="text-slate-700 mb-2">Execute o comando:</p>
                            <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block mb-3">
                              aws configure
                            </code>

                            <p className="text-slate-700 mb-2">Ele vai pedir 4 informações. Digite cada uma:</p>
                            <div className="space-y-2">
                              <div>
                                <code className="bg-slate-900 text-green-400 px-2 py-1 rounded text-xs block">
                                  AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
                                </code>
                                <p className="text-slate-600 text-xs mt-1">Cole o Access Key ID que você copiou</p>
                              </div>
                              <div>
                                <code className="bg-slate-900 text-green-400 px-2 py-1 rounded text-xs block">
                                  AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
                                </code>
                                <p className="text-slate-600 text-xs mt-1">Cole o Secret Access Key</p>
                              </div>
                              <div>
                                <code className="bg-slate-900 text-green-400 px-2 py-1 rounded text-xs block">
                                  Default region name [None]: us-east-1
                                </code>
                                <p className="text-slate-600 text-xs mt-1">
                                  Digite "us-east-1" (Virginia - região mais comum)
                                </p>
                              </div>
                              <div>
                                <code className="bg-slate-900 text-green-400 px-2 py-1 rounded text-xs block">
                                  Default output format [None]: json
                                </code>
                                <p className="text-slate-600 text-xs mt-1">Digite "json"</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="font-semibold text-green-900 mb-1">✅ Testar se funcionou:</p>
                            <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                              aws sts get-caller-identity
                            </code>
                            <p className="text-green-700 text-xs mt-2">
                              Se mostrar seu ID de conta AWS, está tudo certo!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passo 3: Preparar Scripts CDK */}
                    <div className="border-2 border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                          3
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Preparar os Scripts AWS CDK</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <p className="text-slate-700">
                          Os scripts já foram criados na pasta{" "}
                          <code className="bg-slate-200 px-1.5 py-0.5 rounded">back-end/aws/</code>. Agora vamos
                          prepará-los para execução.
                        </p>

                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">3.1. Navegar até a pasta AWS:</p>
                            <code className="bg-slate-900 text-green-400 px-3 py-2 rounded">cd back-end/aws</code>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">3.2. Criar ambiente virtual Python:</p>
                            <p className="text-slate-700 mb-2 text-xs">
                              Isso cria um ambiente isolado para as dependências:
                            </p>
                            <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block mb-2">
                              python3 -m venv .venv
                            </code>

                            <p className="text-slate-700 mb-2 text-xs mt-3">Ativar o ambiente virtual:</p>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-600">Windows:</p>
                              <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                                .venv\Scripts\activate
                              </code>
                              <p className="text-xs text-slate-600 mt-2">Mac/Linux:</p>
                              <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block text-xs">
                                source .venv/bin/activate
                              </code>
                            </div>

                            <p className="text-slate-600 text-xs mt-2">
                              Você vai ver <code className="bg-slate-200 px-1 py-0.5 rounded">(.venv)</code> no início
                              da linha do terminal
                            </p>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">3.3. Instalar dependências Python:</p>
                            <code className="bg-slate-900 text-green-400 px-3 py-2 rounded">
                              pip install -r requirements.txt
                            </code>
                            <p className="text-slate-600 text-xs mt-2">
                              Isso instala o AWS CDK para Python e outras bibliotecas necessárias. Vai levar ~2 minutos.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passo 4: Bootstrap AWS CDK */}
                    <div className="border-2 border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white font-bold">
                          4
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Bootstrap da AWS (Primeira Vez Apenas)</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-lg">
                          <p className="font-semibold text-blue-900 mb-1">O que é Bootstrap?</p>
                          <p className="text-blue-800 text-xs">
                            É como "preparar o terreno" antes de construir uma casa. O CDK precisa criar alguns recursos
                            básicos na sua conta AWS antes de poder criar sua infraestrutura. Você faz isso UMA VEZ só,
                            nunca mais precisa repetir.
                          </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="font-semibold text-slate-900 mb-2">Executar o bootstrap:</p>
                          <code className="bg-slate-900 text-green-400 px-3 py-2 rounded block mb-2">
                            cdk bootstrap
                          </code>

                          <p className="text-slate-600 text-xs mt-2">
                            Isso vai criar um bucket S3 especial chamado "CDKToolkit" e algumas outras coisas. Demora ~2
                            minutos.
                          </p>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-semibold text-green-900 mb-1">✅ O que você vai ver:</p>
                          <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs whitespace-pre-wrap">
                            ⏳ Bootstrapping environment aws://123456789012/us-east-1...
                            <br />✅ Environment aws://123456789012/us-east-1 bootstrapped.
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Passo 5: Deploy! */}
                    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                          5
                        </div>
                        <h4 className="text-lg font-bold text-green-900">🚀 CRIAR TUDO NA AWS!</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <p className="text-green-800 font-semibold">
                          Agora é a hora da mágica! Com UM comando, vamos criar TUDO:
                        </p>

                        <ul className="list-disc list-inside text-green-700 space-y-1 pl-4 text-xs">
                          <li>5 tabelas DynamoDB</li>
                          <li>2 buckets S3</li>
                          <li>Configuração AWS SES</li>
                          <li>Funções Lambda</li>
                          <li>API Gateway</li>
                          <li>IAM Roles e Policies</li>
                          <li>Secrets Manager</li>
                        </ul>

                        <div className="bg-white border-2 border-green-300 p-4 rounded-lg">
                          <p className="font-semibold text-green-900 mb-2">Execute o comando mágico:</p>
                          <code className="bg-slate-900 text-green-400 px-4 py-3 rounded block text-lg font-bold">
                            cdk deploy --all
                          </code>

                          <div className="mt-4 space-y-2">
                            <p className="text-green-800 text-xs">Ele vai mostrar o que será criado e perguntar:</p>
                            <code className="bg-slate-900 text-yellow-400 px-2 py-1 rounded block text-xs">
                              Do you wish to deploy these changes (y/n)?
                            </code>
                            <p className="text-green-800 text-xs">
                              Digite <strong>y</strong> e aperte Enter.
                            </p>
                          </div>

                          <div className="mt-4 bg-green-100 p-3 rounded">
                            <p className="font-semibold text-green-900 mb-1">⏱️ Tempo de criação:</p>
                            <p className="text-green-800 text-xs">
                              ~10 minutos. Você vai ver várias barras de progresso. Relaxe e tome um café ☕
                            </p>
                          </div>
                        </div>

                        <div className="bg-green-100 border-2 border-green-300 p-3 rounded-lg">
                          <p className="font-semibold text-green-900 mb-1">✅ Sucesso! O que você vai ver:</p>
                          <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs whitespace-pre-wrap">
                            {`✅ PetrobrasFileShareDatabaseStack
✅ PetrobrasFileShareStorageStack
✅ PetrobrasFileShareEmailStack
✅ PetrobrasFileShareLambdaStack
✅ PetrobrasFileShareApiStack

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/...

Outputs:
PetrobrasFileShareApiStack.ApiUrl = https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
PetrobrasFileShareStorageStack.FilesBucketName = petrobras-fileshare-files-abc123
PetrobrasFileShareStorageStack.TempBucketName = petrobras-fileshare-temp-abc123

✨ Deployment time: 612.34s`}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Passo 6: Verificar */}
                    <div className="border-2 border-slate-200 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-bold">
                          6
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Verificar se Tudo Foi Criado</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <p className="text-slate-700">
                          Vamos conferir no console da AWS se tudo foi criado corretamente:
                        </p>

                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">6.1. Verificar DynamoDB:</p>
                            <ol className="list-decimal list-inside text-slate-700 space-y-1 pl-4 text-xs">
                              <li>
                                Acesse{" "}
                                <a href="https://console.aws.amazon.com/dynamodb" className="text-blue-600 underline">
                                  console.aws.amazon.com/dynamodb
                                </a>
                              </li>
                              <li>Clique em "Tables" no menu esquerdo</li>
                              <li>
                                Você deve ver 5 tabelas:
                                <ul className="list-disc list-inside pl-4 mt-1">
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-users</code>
                                  </li>
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-file-shares</code>
                                  </li>
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-audit-logs</code>
                                  </li>
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-notifications</code>
                                  </li>
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-sessions</code>
                                  </li>
                                </ul>
                              </li>
                            </ol>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">6.2. Verificar S3:</p>
                            <ol className="list-decimal list-inside text-slate-700 space-y-1 pl-4 text-xs">
                              <li>
                                Acesse{" "}
                                <a href="https://console.aws.amazon.com/s3" className="text-blue-600 underline">
                                  console.aws.amazon.com/s3
                                </a>
                              </li>
                              <li>
                                Você deve ver 2 buckets:
                                <ul className="list-disc list-inside pl-4 mt-1">
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">
                                      petrobras-fileshare-files-*
                                    </code>{" "}
                                    (arquivos permanentes)
                                  </li>
                                  <li>
                                    <code className="bg-slate-200 px-1 py-0.5 rounded">petrobras-fileshare-temp-*</code>{" "}
                                    (arquivos temporários)
                                  </li>
                                </ul>
                              </li>
                            </ol>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">6.3. Verificar Lambda:</p>
                            <ol className="list-decimal list-inside text-slate-700 space-y-1 pl-4 text-xs">
                              <li>
                                Acesse{" "}
                                <a href="https://console.aws.amazon.com/lambda" className="text-blue-600 underline">
                                  console.aws.amazon.com/lambda
                                </a>
                              </li>
                              <li>Clique em "Functions"</li>
                              <li>Você deve ver funções Lambda criadas para limpeza automática e notificações</li>
                            </ol>
                          </div>

                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="font-semibold text-slate-900 mb-2">6.4. Copiar URL da API:</p>
                            <p className="text-slate-700 mb-2 text-xs">
                              No output do comando <code className="bg-slate-200 px-1 py-0.5 rounded">cdk deploy</code>,
                              você viu uma linha com "ApiUrl". Copie essa URL, você vai precisar dela no back-end
                              Python!
                            </p>
                            <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs">
                              PetrobrasFileShareApiStack.ApiUrl =
                              https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Passo 7: Conectar Back-end */}
                    <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold">
                          7
                        </div>
                        <h4 className="text-lg font-bold text-purple-900">Conectar o Back-end Python</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <p className="text-purple-800">
                          Agora que a infraestrutura AWS está criada, vamos conectar o back-end Python para usar ela:
                        </p>

                        <div className="bg-white border-2 border-purple-300 p-4 rounded-lg">
                          <p className="font-semibold text-purple-900 mb-2">
                            7.1. Criar arquivo .env no back-end Python:
                          </p>
                          <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs mb-3">
                            cd ../../python
                            <br />
                            nano .env
                          </code>

                          <p className="text-purple-800 mb-2 text-xs">Cole este conteúdo (substitua os valores):</p>
                          <div className="bg-slate-900 p-3 rounded-lg">
                            <pre className="text-xs text-green-400 overflow-x-auto">
                              {`# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<seu_access_key>
AWS_SECRET_ACCESS_KEY=<seu_secret_key>

# DynamoDB Tables
DYNAMODB_USERS_TABLE=petrobras-users
DYNAMODB_FILESHARES_TABLE=petrobras-file-shares
DYNAMODB_AUDIT_TABLE=petrobras-audit-logs
DYNAMODB_NOTIFICATIONS_TABLE=petrobras-notifications
DYNAMODB_SESSIONS_TABLE=petrobras-sessions

# S3 Buckets (copie os nomes que apareceram no output do CDK)
S3_FILES_BUCKET=petrobras-fileshare-files-abc123
S3_TEMP_BUCKET=petrobras-fileshare-temp-abc123

# API Gateway URL (copie do output do CDK)
AWS_API_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod

# ServiceNow (você vai pegar com a equipe de infra)
SERVICENOW_INSTANCE=petrobras.service-now.com
SERVICENOW_CLIENT_ID=<pedir_para_infra>
SERVICENOW_CLIENT_SECRET=<pedir_para_infra>

# JWT Secret (gere um aleatório)
JWT_SECRET=$(openssl rand -hex 32)

# Resend (para e-mails)
RESEND_API_KEY=<sua_chave_resend>`}
                            </pre>
                          </div>
                        </div>

                        <div className="bg-purple-100 p-3 rounded-lg">
                          <p className="font-semibold text-purple-900 mb-1">✅ Pronto!</p>
                          <p className="text-purple-800 text-xs">
                            Agora o back-end Python consegue conversar com todos os serviços AWS que você acabou de
                            criar!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Passo 8: Testar */}
                    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                          8
                        </div>
                        <h4 className="text-lg font-bold text-green-900">Testar Tudo!</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <p className="text-green-800">Vamos testar se conseguimos gravar e ler dados do DynamoDB:</p>

                        <div className="bg-white border-2 border-green-300 p-4 rounded-lg">
                          <p className="font-semibold text-green-900 mb-2">Criar script de teste:</p>
                          <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs mb-3">
                            nano test_aws.py
                          </code>

                          <p className="text-green-800 mb-2 text-xs">Cole este código:</p>
                          <div className="bg-slate-900 p-3 rounded-lg">
                            <pre className="text-xs text-green-400 overflow-x-auto">
                              {`import boto3
from datetime import datetime

# Conectar ao DynamoDB
dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('petrobras-users')

# Criar um usuário de teste
user = {
    'user_id': 'test-001',
    'email': 'teste@petrobras.com.br',
    'name': 'Usuário de Teste',
    'role': 'internal',
    'created_at': datetime.now().isoformat()
}

# Salvar no DynamoDB
table.put_item(Item=user)
print("✅ Usuário criado com sucesso!")

# Ler do DynamoDB
response = table.get_item(Key={'user_id': 'test-001'})
print("✅ Usuário lido com sucesso:")
print(response['Item'])`}
                            </pre>
                          </div>

                          <p className="text-green-800 mb-2 text-xs mt-3">Executar o teste:</p>
                          <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs">
                            python test_aws.py
                          </code>

                          <div className="bg-green-100 p-3 rounded mt-3">
                            <p className="font-semibold text-green-900 mb-1">Se funcionou, você vai ver:</p>
                            <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs">
                              ✅ Usuário criado com sucesso!
                              <br />✅ Usuário lido com sucesso:
                              <br />
                              {"{'user_id': 'test-001', 'email': 'teste@petrobras.com.br', ...}"}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
                  <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                    <Shield className="h-6 w-6" />
                    Problemas Comuns e Soluções
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-semibold text-yellow-900 mb-2">❌ Erro: "Unable to locate credentials"</p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Causa:</strong> AWS CLI não está configurado ou as credenciais expiraram.
                      </p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Solução:</strong> Execute{" "}
                        <code className="bg-yellow-100 px-1 py-0.5 rounded">aws configure</code> novamente e coloque
                        suas credenciais.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-semibold text-yellow-900 mb-2">❌ Erro: "Access Denied"</p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Causa:</strong> Sua conta AWS não tem permissões para criar recursos.
                      </p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Solução:</strong> Peça para o administrador da conta AWS adicionar permissões de
                        "AdministratorAccess" ou pelo menos "PowerUserAccess" para seu usuário.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-semibold text-yellow-900 mb-2">❌ Erro: "Stack already exists"</p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Causa:</strong> Você já executou o{" "}
                        <code className="bg-yellow-100 px-1 py-0.5 rounded">cdk deploy</code> antes.
                      </p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Solução:</strong> Para atualizar os recursos, execute:
                      </p>
                      <code className="bg-slate-900 text-green-400 px-2 py-1 rounded block text-xs">
                        cdk deploy --all --force
                      </code>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-semibold text-yellow-900 mb-2">
                        ❌ Erro no teste Python: "Cannot connect to DynamoDB"
                      </p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Causa:</strong> Nome da tabela errado ou região errada.
                      </p>
                      <p className="text-yellow-800 mb-2 text-xs">
                        <strong>Solução:</strong> Verifique se o nome da tabela no código é exatamente igual ao que
                        aparece no console AWS e se a região está correta (us-east-1).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Próximos Passos */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                  <h3 className="text-xl font-bold text-blue-900 mb-4">🎉 Parabéns! E Agora?</h3>

                  <div className="space-y-3 text-sm">
                    <p className="text-blue-800">
                      Você acabou de criar toda a infraestrutura AWS do projeto! Agora você pode:
                    </p>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                        <p className="font-semibold text-blue-900 mb-1">1. Conectar o Front-end</p>
                        <p className="text-blue-700 text-xs">
                          Atualizar o Next.js para usar a URL da API Gateway que você copiou
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                        <p className="font-semibold text-blue-900 mb-1">2. Implementar ServiceNow</p>
                        <p className="text-blue-700 text-xs">
                          Seguir a aba "ServiceNow" da Wiki para integrar autenticação
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                        <p className="font-semibold text-blue-900 mb-1">3. Testar Upload/Download</p>
                        <p className="text-blue-700 text-xs">Fazer upload de um arquivo e ver ele sendo salvo no S3</p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border-2 border-blue-200">
                        <p className="font-semibold text-blue-900 mb-1">4. Configurar Monitoramento</p>
                        <p className="text-blue-700 text-xs">Ativar CloudWatch Alarms para ser notificado de erros</p>
                      </div>
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
