"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/services/api-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Users,
  Search,
  Mail,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Building,
  RefreshCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubordinateShares {
  total: number
  pending: number
  active: number
  rejected: number
}

interface Subordinate {
  id: number
  name: string
  email: string
  department: string | null
  job_title: string | null
  employee_id: string | null
  status: boolean
  last_login: string | null
  shares: SubordinateShares
}

export function SubordinatesList() {
  const [subordinates, setSubordinates] = useState<Subordinate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadSubordinates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ subordinates: Subordinate[]; total: number }>(
        "/supervisor/subordinates"
      )
      setSubordinates(data.subordinates || [])
    } catch (err) {
      setError("Erro ao carregar subordinados. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSubordinates()
  }, [])

  const filtered = subordinates.filter((sub) => {
    const q = searchQuery.toLowerCase()
    return (
      sub.name.toLowerCase().includes(q) ||
      sub.email.toLowerCase().includes(q) ||
      (sub.department || "").toLowerCase().includes(q) ||
      (sub.employee_id || "").toLowerCase().includes(q)
    )
  })

  const totalShares = subordinates.reduce((acc, sub) => acc + sub.shares.total, 0)
  const totalPending = subordinates.reduce((acc, sub) => acc + sub.shares.pending, 0)
  const totalActive = subordinates.reduce((acc, sub) => acc + sub.shares.active, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-secondary" />
          <p className="text-muted-foreground">Carregando subordinados...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={loadSubordinates}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{subordinates.length}</p>
              <p className="text-sm text-muted-foreground">Subordinados</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalPending}</p>
              <p className="text-sm text-muted-foreground">Pendentes (total)</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalShares}</p>
              <p className="text-sm text-muted-foreground">Compartilhamentos (total)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email, departamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 h-12 text-base"
        />
      </div>

      {/* Lista de subordinados */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center bg-card/50">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-xl font-medium text-foreground mb-2">Nenhum subordinado encontrado</p>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Tente ajustar a busca"
              : "Nenhum usuario esta vinculado a voce como gestor"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-semibold text-foreground truncate">{sub.name}</h3>
                        <Badge
                          variant={sub.status ? "default" : "secondary"}
                          className={sub.status ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}
                        >
                          {sub.status ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{sub.email}</span>
                        </div>
                        {sub.department && (
                          <div className="flex items-center gap-2">
                            <Building className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{sub.department}</span>
                          </div>
                        )}
                        {sub.job_title && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{sub.job_title}</span>
                          </div>
                        )}
                        {sub.last_login && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              Ultimo login: {new Date(sub.last_login).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metricas de shares */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-center px-3 py-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold text-foreground">{sub.shares.total}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-lg bg-amber-50">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <p className="text-lg font-bold text-amber-700">{sub.shares.pending}</p>
                      </div>
                      <p className="text-xs text-amber-600">Pendentes</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-lg bg-emerald-50">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <p className="text-lg font-bold text-emerald-700">{sub.shares.active}</p>
                      </div>
                      <p className="text-xs text-emerald-600">Ativos</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-lg bg-red-50">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="h-3 w-3 text-red-600" />
                        <p className="text-lg font-bold text-red-700">{sub.shares.rejected}</p>
                      </div>
                      <p className="text-xs text-red-600">Rejeitados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
