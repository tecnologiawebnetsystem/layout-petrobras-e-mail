"use client"

import type React from "react"

import { useState, useCallback, type DragEvent } from "react"
import { Upload, FileText, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function DragDropZone({ onFilesSelected, selectedFiles, onRemoveFile }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (type: string) => {
    return <FileText className="h-8 w-8" />
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
          ${
            isDragging
              ? "border-[#00A99D] bg-[#00A99D]/5 scale-[1.02]"
              : "border-border hover:border-[#00A99D]/50 hover:bg-muted/30"
          }
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="pointer-events-none space-y-4">
          <div
            className={`
            mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
            ${isDragging ? "bg-[#00A99D] scale-110" : "bg-[#00A99D]/10"}
          `}
          >
            <Upload className={`h-10 w-10 transition-all ${isDragging ? "text-white scale-110" : "text-[#00A99D]"}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {isDragging ? "Solte os arquivos aqui!" : "Arraste e solte os arquivos aqui"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar do seu computador</p>
            <p className="text-xs text-muted-foreground">Tamanho máximo: 50MB por arquivo</p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto border-[#00A99D] text-[#00A99D] hover:bg-[#00A99D] hover:text-white bg-transparent"
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            Selecionar Arquivos
          </Button>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Arquivos Selecionados ({selectedFiles.length})
            </h4>
            <p className="text-sm text-muted-foreground">
              Total: {formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}
            </p>
          </div>

          <div className="grid gap-3">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-all group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#00A99D]/10 flex items-center justify-center text-[#00A99D]">
                  {getFileIcon(file.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFile(index)}
                  className="flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
