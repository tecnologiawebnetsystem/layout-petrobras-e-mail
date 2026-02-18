"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Home, KeyRound, Copy, Check, Server, Monitor, Cloud, HardDrive, Shield, Mail, Globe, Lock, FolderOpen, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function CopyBlock({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      {label && <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm">
        <code className="flex-1 overflow-x-auto whitespace-pre text-slate-800">{text}</code>
        <button
          onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="shrink-0 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
      {children}
    </div>
  )
}

function WarningBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>{children}</div>
      </div>
    </div>
  )
}

export default function VariaveisAmbientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Variaveis de Ambiente</h1>
          <p className="text-lg text-slate-600">
            Todas as configuracoes do sistema organizadas por ambiente: local, Render (backend) e Vercel (frontend)
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-700">4 Arquivos Prontos</Badge>
            <Badge className="bg-blue-100 text-blue-700">Pasta ENV/</Badge>
            <Badge className="bg-amber-100 text-amber-700">Copiar e Colar</Badge>
          </div>
        </div>

        <Alert className="mb-8 border-red-300 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>IMPORTANTE:</strong> Os arquivos da pasta <code className="rounded bg-red-100 px-1">ENV/</code> contem
            valores de EXEMPLO. Nunca commite o arquivo <code className="rounded bg-red-100 px-1">.env</code> real com senhas
            verdadeiras no GitHub. O <code className="rounded bg-red-100 px-1">.gitignore</code> ja protege isso.
          </AlertDescription>
        </Alert>

        {/* ================================================ */}
        {/* MAPA DOS ARQUIVOS */}
        {/* ================================================ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-amber-600" />
              Mapa dos Arquivos de Configuracao
            </CardTitle>
            <CardDescription>Onde cada arquivo fica e para que serve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Arquivo</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Para que serve</th>
                    <th className="pb-3 font-semibold text-slate-700">Onde usar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-blue-700">ENV/frontend-vercel.env</td>
                    <td className="py-3 pr-4 text-slate-600">Configuracao completa do frontend para Vercel (producao)</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Vercel Dashboard</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-blue-700">ENV/frontend-local.env</td>
                    <td className="py-3 pr-4 text-slate-600">Frontend rodando no seu computador</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Copiar para .env.local</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-green-700">ENV/backend-render.env</td>
                    <td className="py-3 pr-4 text-slate-600">Configuracao completa do backend para Render (producao)</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Render Dashboard</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-green-700">ENV/backend-local.env</td>
                    <td className="py-3 pr-4 text-slate-600">Backend rodando no seu computador</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Copiar para backend/.env</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">.env.example</td>
                    <td className="py-3 pr-4 text-slate-600">Resumo rapido do frontend (versao curta)</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Referencia</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-500">backend/.env.example</td>
                    <td className="py-3 pr-4 text-slate-600">Resumo rapido do backend (versao curta)</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">Referencia</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* COMO USAR LOCAL */}
        {/* ================================================ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Como Usar no Seu Computador (Local)
            </CardTitle>
            <CardDescription>Copie os arquivos e preencha com seus dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Passo 1: Copiar o arquivo do backend</h4>
              <CopyBlock text="cp ENV/backend-local.env backend/.env" />
              <p className="text-sm text-slate-600">Isso cria o arquivo <code className="rounded bg-slate-100 px-1">backend/.env</code> com as configuracoes para rodar local.</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Passo 2: Copiar o arquivo do frontend</h4>
              <CopyBlock text="cp ENV/frontend-local.env .env.local" />
              <p className="text-sm text-slate-600">Isso cria o arquivo <code className="rounded bg-slate-100 px-1">.env.local</code> na raiz do projeto.</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800">Passo 3: Editar os dois arquivos</h4>
              <p className="text-sm text-slate-600">
                Abra cada arquivo e troque <code className="rounded bg-slate-100 px-1">USER:SENHA@ep-xxx</code> pela
                sua connection string real do Neon. O resto ja vem configurado para desenvolvimento.
              </p>
            </div>

            <InfoBox>
              <strong>Dica:</strong> No modo local, o backend usa SQLite se voce nao preencher o DATABASE_URL.
              Funciona para testar, mas nao tem as tabelas do Neon.
            </InfoBox>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* VARIAVEIS DO FRONTEND */}
        {/* ================================================ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Frontend (Next.js) - Todas as Variaveis
            </CardTitle>
            <CardDescription>Configurar na Vercel (producao) ou em .env.local (local)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Variavel</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Obrigatorio</th>
                    <th className="pb-3 pr-4 font-semibold text-slate-700">Onde Pegar</th>
                    <th className="pb-3 font-semibold text-slate-700">Valor em Producao</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">BACKEND_URL</td>
                    <td className="py-3 pr-4"><Badge className="bg-red-100 text-red-700">SIM</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">URL do Render Dashboard</td>
                    <td className="py-3 font-mono text-xs text-slate-600">https://layout-petrobras-e-mail.onrender.com</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">DATABASE_URL</td>
                    <td className="py-3 pr-4"><Badge className="bg-red-100 text-red-700">SIM</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">Neon Console &gt; Connection Details</td>
                    <td className="py-3 font-mono text-xs text-slate-600">postgresql://user:pass@host/db</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">NEXT_PUBLIC_ENTRA_CLIENT_ID</td>
                    <td className="py-3 pr-4"><Badge className="bg-amber-100 text-amber-700">Producao</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">Azure Portal &gt; App Registrations</td>
                    <td className="py-3 font-mono text-xs text-slate-600">xxxxxxxx-xxxx-xxxx-xxxx</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">NEXT_PUBLIC_ENTRA_TENANT_ID</td>
                    <td className="py-3 pr-4"><Badge className="bg-amber-100 text-amber-700">Producao</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">Azure Portal &gt; App Registrations</td>
                    <td className="py-3 font-mono text-xs text-slate-600">xxxxxxxx-xxxx-xxxx-xxxx</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">NEXT_PUBLIC_ENTRA_REDIRECT_URI</td>
                    <td className="py-3 pr-4"><Badge className="bg-slate-100 text-slate-600">Opcional</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">Usa window.location.origin se vazio</td>
                    <td className="py-3 font-mono text-xs text-slate-600">https://seu-app.vercel.app</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">NEXT_PUBLIC_APP_URL</td>
                    <td className="py-3 pr-4"><Badge className="bg-slate-100 text-slate-600">Opcional</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">URL publica do app</td>
                    <td className="py-3 font-mono text-xs text-slate-600">https://seu-app.vercel.app</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-800">NEXT_PUBLIC_API_URL</td>
                    <td className="py-3 pr-4"><Badge className="bg-slate-100 text-slate-600">Opcional</Badge></td>
                    <td className="py-3 pr-4 text-slate-600">Padrao: /api</td>
                    <td className="py-3 font-mono text-xs text-slate-600">/api</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* VARIAVEIS DO BACKEND */}
        {/* ================================================ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              Backend (Python/FastAPI) - Todas as Variaveis
            </CardTitle>
            <CardDescription>Configurar no Render (producao) ou em backend/.env (local)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Banco */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <HardDrive className="h-4 w-4" /> Banco de Dados
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Obrigatorio</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">DATABASE_URL</td>
                        <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">SIM</Badge></td>
                        <td className="py-2 text-slate-600">Connection string do Neon PostgreSQL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seguranca */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Lock className="h-4 w-4" /> Seguranca
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Obrigatorio</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">JWT_SECRET_KEY</td>
                        <td className="py-2 pr-4"><Badge className="bg-red-100 text-red-700">SIM</Badge></td>
                        <td className="py-2 text-slate-600">Chave para assinar tokens JWT</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2">
                  <CopyBlock text={`python3 -c "import secrets; print(secrets.token_hex(64))"`} label="Como gerar a chave:" />
                </div>
              </div>

              {/* Email */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Mail className="h-4 w-4" /> Email
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Padrao</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">EMAIL_PROVIDER</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">dev</td>
                        <td className="py-2 text-slate-600">"dev" (console) ou "ses" (Amazon SES)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">SMTP_SERVER</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Servidor SMTP (so se EMAIL_PROVIDER=ses)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">SMTP_PORT</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Porta SMTP (587)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">SMTP_USER / SMTP_PASS</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Credenciais SMTP</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">MAIL_FROM</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Email remetente</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storage */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Cloud className="h-4 w-4" /> Armazenamento (S3)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Padrao</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">STORAGE_PROVIDER</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">local</td>
                        <td className="py-2 text-slate-600">"local" (disco) ou "aws" (S3)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">AWS_REGION</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Regiao AWS (us-east-1)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">AWS_S3_BUCKET</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Nome do bucket S3</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">AWS_ACCESS_KEY_ID</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Access Key IAM</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">AWS_SECRET_ACCESS_KEY</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Secret Key IAM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Auth */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Shield className="h-4 w-4" /> Autenticacao (Entra ID)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Padrao</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">AUTH_MODE</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">local</td>
                        <td className="py-2 text-slate-600">"local" (usuario/senha) ou "entra" (SSO)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">ENTRA_TENANT_ID</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Tenant da Petrobras no Azure</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">ENTRA_CLIENT_ID</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Client ID do App Registration</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">ENTRA_CLIENT_SECRET</td>
                        <td className="py-2 pr-4 text-slate-400">-</td>
                        <td className="py-2 text-slate-600">Secret do App Registration</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">ENTRA_REDIRECT_URI</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">localhost callback</td>
                        <td className="py-2 text-slate-600">URL de callback do OAuth</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Branding */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-slate-800">
                  <Globe className="h-4 w-4" /> Links e Branding
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left">
                        <th className="pb-2 pr-4 font-medium text-slate-600">Variavel</th>
                        <th className="pb-2 pr-4 font-medium text-slate-600">Padrao</th>
                        <th className="pb-2 font-medium text-slate-600">Descricao</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">FRONTEND_EXTERNAL_PORTAL_URL</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">localhost:3000</td>
                        <td className="py-2 text-slate-600">URL do frontend (para links em emails)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">APP_NAME</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">Compartilhamento...</td>
                        <td className="py-2 text-slate-600">Nome exibido nos emails</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">COMPANY_NAME</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">Petrobras</td>
                        <td className="py-2 text-slate-600">Nome da empresa nos emails</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-xs">SUPPORT_EMAIL</td>
                        <td className="py-2 pr-4 font-mono text-xs text-slate-500">suporte@petrobras...</td>
                        <td className="py-2 text-slate-600">Email de suporte</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================ */}
        {/* STATUS ATUAL EM PRODUCAO */}
        {/* ================================================ */}
        <Card className="mb-8 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Check className="h-5 w-5 text-green-600" />
              Status Atual em Producao
            </CardTitle>
            <CardDescription>O que ja esta configurado e funcionando</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Backend (Render.com)</h4>
                <p className="mb-1 text-sm text-green-700">URL: <code className="rounded bg-green-100 px-1">https://layout-petrobras-e-mail.onrender.com</code></p>
                <p className="mb-1 text-sm text-green-700">Swagger: <code className="rounded bg-green-100 px-1">https://layout-petrobras-e-mail.onrender.com/docs</code></p>
                <p className="text-sm text-green-700">Status: Rodando</p>
              </div>

              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Frontend (Vercel)</h4>
                <p className="mb-1 text-sm text-green-700">BACKEND_URL: Configurado e apontando para o Render</p>
                <p className="mb-1 text-sm text-green-700">DATABASE_URL: Configurado (Neon PostgreSQL)</p>
                <p className="text-sm text-green-700">48 rotas proxy funcionando</p>
              </div>

              <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                <h4 className="mb-2 font-semibold text-green-800">Banco de Dados (Neon)</h4>
                <p className="mb-1 text-sm text-green-700">19 tabelas criadas e funcionando</p>
                <p className="text-sm text-green-700">Conectado ao backend e frontend</p>
              </div>
            </div>

            <WarningBox>
              <strong>Faltando para producao completa:</strong> NEXT_PUBLIC_ENTRA_CLIENT_ID e NEXT_PUBLIC_ENTRA_TENANT_ID
              (SSO da Petrobras). Sem eles, o login funciona apenas no modo local (usuario/senha).
            </WarningBox>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white/50 p-6 shadow-sm">
          <p className="text-center text-sm text-slate-500">
            Documentacao restrita - Uso interno do desenvolvimento
          </p>
        </div>
      </div>
    </div>
  )
}
