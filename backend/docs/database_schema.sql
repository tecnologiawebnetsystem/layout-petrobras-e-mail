-- ============================================================================
-- SCAC - Sistema de Compartilhamento de Arquivos Corporativos
-- Script SQL para PostgreSQL (Aurora)
-- 
-- Este script cria toda a estrutura do banco de dados.
-- Execute este arquivo diretamente no Aurora se não estiver usando Alembic.
-- 
-- Ordem de execução:
-- 1. ENUMs
-- 2. Tabelas (respeitando dependências de FK)
-- 3. Índices
-- ============================================================================

-- ============================================================================
-- PARTE 1: CRIAÇÃO DOS ENUMs
-- ============================================================================

-- Tipo de usuário
CREATE TYPE usertype AS ENUM ('externo', 'internal');

-- Status do compartilhamento
CREATE TYPE sharestatus AS ENUM (
    'pendente', 
    'aprovado', 
    'rejeitado', 
    'ativo', 
    'concluido', 
    'expirado', 
    'cancelado'
);

-- Política de consumo
CREATE TYPE consumptionpolicy AS ENUM ('apos_todos', 'apos_primeiro');

-- Tipo de token
CREATE TYPE tokentype AS ENUM ('otp', 'access');

-- Nível de log de auditoria
CREATE TYPE auditlevel AS ENUM ('info', 'success', 'warning', 'error');

-- Tipo de notificação
CREATE TYPE notificationtype AS ENUM (
    'info', 
    'success', 
    'warning', 
    'error', 
    'approval', 
    'rejection', 
    'download', 
    'expiration'
);

-- Prioridade de notificação
CREATE TYPE notificationpriority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Status de email
CREATE TYPE emailstatus AS ENUM (
    'pending', 
    'queued', 
    'sent', 
    'delivered', 
    'opened', 
    'clicked', 
    'bounced', 
    'complained', 
    'failed'
);

-- Tipo de email
CREATE TYPE emailtype AS ENUM (
    'otp_verification', 
    'share_notification', 
    'share_approved',
    'share_rejected', 
    'download_complete', 
    'expiration_warning',
    'password_reset', 
    'welcome', 
    'support_notification'
);

-- Tipo de token de sessão
CREATE TYPE sessiontokentype AS ENUM ('refresh', 'reset');

-- Status de registro de suporte
CREATE TYPE supportstatus AS ENUM ('ativo', 'pendente', 'inativo', 'cancelado');

-- Ação de suporte
CREATE TYPE supportaction AS ENUM (
    'CADASTRO', 
    'REATIVACAO', 
    'INATIVACAO', 
    'ALTERACAO', 
    'CONSULTA'
);

-- ============================================================================
-- PARTE 2: CRIAÇÃO DAS TABELAS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA: user
-- Propósito: Armazena todos os usuários do sistema
-- Tipos de usuário:
--   - Interno: type='internal', is_supervisor=false, is_admin=false
--   - Externo: type='externo'
--   - Supervisor: type='internal', is_supervisor=true
--   - Admin Global: type='internal', is_admin=true (vê TUDO)
-- ----------------------------------------------------------------------------
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    type usertype NOT NULL DEFAULT 'internal',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department VARCHAR(255),
    job_title VARCHAR(255),
    employee_id VARCHAR(50),
    photo_url VARCHAR(500),
    manager_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    is_supervisor BOOLEAN NOT NULL DEFAULT false,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE "user" IS 'Usuários do sistema: internos, externos, supervisores e admins';
COMMENT ON COLUMN "user".type IS 'Tipo: externo (parceiros) ou internal (Petrobras)';
COMMENT ON COLUMN "user".manager_id IS 'FK para o gestor/supervisor hierárquico';
COMMENT ON COLUMN "user".is_supervisor IS 'Se pode aprovar/rejeitar compartilhamentos';
COMMENT ON COLUMN "user".is_admin IS 'Se é super administrador global (vê TUDO)';

CREATE INDEX ix_user_email ON "user"(email);
CREATE INDEX ix_user_type ON "user"(type);
CREATE INDEX ix_user_manager_id ON "user"(manager_id);
CREATE INDEX ix_user_is_supervisor ON "user"(is_supervisor);
CREATE INDEX ix_user_is_admin ON "user"(is_admin);
CREATE INDEX ix_user_status ON "user"(status);

