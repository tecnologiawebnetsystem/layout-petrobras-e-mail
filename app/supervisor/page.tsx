"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useWorkflowStore } from "@/lib/stores/workflow-store"
import { AppHeader } from "@/components/shared/app-header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav"
import { ScrollToTop } from "@/components/shared/scroll-to-top"

export default function SupervisorPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { uploads } = useWorkflowStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isAuthenticated || user?.userType !== "supervisor") {
        router.push("/")
      } else {
        setIsChecking(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  const pendingCount = uploads.filter((u) => u.status === "pending").length
  const approvedCount = uploads.filter((u) => u.status === "approved").length
  const rejectedCount = uploads.filter((u) => u.status === "rejected").length

  const filteredUploads = uploads.filter((upload) => {
    const matchesSearch =
      upload.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      upload.sender.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || upload.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (isChecking || !isAuthenticated || user?.userType !== "supervisor") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <ScrollToTop />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <BreadcrumbNav items={[{ label: "Início", href: "/supervisor" }, { label: "Aprovação de Documentos" }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Aprovação de Documentos</h1>
          <p className="text-muted-foreground">Gerencie e aprove documentos enviados pela equipe</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Widget Pendentes */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-yellow-200 bg-yellow-50/50"
            onClick={() => setStatusFilter("pending")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                {pendingCount}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Pendentes</h3>
            <p className="text-sm text-muted-foreground">Aguardando sua aprovação</p>
          </Card>

          {/* Widget Aprovados */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-green-200 bg-green-50/50"
            onClick={() => setStatusFilter("approved")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-300">
                {approvedCount}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Aprovados</h3>
            <p className="text-sm text-muted-foreground">Documentos aprovados</p>
          </Card>

          {/* Widget Rejeitados */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-red-200 bg-red-50/50"
            onClick={() => setStatusFilter("rejected")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-300">
                {rejectedCount}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Rejeitados</h3>
            <p className="text-sm text-muted-foreground">Documentos rejeitados</p>
          </Card>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo, remetente ou e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="rejected">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="space-y-4">
          {filteredUploads.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Nenhum documento encontrado</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
            </Card>
          ) : (
            filteredUploads.map((upload) => (
              <Card key={upload.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-2">{upload.name}</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Remetente:</span> {upload.sender.name}
                        </p>
                        <p>
                          <span className="font-medium">Destinatário:</span> {upload.recipient}
                        </p>
                        <p>
                          <span className="font-medium">Data:</span>{" "}
                          {new Date(upload.uploadDate).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • {upload.files.length} arquivo(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        upload.status === "approved"
                          ? "default"
                          : upload.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        upload.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                          : upload.status === "approved"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : ""
                      }
                    >
                      {upload.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                      {upload.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {upload.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                      {upload.status === "pending"
                        ? "Pendente"
                        : upload.status === "approved"
                          ? "Aprovado"
                          : "Rejeitado"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/supervisor/detalhes/${upload.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
