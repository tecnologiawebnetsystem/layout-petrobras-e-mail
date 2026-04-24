"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, Shield, CheckCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function AzureConfigPage() {
  const [copied, setCopied] = useState("")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(""), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki-Dev
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">Configuração Azure AD</h1>
          <p className="text-lg text-slate-600">Guia completo para configurar Microsoft Entra ID em HML e Produção</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="redirect-uri" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="redirect-uri">Redirect URI</TabsTrigger>
            <TabsTrigger value="permissoes">Permissões Graph API</TabsTrigger>
          </TabsList>

          {/* Redirect URI Tab */}
          <TabsContent value="redirect-uri" className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                Configure o Redirect URI no Azure AD para permitir autenticação SSO nos ambientes HML e Produção.
              </AlertDescription>
            </Alert>

            {/* HML Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ambiente de Homologação (HML)</CardTitle>
                  <Badge variant="secondary">HML</Badge>
                </div>
                <CardDescription>Configuração para ambiente de testes e validação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">Informações da Aplicação</h3>
                  <div className="space-y-2 rounded-lg bg-slate-50 p-4 font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Client ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-slate-900"></code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard("", "hml-client")}
                        >
                          {copied === "hml-client" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tenant ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-slate-900"></code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard("", "hml-tenant")}
                        >
                          {copied === "hml-tenant" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Nome:</span>
                      <code className="text-slate-900"></code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">URLs a Configurar</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                      <code className="text-sm text-blue-900">https://layout-petro-e-mail.vercel.app</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("https://layout-petro-e-mail.vercel.app", "hml-url1")}
                      >
                        {copied === "hml-url1" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                      <code className="text-sm text-blue-900">https://layout-petro-e-mail.vercel.app/</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard("https://layout-petro-e-mail.vercel.app/", "hml-url2")}
                      >
                        {copied === "hml-url2" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">⚠️ Adicione AMBAS as URLs (com e sem barra final)</p>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">Passo a Passo</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                        1
                      </span>
                      <span>
                        Acesse{" "}
                        <a
                          href="https://portal.azure.com"
                          target="_blank"
                          className="text-blue-600 hover:underline"
                          rel="noreferrer"
                        >
                          portal.azure.com
                        </a>{" "}
                        e faça login como administrador
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                        2
                      </span>
                      <span>Azure Active Directory → App registrations → </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                        3
                      </span>
                      <span>
                        No menu lateral, clique em <strong>Authentication</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                        4
                      </span>
                      <span>
                        Adicione as URLs acima em <strong>Single-page application (SPA)</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-600">
                        5
                      </span>
                      <span>
                        Clique em <strong>Save</strong>
                      </span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Produção Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Ambiente de Produção</CardTitle>
                  <Badge className="bg-red-600">PRODUÇÃO</Badge>
                </div>
                <CardDescription>Configuração para ambiente de produção (a ser definido)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900">
                    As informações de produção serão atualizadas quando o domínio final for definido. Siga os mesmos
                    passos da HML, alterando apenas as URLs.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">URLs de Produção (Exemplo)</h3>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <code className="text-sm text-slate-600">https://compartilhamento.petrobras.com.br</code>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <code className="text-sm text-slate-600">https://compartilhamento.petrobras.com.br/</code>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">ℹ️ Substitua pelo domínio real quando disponível</p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">Checklist de Produção</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      <span>Criar novo App Registration ou usar existente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      <span>Configurar Redirect URIs com domínio de produção</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      <span>Atualizar variáveis de ambiente no Vercel</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      <span>Configurar permissões Graph API (ver aba ao lado)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border-2 border-slate-300" />
                      <span>Testar login com usuários reais</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="mb-1 font-semibold text-slate-900">Erro: "redirect URI does not match"</h4>
                  <p className="text-slate-600">
                    Verifique se adicionou em <strong>Single-page application</strong> (não Web ou Mobile)
                  </p>
                </div>
                <div>
                  <h4 className="mb-1 font-semibold text-slate-900">Erro persiste após configurar</h4>
                  <p className="text-slate-600">Aguarde 1-2 minutos, limpe cache do navegador e teste em aba anônima</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissões Graph API Tab */}
          <TabsContent value="permissoes" className="space-y-6">
            <Alert className="border-purple-200 bg-purple-50">
              <Shield className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-900">
                Configure as permissões do Microsoft Graph API para permitir busca de foto, cargo, departamento e
                supervisor.
              </AlertDescription>
            </Alert>

            {/* HML Permissões */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Permissões para HML</CardTitle>
                  <Badge variant="secondary">HML</Badge>
                </div>
                <CardDescription>Configuração de permissões do Microsoft Graph API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">Permissões Necessárias</h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-green-900">User.Read</h4>
                        <Badge variant="outline" className="border-green-600 text-green-600">
                          Delegated
                        </Badge>
                      </div>
                      <p className="text-sm text-green-800">Permite: Ler perfil básico do usuário logado</p>
                      <p className="mt-1 text-xs text-green-700">✓ Não requer admin consent</p>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-blue-900">User.ReadBasic.All</h4>
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          Delegated
                        </Badge>
                      </div>
                      <p className="text-sm text-blue-800">Permite: Ler cargo, departamento, localização, telefone</p>
                      <p className="mt-1 text-xs text-blue-700">✓ Não requer admin consent</p>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-amber-900">User.Read.All</h4>
                        <Badge variant="outline" className="border-amber-600 text-amber-600">
                          Delegated
                        </Badge>
                      </div>
                      <p className="text-sm text-amber-800">
                        Permite: Ler foto do perfil e informações do supervisor direto
                      </p>
                      <p className="mt-1 text-xs text-amber-700">⚠️ REQUER admin consent</p>
                    </div>

                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h4 className="font-semibold text-purple-900">Mail.Send</h4>
                        <Badge variant="outline" className="border-purple-600 text-purple-600">
                          Delegated
                        </Badge>
                      </div>
                      <p className="text-sm text-purple-800">
                        Permite: Enviar emails como o usuário logado através do Microsoft 365
                      </p>
                      <p className="mt-1 text-xs text-purple-700">✓ Não requer admin consent</p>
                      <div className="mt-2 rounded bg-purple-100 p-2 text-xs text-purple-900">
                        💡 <strong>Benefício:</strong> Substitui AWS SES, sem custo adicional usando caixa de email
                        corporativa
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">Passo a Passo</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        1
                      </span>
                      <span>Azure AD → App registrations → </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        2
                      </span>
                      <span>
                        No menu lateral, clique em <strong>API permissions</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        3
                      </span>
                      <span>
                        Clique em <strong>+ Add a permission</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        4
                      </span>
                      <span>
                        Selecione <strong>Microsoft Graph</strong> → <strong>Delegated permissions</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        5
                      </span>
                      <span>
                        Marque as 4 permissões acima e clique em <strong>Add permissions</strong>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-600">
                        6
                      </span>
                      <span className="font-semibold text-amber-600">
                        IMPORTANTE: Clique em <strong>Grant admin consent for Petrobras</strong>
                      </span>
                    </li>
                  </ol>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900">
                    O <strong>Admin Consent</strong> é obrigatório! Sem ele, os dados do perfil não serão carregados.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">Link Direto de Admin Consent (HML)</h3>
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                    <code className="flex-1 text-xs text-slate-600">
                      https://login.microsoftonline.com//adminconsent?client_id=
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          "https://login.microsoftonline.com//adminconsent?client_id=",
                          "consent-link",
                        )
                      }
                    >
                      {copied === "consent-link" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Produção Permissões */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Permissões para Produção</CardTitle>
                  <Badge className="bg-red-600">PRODUÇÃO</Badge>
                </div>
                <CardDescription>As mesmas permissões devem ser configuradas em produção</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    Siga os mesmos passos da HML quando o App Registration de produção estiver criado. As permissões são
                    idênticas: <strong>User.Read</strong>, <strong>User.ReadBasic.All</strong> e{" "}
                    <strong>User.Read.All</strong>.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Verificação */}
            <Card>
              <CardHeader>
                <CardTitle>Verificação Após Configurar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Após configurar as permissões, o sistema deve exibir:</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Foto do perfil corporativo no header</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Cargo e departamento do usuário</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Informações do supervisor direto</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Campo "Aprovador" preenchido automaticamente na página de upload</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle>Nota de Segurança</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-700">Estas permissões são seguras e seguem as melhores práticas:</p>
                <ul className="space-y-1 text-slate-600">
                  <li>
                    ✓ Permissões <strong>delegated</strong> (não application) - Só funcionam quando usuário está logado
                  </li>
                  <li>✓ Acesso somente leitura - Não permite modificar dados</li>
                  <li>✓ Limitado ao contexto do usuário - Cada usuário vê apenas suas próprias informações</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Links Úteis */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Links Úteis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="https://portal.azure.com"
              target="_blank"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Portal Azure
            </a>
            <a
              href="https://learn.microsoft.com/en-us/graph/permissions-reference"
              target="_blank"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Documentação Microsoft Graph Permissions
            </a>
            <a
              href="https://aka.ms/redirectUriMismatchError"
              target="_blank"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Troubleshooting Redirect URI Mismatch
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
