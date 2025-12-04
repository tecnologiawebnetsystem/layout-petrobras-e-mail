"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
}

export function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-12 transition-all duration-200",
        isDragging
          ? "border-[#0047BB] bg-blue-50 dark:bg-blue-950/20 scale-[1.02]"
          : "border-border bg-muted/30 hover:border-muted-foreground/50",
      )}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className={cn("p-4 rounded-full transition-colors", isDragging ? "bg-[#0047BB]/10" : "bg-background")}>
          <FileUp className={cn("h-12 w-12", isDragging ? "text-[#0047BB]" : "text-[#0047BB]")} />
        </div>

        <div className="space-y-2">
          <p className="text-base font-medium text-foreground">
            Arraste e solte os arquivos aqui ou clique para selecionar
          </p>
          <p className="text-sm text-muted-foreground">Adicione um ou mais arquivos para enviar.</p>
        </div>

        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Button type="button" variant="default" className="bg-[#0047BB] hover:bg-[#003A99] pointer-events-none">
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Arquivos
        </Button>
      </div>
    </div>
  )
}
