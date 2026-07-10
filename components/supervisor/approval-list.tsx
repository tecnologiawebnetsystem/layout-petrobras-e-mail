"use client"

import type { FileUpload } from "@/lib/stores/workflow-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/shared/status-badge"
import { Calendar, ChevronRight, Eye, FileCheck, FileText, Mail, User } from "lucide-react"

interface ApprovalListProps {
  /** Compartilhamentos ja filtrados a serem exibidos. */
  uploads: FileUpload[]
  /** Navega para a tela de detalhes/analise do compartilhamento. */
  onViewDetails: (id: string) => void
  /** Limpa os filtros (usado no estado vazio). */
  onClearFilters: () => void
}

/**
 * Lista de compartilhamentos para analise do supervisor, com card por item
 * e estado vazio. Extraida da pagina do supervisor mantendo o mesmo layout.
 */
export function ApprovalList({ uploads, onViewDetails, onClearFilters }: ApprovalListProps) {
  if (uploads.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-12 text-center bg-card/50">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-xl font-medium text-foreground mb-2">Nenhum documento encontrado</p>
          <p className="text-muted-foreground mb-6">Tente ajustar os filtros de busca</p>
          <Button variant="outline" onClick={onClearFilters}>
            Limpar Filtros
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {uploads.map((upload) => (
        <Card
          key={upload.id}
          className={`overflow-hidden transition-all hover:shadow-lg border-l-4 ${
            upload.status === "pending"
              ? "border-l-amber-500"
              : upload.status === "approved"
                ? "border-l-emerald-500"
                : "border-l-red-500"
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div
                  className={`p-3 rounded-xl ${
                    upload.status === "pending"
                      ? "bg-amber-100"
                      : upload.status === "approved"
                        ? "bg-emerald-100"
                        : "bg-red-100"
                  }`}
                >
                  <FileCheck
                    className={`h-6 w-6 ${
                      upload.status === "pending"
                        ? "text-amber-600"
                        : upload.status === "approved"
                          ? "text-emerald-600"
                          : "text-red-600"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground truncate">{upload.name}</h3>
                    <StatusBadge status={upload.status} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium">Remetente:</span> {upload.sender?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        <span className="font-medium">Destinatario:</span> {upload.recipient || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Solicitado: {upload.uploadDate || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {upload.files?.length || 0} arquivo(s)
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 gap-2"
                onClick={() => onViewDetails(upload.id)}
              >
                <Eye className="h-4 w-4" />
                Ver Detalhes
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
