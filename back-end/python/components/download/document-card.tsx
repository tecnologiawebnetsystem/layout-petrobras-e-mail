"use client"

import { FileText, FileIcon, Download, CheckCircle, Clock, Lock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  name: string
  sender: string
  date: string
  size: string
  type: string
  downloaded: boolean
  downloadedAt?: string
  downloadCount: number
  expiresAt?: string
  requiresPassword?: boolean
}

interface DocumentCardProps {
  document: Document
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onDownload: () => void
}

export function DocumentCard({ document, isSelected, onSelect, onDownload }: DocumentCardProps) {
  const getFileIcon = (type: string) => {
    const iconClass = "h-8 w-8"
    switch (type) {
      case "pdf":
        return <FileText className={cn(iconClass, "text-red-500")} />
      case "docx":
        return <FileIcon className={cn(iconClass, "text-blue-500")} />
      case "xlsx":
        return (
          <div className={cn(iconClass, "text-green-600 font-bold flex items-center justify-center text-lg")}>XLS</div>
        )
      case "pptx":
        return (
          <div className={cn(iconClass, "text-orange-500 font-bold flex items-center justify-center text-lg")}>PPT</div>
        )
      default:
        return <FileIcon className={cn(iconClass, "text-gray-500")} />
    }
  }

  const isExpired = document.expiresAt && new Date(document.expiresAt) < new Date()
  const isDisabled = document.downloaded || isExpired

  return (
    <div
      className={cn(
        "relative bg-card rounded-lg border p-4 space-y-4 transition-all",
        !isDisabled && "hover:shadow-md",
        isSelected && "ring-2 ring-[#0047BB]",
        isDisabled && "opacity-60",
      )}
    >
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        {document.downloaded && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Baixado
          </Badge>
        )}
        {isExpired && (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Expirado
          </Badge>
        )}
        {document.requiresPassword && !document.downloaded && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs">
            <Lock className="h-3 w-3 mr-1" />
            Protegido
          </Badge>
        )}
      </div>

      {/* Checkbox */}
      <div className="absolute top-3 right-3">
        <Checkbox checked={isSelected} onCheckedChange={onSelect} disabled={isDisabled} />
      </div>

      {/* File Icon */}
      <div className="flex justify-center p-4 bg-muted/50 rounded-lg mt-8">{getFileIcon(document.type)}</div>

      {/* File Info */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-foreground truncate pr-6">{document.name}</h3>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            <span className="font-medium">Remetente:</span> {document.sender}
          </p>
          <p>
            <span className="font-medium">Data:</span> {document.date}
          </p>
          <p>
            <span className="font-medium">Tamanho:</span> {document.size}
          </p>
          {document.downloaded && document.downloadedAt && (
            <p className="text-green-600 dark:text-green-400">
              <span className="font-medium">Baixado em:</span> {document.downloadedAt}
            </p>
          )}
          {document.expiresAt && !isExpired && (
            <p className="text-orange-600 dark:text-orange-400">
              <Clock className="h-3 w-3 inline mr-1" />
              <span className="font-medium">Expira:</span> {document.expiresAt}
            </p>
          )}
        </div>
      </div>

      {/* Download Button */}
      <Button
        onClick={onDownload}
        variant="secondary"
        size="sm"
        disabled={isDisabled}
        className={cn(
          "w-full",
          !isDisabled && "bg-blue-50 hover:bg-blue-100 text-[#0047BB] dark:bg-blue-950/20 dark:hover:bg-blue-950/40",
        )}
      >
        <Download className="h-4 w-4 mr-2" />
        {document.downloaded ? "Baixado" : isExpired ? "Expirado" : "Baixar"}
      </Button>
    </div>
  )
}
