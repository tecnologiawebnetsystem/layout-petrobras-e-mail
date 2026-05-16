"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, User } from "lucide-react"

export interface FileDetail {
  id: string
  name: string
  size: string
  date: string
  recipient: string
  status: string
  category?: string
}

interface MetricDetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  files: FileDetail[]
  gradient: string
}

export function MetricDetailModal({ isOpen, onClose, title, files, gradient }: MetricDetailModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "downloaded":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendente"
      case "approved":
        return "Aprovado"
      case "rejected":
        return "Rejeitado"
      case "downloaded":
        return "Baixado"
      default:
        return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${gradient} flex items-center justify-center`}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum arquivo nesta categoria</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-primary/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {file.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>
                  <Badge className={getStatusColor(file.status)}>{getStatusLabel(file.status)}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{file.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>{file.recipient}</span>
                  </div>
                </div>

                {file.category && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {file.category}
                    </Badge>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
