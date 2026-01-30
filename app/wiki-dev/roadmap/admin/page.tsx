"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import useSWR, { mutate } from "swr"
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, Loader2, LogOut,
  Target, Calendar, Users, CheckCircle2, Clock, Circle, AlertTriangle,
  Flag, BarChart3, Settings, ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Credenciais fixas
const ADMIN_USER = "admin"
const ADMIN_PASS = "petrobras2026"

// Fetcher para SWR
const fetcher = (url: string) => fetch(url).then(res => res.json())

// Cores disponiveis para fases
const coresDisponiveis = [
  { value: "from-green-500 to-emerald-500", label: "Verde", preview: "bg-gradient-to-r from-green-500 to-emerald-500" },
  { value: "from-purple-500 to-indigo-500", label: "Roxo", preview: "bg-gradient-to-r from-purple-500 to-indigo-500" },
  { value: "from-amber-500 to-orange-500", label: "Laranja", preview: "bg-gradient-to-r from-amber-500 to-orange-500" },
  { value: "from-blue-500 to-cyan-500", label: "Azul", preview: "bg-gradient-to-r from-blue-500 to-cyan-500" },
  { value: "from-rose-500 to-pink-500", label: "Rosa", preview: "bg-gradient-to-r from-rose-500 to-pink-500" },
  { value: "from-slate-400 to-slate-500", label: "Cinza", preview: "bg-gradient-to-r from-slate-400 to-slate-500" },
]

// Tipos de entrega disponiveis
const tiposEntrega = ["Feature", "API", "Integracao", "Config", "UI", "Backend", "Database", "Security", "Deploy", "Docs"]

interface Entrega {
  id?: number
  fase_id: number
  nome: string
  status: "concluido" | "em_progresso" | "pendente"
  tipo: string
  data_prevista: string | null
  data_conclusao: string | null
  notas: string | null
  bloqueios: string | null
  ordem: number
  depende_de?: number[]
}

interface Fase {
  id?: number
  nome: string
  periodo: string
  data_inicio: string
  data_fim: string
  status: "concluido" | "em_progresso" | "pendente"
  progresso: number
  cor: string
  descricao: string | null
  responsavel: string | null
  risco: "baixo" | "medio" | "alto"
  ordem: number
  depende_de?: number[]
  entregas?: Entrega[]
}

interface Marco {
  id?: number
  nome: string
  data: string
  status: "concluido" | "pendente"
  ordem: number
}

interface BurndownEntry {
  id?: number
  semana: string
  planejado: number
  real: number | null
  entregas: number | null
  ordem: number
}

