"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
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
  Clock, 
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
  LogIn,
  ArrowLeft,
  X,
  Calendar,
  Building,
  Phone,
  Copy,
  ExternalLink
} from "lucide-react"
import { FullPageLoader } from "@/components/ui/full-page-loader"

// Tipo para registro de cadastro
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

// Dados de demonstracao
const DEMO_REGISTROS: CadastroRegistro[] = [
  {
    id: "1",
    numeroSolicitacao: "SOL-2024-001234",
    emailSolicitante: "maria.santos@petrobras.com.br",
    emailUsuarioExterno: "fornecedor@empresa.com.br",
    status: "ativo",
    dataCadastro: "2024-01-15T10:30:00",
    cadastradoPor: "Suporte Demo",
  },
  {
    id: "2",
    numeroSolicitacao: "SOL-2024-001235",
    emailSolicitante: "joao.silva@petrobras.com.br",
    emailUsuarioExterno: "parceiro@parceiro.com.br",
    status: "ativo",
    dataCadastro: "2024-01-14T14:20:00",
    cadastradoPor: "Suporte Demo",
  },
  {
    id: "3",
    numeroSolicitacao: "SOL-2024-001236",
    emailSolicitante: "ana.costa@petrobras.com.br",
    emailUsuarioExterno: "cliente@cliente.com.br",
    status: "pendente",
    dataCadastro: "2024-01-13T09:15:00",
    cadastradoPor: "Suporte Demo",
  },
]

