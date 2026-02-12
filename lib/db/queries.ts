import { sql } from './neon'
import crypto from 'crypto'

// =====================================================
// TYPES
// =====================================================

export interface DbUser {
  id: string
  email: string
  name: string
  password_hash: string | null
  user_type: 'internal' | 'external' | 'supervisor'
  job_title: string | null
  department: string | null
  office_location: string | null
  mobile_phone: string | null
  employee_id: string | null
  photo_url: string | null
  manager_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface DbSession {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  ip_address: string | null
  user_agent: string | null
  expires_at: string
  created_at: string
}

export interface DbFileUpload {
  id: string
  name: string
  description: string | null
  sender_id: string
  recipient_email: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  expiration_hours: number
  expires_at: string | null
  current_step: number
  total_steps: number
  approval_date: string | null
  approved_by: string | null
  rejection_reason: string | null
  cancellation_date: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface DbFileUploadItem {
  id: string
  upload_id: string
  name: string
  size: string
  type: string
  s3_key: string | null
  url: string | null
  created_at: string
}

export interface DbFileUploadStep {
  id: string
  upload_id: string
  title: string
  status: 'pending' | 'approved' | 'rejected' | 'in_progress'
  step_order: number
  completed_date: string | null
  comments: string | null
  created_at: string
}

export interface DbAuditLog {
  id: string
  action: string
  level: 'info' | 'warning' | 'error' | 'success'
  user_id: string | null
  user_name: string | null
  user_email: string | null
  user_type: string | null
  user_employee_id: string | null
  target_id: string | null
  target_name: string | null
  description: string
  ip_address: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DbNotification {
  id: string
  user_id: string | null
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  read: boolean
  action_label: string | null
  action_url: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DbEmailHistory {
  id: string
  message_id: string | null
  to_email: string
  to_name: string | null
  cc: string | null
  bcc: string | null
  subject: string
  body: string | null
  html_body: string | null
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'failed'
  sent_at: string | null
  delivered_at: string | null
  error: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// =====================================================
// USERS
// =====================================================

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} AND is_active = true`
  return (rows[0] as DbUser) || null
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`
  return (rows[0] as DbUser) || null
}

export async function createUser(data: {
  email: string
  name: string
  password_hash?: string
  user_type: string
  job_title?: string
  department?: string
  office_location?: string
  mobile_phone?: string
  employee_id?: string
}): Promise<DbUser> {
  const rows = await sql`
    INSERT INTO users (email, name, password_hash, user_type, job_title, department, office_location, mobile_phone, employee_id)
    VALUES (${data.email}, ${data.name}, ${data.password_hash || null}, ${data.user_type}, ${data.job_title || null}, ${data.department || null}, ${data.office_location || null}, ${data.mobile_phone || null}, ${data.employee_id || null})
    RETURNING *
  `
  return rows[0] as DbUser
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await sql`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ${userId}`
}

// =====================================================
// SESSIONS
// =====================================================

function generateToken(): string {
  return crypto.randomBytes(48).toString('hex')
}

export async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<DbSession> {
  const accessToken = generateToken()
  const refreshToken = generateToken()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h

  const rows = await sql`
    INSERT INTO sessions (user_id, access_token, refresh_token, ip_address, user_agent, expires_at)
    VALUES (${userId}, ${accessToken}, ${refreshToken}, ${ipAddress || null}, ${userAgent || null}, ${expiresAt})
    RETURNING *
  `
  return rows[0] as DbSession
}

export async function getSessionByAccessToken(token: string): Promise<(DbSession & { user_email: string; user_name: string; user_type: string }) | null> {
  const rows = await sql`
    SELECT s.*, u.email as user_email, u.name as user_name, u.user_type
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.access_token = ${token} AND s.expires_at > CURRENT_TIMESTAMP
  `
  return (rows[0] as (DbSession & { user_email: string; user_name: string; user_type: string })) || null
}

export async function getSessionByRefreshToken(token: string): Promise<DbSession | null> {
  const rows = await sql`SELECT * FROM sessions WHERE refresh_token = ${token}`
  return (rows[0] as DbSession) || null
}

export async function deleteSession(accessToken: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE access_token = ${accessToken}`
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`
}

export async function cleanExpiredSessions(): Promise<void> {
  await sql`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`
}

// =====================================================
// FILE UPLOADS
// =====================================================

export async function createFileUpload(data: {
  name: string
  description?: string
  sender_id: string
  recipient_email: string
  expiration_hours?: number
}): Promise<DbFileUpload> {
  const rows = await sql`
    INSERT INTO file_uploads (name, description, sender_id, recipient_email, expiration_hours)
    VALUES (${data.name}, ${data.description || null}, ${data.sender_id}, ${data.recipient_email}, ${data.expiration_hours || 24})
    RETURNING *
  `
  return rows[0] as DbFileUpload
}

export async function getFileUploadById(id: string): Promise<DbFileUpload | null> {
  const rows = await sql`SELECT * FROM file_uploads WHERE id = ${id}`
  return (rows[0] as DbFileUpload) || null
}

export async function getFileUploadsBySender(senderId: string): Promise<DbFileUpload[]> {
  const rows = await sql`SELECT * FROM file_uploads WHERE sender_id = ${senderId} ORDER BY created_at DESC`
  return rows as DbFileUpload[]
}

export async function getFileUploadsByRecipient(email: string, status?: string): Promise<DbFileUpload[]> {
  if (status) {
    const rows = await sql`SELECT * FROM file_uploads WHERE recipient_email = ${email} AND status = ${status} ORDER BY created_at DESC`
    return rows as DbFileUpload[]
  }
  const rows = await sql`SELECT * FROM file_uploads WHERE recipient_email = ${email} ORDER BY created_at DESC`
  return rows as DbFileUpload[]
}

export async function getFileUploadsByStatus(status: string): Promise<DbFileUpload[]> {
  const rows = await sql`SELECT * FROM file_uploads WHERE status = ${status} ORDER BY created_at DESC`
  return rows as DbFileUpload[]
}

export async function updateFileUploadStatus(id: string, status: string, extra?: {
  approved_by?: string
  rejection_reason?: string
  cancelled_by?: string
  cancellation_reason?: string
}): Promise<DbFileUpload | null> {
  let rows
  if (status === 'approved') {
    rows = await sql`
      UPDATE file_uploads SET status = 'approved', approval_date = CURRENT_TIMESTAMP, approved_by = ${extra?.approved_by || null},
      expires_at = CURRENT_TIMESTAMP + (expiration_hours || ' hours')::INTERVAL, current_step = total_steps, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} RETURNING *
    `
  } else if (status === 'rejected') {
    rows = await sql`
      UPDATE file_uploads SET status = 'rejected', rejection_reason = ${extra?.rejection_reason || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} RETURNING *
    `
  } else if (status === 'cancelled') {
    rows = await sql`
      UPDATE file_uploads SET status = 'cancelled', cancellation_date = CURRENT_TIMESTAMP, cancelled_by = ${extra?.cancelled_by || null}, cancellation_reason = ${extra?.cancellation_reason || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} RETURNING *
    `
  } else {
    rows = await sql`
      UPDATE file_uploads SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} RETURNING *
    `
  }
  return (rows[0] as DbFileUpload) || null
}

export async function extendFileUploadExpiration(id: string, newHours: number): Promise<DbFileUpload | null> {
  const rows = await sql`
    UPDATE file_uploads SET expiration_hours = ${newHours}, expires_at = CURRENT_TIMESTAMP + (${newHours} || ' hours')::INTERVAL, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} RETURNING *
  `
  return (rows[0] as DbFileUpload) || null
}

// =====================================================
// FILE UPLOAD ITEMS
// =====================================================

export async function createFileUploadItem(data: {
  upload_id: string
  name: string
  size: string
  type: string
  s3_key?: string
  url?: string
}): Promise<DbFileUploadItem> {
  const rows = await sql`
    INSERT INTO file_upload_items (upload_id, name, size, type, s3_key, url)
    VALUES (${data.upload_id}, ${data.name}, ${data.size}, ${data.type}, ${data.s3_key || null}, ${data.url || null})
    RETURNING *
  `
  return rows[0] as DbFileUploadItem
}

export async function getFileUploadItems(uploadId: string): Promise<DbFileUploadItem[]> {
  const rows = await sql`SELECT * FROM file_upload_items WHERE upload_id = ${uploadId} ORDER BY created_at`
  return rows as DbFileUploadItem[]
}

// =====================================================
// FILE UPLOAD STEPS
// =====================================================

export async function createFileUploadSteps(uploadId: string): Promise<DbFileUploadStep[]> {
  const steps = [
    { title: 'Verificação de Segurança', step_order: 1, status: 'in_progress' },
    { title: 'Aprovação do Supervisor', step_order: 2, status: 'pending' },
    { title: 'Liberação para Download', step_order: 3, status: 'pending' },
  ]

  const result: DbFileUploadStep[] = []
  for (const step of steps) {
    const rows = await sql`
      INSERT INTO file_upload_steps (upload_id, title, status, step_order)
      VALUES (${uploadId}, ${step.title}, ${step.status}, ${step.step_order})
      RETURNING *
    `
    result.push(rows[0] as DbFileUploadStep)
  }
  return result
}

export async function getFileUploadSteps(uploadId: string): Promise<DbFileUploadStep[]> {
  const rows = await sql`SELECT * FROM file_upload_steps WHERE upload_id = ${uploadId} ORDER BY step_order`
  return rows as DbFileUploadStep[]
}

export async function updateFileUploadStep(uploadId: string, stepOrder: number, status: string, comments?: string): Promise<void> {
  await sql`
    UPDATE file_upload_steps SET status = ${status}, completed_date = CASE WHEN ${status} IN ('approved','rejected') THEN CURRENT_TIMESTAMP ELSE completed_date END, comments = COALESCE(${comments || null}, comments)
    WHERE upload_id = ${uploadId} AND step_order = ${stepOrder}
  `
}

export async function approveAllSteps(uploadId: string): Promise<void> {
  await sql`
    UPDATE file_upload_steps SET status = 'approved', completed_date = CURRENT_TIMESTAMP
    WHERE upload_id = ${uploadId} AND status != 'approved'
  `
}

// =====================================================
// EXPIRATION LOGS
// =====================================================

export async function createExpirationLog(data: {
  upload_id: string
  changed_by: string
  previous_value: number | null
  new_value: number
  reason?: string
}): Promise<void> {
  await sql`
    INSERT INTO expiration_logs (upload_id, changed_by, previous_value, new_value, reason)
    VALUES (${data.upload_id}, ${data.changed_by}, ${data.previous_value}, ${data.new_value}, ${data.reason || null})
  `
}

export async function getExpirationLogs(uploadId: string) {
  const rows = await sql`SELECT * FROM expiration_logs WHERE upload_id = ${uploadId} ORDER BY created_at DESC`
  return rows
}

// =====================================================
// AUDIT LOGS
// =====================================================

export async function createAuditLog(data: {
  action: string
  level: string
  user_id?: string | null
  user_name?: string | null
  user_email?: string | null
  user_type?: string | null
  user_employee_id?: string | null
  target_id?: string | null
  target_name?: string | null
  description: string
  ip_address?: string | null
  metadata?: Record<string, unknown>
}): Promise<DbAuditLog> {
  const rows = await sql`
    INSERT INTO audit_logs (action, level, user_id, user_name, user_email, user_type, user_employee_id, target_id, target_name, description, ip_address, metadata)
    VALUES (${data.action}, ${data.level}, ${data.user_id || null}, ${data.user_name || null}, ${data.user_email || null}, ${data.user_type || null}, ${data.user_employee_id || null}, ${data.target_id || null}, ${data.target_name || null}, ${data.description}, ${data.ip_address || null}, ${JSON.stringify(data.metadata || {})})
    RETURNING *
  `
  return rows[0] as DbAuditLog
}

export async function getAuditLogs(filters?: {
  action?: string
  level?: string
  user_email?: string
  search?: string
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
}): Promise<{ logs: DbAuditLog[]; total: number }> {
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0

  // Build dynamic WHERE conditions
  let whereConditions = 'WHERE 1=1'
  if (filters?.action) whereConditions += ` AND action = '${filters.action.replace(/'/g, "''")}'`
  if (filters?.level) whereConditions += ` AND level = '${filters.level.replace(/'/g, "''")}'`
  if (filters?.user_email) whereConditions += ` AND user_email = '${filters.user_email.replace(/'/g, "''")}'`
  if (filters?.startDate) whereConditions += ` AND created_at >= '${filters.startDate}'`
  if (filters?.endDate) whereConditions += ` AND created_at <= '${filters.endDate}'`
  if (filters?.search) {
    const s = filters.search.replace(/'/g, "''")
    whereConditions += ` AND (description ILIKE '%${s}%' OR user_name ILIKE '%${s}%' OR user_email ILIKE '%${s}%' OR target_name ILIKE '%${s}%')`
  }

  // Use simple parameterized queries for safety
  const logs = await sql`
    SELECT * FROM audit_logs
    ${sql.unsafe(whereConditions)}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countResult = await sql`
    SELECT COUNT(*)::int as count FROM audit_logs ${sql.unsafe(whereConditions)}
  `

  return {
    logs: logs as DbAuditLog[],
    total: countResult[0]?.count || 0,
  }
}

export async function getAuditMetrics() {
  const totalLogs = await sql`SELECT COUNT(*)::int as count FROM audit_logs`
  const byAction = await sql`SELECT action, COUNT(*)::int as count FROM audit_logs GROUP BY action ORDER BY count DESC`
  const byLevel = await sql`SELECT level, COUNT(*)::int as count FROM audit_logs GROUP BY level ORDER BY count DESC`
  const recentErrors = await sql`SELECT COUNT(*)::int as count FROM audit_logs WHERE level = 'error' AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`
  const todayLogins = await sql`SELECT COUNT(*)::int as count FROM audit_logs WHERE action = 'login' AND level = 'success' AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`
  const uniqueUsers = await sql`SELECT COUNT(DISTINCT user_email)::int as count FROM audit_logs WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'`

  return {
    total: totalLogs[0]?.count || 0,
    byAction: byAction as { action: string; count: number }[],
    byLevel: byLevel as { level: string; count: number }[],
    recentErrors: recentErrors[0]?.count || 0,
    todayLogins: todayLogins[0]?.count || 0,
    uniqueUsersToday: uniqueUsers[0]?.count || 0,
  }
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export async function createNotification(data: {
  user_id?: string | null
  type: string
  priority?: string
  title: string
  message: string
  action_label?: string
  action_url?: string
  metadata?: Record<string, unknown>
}): Promise<DbNotification> {
  const rows = await sql`
    INSERT INTO notifications (user_id, type, priority, title, message, action_label, action_url, metadata)
    VALUES (${data.user_id || null}, ${data.type}, ${data.priority || 'medium'}, ${data.title}, ${data.message}, ${data.action_label || null}, ${data.action_url || null}, ${JSON.stringify(data.metadata || {})})
    RETURNING *
  `
  return rows[0] as DbNotification
}

export async function getNotificationsByUserId(userId: string): Promise<DbNotification[]> {
  const rows = await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`
  return rows as DbNotification[]
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await sql`UPDATE notifications SET read = true WHERE id = ${id}`
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await sql`UPDATE notifications SET read = true WHERE user_id = ${userId} AND read = false`
}

export async function deleteNotification(id: string): Promise<void> {
  await sql`DELETE FROM notifications WHERE id = ${id}`
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const rows = await sql`SELECT COUNT(*)::int as count FROM notifications WHERE user_id = ${userId} AND read = false`
  return rows[0]?.count || 0
}

// =====================================================
// OTP CODES
// =====================================================

export async function createOtpCode(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min

  // Invalidate previous codes
  await sql`UPDATE otp_codes SET is_used = true WHERE email = ${email} AND is_used = false`

  await sql`
    INSERT INTO otp_codes (email, code, expires_at)
    VALUES (${email}, ${code}, ${expiresAt})
  `
  return code
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const rows = await sql`
    SELECT * FROM otp_codes
    WHERE email = ${email} AND code = ${code} AND is_used = false AND expires_at > CURRENT_TIMESTAMP
    ORDER BY created_at DESC LIMIT 1
  `
  if (rows.length === 0) return false

  // Mark as used
  await sql`UPDATE otp_codes SET is_used = true WHERE id = ${rows[0].id}`
  return true
}

export async function cleanExpiredOtpCodes(): Promise<void> {
  await sql`DELETE FROM otp_codes WHERE expires_at < CURRENT_TIMESTAMP OR is_used = true`
}

// =====================================================
// DOWNLOAD LOGS
// =====================================================

export async function createDownloadLog(data: {
  upload_id: string
  document_name?: string
  downloaded_by_email: string
  ip_address?: string
  user_agent?: string
}): Promise<void> {
  await sql`
    INSERT INTO download_logs (upload_id, document_name, downloaded_by_email, ip_address, user_agent)
    VALUES (${data.upload_id}, ${data.document_name || null}, ${data.downloaded_by_email}, ${data.ip_address || null}, ${data.user_agent || null})
  `
}

export async function getDownloadLogsByUpload(uploadId: string) {
  const rows = await sql`SELECT * FROM download_logs WHERE upload_id = ${uploadId} ORDER BY created_at DESC`
  return rows
}

// =====================================================
// EMAIL HISTORY
// =====================================================

export async function createEmailHistoryEntry(data: {
  message_id?: string
  to_email: string
  to_name?: string
  cc?: string
  bcc?: string
  subject: string
  body?: string
  html_body?: string
  status?: string
  metadata?: Record<string, unknown>
}): Promise<DbEmailHistory> {
  const rows = await sql`
    INSERT INTO email_history (message_id, to_email, to_name, cc, bcc, subject, body, html_body, status, metadata)
    VALUES (${data.message_id || null}, ${data.to_email}, ${data.to_name || null}, ${data.cc || null}, ${data.bcc || null}, ${data.subject}, ${data.body || null}, ${data.html_body || null}, ${data.status || 'pending'}, ${JSON.stringify(data.metadata || {})})
    RETURNING *
  `
  return rows[0] as DbEmailHistory
}

export async function updateEmailStatus(id: string, status: string, error?: string): Promise<void> {
  if (status === 'sent') {
    await sql`UPDATE email_history SET status = 'sent', sent_at = CURRENT_TIMESTAMP WHERE id = ${id}`
  } else if (status === 'delivered') {
    await sql`UPDATE email_history SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP WHERE id = ${id}`
  } else if (status === 'failed' || status === 'bounced') {
    await sql`UPDATE email_history SET status = ${status}, error = ${error || null} WHERE id = ${id}`
  } else {
    await sql`UPDATE email_history SET status = ${status} WHERE id = ${id}`
  }
}

export async function getEmailHistory(filters?: {
  to_email?: string
  status?: string
  limit?: number
  offset?: number
}): Promise<{ emails: DbEmailHistory[]; total: number }> {
  const limit = filters?.limit || 50
  const offset = filters?.offset || 0

  let whereConditions = 'WHERE 1=1'
  if (filters?.to_email) whereConditions += ` AND to_email = '${filters.to_email.replace(/'/g, "''")}'`
  if (filters?.status) whereConditions += ` AND status = '${filters.status.replace(/'/g, "''")}'`

  const emails = await sql`
    SELECT * FROM email_history
    ${sql.unsafe(whereConditions)}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countResult = await sql`
    SELECT COUNT(*)::int as count FROM email_history ${sql.unsafe(whereConditions)}
  `

  return {
    emails: emails as DbEmailHistory[],
    total: countResult[0]?.count || 0,
  }
}

export async function getEmailByMessageId(messageId: string): Promise<DbEmailHistory | null> {
  const rows = await sql`SELECT * FROM email_history WHERE message_id = ${messageId}`
  return (rows[0] as DbEmailHistory) || null
}
