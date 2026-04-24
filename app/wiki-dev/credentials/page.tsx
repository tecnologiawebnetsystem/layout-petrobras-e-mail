import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Mail, Lock, Shield } from "lucide-react"
import Link from "next/link"

export default function CredentialsPage() {
  const demoUsers = [
    {
      name: "Kleber Gonçalves",
      email: "kleber.goncalves.prestserv@petrobras.com.br",
      password: "petro123",
      role: "Usuário Interno",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      permissions: ["Enviar arquivos", "Ver histórico próprio", "Fazer download"],
    },
    {
      name: "Wagner Gaspar Brazil",
      email: "wagner.brazil@petrobras.com.br",
      password: "petro123",
      role: "Supervisor",
      icon: Shield,
      color: "from-purple-500 to-pink-500",
      permissions: ["Aprovar/Rejeitar uploads", "Ver todos históricos", "Auditoria completa", "Gerenciar usuários"],
    },
    {
      name: "João Santos",
      email: "joao.santos@exemplo.com.br",
      password: "ext123",
      role: "Usuário Externo",
      icon: Mail,
      color: "from-green-500 to-emerald-500",
      permissions: ["Fazer download (após aprovação)", "Ver arquivos próprios"],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        <div className="mb-10">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900">Credenciais Demo</h1>
          <p className="text-lg text-slate-600">Usuários de teste para demonstração e desenvolvimento do sistema</p>
        </div>

        <div className="space-y-6">
          {demoUsers.map((user) => {
            const Icon = user.icon
            return (
              <Card key={user.email} className="overflow-hidden transition-shadow hover:shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${user.color} shadow-md`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <CardTitle className="text-2xl">{user.name}</CardTitle>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                      <CardDescription className="text-base">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Lock className="h-4 w-4" />
                      Senha de acesso
                    </div>
                    <code className="rounded bg-slate-900 px-3 py-1.5 font-mono text-sm text-slate-100">
                      {user.password}
                    </code>
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-700">Permissões:</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-900">
            <p>Estas credenciais são apenas para ambiente de desenvolvimento e demonstração.</p>
            <p>
              <strong>Em produção:</strong> Use autenticação via ServiceNow ou Microsoft Entra ID conforme documentado
              nas respectivas páginas da Wiki.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
