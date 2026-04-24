/**
 * Helper centralizado para chamadas API ao backend Python (via proxy Next.js).
 * Adiciona Authorization header automaticamente e trata erros/refresh de token.
 */

import { useAuthStore } from "@/lib/stores/auth-store"

const API_BASE = "/api"

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: Record<string, unknown> | FormData | string
  skipAuth?: boolean
}

interface ApiError {
  status: number
  detail: string
}

export class ApiRequestError extends Error {
  status: number
  detail: string
  constructor(status: number, detail: string) {
    super(detail)
    this.name = "ApiRequestError"
    this.status = status
    this.detail = detail
  }
}

/**
 * Fetch wrapper que adiciona auth headers e trata erros.
 * Tenta refresh automatico ao receber 401.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, skipAuth, ...restOptions } = options
  const { accessToken, refreshToken, updateAccessToken, setTokens, clearAuth } =
    useAuthStore.getState()

  const headers: Record<string, string> = {}

  // Adiciona Authorization se autenticado
  if (!skipAuth && accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  // Define Content-Type (FormData eh tratado pelo browser)
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  const url = path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`

  let response = await fetch(url, {
    ...restOptions,
    headers: {
      ...headers,
      ...(restOptions.headers as Record<string, string>),
    },
    body:
      body instanceof FormData
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
  })

  // Tenta refresh automatico ao receber 401
  if (response.status === 401 && !skipAuth && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        if (refreshData.refresh_token) {
          setTokens(refreshData.access_token, refreshData.refresh_token)
        } else {
          updateAccessToken(refreshData.access_token)
        }

        // Repete a request original com o novo token
        headers["Authorization"] = `Bearer ${refreshData.access_token}`
        response = await fetch(url, {
          ...restOptions,
          headers: {
            ...headers,
            ...(restOptions.headers as Record<string, string>),
          },
          body:
            body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : undefined,
        })
      } else {
        // Refresh falhou, desloga
        clearAuth()
        throw new ApiRequestError(401, "Sessao expirada. Faca login novamente.")
      }
    } catch (err) {
      if (err instanceof ApiRequestError) throw err
      clearAuth()
      throw new ApiRequestError(401, "Sessao expirada. Faca login novamente.")
    }
  }

  if (!response.ok) {
    let detail = "Erro desconhecido"
    try {
      const errorData = await response.json()
      const raw = errorData.detail || errorData.message || errorData.error || detail
      detail = typeof raw === "string" ? raw : raw?.message || detail
    } catch {
      detail = response.statusText || detail
    }
    throw new ApiRequestError(response.status, detail)
  }

  // Retorna JSON ou undefined para 204
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

/**
 * Verifica se o backend esta acessivel.
 * Retorna true se a API responde, false se nao.
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "OPTIONS",
    })
    return response.status !== 502 && response.status !== 503
  } catch {
    return false
  }
}
