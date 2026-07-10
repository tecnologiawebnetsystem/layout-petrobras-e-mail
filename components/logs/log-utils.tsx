import {
  Activity,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Mail,
  Shield,
  Upload,
  User,
  XCircle,
} from "lucide-react"

export interface AuditLog {
  id: number
  timestamp: string
  action: string
  level: string
  user: {
    id: number
    name: string
    email: string
    type: string
    employee_id?: string
  } | null
  details: {
    target_id: number | null
    target_name: string | null
    description: string | null
    ip_address: string | null
    metadata: Record<string, unknown> | null
  }
}

export interface AuditPagination {
  current_page: number
  total_pages: number
  total_items: number
  items_per_page: number
}

export interface AuditResponse {
  logs: AuditLog[]
  pagination: AuditPagination
}

/** Icone conforme a acao registrada no log. */
export function getLogIcon(action: string) {
  const actionUpper = action.toUpperCase()
  if (actionUpper.includes("APROVAR") || actionUpper.includes("APPROVE")) return <CheckCircle className="h-4 w-4" />
  if (actionUpper.includes("REJEITAR") || actionUpper.includes("REJECT")) return <XCircle className="h-4 w-4" />
  if (actionUpper.includes("DOWNLOAD") || actionUpper.includes("BAIXAR")) return <Download className="h-4 w-4" />
  if (actionUpper.includes("EMAIL") || actionUpper.includes("OTP") || actionUpper.includes("CODIGO"))
    return <Mail className="h-4 w-4" />
  if (actionUpper.includes("EXPIR")) return <Clock className="h-4 w-4" />
  if (actionUpper.includes("CADASTR") || actionUpper.includes("CRIAR")) return <User className="h-4 w-4" />
  if (actionUpper.includes("LOGIN") || actionUpper.includes("AUTH")) return <Shield className="h-4 w-4" />
  if (actionUpper.includes("UPLOAD") || actionUpper.includes("ENVIAR")) return <Upload className="h-4 w-4" />
  if (actionUpper.includes("VER") || actionUpper.includes("VIEW")) return <FileText className="h-4 w-4" />
  return <Activity className="h-4 w-4" />
}

/** Normaliza o nivel do log a partir do campo level e da acao. */
export function getLogLevel(log: AuditLog): string {
  const level = log.level?.toLowerCase() || "info"
  const action = log.action.toUpperCase()

  if (level === "success" || action.includes("APROVAR") || action.includes("APPROVE")) return "success"
  if (level === "error" || action.includes("REJEITAR") || action.includes("REJECT") || action.includes("ERRO"))
    return "error"
  if (level === "warning" || action.includes("EXPIR") || action.includes("ALERT")) return "warning"
  return "info"
}

/** Classes de cor do badge/icone conforme o nivel. */
export function getLogStatusColor(level: string): string {
  switch (level) {
    case "success":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
    case "error":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
    case "warning":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"
    default:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
  }
}

/** Classe da borda esquerda do card conforme o nivel. */
export function getLogBorderColor(level: string): string {
  switch (level) {
    case "success":
      return "border-l-emerald-500"
    case "error":
      return "border-l-red-500"
    case "warning":
      return "border-l-amber-500"
    default:
      return "border-l-blue-500"
  }
}

/** Formata a acao (snake_case/maiusculas) em texto legivel. */
export function formatAction(action: string): string {
  return action
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}
