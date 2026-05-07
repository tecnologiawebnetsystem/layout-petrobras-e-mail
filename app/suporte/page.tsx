"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useSolicitacoesStore } from "@/lib/stores/solicitacoes-store"
import { AppHeader } from "@/components/shared/app-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { NotificationModal } from "@/components/shared/notification-modal"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Users,
  FileText,
  Activity,
  RefreshCcw,
  Mail,
  Hash,
  User,
  Loader2,
  History,
  Eye,
  Calendar,
  Copy,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react"
import { FullPageLoader } from "@/components/ui/full-page-loader"

interface CadastroRegistro {
  id: string
  numeroSolicitacao: string
  emailSolicitante: string
  emailUsuarioExterno: string
  status: "pendente" | "ativo" | "inativo" | "erro"
  dataCadastro: string
  cadastradoPor: string
  observacao?: string
}

const REGISTROS_INICIAIS: CadastroRegistro[] = []

// Gera iniciais para o avatar
function getInitials(email: string) {
  const name = email.split("@")[0]
  return name.slice(0, 2).toUpperCase()
}

// Cor do avatar baseada no email
function getAvatarColor(email: string) {
  const colors = [
    "bg-[#0066CC]",
    "bg-[#00A99D]",
    "bg-violet-600",
    "bg-amber-600",
    "bg-rose-600",
  ]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function SuportePage() {
  const { user, isAuthenticated } = useAuthStore()
  const { addSolicitacao } = useSolicitacoesStore()
  const router = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [numeroSolicitacao, setNumeroSolicitacao] = useState("")
  const [emailSolicitante, setEmailSolicitante] = useState("")
  const [emailUsuarioExterno, setEmailUsuarioExterno] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [registros, setRegistros] = useState<CadastroRegistro[]>(REGISTROS_INICIAIS)
  const [registrosFiltrados, setRegistrosFiltrados] = useState<CadastroRegistro[]>(REGISTROS_INICIAIS)
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "pendente" | "inativo" | "hoje">("todos")
  const [activeTab, setActiveTab] = useState("cadastrar")
  const [registroSelecionado, setRegistroSelecionado] = useState<CadastroRegistro | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)

  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({ show: false, type: "info", title: "", message: "" })

  const hasSuportAccess = user?.userType === "support" || user?.userType === "supervisor"

  const stats = {
    total: registros.length,
    ativos: registros.filter(r => r.status === "ativo").length,
    hoje: registros.filter(r => {
      const hoje = new Date().toDateString()
      return new Date(r.dataCadastro).toDateString() === hoje
    }).length,
  }

  // Percentual de ativos em relação ao total
  const pctAtivos = stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const verificarDuplicidade = (email: string) =>
    registros.some(
      r => r.emailUsuarioExterno.toLowerCase() === email.toLowerCase() &&
           (r.status === "ativo" || r.status === "pendente")
    )

  useEffect(() => {
    if (!isAuthenticated) { router.push("/"); return }
    if (!hasSuportAccess) { router.push("/"); return }
    const timer = setTimeout(() => setPageLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [isAuthenticated, hasSuportAccess, router])

  useEffect(() => {
    let filtrados = registros
    if (filtroStatus === "ativo") filtrados = filtrados.filter(r => r.status === "ativo")
    else if (filtroStatus === "pendente") filtrados = filtrados.filter(r => r.status === "pendente")
    else if (filtroStatus === "inativo") filtrados = filtrados.filter(r => r.status === "inativo")
    else if (filtroStatus === "hoje") {
      const hoje = new Date().toDateString()
      filtrados = filtrados.filter(r => new Date(r.dataCadastro).toDateString() === hoje)
    }
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase()
      filtrados = filtrados.filter(r =>
        r.numeroSolicitacao.toLowerCase().includes(termo) ||
        r.emailSolicitante.toLowerCase().includes(termo) ||
        r.emailUsuarioExterno.toLowerCase().includes(termo)
      )
    }
    setRegistrosFiltrados(filtrados)
  }, [searchTerm, registros, filtroStatus])

  const handleFiltrarPorStatus = (status: "todos" | "ativo" | "pendente" | "inativo" | "hoje") => {
    setFiltroStatus(status)
    setActiveTab("consulta")
  }

  const handleVisualizarDetalhes = (registro: CadastroRegistro) => {
    setRegistroSelecionado(registro)
    setShowDetalhesModal(true)
  }

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto)
    setNotification({ show: true, type: "success", title: "Copiado", message: "Texto copiado para a area de transferencia" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!numeroSolicitacao.trim()) {
      setNotification({ show: true, type: "warning", title: "Campo obrigatorio", message: "Por favor, informe o numero da solicitacao." })
      return
    }
    if (!emailSolicitante.trim() || !isValidEmail(emailSolicitante)) {
      setNotification({ show: true, type: "warning", title: "E-mail invalido", message: "Por favor, informe um e-mail de solicitante valido." })
      return
    }
    if (!emailUsuarioExterno.trim() || !isValidEmail(emailUsuarioExterno)) {
      setNotification({ show: true, type: "warning", title: "E-mail invalido", message: "Por favor, informe um e-mail de usuario externo valido." })
      return
    }
    if (verificarDuplicidade(emailUsuarioExterno)) {
      setNotification({ show: true, type: "error", title: "Cadastro duplicado", message: "Ja existe um cadastro ativo ou pendente para este e-mail." })
      return
    }

    setIsLoading(true)
    try {
      const apiResponse = await fetch("/api/support/solicitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero_solicitacao: numeroSolicitacao,
          email_solicitante: emailSolicitante,
          email_usuario_externo: emailUsuarioExterno,
          created_by: user?.name || "Suporte",
        }),
      })

      const apiData = await apiResponse.json()

      if (!apiResponse.ok) {
        if (apiResponse.status === 409) {
          setNotification({ show: true, type: "error", title: "Numero duplicado", message: "Ja existe uma solicitacao cadastrada com este numero." })
          return
        }
        throw new Error(apiData?.error?.message || "Erro ao cadastrar")
      }

      const novoRegistro: CadastroRegistro = {
        id: apiData.data?.id ?? String(Date.now()),
        numeroSolicitacao,
        emailSolicitante,
        emailUsuarioExterno,
        status: "ativo",
        dataCadastro: apiData.data?.created_at ?? new Date().toISOString(),
        cadastradoPor: user?.name || "Suporte",
      }

      setRegistros(prev => [novoRegistro, ...prev])
      addSolicitacao({
        id: novoRegistro.id,
        numeroSolicitacao: novoRegistro.numeroSolicitacao,
        emailSolicitante: novoRegistro.emailSolicitante,
        nomeSolicitante: novoRegistro.emailSolicitante,
        emailUsuarioExterno: novoRegistro.emailUsuarioExterno,
        status: "ativo",
        dataCadastro: novoRegistro.dataCadastro,
        cadastradoPor: novoRegistro.cadastradoPor,
      })

      setNotification({ show: true, type: "success", title: "Cadastro realizado", message: `${emailUsuarioExterno} cadastrado com sucesso.` })
      setNumeroSolicitacao("")
      setEmailSolicitante("")
      setEmailUsuarioExterno("")

    } catch {
      setNotification({ show: true, type: "error", title: "Erro ao cadastrar", message: "Ocorreu um erro. Tente novamente." })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: CadastroRegistro["status"]) => {
    const config = {
      ativo:    { label: "Ativo",    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      inativo:  { label: "Inativo",  className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
      erro:     { label: "Erro",     className: "bg-red-500/10 text-red-600 border-red-500/20" },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  if (pageLoading) {
    return <FullPageLoader message="Carregando painel de suporte..." subMessage="Preparando recursos e dados" />
  }

  // Formulario preenchido parcialmente — mostra preview lateral quando todos os 3 campos tiverem valor
  const formCompleto = numeroSolicitacao.trim() && emailSolicitante.trim() && emailUsuarioExterno.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Painel de Suporte" />

      <main className="container max-w-7xl mx-auto px-4 md:px-6 py-8 pb-20">
        <BreadcrumbNav
          items={[{ label: "Inicio", href: "/" }, { label: "Suporte" }]}
          dashboardLink="/suporte"
        />

        {/* ── Cards de Metricas (3 cards, sem Pendentes) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

          {/* Total */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleFiltrarPorStatus("todos")}
            onKeyDown={(e) => e.key === "Enter" && handleFiltrarPorStatus("todos")}
            className={`bg-[#EBF3FB] rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group ${filtroStatus === "todos" ? "ring-2 ring-[#0066CC]" : ""}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="h-13 w-13 rounded-2xl bg-[#0066CC] flex items-center justify-center p-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#0066CC] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-4xl font-bold text-foreground leading-none mb-1">{stats.total}</p>
            <p className="text-sm text-muted-foreground mb-4">Total de Cadastros</p>
            <div className="h-1.5 w-full bg-[#0066CC]/15 rounded-full overflow-hidden">
              <div className="h-full bg-[#0066CC] rounded-full" style={{ width: "100%" }} />
            </div>
          </div>

          {/* Ativos */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleFiltrarPorStatus("ativo")}
            onKeyDown={(e) => e.key === "Enter" && handleFiltrarPorStatus("ativo")}
            className={`bg-green-50 rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group ${filtroStatus === "ativo" ? "ring-2 ring-green-500" : ""}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="h-13 w-13 rounded-2xl bg-green-500 flex items-center justify-center p-3">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-4xl font-bold text-foreground leading-none mb-1">{stats.ativos}</p>
            <p className="text-sm text-muted-foreground mb-4">Usuarios Ativos</p>
            <div className="h-1.5 w-full bg-green-500/15 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pctAtivos}%` }} />
            </div>
            <p className="text-xs text-green-700 mt-1.5">{pctAtivos}% do total</p>
          </div>

          {/* Cadastros Hoje */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => handleFiltrarPorStatus("hoje")}
            onKeyDown={(e) => e.key === "Enter" && handleFiltrarPorStatus("hoje")}
            className={`bg-[#EBF3FB] rounded-2xl p-6 cursor-pointer hover:shadow-md transition-all group ${filtroStatus === "hoje" ? "ring-2 ring-[#0066CC]" : ""}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="h-13 w-13 rounded-2xl bg-[#00A99D] flex items-center justify-center p-3">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#00A99D] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-4xl font-bold text-foreground leading-none mb-1">{stats.hoje}</p>
            <p className="text-sm text-muted-foreground mb-4">Cadastros Hoje</p>
            <div className="h-1.5 w-full bg-[#00A99D]/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00A99D] rounded-full"
                style={{ width: stats.total > 0 ? `${Math.round((stats.hoje / stats.total) * 100)}%` : "0%" }}
              />
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-11">
            <TabsTrigger value="cadastrar" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Novo Cadastro
            </TabsTrigger>
            <TabsTrigger value="consulta" className="gap-2">
              <Search className="h-4 w-4" />
              Consulta
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Historico
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Novo Cadastro ── */}
          <TabsContent value="cadastrar">
            <div className={`grid gap-6 ${formCompleto ? "lg:grid-cols-5" : "grid-cols-1 max-w-2xl"}`}>

              {/* Formulario */}
              <Card className={`bg-card/50 backdrop-blur-sm border shadow-sm ${formCompleto ? "lg:col-span-3" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Cadastro de Usuario</CardTitle>
                      <CardDescription>Registre novos usuarios para receber compartilhamentos</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5 pt-2">

                    {/* Numero da Solicitacao */}
                    <div className="space-y-1.5">
                      <Label htmlFor="numeroSolicitacao" className="font-medium flex items-center gap-2">
                        <Hash className="h-4 w-4 text-[#0047BB]" />
                        Numero da Solicitacao
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="numeroSolicitacao"
                        type="text"
                        placeholder="Ex: SOL-2024-001234"
                        value={numeroSolicitacao}
                        onChange={(e) => setNumeroSolicitacao(e.target.value)}
                        className="h-11"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">Numero do chamado que originou este cadastro</p>
                    </div>

                    {/* Grid dos dois emails */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* E-mail Solicitante */}
                      <div className="space-y-1.5">
                        <Label htmlFor="emailSolicitante" className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-[#00A99D]" />
                          E-mail do Solicitante
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="emailSolicitante"
                          type="email"
                          placeholder="colaborador@petrobras.com.br"
                          value={emailSolicitante}
                          onChange={(e) => setEmailSolicitante(e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Colaborador Petrobras que solicitou</p>
                      </div>

                      {/* E-mail Usuario Externo */}
                      <div className="space-y-1.5">
                        <Label htmlFor="emailUsuarioExterno" className="font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#FDB913]" />
                          E-mail do Usuario Externo
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="emailUsuarioExterno"
                          type="email"
                          placeholder="usuario@empresa.com.br"
                          value={emailUsuarioExterno}
                          onChange={(e) => setEmailUsuarioExterno(e.target.value)}
                          className="h-11"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Quem tera acesso aos compartilhamentos</p>
                      </div>
                    </div>

                    {/* Alerta de rastreabilidade */}
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                        Este cadastro sera registrado com seu usuario{" "}
                        <span className="font-medium">({user?.email || "suporte@petrobras.com.br"})</span>{" "}
                        para fins de auditoria e rastreabilidade.
                      </p>
                    </div>

                    {/* Botao */}
                    <div className="flex justify-end pt-1">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white font-semibold px-8 shadow-md min-w-[180px]"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cadastrando...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Cadastrar Usuario
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Preview lateral — aparece apenas quando formulario esta completo */}
              {formCompleto && (
                <div className="lg:col-span-2 space-y-4">
                  <Card className="border-[#0066CC]/20 bg-[#EBF3FB]/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base text-[#0047BB] flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Pre-visualizacao do Cadastro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Numero */}
                      <div className="flex items-center gap-3 p-3 bg-white/70 dark:bg-background/50 rounded-xl border">
                        <Hash className="h-4 w-4 text-[#0047BB] flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Numero da Solicitacao</p>
                          <p className="font-mono font-semibold text-[#0047BB] text-sm">{numeroSolicitacao}</p>
                        </div>
                      </div>

                      {/* Solicitante */}
                      {emailSolicitante && (
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full ${getAvatarColor(emailSolicitante)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(emailSolicitante)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Solicitante (interno)</p>
                            <p className="text-sm font-medium text-foreground truncate">{emailSolicitante}</p>
                          </div>
                        </div>
                      )}

                      <ChevronRight className="h-4 w-4 text-muted-foreground mx-auto" />

                      {/* Externo */}
                      {emailUsuarioExterno && (
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-full ${getAvatarColor(emailUsuarioExterno)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {getInitials(emailUsuarioExterno)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Usuario externo</p>
                            <p className="text-sm font-medium text-foreground truncate">{emailUsuarioExterno}</p>
                          </div>
                        </div>
                      )}

                      <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10" variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        Sera cadastrado como Ativo
                      </Badge>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Consulta ── */}
          <TabsContent value="consulta" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Consulta de Usuarios</CardTitle>
                      <CardDescription>Visualize todos os usuarios cadastrados</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setFiltroStatus("todos"); setSearchTerm("") }}
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Limpar Filtros
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Barra de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por solicitacao ou e-mail..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-11"
                  />
                </div>

                {/* Filtros rapidos */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "todos",   label: `Todos (${stats.total})` },
                    { key: "ativo",   label: `Ativos (${stats.ativos})` },
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={filtroStatus === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFiltroStatus(key as typeof filtroStatus)}
                      className={filtroStatus === key ? "bg-[#0047BB] hover:bg-[#003A99]" : ""}
                    >
                      {label}
                    </Button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Exibindo {registrosFiltrados.length} de {registros.length} registros
                </p>

                {/* Lista */}
                <div className="space-y-2">
                  {registrosFiltrados.length === 0 ? (
                    <div className="text-center py-16">
                      <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="font-medium text-muted-foreground">Nenhum usuario encontrado</p>
                      <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
                    </div>
                  ) : (
                    registrosFiltrados.map((registro) => (
                      <div
                        key={registro.id}
                        className="flex items-center gap-4 p-4 bg-background/50 border rounded-xl hover:bg-background/80 hover:shadow-sm transition-all cursor-pointer group"
                        onClick={() => handleVisualizarDetalhes(registro)}
                      >
                        {/* Avatar */}
                        <div className={`h-10 w-10 rounded-full ${getAvatarColor(registro.emailUsuarioExterno)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {getInitials(registro.emailUsuarioExterno)}
                        </div>

                        {/* Info principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-[#0047BB] bg-[#EBF3FB] px-2 py-0.5 rounded-full">
                              {registro.numeroSolicitacao}
                            </span>
                            {getStatusBadge(registro.status)}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">{registro.emailUsuarioExterno}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Solicitante: {registro.emailSolicitante}
                          </p>
                        </div>

                        {/* Data + seta */}
                        <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {new Date(registro.dataCadastro).toLocaleDateString("pt-BR")}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Historico ── */}
          <TabsContent value="historico" className="space-y-4">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Historico de Cadastros</CardTitle>
                      <CardDescription>Registro cronologico de atividades</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {registros.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium text-muted-foreground">Nenhum historico encontrado</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Linha vertical da timeline */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" aria-hidden />

                    <div className="space-y-0">
                      {registros.map((registro, index) => (
                        <div key={registro.id} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Icone da timeline */}
                          <div className="relative z-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00A99D]/20 to-[#0047BB]/20 border-2 border-background flex items-center justify-center shadow-sm">
                              <UserPlus className="h-4 w-4 text-[#0047BB]" />
                            </div>
                          </div>

                          {/* Conteudo */}
                          <div className="flex-1 min-w-0 pt-1.5 pb-2 bg-background/40 border rounded-xl px-4 hover:bg-background/70 transition-colors">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-sm text-foreground">Novo cadastro</span>
                              {getStatusBadge(registro.status)}
                              <span className="font-mono text-xs text-[#0047BB]">{registro.numeroSolicitacao}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              <span className="font-medium text-foreground">{registro.emailUsuarioExterno}</span>{" "}
                              cadastrado por <span className="font-medium text-foreground">{registro.cadastradoPor}</span>
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(registro.dataCadastro).toLocaleString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ScrollToTop />

      <NotificationModal
        open={notification.show}
        onOpenChange={(show) => setNotification({ ...notification, show })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Modal de Detalhes */}
      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              Detalhes do Usuario
            </DialogTitle>
            <DialogDescription>Informacoes completas do cadastro</DialogDescription>
          </DialogHeader>

          {registroSelecionado && (
            <div className="space-y-4 py-2">
              {/* Header com numero e status */}
              <div className="flex items-center justify-between p-3 bg-[#EBF3FB] rounded-xl">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#0047BB]" />
                  <span className="font-mono font-bold text-[#0047BB]">{registroSelecionado.numeroSolicitacao}</span>
                </div>
                {getStatusBadge(registroSelecionado.status)}
              </div>

              {/* Usuarios */}
              <div className="space-y-3">
                {[
                  { label: "Usuario Externo", value: registroSelecionado.emailUsuarioExterno, icon: Mail, color: "text-[#00A99D]" },
                  { label: "Solicitante", value: registroSelecionado.emailSolicitante, icon: User, color: "text-[#0047BB]" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between gap-3 bg-muted/40 rounded-xl p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium text-foreground truncate">{value}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => handleCopiar(value)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Cadastrado por</p>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-sm font-medium truncate">{registroSelecionado.cadastradoPor}</span>
                  </div>
                </div>
                <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Data de Cadastro</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{new Date(registroSelecionado.dataCadastro).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {registroSelecionado.observacao && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Observacao</p>
                  <p className="text-sm text-amber-700">{registroSelecionado.observacao}</p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <Button variant="outline" onClick={() => setShowDetalhesModal(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