-- ----------------------------------------------------------------------------
-- TABELA: credential_local
-- Propósito: Credenciais de login local para usuários externos
-- Internos NÃO usam - autenticam via Microsoft Entra ID
-- ----------------------------------------------------------------------------
CREATE TABLE credential_local (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE credential_local IS 'Credenciais de login local para usuários externos';
COMMENT ON COLUMN credential_local.password_hash IS 'Hash SHA-256 da senha';
COMMENT ON COLUMN credential_local.failed_attempts IS 'Tentativas de login falhas consecutivas';
COMMENT ON COLUMN credential_local.blocked_until IS 'Bloqueado até esta data (após 5 falhas)';

CREATE INDEX ix_credential_user_id ON credential_local(user_id);

-- ----------------------------------------------------------------------------
-- TABELA: shared_area
-- Propósito: Áreas/pastas de compartilhamento no S3
-- ----------------------------------------------------------------------------
CREATE TABLE shared_area (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    prefix_s3 VARCHAR(500) NOT NULL,
    description TEXT,
    status BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applicant_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL
);

COMMENT ON TABLE shared_area IS 'Áreas/pastas de compartilhamento no S3';
COMMENT ON COLUMN shared_area.prefix_s3 IS 'Prefixo no bucket S3';

CREATE INDEX ix_area_applicant_id ON shared_area(applicant_id);
CREATE INDEX ix_area_status ON shared_area(status);

-- ----------------------------------------------------------------------------
-- TABELA: areasupervisor
-- Propósito: Associação N:N entre áreas e supervisores
-- ----------------------------------------------------------------------------
CREATE TABLE areasupervisor (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES shared_area(id) ON DELETE CASCADE,
    supervisor_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(area_id, supervisor_id)
);

COMMENT ON TABLE areasupervisor IS 'Associação N:N entre áreas e supervisores';

CREATE INDEX ix_areasup_area_id ON areasupervisor(area_id);
CREATE INDEX ix_areasup_supervisor_id ON areasupervisor(supervisor_id);

-- ----------------------------------------------------------------------------
-- TABELA: restricted_file
-- Propósito: Metadados dos arquivos armazenados no S3
-- ----------------------------------------------------------------------------
CREATE TABLE restricted_file (
    id SERIAL PRIMARY KEY,
    area_id INTEGER REFERENCES shared_area(id) ON DELETE SET NULL,
    name VARCHAR(500) NOT NULL,
    key_s3 VARCHAR(1000) NOT NULL,
    size_bytes BIGINT,
    mime_type VARCHAR(255),
    checksum VARCHAR(128),
    upload_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE restricted_file IS 'Metadados dos arquivos armazenados no S3';
COMMENT ON COLUMN restricted_file.key_s3 IS 'Chave completa no S3';
COMMENT ON COLUMN restricted_file.checksum IS 'Hash MD5/SHA do arquivo para verificação';

CREATE INDEX ix_file_area_id ON restricted_file(area_id);
CREATE INDEX ix_file_upload_id ON restricted_file(upload_id);
CREATE INDEX ix_file_status ON restricted_file(status);
CREATE INDEX ix_file_key_s3 ON restricted_file(key_s3);

-- ----------------------------------------------------------------------------
-- TABELA: share
-- Propósito: Compartilhamentos de arquivos com usuários externos
-- ----------------------------------------------------------------------------
CREATE TABLE share (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(1000),
    area_id INTEGER REFERENCES shared_area(id) ON DELETE SET NULL,
    external_email VARCHAR(255) NOT NULL,
    status sharestatus NOT NULL DEFAULT 'pendente',
    consumption_policy consumptionpolicy NOT NULL DEFAULT 'apos_todos',
    expiration_hours INTEGER NOT NULL DEFAULT 72,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    approver_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(500),
    approval_comments VARCHAR(500)
);

COMMENT ON TABLE share IS 'Compartilhamentos de arquivos com usuários externos';
COMMENT ON COLUMN share.status IS 'pendente, aprovado, rejeitado, ativo, concluido, expirado, cancelado';
COMMENT ON COLUMN share.consumption_policy IS 'apos_todos (expira quando todos baixam) ou apos_primeiro';
COMMENT ON COLUMN share.expiration_hours IS 'Horas de validade solicitadas';

CREATE INDEX ix_share_area_id ON share(area_id);
CREATE INDEX ix_share_external_email ON share(external_email);
CREATE INDEX ix_share_status ON share(status);
CREATE INDEX ix_share_created_by_id ON share(created_by_id);
CREATE INDEX ix_share_approver_id ON share(approver_id);
CREATE INDEX ix_share_expires_at ON share(expires_at);

-- ----------------------------------------------------------------------------
-- TABELA: share_file
-- Propósito: Associação N:N entre shares e arquivos
-- ----------------------------------------------------------------------------
CREATE TABLE share_file (
    id SERIAL PRIMARY KEY,
    share_id INTEGER NOT NULL REFERENCES share(id) ON DELETE CASCADE,
    file_id INTEGER NOT NULL REFERENCES restricted_file(id) ON DELETE CASCADE,
    downloaded BOOLEAN NOT NULL DEFAULT false,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(share_id, file_id)
);

COMMENT ON TABLE share_file IS 'Associação N:N entre shares e arquivos';

CREATE INDEX ix_sharefile_share_id ON share_file(share_id);
CREATE INDEX ix_sharefile_file_id ON share_file(file_id);
CREATE INDEX ix_sharefile_downloaded ON share_file(downloaded);

-- ----------------------------------------------------------------------------
-- TABELA: token_access
-- Propósito: Tokens OTP e de acesso para usuários externos
-- ----------------------------------------------------------------------------
CREATE TABLE token_access (
    id SERIAL PRIMARY KEY,
    type tokentype NOT NULL,
    token VARCHAR(500),
    token_hash VARCHAR(128),
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
    share_id INTEGER REFERENCES share(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE token_access IS 'Tokens OTP e de acesso para usuários externos';
COMMENT ON COLUMN token_access.type IS 'otp (código 6 dígitos) ou access (link)';
COMMENT ON COLUMN token_access.token IS 'Token de acesso (para type=access)';
COMMENT ON COLUMN token_access.token_hash IS 'Hash do OTP (para type=otp)';

CREATE INDEX ix_token_type ON token_access(type);
CREATE INDEX ix_token_token ON token_access(token);
CREATE INDEX ix_token_user_id ON token_access(user_id);
CREATE INDEX ix_token_share_id ON token_access(share_id);
CREATE INDEX ix_token_used ON token_access(used);
CREATE INDEX ix_token_expires_at ON token_access(expires_at);

-- ----------------------------------------------------------------------------
-- TABELA: audit
-- Propósito: Logs de auditoria de todas as ações do sistema
-- ----------------------------------------------------------------------------
CREATE TABLE audit (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    level auditlevel NOT NULL DEFAULT 'info',
    user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    share_id INTEGER REFERENCES share(id) ON DELETE SET NULL,
    file_id INTEGER REFERENCES restricted_file(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detail TEXT
);

COMMENT ON TABLE audit IS 'Logs de auditoria de todas as ações do sistema';
COMMENT ON COLUMN audit.action IS 'UPLOAD, DOWNLOAD, APPROVE, REJECT, LOGIN, etc.';
COMMENT ON COLUMN audit.level IS 'info, success, warning, error';
COMMENT ON COLUMN audit.detail IS 'Detalhes adicionais em JSON';

CREATE INDEX ix_audit_action ON audit(action);
CREATE INDEX ix_audit_level ON audit(level);
CREATE INDEX ix_audit_user_id ON audit(user_id);
CREATE INDEX ix_audit_share_id ON audit(share_id);
CREATE INDEX ix_audit_file_id ON audit(file_id);
CREATE INDEX ix_audit_created_at ON audit(created_at);

-- ----------------------------------------------------------------------------
-- TABELA: notification
-- Propósito: Notificações in-app para usuários
-- ----------------------------------------------------------------------------
CREATE TABLE notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type notificationtype NOT NULL DEFAULT 'info',
    priority notificationpriority NOT NULL DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    action_label VARCHAR(100),
    action_url VARCHAR(500),
    extra_metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notification IS 'Notificações in-app para usuários';

CREATE INDEX ix_notification_user_id ON notification(user_id);
CREATE INDEX ix_notification_type ON notification(type);
CREATE INDEX ix_notification_read ON notification(read);
CREATE INDEX ix_notification_created_at ON notification(created_at);

-- ----------------------------------------------------------------------------
-- TABELA: email_log
-- Propósito: Rastreamento de emails enviados pelo sistema (SES)
-- ----------------------------------------------------------------------------
CREATE TABLE email_log (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    email_type emailtype NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_preview VARCHAR(500),
    status emailstatus NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    error_message VARCHAR(1000),
    error_code VARCHAR(50),
    user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    share_id INTEGER REFERENCES share(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    extra_metadata TEXT
);

COMMENT ON TABLE email_log IS 'Rastreamento de emails enviados pelo sistema';
COMMENT ON COLUMN email_log.message_id IS 'ID único do email (SES)';

CREATE INDEX ix_emaillog_message_id ON email_log(message_id);
CREATE INDEX ix_emaillog_email_type ON email_log(email_type);
CREATE INDEX ix_emaillog_to_email ON email_log(to_email);
CREATE INDEX ix_emaillog_status ON email_log(status);
CREATE INDEX ix_emaillog_user_id ON email_log(user_id);
CREATE INDEX ix_emaillog_share_id ON email_log(share_id);
CREATE INDEX ix_emaillog_created_at ON email_log(created_at);

-- ----------------------------------------------------------------------------
-- TABELA: session_token
-- Propósito: Tokens de sessão (refresh e reset de senha)
-- ----------------------------------------------------------------------------
CREATE TABLE session_token (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type sessiontokentype NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN NOT NULL DEFAULT false,
    revoked BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    email VARCHAR(255)
);

COMMENT ON TABLE session_token IS 'Tokens de sessão: refresh e reset de senha';
COMMENT ON COLUMN session_token.email IS 'Email (para reset de senha)';

CREATE INDEX ix_session_user_id ON session_token(user_id);
CREATE INDEX ix_session_token_hash ON session_token(token_hash);
CREATE INDEX ix_session_token_type ON session_token(token_type);
CREATE INDEX ix_session_expires_at ON session_token(expires_at);

-- ----------------------------------------------------------------------------
-- TABELA: support_registration
-- Propósito: Registros de cadastros feitos pelo time de suporte
-- ----------------------------------------------------------------------------
CREATE TABLE support_registration (
    id SERIAL PRIMARY KEY,
    request_number VARCHAR(50) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    external_user_email VARCHAR(255) NOT NULL,
    external_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    registered_by_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    registered_by_name VARCHAR(255) NOT NULL,
    status supportstatus NOT NULL DEFAULT 'ativo',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_reactivation BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE support_registration IS 'Registros de cadastros feitos pelo time de suporte';
COMMENT ON COLUMN support_registration.request_number IS 'Número do chamado ServiceNow';

CREATE INDEX ix_support_reg_request_number ON support_registration(request_number);
CREATE INDEX ix_support_reg_requester_email ON support_registration(requester_email);
CREATE INDEX ix_support_reg_external_email ON support_registration(external_user_email);
CREATE INDEX ix_support_reg_status ON support_registration(status);
CREATE INDEX ix_support_reg_created_at ON support_registration(created_at);

-- ----------------------------------------------------------------------------
-- TABELA: support_audit
-- Propósito: Auditoria de ações do time de suporte
-- ----------------------------------------------------------------------------
CREATE TABLE support_audit (
    id SERIAL PRIMARY KEY,
    action supportaction NOT NULL,
    description VARCHAR(500) NOT NULL,
    details TEXT,
    support_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    registration_id INTEGER REFERENCES support_registration(id) ON DELETE SET NULL,
    affected_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE support_audit IS 'Auditoria de ações do time de suporte';
COMMENT ON COLUMN support_audit.action IS 'CADASTRO, REATIVACAO, INATIVACAO, ALTERACAO, CONSULTA';

CREATE INDEX ix_supaudit_action ON support_audit(action);
CREATE INDEX ix_supaudit_support_user_id ON support_audit(support_user_id);
CREATE INDEX ix_supaudit_registration_id ON support_audit(registration_id);
CREATE INDEX ix_supaudit_affected_user_id ON support_audit(affected_user_id);
CREATE INDEX ix_supaudit_created_at ON support_audit(created_at);

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

-- Para verificar as tabelas criadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Para verificar os ENUMs criados:
-- SELECT typname FROM pg_type WHERE typcategory = 'E';
