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
 * GET /api/download/files/zip?ids=1,2,3
 * Transmite o ZIP dos arquivos selecionados pelo usuário externo.
 */
export async function GET(request: NextRequest) {
  try {
    const ids =
      request.nextUrl.searchParams.get("ids") ?? ""

    const response = await fetch(
      `${BACKEND_URL}/api/v1/download/files/zip?ids=${encodeURIComponent(ids)}`,
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
              "Falha ao gerar o arquivo ZIP.",
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
          'attachment; filename="arquivos.zip"',
      },
    })
  } catch (error) {
    console.error(
      "[API] GET /download/files/zip:",
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