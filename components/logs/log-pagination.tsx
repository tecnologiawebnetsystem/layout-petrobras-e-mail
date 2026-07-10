"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface LogPaginationProps {
  currentPage: number
  totalPages: number
  isLoading: boolean
  onPageChange: (page: number) => void
}

/**
 * Controles de paginacao da lista de logs. So renderiza quando ha mais de
 * uma pagina. Extraido da pagina de logs.
 */
export function LogPagination({ currentPage, totalPages, isLoading, onPageChange }: LogPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-6 border-t">
      <p className="text-sm text-muted-foreground">
        Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || isLoading}
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
