import { NextRequest } from "next/server"
import {
  BACKEND_URL,
  proxyHeaders,
} from "@/lib/api/route-handler-utils"

type ErrorResponse = {
  detail?: string
}

async function safeJsonParse<T>(
  response: Response
): Promise<T | null> {
  const contentType =
    response.headers.get("content-type")

  if (!contentType?.includes("application/json")) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

/**
 * GET /api/supervisor/shares/[shareId]/download-zip
 * Transmite o ZIP de todos os arquivos do share diretamente do backend.
 * Disponível apenas para shares PENDING.
 */
export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ shareId: string }>
  }
) {
  const { shareId } = await params

  // Validação básica do parâmetro
  if (!/^\d+$/.test(shareId)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INVALID_SHARE_ID",
          message: "Share inválido",
        },
      }),
      {
        status: 400,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    )
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/supervisor/shares/${shareId}/download-zip`,
      {
        headers: proxyHeaders(request),
      }
    )

    if (!response.ok) {
      const errorData =
        await safeJsonParse<ErrorResponse>(
          response
        )

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "DOWNLOAD_ZIP_FAILED",
            message:
              errorData?.detail ??
              "Erro ao gerar ZIP",
          },
        }),
        {
          status: response.status,
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      )
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type":
          "application/zip",

        "Content-Disposition":
          response.headers.get(
            "Content-Disposition"
          ) ??
          `attachment; filename="share-${shareId}.zip"`,
      },
    })
  } catch (error) {
    console.error(
      `[API] GET /supervisor/shares/${shareId}/download-zip:`,
      error
    )

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SERVER_ERROR",
          message:
            "Erro interno do servidor",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    )
  }
}