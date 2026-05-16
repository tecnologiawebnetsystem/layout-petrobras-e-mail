// Lista de extensões bloqueadas por categoria
export const BLOCKED_EXTENSIONS = {
  executaveis: [".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".vbs", ".ps1", ".app", ".deb", ".rpm"],
  scripts: [".sh", ".bash", ".js", ".py", ".rb", ".pl", ".php"],
  bibliotecas: [".dll", ".so", ".dylib"],
  outros: [".jar", ".apk", ".ipa"],
}

// Todas as extensões bloqueadas em um array único
export const ALL_BLOCKED_EXTENSIONS = Object.values(BLOCKED_EXTENSIONS).flat()

export interface ZipValidationResult {
  isValid: boolean
  blockedFiles: string[]
  totalFiles: number
  message: string
}

export async function validateZipFile(file: File): Promise<ZipValidationResult> {
  try {
    // Importar JSZip dinamicamente
    const JSZip = (await import("jszip")).default
    const zip = new JSZip()

    // Ler o arquivo ZIP
    const zipContent = await zip.loadAsync(file)
    const files = Object.keys(zipContent.files)
    const blockedFiles: string[] = []

    // Verificar cada arquivo dentro do ZIP
    for (const fileName of files) {
      const fileEntry = zipContent.files[fileName]

      // Ignorar diretórios
      if (fileEntry.dir) continue

      // Verificar extensão
      const extension = "." + fileName.split(".").pop()?.toLowerCase()
      if (ALL_BLOCKED_EXTENSIONS.includes(extension)) {
        blockedFiles.push(fileName)
      }
    }

    if (blockedFiles.length > 0) {
      return {
        isValid: false,
        blockedFiles,
        totalFiles: files.length,
        message: `Arquivo ZIP contém ${blockedFiles.length} arquivo(s) com extensões bloqueadas`,
      }
    }

    return {
      isValid: true,
      blockedFiles: [],
      totalFiles: files.length,
      message: `ZIP validado com sucesso. ${files.length} arquivo(s) encontrado(s)`,
    }
  } catch (error) {
    return {
      isValid: false,
      blockedFiles: [],
      totalFiles: 0,
      message: "Erro ao ler arquivo ZIP. O arquivo pode estar corrompido ou protegido por senha.",
    }
  }
}

export function isZipFile(file: File): boolean {
  const zipExtensions = [".zip", ".rar", ".7z", ".tar", ".gz"]
  const extension = "." + file.name.split(".").pop()?.toLowerCase()
  return (
    zipExtensions.includes(extension) || file.type === "application/zip" || file.type === "application/x-zip-compressed"
  )
}

export function getBlockedExtensionCategory(extension: string): string {
  for (const [category, extensions] of Object.entries(BLOCKED_EXTENSIONS)) {
    if (extensions.includes(extension.toLowerCase())) {
      return category
    }
  }
  return "outros"
}
