/**
 * Helper para baixar arquivos (CSV) de rotas protegidas do proxy Next.js.
 *
 * Diferente de `apiFetch` (que espera JSON), aqui lidamos com um blob binário e
 * disparamos o download no navegador, incluindo o Authorization header a partir
 * do auth store.
 */

import { useAuthStore } from "@/lib/stores/auth-store"

const API_BASE = "/api"

/**
 * Faz o download de um arquivo a partir de um endpoint do proxy.
 *
 * @param path     caminho relativo ao /api (ex.: "/admin/export/users?columns=id,name")
 * @param filename nome sugerido do arquivo salvo (ex.: "usuarios.csv")
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const { accessToken } = useAuthStore.getState()

  const url = path.startsWith("/") ? `${API_BASE}${path}` : `${API_BASE}/${path}`

  const response = await fetch(url, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  })

  if (!response.ok) {
    let message = "Erro ao exportar arquivo"
    try {
      const data = await response.json()
      message = data?.error?.message || data?.detail || data?.message || message
    } catch {
      message = response.statusText || message
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
