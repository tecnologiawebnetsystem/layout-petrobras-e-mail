import { useAuditLogStore } from "./path-to-audit-log-store" // Import useAuditLogStore
import { user } from "./path-to-user" // Import user
import { uploadId } from "./path-to-upload-id" // Import uploadId
import { files } from "./path-to-files" // Import files
import { recipient } from "./path-to-recipient" // Import recipient
import { expirationHours } from "./path-to-expiration-hours" // Import expirationHours

useAuditLogStore.getState().addLog({
  action: "upload",
  level: "info",
  user: {
    id: user.id,
    name: user.name,
    email: user.email,
    type: user.userType,
    employeeId: user.employeeId, // Adicionando employeeId ao log
  },
  details: {
    targetId: uploadId,
    targetName: files[0]?.name || "Múltiplos arquivos",
    description: `Enviou ${files.length} arquivo(s) para ${recipient}`,
    metadata: {
      fileCount: files.length,
      totalSize: `${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB`,
      recipient,
      expirationHours,
      employeeId: user.employeeId, // Também em metadata para análise
    },
  },
})
