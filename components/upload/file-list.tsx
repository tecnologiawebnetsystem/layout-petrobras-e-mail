"use client"

import { FileText, ImageIcon, FileIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileListProps {
  files: File[]
  onRemove: (index: number) => void
}

export function FileList({ files, onRemove }: FileListProps) {
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-blue-500" />
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />
    return <FileIcon className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors"
        >
          <div className="flex-shrink-0 p-2 bg-background rounded">{getFileIcon(file.type)}</div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(index)}
            className="flex-shrink-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
