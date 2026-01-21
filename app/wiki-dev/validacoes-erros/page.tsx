"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Home, Search, Copy, Check, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

const Loading = () => null

export default function ValidacoesErrosPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const searchParams = useSearchParams()

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Codigos de erro HTTP
  const httpErrors = [
    {
      code: 400,
      name: "Bad Request",
      description: "Requisicao invalida - dados faltando ou formato incorreto",
      causes: ["Campo obrigatorio ausente", "Formato de email invalido", "JSON mal formado", "Tipo de dado incorreto"],
      example: `{
  "error": "BAD_REQUEST",
  "message": "O campo 'email' e obrigatorio",
  "field": "email",
  "code": "MISSING_FIELD"
}`,
    },
    {
      code: 401,
      name: "Unauthorized",
      description: "Nao autenticado - token ausente, expirado ou invalido",
      causes: ["Token nao enviado no header", "Token expirado", "Token invalido ou corrompido", "Sessao encerrada"],
      example: `{
  "error": "UNAUTHORIZED",
  "message": "Token de acesso expirado. Faca login novamente.",
  "code": "TOKEN_EXPIRED"
}`,
    },
    {
      code: 403,
      name: "Forbidden",
      description: "Sem permissao - usuario autenticado mas sem acesso ao recurso",
      causes: ["Usuario nao e supervisor", "Tentando acessar share de outro usuario", "Acao nao permitida para o perfil"],
      example: `{
  "error": "FORBIDDEN",
  "message": "Voce nao tem permissao para aprovar este compartilhamento",
  "code": "INSUFFICIENT_PERMISSIONS"
}`,
    },
    {
      code: 404,
      name: "Not Found",
      description: "Recurso nao encontrado",
      causes: ["Share ID inexistente", "Arquivo deletado", "Usuario nao existe"],
      example: `{
  "error": "NOT_FOUND",
  "message": "Compartilhamento nao encontrado",
  "code": "SHARE_NOT_FOUND"
}`,
    },
    {
      code: 409,
      name: "Conflict",
      description: "Conflito - acao nao pode ser realizada no estado atual",
      causes: ["Share ja aprovado", "Share ja rejeitado", "Arquivo ja expirado"],
      example: `{
  "error": "CONFLICT",
  "message": "Este compartilhamento ja foi aprovado",
  "code": "ALREADY_APPROVED"
}`,
    },
    {
      code: 413,
      name: "Payload Too Large",
      description: "Arquivo muito grande",
      causes: ["Arquivo excede 500MB", "Total dos arquivos excede limite"],
      example: `{
  "error": "PAYLOAD_TOO_LARGE",
  "message": "Arquivo excede o tamanho maximo de 500MB",
  "maxSize": 524288000,
  "code": "FILE_TOO_LARGE"
}`,
    },
    {
      code: 422,
      name: "Unprocessable Entity",
      description: "Dados validos mas semanticamente incorretos",
      causes: ["Email do destinatario e interno (@petrobras)", "Extensao de arquivo bloqueada", "Motivo muito curto"],
      example: `{
  "error": "UNPROCESSABLE_ENTITY",
  "message": "Extensao .exe nao e permitida",
  "code": "BLOCKED_EXTENSION"
}`,
    },
    {
      code: 429,
      name: "Too Many Requests",
      description: "Rate limit excedido",
      causes: ["Muitas tentativas de OTP", "Muitas requisicoes por minuto", "IP bloqueado temporariamente"],
      example: `{
  "error": "TOO_MANY_REQUESTS",
  "message": "Muitas tentativas. Aguarde 15 minutos.",
  "retryAfter": 900,
  "code": "RATE_LIMITED"
}`,
    },
    {
      code: 500,
      name: "Internal Server Error",
      description: "Erro interno do servidor",
      causes: ["Bug no codigo", "Banco de dados indisponivel", "Servico externo falhou"],
      example: `{
  "error": "INTERNAL_ERROR",
  "message": "Erro interno. Tente novamente mais tarde.",
  "requestId": "req_abc123",
  "code": "INTERNAL_ERROR"
}`,
    },
  ]

  // Codigos de erro especificos da aplicacao
  const appErrors = [
    {
      category: "Autenticacao",
      errors: [
        { code: "INVALID_TOKEN", message: "Token de acesso invalido", action: "Redirecionar para login" },
        { code: "TOKEN_EXPIRED", message: "Token expirado", action: "Redirecionar para login" },
        { code: "INVALID_OTP", message: "Codigo OTP incorreto", action: "Mostrar erro, permitir nova tentativa" },
        { code: "OTP_EXPIRED", message: "Codigo OTP expirado", action: "Sugerir reenvio do codigo" },
        { code: "MAX_OTP_ATTEMPTS", message: "Maximo de tentativas excedido", action: "Bloquear por 15 min" },
        { code: "SESSION_EXPIRED", message: "Sessao expirada", action: "Redirecionar para login" },
        { code: "INVALID_DOMAIN", message: "Email de dominio nao permitido", action: "Mostrar erro, bloquear login" },
      ],
    },
    {
      category: "Compartilhamento",
      errors: [
        { code: "SHARE_NOT_FOUND", message: "Compartilhamento nao encontrado", action: "Mostrar pagina 404" },
        { code: "SHARE_EXPIRED", message: "Compartilhamento expirado", action: "Mostrar mensagem de expiracao" },
        { code: "SHARE_CANCELLED", message: "Compartilhamento cancelado", action: "Mostrar mensagem" },
        { code: "ALREADY_APPROVED", message: "Ja foi aprovado", action: "Atualizar lista" },
        { code: "ALREADY_REJECTED", message: "Ja foi rejeitado", action: "Atualizar lista" },
        { code: "CANNOT_CANCEL", message: "Nao pode mais ser cancelado", action: "Mostrar motivo" },
        { code: "NO_FILES", message: "Nenhum arquivo selecionado", action: "Validar form" },
        { code: "NO_RECIPIENTS", message: "Nenhum destinatario", action: "Validar form" },
      ],
    },
    {
      category: "Arquivos",
      errors: [
        { code: "FILE_TOO_LARGE", message: "Arquivo muito grande (max 500MB)", action: "Impedir upload" },
        { code: "BLOCKED_EXTENSION", message: "Extensao nao permitida", action: "Impedir upload" },
        { code: "FILE_NOT_FOUND", message: "Arquivo nao encontrado no S3", action: "Mostrar erro" },
        { code: "DOWNLOAD_FAILED", message: "Falha no download", action: "Permitir retry" },
        { code: "UPLOAD_FAILED", message: "Falha no upload", action: "Permitir retry" },
        { code: "VIRUS_DETECTED", message: "Arquivo com virus detectado", action: "Bloquear e notificar" },
      ],
    },
    {
      category: "Supervisor",
      errors: [
        { code: "NOT_SUPERVISOR", message: "Usuario nao e supervisor", action: "Redirecionar para home" },
        { code: "CANNOT_APPROVE_OWN", message: "Nao pode aprovar proprio share", action: "Mostrar erro" },
        { code: "REJECTION_REASON_REQUIRED", message: "Motivo da rejeicao obrigatorio", action: "Validar form" },
        { code: "REJECTION_REASON_TOO_SHORT", message: "Motivo muito curto (min 10 chars)", action: "Validar form" },
      ],
    },
  ]

  // Validacoes de entrada
  const validations = [
    {
      field: "email",
      rules: [
        { rule: "Obrigatorio", regex: "/.+/", example: "joao@empresa.com" },
        { rule: "Formato email valido", regex: "/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/", example: "nome@dominio.com" },
        { rule: "Nao pode ser @petrobras (destinatario)", regex: "!/.*@petrobras/i", example: "externo@empresa.com" },
      ],
    },
    {
      field: "motivo (reason)",
      rules: [
        { rule: "Obrigatorio", regex: "/.+/", example: "Documentos do projeto X" },
        { rule: "Minimo 10 caracteres", regex: "/.{10,}/", example: "Envio de relatorios mensais" },
        { rule: "Maximo 500 caracteres", regex: "/^.{0,500}$/", example: "..." },
      ],
    },
    {
      field: "expirationHours",
      rules: [
        { rule: "Obrigatorio", regex: "/\\d+/", example: "48" },
        { rule: "Valores permitidos: 24, 48 ou 72", regex: "/^(24|48|72)$/", example: "24" },
      ],
    },
    {
      field: "rejectionReason",
      rules: [
        { rule: "Obrigatorio (para rejeicao)", regex: "/.+/", example: "Arquivo incorreto" },
        { rule: "Minimo 10 caracteres", regex: "/.{10,}/", example: "O arquivo enviado nao corresponde..." },
      ],
    },
    {
      field: "otpCode",
      rules: [
        { rule: "Obrigatorio", regex: "/.+/", example: "123456" },
        { rule: "Exatamente 6 digitos", regex: "/^\\d{6}$/", example: "482910" },
      ],
    },
    {
      field: "files",
      rules: [
        { rule: "Minimo 1 arquivo", regex: "length >= 1", example: "[file1.pdf]" },
        { rule: "Maximo 10 arquivos", regex: "length <= 10", example: "[file1.pdf, ..., file10.pdf]" },
        { rule: "Cada arquivo max 500MB", regex: "size <= 524288000", example: "< 500MB" },
        { rule: "Extensao nao bloqueada", regex: "!blockedExtensions.includes(ext)", example: ".pdf, .docx" },
      ],
    },
  ]

  const filteredHttpErrors = httpErrors.filter(
    (e) =>
      e.code.toString().includes(searchQuery) ||
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Link href="/wiki-dev">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Voltar para Wiki
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Validacoes e Erros</h1>
            <p className="text-slate-600">
              Codigos HTTP, erros da aplicacao, validacoes de entrada e tratamento de excecoes
            </p>
          </div>

          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar erro (ex: 401, token, OTP...)"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* HTTP Errors */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Codigos de Erro HTTP
            </h2>
            <div className="space-y-4">
              {filteredHttpErrors.map((error) => (
                <Card key={error.code}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={
                            error.code < 400
                              ? "bg-green-100 text-green-700 border-green-300"
                              : error.code < 500
                                ? "bg-amber-100 text-amber-700 border-amber-300"
                                : "bg-red-100 text-red-700 border-red-300"
                          }
                        >
                          {error.code}
                        </Badge>
                        <span>{error.name}</span>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(error.example, `http-${error.code}`)}
                      >
                        {copiedId === `http-${error.code}` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-600">{error.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">Causas Comuns:</p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {error.causes.map((cause, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-slate-400">•</span>
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Exemplo de Response:</p>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
                          <code>{error.example}</code>
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* App Errors */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-500" />
              Codigos de Erro da Aplicacao
            </h2>
            <div className="space-y-6">
              {appErrors.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle>{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Codigo</th>
                            <th className="px-4 py-2 text-left font-medium">Mensagem</th>
                            <th className="px-4 py-2 text-left font-medium">Acao no Front-End</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.errors.map((error) => (
                            <tr key={error.code} className="border-t">
                              <td className="px-4 py-2 font-mono text-red-600 text-xs">{error.code}</td>
                              <td className="px-4 py-2">{error.message}</td>
                              <td className="px-4 py-2 text-slate-600">{error.action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Validations */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Validacoes de Entrada
            </h2>
            <div className="space-y-4">
              {validations.map((field) => (
                <Card key={field.field}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{field.field}</code>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Regra</th>
                            <th className="px-4 py-2 text-left font-medium">Validacao</th>
                            <th className="px-4 py-2 text-left font-medium">Exemplo Valido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {field.rules.map((rule, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-4 py-2">{rule.rule}</td>
                              <td className="px-4 py-2 font-mono text-xs text-slate-600">{rule.regex}</td>
                              <td className="px-4 py-2 font-mono text-xs text-green-600">{rule.example}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Best Practices */}
          <section>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="h-6 w-6 text-blue-500" />
              Boas Praticas de Tratamento de Erros
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">1. Sempre mostrar mensagem amigavel ao usuario</h4>
                    <p className="text-sm text-blue-700">
                      Nunca mostre stack traces ou mensagens tecnicas. Use as mensagens do campo "message" da response.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">2. Validar no front-end E no back-end</h4>
                    <p className="text-sm text-green-700">
                      A validacao do front e para UX rapida. A do back e para seguranca. Ambas sao necessarias.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <h4 className="font-semibold text-amber-800 mb-2">3. Logar erros para auditoria</h4>
                    <p className="text-sm text-amber-700">
                      Todos os erros 4xx e 5xx devem ser registrados no log de auditoria com requestId para debug.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">4. Usar try/catch em todas as chamadas de API</h4>
                    <p className="text-sm text-purple-700">
                      Sempre trate erros de rede e timeouts. Mostre mensagem generica se nao conseguir parsear a response.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-slate-800 mb-2">5. Exemplo de tratamento no front-end</h4>
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-x-auto mt-2">
                      <code>{`try {
  const response = await fetch("/api/v1/shares/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    
    // Tratar erros especificos
    if (error.code === "BLOCKED_EXTENSION") {
      toast.error("Este tipo de arquivo nao e permitido")
      return
    }
    
    // Erro generico
    toast.error(error.message || "Erro ao criar compartilhamento")
    return
  }
  
  const result = await response.json()
  toast.success("Compartilhamento criado!")
  
} catch (err) {
  // Erro de rede/timeout
  toast.error("Erro de conexao. Verifique sua internet.")
}`}</code>
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Suspense>
  )
}
