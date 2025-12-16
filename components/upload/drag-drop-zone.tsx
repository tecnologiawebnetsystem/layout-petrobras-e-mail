"use client"

import type React from "react"

import { useState, useCallback, type DragEvent } from "react"
import { Upload, FileText, X, CheckCircle2, ImageIcon, FileSpreadsheet, Presentation, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { validateZipFile, isZipFile, type ZipValidationResult } from "@/lib/utils/zip-validator"
import { ZipValidationModal } from "@/components/upload/zip-validation-modal"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useAuditLogStore } from "@/lib/stores/audit-log-store"

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void
  selectedFiles: File[]
  onRemoveFile: (index: number) => void
}

export function DragDropZone({ onFilesSelected, selectedFiles, onRemoveFile }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: number]: number }>({})
  const [validatingZip, setValidatingZip] = useState(false)
  const [zipValidationResult, setZipValidationResult] = useState<{
    show: boolean
    fileName: string
    blockedFiles: string[]
    totalFiles: number
  }>({ show: false, fileName: "", blockedFiles: [], totalFiles: 0 })

  const { user } = useAuthStore()

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

  const processFiles = useCallback(
    async (files: File[]) => {
      const validFiles: File[] = []
      setValidatingZip(true)

      for (const file of files) {
        if (isZipFile(file)) {
          const result: ZipValidationResult = await validateZipFile(file)

          if (!result.isValid) {
            if (user) {
              useAuditLogStore.getState().addLog({
                action: "zip_validation",
                level: "warning",
                user: {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  type: user.userType,
                },
                details: {
                  targetName: file.name,
                  description: `Arquivo ZIP bloqueado: contém ${result.blockedFiles.length} arquivo(s) com extensões não permitidas`,
                  metadata: {
                    blockedFiles: result.blockedFiles,
                    totalFiles: result.totalFiles,
                    fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                  },
                },
              })
            }

            setZipValidationResult({
              show: true,
              fileName: file.name,
              blockedFiles: result.blockedFiles,
              totalFiles: result.totalFiles,
            })
            setValidatingZip(false)
            return
          }

          if (user) {
            useAuditLogStore.getState().addLog({
              action: "zip_validation",
              level: "success",
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                type: user.userType,
              },
              details: {
                targetName: file.name,
                description: `Arquivo ZIP validado com sucesso: ${result.totalFiles} arquivo(s) interno(s)`,
                metadata: {
                  totalFiles: result.totalFiles,
                  fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                },
              },
            })
          }
        }
        validFiles.push(file)
      }

      setValidatingZip(false)
      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
        simulateUpload(validFiles.length)
      }
    },
    [onFilesSelected, user],
  )

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        await processFiles(files)
      }
    },
    [processFiles],
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await processFiles(files)
    }
  }

  const simulateUpload = (count: number) => {
    const startIndex = selectedFiles.length
    for (let i = 0; i < count; i++) {
      const fileIndex = startIndex + i
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 30
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          setTimeout(() => {
            setUploadingFiles((prev) => {
              const newState = { ...prev }
              delete newState[fileIndex]
              return newState
            })
          }, 500)
        }
        setUploadingFiles((prev) => ({ ...prev, [fileIndex]: progress }))
      }, 200)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase()
    const iconClass = "h-8 w-8"

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <ImageIcon className={`${iconClass} text-purple-500`} />
    }
    if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <FileSpreadsheet className={`${iconClass} text-green-600`} />
    }
    if (["ppt", "pptx"].includes(ext || "")) {
      return <Presentation className={`${iconClass} text-orange-500`} />
    }
    if (ext === "pdf") {
      return <FileText className={`${iconClass} text-red-500`} />
    }
    return <FileText className={`${iconClass} text-blue-500`} />
  }

  return (
    <>
      <div className="space-y-4">
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-500
          ${
            isDragging
              ? "border-[#00A99D] bg-gradient-to-br from-[#00A99D]/10 to-[#0047BB]/10 scale-[1.02] shadow-2xl"
              : "border-border hover:border-[#00A99D]/50 hover:bg-muted/30 hover:shadow-lg"
          }
          ${validatingZip ? "pointer-events-none opacity-50" : ""}
        `}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={validatingZip}
          />

          <div className="pointer-events-none space-y-4">
            {validatingZip ? (
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00A99D] to-[#0047BB] flex items-center justify-center">
                  <Shield className="h-12 w-12 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Validando arquivos...</h3>
                  <p className="text-sm text-muted-foreground">Verificando conteúdo de arquivos ZIP</p>
                </div>
              </div>
            ) : (
              <>
                <div
                  className={`
                  mx-auto w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-500
                  ${isDragging ? "bg-gradient-to-br from-[#00A99D] to-[#0047BB] scale-110 shadow-xl rotate-6" : "bg-gradient-to-br from-[#00A99D]/20 to-[#0047BB]/20"}
                `}
                >
                  <Upload
                    className={`h-12 w-12 transition-all duration-500 ${isDragging ? "text-white scale-125 -rotate-6" : "text-[#00A99D]"}`}
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {isDragging ? "Solte os arquivos aqui!" : "Arraste e solte os arquivos"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar do seu computador</p>
                  <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" /> PDF
                    </span>
                    <span className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" /> Excel
                    </span>
                    <span className="flex items-center gap-1">
                      <Presentation className="h-4 w-4" /> PowerPoint
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4" /> Imagens
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="pointer-events-auto bg-gradient-to-r from-[#00A99D] to-[#0047BB] hover:from-[#008A81] hover:to-[#003A99] text-white shadow-lg"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Selecionar Arquivos
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-3 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                Arquivos Prontos ({selectedFiles.length})
              </h4>
              <p className="text-sm text-muted-foreground font-medium">
                Total: {formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}
              </p>
            </div>

            <div className="grid gap-3">
              {selectedFiles.map((file, index) => {
                const isUploading = uploadingFiles[index] !== undefined
                const progress = uploadingFiles[index] || 100

                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-card to-card/50 border rounded-xl hover:shadow-lg transition-all duration-300 group card-hover"
                  >
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#00A99D]/20 to-[#0047BB]/20 flex items-center justify-center">
                      {getFileIcon(file.name)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground flex-shrink-0 ml-2">{formatFileSize(file.size)}</p>
                      </div>
                      {isUploading && (
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">Processando... {Math.round(progress)}%</p>
                        </div>
                      )}
                      {!isUploading && (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Pronto</span>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveFile(index)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <ZipValidationModal
        open={zipValidationResult.show}
        onOpenChange={(show) => setZipValidationResult({ ...zipValidationResult, show })}
        fileName={zipValidationResult.fileName}
        blockedFiles={zipValidationResult.blockedFiles}
        totalFiles={zipValidationResult.totalFiles}
      />
    </>
  )
}
