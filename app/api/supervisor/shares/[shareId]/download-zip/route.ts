import { NextRequest } from "next/server"
import { BACKEND_URL, proxyHeaders } from "@/lib/api/route-handler-utils"

/**
 * GET /api/supervisor/shares/[shareId]/download-zip
 * Transmite o ZIP de todos os arquivos do share diretamente do backend.
 * Disponível apenas para shares PENDING.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/supervisor/shares/${shareId}/download-zip`,
      { headers: proxyHeaders(request) }
    )

    if (!response.ok) {
      let detail = "Erro ao gerar ZIP"
      try {
        const err = (await response.json()) as { detail?: string }
        detail = err.detail ?? detail
      } catch {}
      return new Response(JSON.stringify({ success: false, error: { code: "DOWNLOAD_ZIP_FAILED", message: detail } }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Repassa o stream binário sem buffer
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename="share-${shareId}.zip"`,
      },
    })
  } catch (error) {
    console.error(`[API] GET /supervisor/shares/${shareId}/download-zip:`, error)
    return new Response(
      JSON.stringify({ success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
