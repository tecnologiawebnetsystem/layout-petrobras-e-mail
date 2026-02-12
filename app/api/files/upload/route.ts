import { NextRequest, NextResponse } from "next/server"
import {
  getSessionByAccessToken, createFileUpload, createFileUploadItem,
  createFileUploadSteps, createAuditLog, createNotification, getUserById,
} from "@/lib/db/queries"
import { sql } from "@/lib/db/neon"

function getAuthToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization")
  return h?.startsWith("Bearer ") ? h.slice(7) : null
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Token nao fornecido" } }, { status: 401 })

    const session = await getSessionByAccessToken(token)
    if (!session) return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Sessao invalida" } }, { status: 401 })

    const ct = request.headers.get("content-type") || ""
    let name = "", description = "", recipientEmail = "", expirationHours = 24
    const filesList: { name: string; size: string; type: string; s3Key?: string; url?: string }[] = []

    if (ct.includes("application/json")) {
      const b = await request.json()
      name = b.name || ""; description = b.description || ""; recipientEmail = b.recipientEmail || ""
      expirationHours = b.expirationHours || 24
      if (b.files) filesList.push(...b.files)
    } else {
      const fd = await request.formData()
      name = (fd.get("name") as string) || ""; description = (fd.get("description") as string) || ""
      recipientEmail = (fd.get("recipientEmail") as string) || ""
      expirationHours = parseInt((fd.get("expirationHours") as string) || "24") || 24
      for (const f of fd.getAll("files")) {
        if (f instanceof File) {
          const sz = f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${(f.size / 1024).toFixed(0)} KB`
          filesList.push({ name: f.name, size: sz, type: f.type })
        }
      }
    }

    if (!name || !recipientEmail || !filesList.length)
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Nome, destinatario e arquivos obrigatorios" } }, { status: 400 })

    const upload = await createFileUpload({ name, description: description || undefined, sender_id: session.user_id, recipient_email: recipientEmail, expiration_hours: expirationHours })
    for (const f of filesList) await createFileUploadItem({ upload_id: upload.id, name: f.name, size: f.size, type: f.type, s3_key: f.s3Key, url: f.url })
    await createFileUploadSteps(upload.id)

    const user = await getUserById(session.user_id)
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null
    await createAuditLog({ action: "upload", level: "success", user_id: session.user_id, user_name: user?.name, user_email: user?.email, user_type: user?.user_type, user_employee_id: user?.employee_id, target_id: upload.id, target_name: name, description: `Upload: ${name} (${filesList.length} arquivo${filesList.length > 1 ? "s" : ""})`, ip_address: ip })

    const sups = await sql`SELECT id FROM users WHERE user_type = 'supervisor' AND is_active = true`
    for (const s of sups) await createNotification({ user_id: s.id, type: "pending", priority: "high", title: "Novo Envio Pendente", message: `${user?.name || "Usuario"} enviou "${name}" para aprovacao.`, action_label: "Revisar", action_url: "/supervisor" })

    return NextResponse.json({ success: true, message: "Upload realizado com sucesso", data: { uploadId: upload.id, name: upload.name, recipientEmail: upload.recipient_email, files: filesList.map(f => ({ name: f.name, size: f.size, type: f.type })), status: upload.status, expirationHours: upload.expiration_hours, createdAt: upload.created_at } })
  } catch (error) {
    console.error("[API] Upload error:", error)
    return NextResponse.json({ success: false, error: { code: "SERVER_ERROR", message: "Erro interno do servidor" } }, { status: 500 })
  }
}
