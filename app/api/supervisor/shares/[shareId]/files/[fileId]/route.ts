import { NextRequest } from "next/server"
import { proxyDELETE } from "@/lib/api/route-handler-utils"

/**
 * DELETE /api/supervisor/shares/[shareId]/files/[fileId]
 * Remove um arquivo individual de um share PENDENTE (exclui do S3 e do banco).
 * Se não sobrar nenhum arquivo, o share é automaticamente rejeitado.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string; fileId: string }> }
) {
  const { shareId, fileId } = await params
  return proxyDELETE(request, `/api/v1/supervisor/shares/${shareId}/files/${fileId}`, {
    errorCode: "REMOVE_FILE_FAILED",
    errorMessage: "Erro ao remover arquivo do compartilhamento",
    successShape: "passthrough",
  })
}
