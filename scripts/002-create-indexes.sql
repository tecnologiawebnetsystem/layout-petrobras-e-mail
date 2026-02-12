-- =====================================================
-- Petrobras Email File Transfer System
-- Script 002: Criacao de Indices
-- Compativel com qualquer PostgreSQL 14+
-- =====================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- File Uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_sender_id ON file_uploads(sender_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_recipient ON file_uploads(recipient_email);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_expires_at ON file_uploads(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status_created ON file_uploads(status, created_at DESC);

-- File Upload Items
CREATE INDEX IF NOT EXISTS idx_file_upload_items_upload_id ON file_upload_items(upload_id);

-- File Upload Steps
CREATE INDEX IF NOT EXISTS idx_file_upload_steps_upload_id ON file_upload_steps(upload_id);
CREATE INDEX IF NOT EXISTS idx_file_upload_steps_order ON file_upload_steps(upload_id, step_order);

-- Expiration Logs
CREATE INDEX IF NOT EXISTS idx_expiration_logs_upload_id ON expiration_logs(upload_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- OTP Codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_code ON otp_codes(email, code);

-- Download Logs
CREATE INDEX IF NOT EXISTS idx_download_logs_upload_id ON download_logs(upload_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_email ON download_logs(downloaded_by_email);
CREATE INDEX IF NOT EXISTS idx_download_logs_created_at ON download_logs(created_at DESC);

-- Email History
CREATE INDEX IF NOT EXISTS idx_email_history_to_email ON email_history(to_email);
CREATE INDEX IF NOT EXISTS idx_email_history_status ON email_history(status);
CREATE INDEX IF NOT EXISTS idx_email_history_message_id ON email_history(message_id);
CREATE INDEX IF NOT EXISTS idx_email_history_created_at ON email_history(created_at DESC);
