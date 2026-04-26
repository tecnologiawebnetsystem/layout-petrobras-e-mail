-- ============================================================
-- Script SQL compativel com PostgreSQL 14+
-- Espelha EXATAMENTE os modelos SQLModel do backend Python
-- Pode ser executado em qualquer servidor PostgreSQL (Neon, RDS, local)
-- ============================================================

-- ====================
-- ENUM TYPES
-- ====================
DO $$ BEGIN
    CREATE TYPE typeuser AS ENUM ('externo', 'internal', 'supervisor', 'support');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE typelevel AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sharestatus AS ENUM ('pendente', 'ativo', 'aprovado', 'rejeitado', 'concluido', 'expirado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tokenconsumption AS ENUM ('apos_todos', 'apos_primeiro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE typetoken AS ENUM ('otp', 'access');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notificationtype AS ENUM ('info', 'success', 'warning', 'error', 'approval', 'rejection', 'download', 'expiration');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE notificationpriority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE emailstatus AS ENUM ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE emailtype AS ENUM ('file_share', 'otp', 'approval_request', 'approval_granted', 'approval_rejected', 'expiration_warning', 'download_confirmation', 'password_reset', 'welcome', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ====================
-- TABELA: user
-- Modelo: User (backend/app/models/user.py)
-- ====================
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    type typeuser NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(255),
    job_title VARCHAR(255),
    employee_id VARCHAR(50),
    photo_url VARCHAR(500),
    manager_id INTEGER REFERENCES "user"(id),
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_user_type ON "user"(type);
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- ====================
-- TABELA: credential_local
-- Modelo: CredentialLocal (backend/app/models/credencial_local.py)
-- ====================
CREATE TABLE IF NOT EXISTS credential_local (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    password_hash VARCHAR NOT NULL,
    salt VARCHAR NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_credential_local_user_id ON credential_local(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_local_failed_attempts ON credential_local(failed_attempts);
CREATE INDEX IF NOT EXISTS idx_credential_local_blocked_until ON credential_local(blocked_until);

-- ====================
-- TABELA: shared_area
-- Modelo: SharedArea (backend/app/models/area.py)
-- ====================
CREATE TABLE IF NOT EXISTS shared_area (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    prefix_s3 VARCHAR NOT NULL,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applicant_id INTEGER NOT NULL REFERENCES "user"(id)
);
CREATE INDEX IF NOT EXISTS idx_shared_area_applicant_id ON shared_area(applicant_id);

-- ====================
-- TABELA: areasupervisor
-- Modelo: AreaSupervisor (backend/app/models/areasupervisors.py)
-- ====================
CREATE TABLE IF NOT EXISTS areasupervisor (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES shared_area(id),
    supervisor_id INTEGER NOT NULL REFERENCES "user"(id)
);
CREATE INDEX IF NOT EXISTS idx_areasupervisor_area_id ON areasupervisor(area_id);
CREATE INDEX IF NOT EXISTS idx_areasupervisor_supervisor_id ON areasupervisor(supervisor_id);

-- ====================
-- TABELA: restricted_file
-- Modelo: RestrictedFile (backend/app/models/restricted_file.py)
-- ====================
CREATE TABLE IF NOT EXISTS restricted_file (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES shared_area(id),
    name VARCHAR NOT NULL,
    key_s3 VARCHAR NOT NULL,
    size_bytes INTEGER,
    mime_type VARCHAR,
    checksum VARCHAR,
    upload_id INTEGER REFERENCES "user"(id),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_restricted_file_area_id ON restricted_file(area_id);

-- ====================
-- TABELA: share
-- Modelo: Share (backend/app/models/share.py)
-- ====================
CREATE TABLE IF NOT EXISTS share (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(1000),
    area_id INTEGER REFERENCES shared_area(id),
    external_email VARCHAR NOT NULL,
    status sharestatus NOT NULL DEFAULT 'pendente',
    consumption_policy tokenconsumption NOT NULL DEFAULT 'apos_todos',
    expiration_hours INTEGER NOT NULL DEFAULT 72,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_id INTEGER NOT NULL REFERENCES "user"(id),
    approver_id INTEGER REFERENCES "user"(id),
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason VARCHAR(500),
    approval_comments VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_share_area_id ON share(area_id);
CREATE INDEX IF NOT EXISTS idx_share_external_email ON share(external_email);
CREATE INDEX IF NOT EXISTS idx_share_status ON share(status);
CREATE INDEX IF NOT EXISTS idx_share_created_by_id ON share(created_by_id);

-- ====================
-- TABELA: share_file
-- Modelo: ShareFile (backend/app/models/share_file.py)
-- ====================
CREATE TABLE IF NOT EXISTS share_file (
    id SERIAL PRIMARY KEY,
    share_id INTEGER NOT NULL REFERENCES share(id),
    file_id INTEGER NOT NULL REFERENCES restricted_file(id),
    downloaded BOOLEAN NOT NULL DEFAULT FALSE,
    downloaded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_share_file_share_id ON share_file(share_id);
CREATE INDEX IF NOT EXISTS idx_share_file_file_id ON share_file(file_id);
CREATE INDEX IF NOT EXISTS idx_share_file_downloaded ON share_file(downloaded);

-- ====================
-- TABELA: token_access
-- Modelo: TokenAccess (backend/app/models/token_access.py)
-- ====================
CREATE TABLE IF NOT EXISTS token_access (
    id SERIAL PRIMARY KEY,
    type typetoken NOT NULL,
    token VARCHAR UNIQUE,
    token_hash VARCHAR,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    share_id INTEGER NOT NULL REFERENCES share(id),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_token_access_type ON token_access(type);
CREATE INDEX IF NOT EXISTS idx_token_access_token ON token_access(token);
CREATE INDEX IF NOT EXISTS idx_token_access_user_id ON token_access(user_id);
CREATE INDEX IF NOT EXISTS idx_token_access_share_id ON token_access(share_id);
CREATE INDEX IF NOT EXISTS idx_token_access_used ON token_access(used);
CREATE INDEX IF NOT EXISTS idx_token_access_attempts ON token_access(attempts);
CREATE INDEX IF NOT EXISTS idx_token_access_blocked_until ON token_access(blocked_until);

-- ====================
-- TABELA: audit
-- Modelo: Audit (backend/app/models/audit.py)
-- ====================
CREATE TABLE IF NOT EXISTS audit (
    id SERIAL PRIMARY KEY,
    action VARCHAR NOT NULL,
    level typelevel NOT NULL DEFAULT 'success',
    user_id INTEGER REFERENCES "user"(id),
    share_id INTEGER REFERENCES share(id),
    file_id INTEGER REFERENCES restricted_file(id),
    ip_address VARCHAR,
    user_agent VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_level ON audit(level);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_share_id ON audit(share_id);
CREATE INDEX IF NOT EXISTS idx_audit_file_id ON audit(file_id);

-- ====================
-- TABELA: notification
-- Modelo: Notification (backend/app/models/notification.py)
-- ====================
CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id),
    type notificationtype NOT NULL DEFAULT 'info',
    priority notificationpriority NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    action_label VARCHAR(100),
    action_url VARCHAR(500),
    metadata TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(read);

-- ====================
-- TABELA: email_log
-- Modelo: EmailLog (backend/app/models/email_log.py)
-- ====================
CREATE TABLE IF NOT EXISTS email_log (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR NOT NULL UNIQUE,
    email_type emailtype NOT NULL,
    from_email VARCHAR NOT NULL,
    to_email VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    body_preview VARCHAR(500),
    status emailstatus NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    error_message VARCHAR(1000),
    error_code VARCHAR(50),
    user_id INTEGER REFERENCES "user"(id),
    share_id INTEGER REFERENCES share(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    metadata TEXT
);
CREATE INDEX IF NOT EXISTS idx_email_log_message_id ON email_log(message_id);
CREATE INDEX IF NOT EXISTS idx_email_log_email_type ON email_log(email_type);
CREATE INDEX IF NOT EXISTS idx_email_log_to_email ON email_log(to_email);
CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
CREATE INDEX IF NOT EXISTS idx_email_log_user_id ON email_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_log_share_id ON email_log(share_id);

-- ====================
-- FIM DO SCRIPT
-- ====================