// Componente de Login
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simular delay de autenticacao
    await new Promise(resolve => setTimeout(resolve, 500))

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem("roadmap_admin_auth", "true")
      onLogin()
    } else {
      setError("Usuario ou senha incorretos")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl w-fit">
            <Settings className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Admin do Roadmap</CardTitle>
          <CardDescription>Entre com suas credenciais para gerenciar o roadmap</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuario"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/wiki-dev/roadmap" className="text-sm text-muted-foreground hover:underline">
              Voltar para o Roadmap
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente principal do Admin
function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("fases")
  
  // Estados para dialogs
  const [faseDialog, setFaseDialog] = useState<{ open: boolean; fase: Partial<Fase> | null; mode: "create" | "edit" }>({ open: false, fase: null, mode: "create" })
  const [entregaDialog, setEntregaDialog] = useState<{ open: boolean; entrega: Partial<Entrega> | null; faseId: number | null; mode: "create" | "edit" }>({ open: false, entrega: null, faseId: null, mode: "create" })
  const [marcoDialog, setMarcoDialog] = useState<{ open: boolean; marco: Partial<Marco> | null; mode: "create" | "edit" }>({ open: false, marco: null, mode: "create" })
  const [burndownDialog, setBurndownDialog] = useState<{ open: boolean; entry: Partial<BurndownEntry> | null; mode: "create" | "edit" }>({ open: false, entry: null, mode: "create" })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: number | null; name: string }>({ open: false, type: "", id: null, name: "" })
  
  // Estados para loading
  const [saving, setSaving] = useState(false)
  
  // Estados para fases expandidas
  const [expandedFases, setExpandedFases] = useState<number[]>([])

  // Dados do SWR
  const { data: fases, isLoading: loadingFases } = useSWR<Fase[]>("/api/roadmap/fases", fetcher)
  const { data: marcos, isLoading: loadingMarcos } = useSWR<Marco[]>("/api/roadmap/marcos", fetcher)
  const { data: burndown, isLoading: loadingBurndown } = useSWR<BurndownEntry[]>("/api/roadmap/burndown", fetcher)
  const { data: config } = useSWR<{ progresso_geral: number }>("/api/roadmap/config", fetcher)

  const handleLogout = () => {
    sessionStorage.removeItem("roadmap_admin_auth")
    router.refresh()
  }

  // CRUD Fases
  const saveFase = async () => {
    if (!faseDialog.fase) return
    setSaving(true)
    try {
      const url = faseDialog.mode === "create" ? "/api/roadmap/fases" : `/api/roadmap/fases/${faseDialog.fase.id}`
      const method = faseDialog.mode === "create" ? "POST" : "PUT"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(faseDialog.fase) })
      mutate("/api/roadmap/fases")
      setFaseDialog({ open: false, fase: null, mode: "create" })
    } catch (error) {
      console.error("Erro ao salvar fase:", error)
    }
    setSaving(false)
  }

  // CRUD Entregas
  const saveEntrega = async () => {
    if (!entregaDialog.entrega) return
    setSaving(true)
    try {
      const url = entregaDialog.mode === "create" ? "/api/roadmap/entregas" : `/api/roadmap/entregas/${entregaDialog.entrega.id}`
      const method = entregaDialog.mode === "create" ? "POST" : "PUT"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(entregaDialog.entrega) })
      mutate("/api/roadmap/fases")
      setEntregaDialog({ open: false, entrega: null, faseId: null, mode: "create" })
    } catch (error) {
      console.error("Erro ao salvar entrega:", error)
    }
    setSaving(false)
  }

  // CRUD Marcos
  const saveMarco = async () => {
    if (!marcoDialog.marco) return
    setSaving(true)
    try {
      const url = marcoDialog.mode === "create" ? "/api/roadmap/marcos" : `/api/roadmap/marcos/${marcoDialog.marco.id}`
      const method = marcoDialog.mode === "create" ? "POST" : "PUT"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(marcoDialog.marco) })
      mutate("/api/roadmap/marcos")
      setMarcoDialog({ open: false, marco: null, mode: "create" })
    } catch (error) {
      console.error("Erro ao salvar marco:", error)
    }
    setSaving(false)
  }

  // CRUD Burndown
  const saveBurndown = async () => {
    if (!burndownDialog.entry) return
    setSaving(true)
    try {
      const url = burndownDialog.mode === "create" ? "/api/roadmap/burndown" : `/api/roadmap/burndown/${burndownDialog.entry.id}`
      const method = burndownDialog.mode === "create" ? "POST" : "PUT"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(burndownDialog.entry) })
      mutate("/api/roadmap/burndown")
      setBurndownDialog({ open: false, entry: null, mode: "create" })
    } catch (error) {
      console.error("Erro ao salvar burndown:", error)
    }
    setSaving(false)
  }

  // Delete generico
  const handleDelete = async () => {
    if (!deleteDialog.id) return
    setSaving(true)
    try {
      let url = ""
      switch (deleteDialog.type) {
        case "fase": url = `/api/roadmap/fases/${deleteDialog.id}`; break
        case "entrega": url = `/api/roadmap/entregas/${deleteDialog.id}`; break
        case "marco": url = `/api/roadmap/marcos/${deleteDialog.id}`; break
        case "burndown": url = `/api/roadmap/burndown/${deleteDialog.id}`; break
      }
      await fetch(url, { method: "DELETE" })
      mutate("/api/roadmap/fases")
      mutate("/api/roadmap/marcos")
      mutate("/api/roadmap/burndown")
      setDeleteDialog({ open: false, type: "", id: null, name: "" })
    } catch (error) {
      console.error("Erro ao deletar:", error)
    }
    setSaving(false)
  }

  // Atualizar progresso geral
  const updateProgressoGeral = async (progresso: number) => {
    await fetch("/api/roadmap/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progresso_geral: progresso }) })
    mutate("/api/roadmap/config")
  }

  // Toggle fase expandida
  const toggleFaseExpanded = (faseId: number) => {
    setExpandedFases(prev => prev.includes(faseId) ? prev.filter(id => id !== faseId) : [...prev, faseId])
  }

  // Metricas calculadas
  const metricas = fases ? {
    totalFases: fases.length,
    fasesConcluidas: fases.filter(f => f.status === "concluido").length,
    totalEntregas: fases.reduce((acc, f) => acc + (f.entregas?.length || 0), 0),
    entregasConcluidas: fases.reduce((acc, f) => acc + (f.entregas?.filter(e => e.status === "concluido").length || 0), 0),
  } : { totalFases: 0, fasesConcluidas: 0, totalEntregas: 0, entregasConcluidas: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/wiki-dev/roadmap">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin do Roadmap</h1>
                  <p className="text-sm text-slate-500">Gerenciamento completo do projeto</p>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Metricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas.totalFases}</p>
                <p className="text-sm text-muted-foreground">Fases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas.fasesConcluidas}</p>
                <p className="text-sm text-muted-foreground">Fases Concluidas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metricas.totalEntregas}</p>
                <p className="text-sm text-muted-foreground">Entregas</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{config?.progresso_geral || 0}%</p>
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Geral Slider */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Progresso Geral do Projeto</CardTitle>
            <CardDescription>Arraste para ajustar o progresso geral exibido no roadmap</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={config?.progresso_geral || 0} className="flex-1 h-3" />
              <Input
                type="number"
                min={0}
                max={100}
                value={config?.progresso_geral || 0}
                onChange={(e) => updateProgressoGeral(parseInt(e.target.value) || 0)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="fases" className="gap-2">
              <Target className="h-4 w-4" />
              Fases e Entregas
            </TabsTrigger>
            <TabsTrigger value="marcos" className="gap-2">
              <Flag className="h-4 w-4" />
              Marcos
            </TabsTrigger>
            <TabsTrigger value="burndown" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Burndown
            </TabsTrigger>
          </TabsList>

          {/* Tab Fases */}
          <TabsContent value="fases" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Fases do Projeto</h2>
              <Button onClick={() => setFaseDialog({ open: true, fase: { nome: "", periodo: "", data_inicio: "", data_fim: "", status: "pendente", progresso: 0, cor: "from-slate-400 to-slate-500", descricao: "", responsavel: "", risco: "baixo", ordem: (fases?.length || 0) + 1 }, mode: "create" })} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Fase
              </Button>
            </div>

            {loadingFases ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : fases && fases.length > 0 ? (
              <div className="space-y-4">
                {fases.map((fase) => (
                  <Card key={fase.id} className="overflow-hidden">
                    <div className={`h-2 bg-gradient-to-r ${fase.cor}`} />
                    <Collapsible open={expandedFases.includes(fase.id!)} onOpenChange={() => toggleFaseExpanded(fase.id!)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${fase.cor} flex items-center justify-center text-white font-bold`}>
                              {fase.id}
                            </div>
                            <div>
                              <CardTitle className="text-base">{fase.nome}</CardTitle>
                              <CardDescription>{fase.periodo} - {fase.responsavel}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={fase.status === "concluido" ? "default" : fase.status === "em_progresso" ? "secondary" : "outline"}>
                              {fase.status === "concluido" ? "Concluido" : fase.status === "em_progresso" ? "Em Progresso" : "Pendente"}
                            </Badge>
                            <Badge variant={fase.risco === "alto" ? "destructive" : fase.risco === "medio" ? "secondary" : "outline"}>
                              Risco {fase.risco}
                            </Badge>
                            <span className="text-sm font-medium">{fase.progresso}%</span>
                            <Button variant="ghost" size="icon" onClick={() => setFaseDialog({ open: true, fase: { ...fase }, mode: "edit" })}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ open: true, type: "fase", id: fase.id!, name: fase.nome })}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon">
                                {expandedFases.includes(fase.id!) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="border-t pt-4 mt-2">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-medium">Entregas ({fase.entregas?.length || 0})</p>
                              <Button size="sm" variant="outline" onClick={() => setEntregaDialog({ open: true, entrega: { fase_id: fase.id!, nome: "", status: "pendente", tipo: "Feature", data_prevista: null, data_conclusao: null, notas: null, bloqueios: null, ordem: (fase.entregas?.length || 0) + 1 }, faseId: fase.id!, mode: "create" })} className="gap-1">
                                <Plus className="h-3 w-3" />
                                Entrega
                              </Button>
                            </div>
                            {fase.entregas && fase.entregas.length > 0 ? (
                              <div className="space-y-2">
                                {fase.entregas.map((entrega) => (
                                  <div key={entrega.id} className={`p-3 rounded-lg border flex items-center justify-between ${entrega.status === "concluido" ? "bg-green-50 border-green-200" : entrega.status === "em_progresso" ? "bg-amber-50 border-amber-200" : "bg-slate-50"}`}>
                                    <div className="flex items-center gap-3">
                                      {entrega.status === "concluido" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : entrega.status === "em_progresso" ? <Clock className="h-4 w-4 text-amber-600" /> : <Circle className="h-4 w-4 text-slate-400" />}
                                      <div>
                                        <p className={`text-sm font-medium ${entrega.status === "concluido" ? "line-through text-muted-foreground" : ""}`}>{entrega.nome}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="outline" className="text-xs">{entrega.tipo}</Badge>
                                          {entrega.data_prevista && <span className="text-xs text-muted-foreground">{new Date(entrega.data_prevista).toLocaleDateString("pt-BR")}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEntregaDialog({ open: true, entrega: { ...entrega }, faseId: fase.id!, mode: "edit" })}>
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, type: "entrega", id: entrega.id!, name: entrega.nome })}>
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma entrega cadastrada</p>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma fase cadastrada</p>
                  <Button className="mt-4" onClick={() => setFaseDialog({ open: true, fase: { nome: "", periodo: "", data_inicio: "", data_fim: "", status: "pendente", progresso: 0, cor: "from-slate-400 to-slate-500", descricao: "", responsavel: "", risco: "baixo", ordem: 1 }, mode: "create" })}>
                    Criar primeira fase
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Marcos */}
          <TabsContent value="marcos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Marcos (Milestones)</h2>
              <Button onClick={() => setMarcoDialog({ open: true, marco: { nome: "", data: "", status: "pendente", ordem: (marcos?.length || 0) + 1 }, mode: "create" })} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Marco
              </Button>
            </div>

            {loadingMarcos ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : marcos && marcos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {marcos.map((marco) => (
                  <Card key={marco.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${marco.status === "concluido" ? "bg-green-100" : "bg-slate-100"}`}>
                            <Flag className={`h-5 w-5 ${marco.status === "concluido" ? "text-green-600" : "text-slate-400"}`} />
                          </div>
                          <div>
                            <p className="font-medium">{marco.nome}</p>
                            <p className="text-sm text-muted-foreground">{new Date(marco.data).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMarcoDialog({ open: true, marco: { ...marco }, mode: "edit" })}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, type: "marco", id: marco.id!, name: marco.nome })}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum marco cadastrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Burndown */}
          <TabsContent value="burndown" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Dados do Burndown Chart</h2>
              <Button onClick={() => setBurndownDialog({ open: true, entry: { semana: "", planejado: 100, real: null, entregas: null, ordem: (burndown?.length || 0) + 1 }, mode: "create" })} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Entrada
              </Button>
            </div>

            {loadingBurndown ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : burndown && burndown.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Semana</th>
                        <th className="text-center p-3 text-sm font-medium">Planejado</th>
                        <th className="text-center p-3 text-sm font-medium">Real</th>
                        <th className="text-center p-3 text-sm font-medium">Entregas</th>
                        <th className="text-right p-3 text-sm font-medium">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {burndown.map((entry) => (
                        <tr key={entry.id} className="border-t">
                          <td className="p-3">{entry.semana}</td>
                          <td className="p-3 text-center">{entry.planejado}%</td>
                          <td className="p-3 text-center">{entry.real ?? "-"}%</td>
                          <td className="p-3 text-center">{entry.entregas ?? "-"}</td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBurndownDialog({ open: true, entry: { ...entry }, mode: "edit" })}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, type: "burndown", id: entry.id!, name: entry.semana })}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum dado de burndown cadastrado</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialog Fase */}
      <Dialog open={faseDialog.open} onOpenChange={(open) => setFaseDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{faseDialog.mode === "create" ? "Nova Fase" : "Editar Fase"}</DialogTitle>
            <DialogDescription>Preencha os dados da fase do projeto</DialogDescription>
          </DialogHeader>
          {faseDialog.fase && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={faseDialog.fase.nome || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, nome: e.target.value } }))} />
              </div>
              <div>
                <Label>Periodo</Label>
                <Input value={faseDialog.fase.periodo || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, periodo: e.target.value } }))} placeholder="ex: Nov-Dez 2025" />
              </div>
              <div>
                <Label>Responsavel</Label>
                <Input value={faseDialog.fase.responsavel || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, responsavel: e.target.value } }))} />
              </div>
              <div>
                <Label>Data Inicio</Label>
                <Input type="date" value={faseDialog.fase.data_inicio || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, data_inicio: e.target.value } }))} />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input type="date" value={faseDialog.fase.data_fim || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, data_fim: e.target.value } }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={faseDialog.fase.status || "pendente"} onValueChange={(value) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, status: value as "concluido" | "em_progresso" | "pendente" } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_progresso">Em Progresso</SelectItem>
                    <SelectItem value="concluido">Concluido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Progresso (%)</Label>
                <Input type="number" min={0} max={100} value={faseDialog.fase.progresso || 0} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, progresso: parseInt(e.target.value) || 0 } }))} />
              </div>
              <div>
                <Label>Risco</Label>
                <Select value={faseDialog.fase.risco || "baixo"} onValueChange={(value) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, risco: value as "baixo" | "medio" | "alto" } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <Select value={faseDialog.fase.cor || "from-slate-400 to-slate-500"} onValueChange={(value) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, cor: value } }))}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded bg-gradient-to-r ${faseDialog.fase.cor}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {coresDisponiveis.map((cor) => (
                      <SelectItem key={cor.value} value={cor.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${cor.preview}`} />
                          {cor.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" min={1} value={faseDialog.fase.ordem || 1} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, ordem: parseInt(e.target.value) || 1 } }))} />
              </div>
              <div className="col-span-2">
                <Label>Descricao</Label>
                <Textarea value={faseDialog.fase.descricao || ""} onChange={(e) => setFaseDialog(prev => ({ ...prev, fase: { ...prev.fase!, descricao: e.target.value } }))} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaseDialog({ open: false, fase: null, mode: "create" })}>Cancelar</Button>
            <Button onClick={saveFase} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Entrega */}
      <Dialog open={entregaDialog.open} onOpenChange={(open) => setEntregaDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{entregaDialog.mode === "create" ? "Nova Entrega" : "Editar Entrega"}</DialogTitle>
            <DialogDescription>Preencha os dados da entrega</DialogDescription>
          </DialogHeader>
          {entregaDialog.entrega && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={entregaDialog.entrega.nome || ""} onChange={(e) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, nome: e.target.value } }))} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={entregaDialog.entrega.tipo || "Feature"} onValueChange={(value) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, tipo: value } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposEntrega.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={entregaDialog.entrega.status || "pendente"} onValueChange={(value) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, status: value as "concluido" | "em_progresso" | "pendente" } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_progresso">Em Progresso</SelectItem>
                    <SelectItem value="concluido">Concluido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={entregaDialog.entrega.data_prevista || ""} onChange={(e) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, data_prevista: e.target.value || null } }))} />
              </div>
              <div>
                <Label>Data Conclusao</Label>
                <Input type="date" value={entregaDialog.entrega.data_conclusao || ""} onChange={(e) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, data_conclusao: e.target.value || null } }))} />
              </div>
              <div className="col-span-2">
                <Label>Notas</Label>
                <Textarea value={entregaDialog.entrega.notas || ""} onChange={(e) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, notas: e.target.value || null } }))} rows={2} />
              </div>
              <div className="col-span-2">
                <Label>Bloqueios</Label>
                <Textarea value={entregaDialog.entrega.bloqueios || ""} onChange={(e) => setEntregaDialog(prev => ({ ...prev, entrega: { ...prev.entrega!, bloqueios: e.target.value || null } }))} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregaDialog({ open: false, entrega: null, faseId: null, mode: "create" })}>Cancelar</Button>
            <Button onClick={saveEntrega} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marco */}
      <Dialog open={marcoDialog.open} onOpenChange={(open) => setMarcoDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{marcoDialog.mode === "create" ? "Novo Marco" : "Editar Marco"}</DialogTitle>
            <DialogDescription>Preencha os dados do marco</DialogDescription>
          </DialogHeader>
          {marcoDialog.marco && (
            <div className="grid gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={marcoDialog.marco.nome || ""} onChange={(e) => setMarcoDialog(prev => ({ ...prev, marco: { ...prev.marco!, nome: e.target.value } }))} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" value={marcoDialog.marco.data || ""} onChange={(e) => setMarcoDialog(prev => ({ ...prev, marco: { ...prev.marco!, data: e.target.value } }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={marcoDialog.marco.status || "pendente"} onValueChange={(value) => setMarcoDialog(prev => ({ ...prev, marco: { ...prev.marco!, status: value as "concluido" | "pendente" } }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="concluido">Concluido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarcoDialog({ open: false, marco: null, mode: "create" })}>Cancelar</Button>
            <Button onClick={saveMarco} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Burndown */}
      <Dialog open={burndownDialog.open} onOpenChange={(open) => setBurndownDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{burndownDialog.mode === "create" ? "Nova Entrada" : "Editar Entrada"}</DialogTitle>
            <DialogDescription>Preencha os dados do burndown</DialogDescription>
          </DialogHeader>
          {burndownDialog.entry && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Semana</Label>
                <Input value={burndownDialog.entry.semana || ""} onChange={(e) => setBurndownDialog(prev => ({ ...prev, entry: { ...prev.entry!, semana: e.target.value } }))} placeholder="ex: Jan S1" />
              </div>
              <div>
                <Label>Planejado (%)</Label>
                <Input type="number" min={0} max={100} value={burndownDialog.entry.planejado || 100} onChange={(e) => setBurndownDialog(prev => ({ ...prev, entry: { ...prev.entry!, planejado: parseInt(e.target.value) || 0 } }))} />
              </div>
              <div>
                <Label>Real (%)</Label>
                <Input type="number" min={0} max={100} value={burndownDialog.entry.real ?? ""} onChange={(e) => setBurndownDialog(prev => ({ ...prev, entry: { ...prev.entry!, real: e.target.value ? parseInt(e.target.value) : null } }))} />
              </div>
              <div>
                <Label>Entregas</Label>
                <Input type="number" min={0} value={burndownDialog.entry.entregas ?? ""} onChange={(e) => setBurndownDialog(prev => ({ ...prev, entry: { ...prev.entry!, entregas: e.target.value ? parseInt(e.target.value) : null } }))} />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input type="number" min={1} value={burndownDialog.entry.ordem || 1} onChange={(e) => setBurndownDialog(prev => ({ ...prev, entry: { ...prev.entry!, ordem: parseInt(e.target.value) || 1 } }))} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBurndownDialog({ open: false, entry: null, mode: "create" })}>Cancelar</Button>
            <Button onClick={saveBurndown} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Delete */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteDialog.name}"? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Componente principal com autenticacao
export default function RoadmapAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const auth = sessionStorage.getItem("roadmap_admin_auth")
    setIsAuthenticated(auth === "true")
    setCheckingAuth(false)
  }, [])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />
  }

  return <AdminDashboard />
}