export default function SuportePage() {
  const { user, isAuthenticated, setAuth } = useAuthStore()
  const router = useRouter()
  
  // Estado de carregamento inicial da pagina
  const [pageLoading, setPageLoading] = useState(true)
  
  // Estado do formulario
  const [numeroSolicitacao, setNumeroSolicitacao] = useState("")
  const [emailSolicitante, setEmailSolicitante] = useState("")
  const [emailUsuarioExterno, setEmailUsuarioExterno] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estado dos registros
  const [registros, setRegistros] = useState<CadastroRegistro[]>(DEMO_REGISTROS)
  const [registrosFiltrados, setRegistrosFiltrados] = useState<CadastroRegistro[]>(DEMO_REGISTROS)
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "pendente" | "inativo" | "hoje">("todos")
  const [activeTab, setActiveTab] = useState("cadastrar")
  const [registroSelecionado, setRegistroSelecionado] = useState<CadastroRegistro | null>(null)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  
  // Notificacao
  const [notification, setNotification] = useState<{
    show: boolean
    type: "success" | "error" | "warning" | "info"
    title: string
    message: string
  }>({
    show: false,
    type: "info",
    title: "",
    message: "",
  })

  // Verifica se usuario tem permissao de suporte
  const hasSuportAccess = user?.userType === "support" || user?.userType === "supervisor"
  const isDemoMode = !isAuthenticated || !hasSuportAccess

  // Estatisticas
  const stats = {
    total: registros.length,
    ativos: registros.filter(r => r.status === "ativo").length,
    pendentes: registros.filter(r => r.status === "pendente").length,
    hoje: registros.filter(r => {
      const hoje = new Date().toDateString()
      return new Date(r.dataCadastro).toDateString() === hoje
    }).length,
  }

  // Validacao de email
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Verificar duplicidade
  const verificarDuplicidade = (email: string) => {
    return registros.some(
      r => r.emailUsuarioExterno.toLowerCase() === email.toLowerCase() && 
           (r.status === "ativo" || r.status === "pendente")
    )
  }

  // Simular carregamento inicial da pagina
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false)
    }, 1500) // 1.5 segundos de carregamento
    return () => clearTimeout(timer)
  }, [])

  // Handler de busca e filtro
  useEffect(() => {
    let filtrados = registros

    // Aplicar filtro de status
    if (filtroStatus === "ativo") {
      filtrados = filtrados.filter(r => r.status === "ativo")
    } else if (filtroStatus === "pendente") {
      filtrados = filtrados.filter(r => r.status === "pendente")
    } else if (filtroStatus === "inativo") {
      filtrados = filtrados.filter(r => r.status === "inativo")
    } else if (filtroStatus === "hoje") {
      const hoje = new Date().toDateString()
      filtrados = filtrados.filter(r => new Date(r.dataCadastro).toDateString() === hoje)
    }

    // Aplicar busca por termo
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

  // Funcao para filtrar por status e ir para aba de consulta
  const handleFiltrarPorStatus = (status: "todos" | "ativo" | "pendente" | "inativo" | "hoje") => {
    setFiltroStatus(status)
    setActiveTab("consulta")
  }

  // Funcao para visualizar detalhes do registro
  const handleVisualizarDetalhes = (registro: CadastroRegistro) => {
    setRegistroSelecionado(registro)
    setShowDetalhesModal(true)
  }

  // Funcao para copiar texto
  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto)
    setNotification({
      show: true,
      type: "success",
      title: "Copiado",
      message: "Texto copiado para a area de transferencia",
    })
  }

  // Login de demonstracao para suporte
  const handleDemoLogin = () => {
    setAuth(
      {
        id: "demo-support",
        email: "suporte@petrobras.com.br",
        name: "Suporte Demo",
        userType: "support",
        department: "Atendimento",
      },
      "demo_support_token",
      "demo_support_refresh"
    )
    setNotification({
      show: true,
      type: "success",
      title: "Login realizado",
      message: "Voce esta logado como usuario de suporte para demonstracao.",
    })
  }

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validacoes
    if (!numeroSolicitacao.trim()) {
      setNotification({
        show: true,
        type: "warning",
        title: "Campo obrigatorio",
        message: "Por favor, informe o numero da solicitacao.",
      })
      return
    }

    if (!emailSolicitante.trim() || !isValidEmail(emailSolicitante)) {
      setNotification({
        show: true,
        type: "warning",
        title: "E-mail invalido",
        message: "Por favor, informe um e-mail de solicitante valido.",
      })
      return
    }

    if (!emailUsuarioExterno.trim() || !isValidEmail(emailUsuarioExterno)) {
      setNotification({
        show: true,
        type: "warning",
        title: "E-mail invalido",
        message: "Por favor, informe um e-mail de usuario externo valido.",
      })
      return
    }

    // Verificar duplicidade
    if (verificarDuplicidade(emailUsuarioExterno)) {
      setNotification({
        show: true,
        type: "error",
        title: "Cadastro duplicado",
        message: "Ja existe um cadastro ativo ou pendente para este e-mail de usuario externo.",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simular chamada API
      await new Promise(resolve => setTimeout(resolve, 2000))

      const novoRegistro: CadastroRegistro = {
        id: String(Date.now()),
        numeroSolicitacao,
        emailSolicitante,
        emailUsuarioExterno,
        status: "ativo",
        dataCadastro: new Date().toISOString(),
        cadastradoPor: user?.name || "Suporte Demo",
      }

      setRegistros(prev => [novoRegistro, ...prev])

      setNotification({
        show: true,
        type: "success",
        title: "Cadastro realizado com sucesso",
        message: `Usuario externo ${emailUsuarioExterno} foi cadastrado e ja pode receber compartilhamentos.`,
      })

      // Limpar formulario
      setNumeroSolicitacao("")
      setEmailSolicitante("")
      setEmailUsuarioExterno("")

    } catch {
      setNotification({
        show: true,
        type: "error",
        title: "Erro ao cadastrar",
        message: "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: CadastroRegistro["status"]) => {
    const config = {
      ativo: { label: "Ativo", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
      pendente: { label: "Pendente", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      inativo: { label: "Inativo", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
      erro: { label: "Erro", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    }
    const { label, className } = config[status]
    return <Badge variant="outline" className={className}>{label}</Badge>
  }

  // Mostra loader enquanto a pagina carrega
  if (pageLoading) {
    return (
      <FullPageLoader
        message="Carregando painel de suporte..."
        subMessage="Preparando recursos e dados"
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <AppHeader subtitle="Painel de Suporte - Cadastro de Usuarios" />

      <main className="container max-w-7xl mx-auto px-6 py-10 pb-20">
        <BreadcrumbNav
          items={[{ label: "Inicio", href: "/" }, { label: "Suporte" }, { label: "Cadastro de Usuarios" }]}
          dashboardLink="/suporte"
        />

        {/* Banner de modo demo se nao autenticado como suporte */}
        {isDemoMode && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">Modo Demonstracao</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Voce esta visualizando a pagina de suporte em modo demonstracao. 
                    {!isAuthenticated ? " Faca login para ter acesso completo." : " Seu perfil nao tem permissao de suporte."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/")}
                  className="gap-2 border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  size="sm"
                  onClick={handleDemoLogin}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Entrar como Suporte (Demo)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Metricas - Clicaveis para filtrar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className={`bg-gradient-to-br from-card to-card/80 border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] ${filtroStatus === "todos" ? "ring-2 ring-[#0047BB]" : ""}`}
            onClick={() => handleFiltrarPorStatus("todos")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0047BB]/10 to-[#0047BB]/5 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#0047BB]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Cadastros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-gradient-to-br from-card to-card/80 border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] ${filtroStatus === "ativo" ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => handleFiltrarPorStatus("ativo")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.ativos}</p>
                  <p className="text-sm text-muted-foreground">Usuarios Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-gradient-to-br from-card to-card/80 border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] ${filtroStatus === "pendente" ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => handleFiltrarPorStatus("pendente")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.pendentes}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`bg-gradient-to-br from-card to-card/80 border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-[1.02] ${filtroStatus === "hoje" ? "ring-2 ring-[#00A99D]" : ""}`}
            onClick={() => handleFiltrarPorStatus("hoje")}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00A99D]/10 to-[#00A99D]/5 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-[#00A99D]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.hoje}</p>
                  <p className="text-sm text-muted-foreground">Cadastros Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3 h-12">
            <TabsTrigger value="cadastrar" className="gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Novo Cadastro
            </TabsTrigger>
            <TabsTrigger value="consulta" className="gap-2 text-base">
              <Search className="h-4 w-4" />
              Consulta
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2 text-base">
              <History className="h-4 w-4" />
              Historico
            </TabsTrigger>
          </TabsList>

          {/* Tab: Novo Cadastro */}
          <TabsContent value="cadastrar" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center shadow-lg">
                    <UserPlus className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Cadastro de Usuario</CardTitle>
                    <CardDescription className="text-base">
                      Registre novos usuarios para receber compartilhamentos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Numero da Solicitacao */}
                  <div className="space-y-2">
                    <Label htmlFor="numeroSolicitacao" className="text-base font-medium flex items-center gap-2">
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
                      className="h-12 text-base"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      Informe o numero do chamado ou solicitacao que originou este cadastro
                    </p>
                  </div>

                  {/* E-mail do Solicitante */}
                  <div className="space-y-2">
                    <Label htmlFor="emailSolicitante" className="text-base font-medium flex items-center gap-2">
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
                      className="h-12 text-base"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      E-mail do colaborador Petrobras que solicitou o cadastro
                    </p>
                  </div>

                  {/* E-mail do Usuario */}
                  <div className="space-y-2">
                    <Label htmlFor="emailUsuarioExterno" className="text-base font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#FDB913]" />
                      E-mail do Usuario
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emailUsuarioExterno"
                      type="email"
                      placeholder="usuario@empresa.com.br"
                      value={emailUsuarioExterno}
                      onChange={(e) => setEmailUsuarioExterno(e.target.value)}
                      className="h-12 text-base"
                      disabled={isLoading}
                    />
                    <p className="text-sm text-muted-foreground">
                      E-mail do usuario que tera acesso aos compartilhamentos
                    </p>
                  </div>

                  {/* Alerta de seguranca */}
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium text-blue-800 dark:text-blue-400">Rastreabilidade</p>
                        <p className="text-sm text-blue-700 dark:text-blue-500">
                          Este cadastro sera registrado com seu usuario ({user?.email || "suporte@petrobras.com.br"}) para fins de auditoria e rastreabilidade.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botao Submit */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      size="lg"
                      className="bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white font-semibold px-8 text-base shadow-lg hover:shadow-xl min-w-[200px]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-5 w-5 mr-2" />
                          Cadastrar Usuario
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Consulta */}
          <TabsContent value="consulta" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center shadow-lg">
                      <Search className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Consulta de Usuarios</CardTitle>
                      <CardDescription className="text-base">
                        Visualize todos os usuarios cadastrados no sistema
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {filtroStatus !== "todos" && (
                      <Badge variant="outline" className="bg-[#0047BB]/10 text-[#0047BB] border-[#0047BB]/30 px-3 py-1">
                        Filtro: {filtroStatus === "ativo" ? "Ativos" : filtroStatus === "pendente" ? "Pendentes" : filtroStatus === "hoje" ? "Hoje" : "Inativos"}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFiltroStatus("todos")
                        setSearchTerm("")
                      }}
                      className="gap-2"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Barra de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por solicitacao, e-mail do solicitante ou usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base"
                  />
                </div>

                {/* Filtros rapidos */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filtroStatus === "todos" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("todos")}
                    className={filtroStatus === "todos" ? "bg-[#0047BB]" : ""}
                  >
                    Todos ({stats.total})
                  </Button>
                  <Button
                    variant={filtroStatus === "ativo" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("ativo")}
                    className={filtroStatus === "ativo" ? "bg-emerald-600" : ""}
                  >
                    Ativos ({stats.ativos})
                  </Button>
                  <Button
                    variant={filtroStatus === "pendente" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltroStatus("pendente")}
                    className={filtroStatus === "pendente" ? "bg-amber-600" : ""}
                  >
                    Pendentes ({stats.pendentes})
                  </Button>
                </div>

                {/* Contador de resultados */}
                <div className="text-sm text-muted-foreground">
                  Exibindo {registrosFiltrados.length} de {registros.length} usuarios
                </div>

                {/* Lista de usuarios */}
                <div className="space-y-3">
                  {registrosFiltrados.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">Nenhum usuario encontrado</p>
                      <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca</p>
                    </div>
                  ) : (
                    registrosFiltrados.map((registro) => (
                      <div
                        key={registro.id}
                        className="bg-background/50 border rounded-xl p-4 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-[#0047BB]">
                                {registro.numeroSolicitacao}
                              </span>
                              {getStatusBadge(registro.status)}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-shrink-0">Solicitante: </span>
                                <span className="text-foreground truncate">{registro.emailSolicitante}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-shrink-0">Usuario: </span>
                                <span className="text-foreground truncate">{registro.emailUsuarioExterno}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Cadastrado por: {registro.cadastradoPor}</span>
                              <span>|</span>
                              <span>{new Date(registro.dataCadastro).toLocaleString("pt-BR")}</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="flex-shrink-0 hover:bg-[#0047BB]/10"
                            onClick={() => handleVisualizarDetalhes(registro)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historico */}
          <TabsContent value="historico" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center shadow-lg">
                      <FileText className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Historico de Cadastros</CardTitle>
                      <CardDescription className="text-base">
                        Registro de atividades e alteracoes
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFiltroStatus("todos")
                      setSearchTerm("")
                    }}
                    className="gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Lista de historico/atividades */}
                <div className="space-y-3">
                  {registros.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">Nenhum historico encontrado</p>
                    </div>
                  ) : (
                    registros.map((registro) => (
                      <div
                        key={registro.id}
                        className="bg-background/50 border rounded-xl p-4 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#00A99D]/20 to-[#0047BB]/20 flex items-center justify-center flex-shrink-0">
                            <UserPlus className="h-5 w-5 text-[#0047BB]" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground">Novo cadastro realizado</span>
                              {getStatusBadge(registro.status)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Usuario <span className="font-medium text-foreground">{registro.emailUsuarioExterno}</span> foi cadastrado por{" "}
                              <span className="font-medium text-foreground">{registro.cadastradoPor}</span>
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">{registro.numeroSolicitacao}</span>
                              <span>|</span>
                              <span>{new Date(registro.dataCadastro).toLocaleString("pt-BR")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

      {/* Modal de Detalhes do Usuario */}
      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0047BB] to-[#00A99D] flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              Detalhes do Usuario
            </DialogTitle>
            <DialogDescription>
              Informacoes completas do cadastro
            </DialogDescription>
          </DialogHeader>

          {registroSelecionado && (
            <div className="space-y-6 py-4">
              {/* Status e Numero da Solicitacao */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-lg font-semibold text-[#0047BB]">
                    {registroSelecionado.numeroSolicitacao}
                  </span>
                </div>
                {getStatusBadge(registroSelecionado.status)}
              </div>

              {/* Informacoes do Usuario */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Usuario Cadastrado
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-[#00A99D]" />
                      <span className="text-foreground font-medium">
                        {registroSelecionado.emailUsuarioExterno}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopiar(registroSelecionado.emailUsuarioExterno)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Solicitante
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-[#0047BB]" />
                      <span className="text-foreground font-medium">
                        {registroSelecionado.emailSolicitante}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopiar(registroSelecionado.emailSolicitante)}
                      className="h-8 w-8"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Cadastrado por
                    </h4>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      <span className="text-foreground text-sm font-medium">
                        {registroSelecionado.cadastradoPor}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Data de Cadastro
                    </h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-sm font-medium">
                        {new Date(registroSelecionado.dataCadastro).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                </div>

                {registroSelecionado.observacao && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                      Observacao
                    </h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {registroSelecionado.observacao}
                    </p>
                  </div>
                )}
              </div>

              {/* Acoes */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetalhesModal(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
