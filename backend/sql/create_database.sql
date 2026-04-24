-- =============================================================================
-- CSA – Sistema de Compartilhamento de Arquivos
-- Script DDL PostgreSQL – Criação completa do esquema do banco de dados
-- Gerado a partir dos modelos SQLModel em csa-backend/app/models/
-- Data: 2026-04-22
-- =============================================================================
--
-- Como usar:
--   psql -U <usuario> -d <banco> -f create_database.sql
--
-- Este script é idempotente: usa DROP ... IF EXISTS com CASCADE antes de cada
-- CREATE, portanto pode ser reaplicado em um banco vazio sem erros.
-- ATENÇÃO: em banco com dados reais, remova os blocos DROP abaixo.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- LIMPEZA (remova se não quiser apagar dados existentes)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS session_token     CASCADE;
DROP TABLE IF EXISTS notification      CASCADE;
DROP TABLE IF EXISTS email_log         CASCADE;
DROP TABLE IF EXISTS credential_local  CASCADE;
DROP TABLE IF EXISTS audit             CASCADE;
DROP TABLE IF EXISTS token_access      CASCADE;
DROP TABLE IF EXISTS share_file        CASCADE;
DROP TABLE IF EXISTS restricted_file   CASCADE;
DROP TABLE IF EXISTS share             CASCADE;
DROP TABLE IF EXISTS areasupervisor    CASCADE;
DROP TABLE IF EXISTS shared_area       CASCADE;
DROP TABLE IF EXISTS "user"            CASCADE;

DROP TYPE IF EXISTS session_token_type   CASCADE;
DROP TYPE IF EXISTS type_token           CASCADE;
DROP TYPE IF EXISTS token_consumption    CASCADE;
DROP TYPE IF EXISTS share_status         CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS notification_type    CASCADE;
DROP TYPE IF EXISTS email_type_enum      CASCADE;
DROP TYPE IF EXISTS email_status         CASCADE;
DROP TYPE IF EXISTS type_level           CASCADE;
DROP TYPE IF EXISTS type_user            CASCADE;

-- ---------------------------------------------------------------------------
-- TIPOS ENUMERADOS
-- ---------------------------------------------------------------------------

-- Tipo de usuário: externo (terceiro) ou interno (colaborador Petrobras)
CREATE TYPE type_user AS ENUM ('externo', 'internal');

-- Nível de severidade para auditoria
CREATE TYPE type_level AS ENUM ('info', 'success', 'warning', 'error');

-- Status de entrega de e-mail (SES webhook)
CREATE TYPE email_status AS ENUM (
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

-- Finalidade do e-mail enviado
CREATE TYPE email_type_enum AS ENUM (
    'file_share',
    'otp',
    'approval_request',
    'approval_granted',
    'approval_rejected',
    'expiration_warning',
    'download_confirmation',
    'password_reset',
    'welcome',
    'system'
);

-- Tipo de notificação interna
CREATE TYPE notification_type AS ENUM (
    'info',
    'success',
    'warning',
    'error',
    'approval',
    'rejection',
    'download',
    'expiration'
);

-- Prioridade da notificação interna
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Ciclo de vida de um compartilhamento
CREATE TYPE share_status AS ENUM (
    'pendente',
    'ativo',
    'aprovado',
    'rejeitado',
    'concluido',
    'expirado',
    'cancelado'
);

-- Política de consumo do token de acesso
CREATE TYPE token_consumption AS ENUM ('apos_todos', 'apos_primeiro');

-- Tipo de token de sessão (refresh ou reset de senha)
CREATE TYPE session_token_type AS ENUM ('refresh', 'reset');

-- Tipo de token de acesso ao compartilhamento
CREATE TYPE type_token AS ENUM ('otp', 'access');

-- ---------------------------------------------------------------------------
-- TABELAS
-- Ordem de criação respeita as dependências de chave estrangeira.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. "user" – Usuários do sistema (internos e externos)
-- ---------------------------------------------------------------------------
-- NOTA: "user" é palavra reservada no PostgreSQL; o nome está entre aspas.
-- ---------------------------------------------------------------------------
CREATE TABLE "user" (
    id            SERIAL        PRIMARY KEY,
    type          type_user     NOT NULL,
    name          VARCHAR(255)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    phone         VARCHAR(20),
    department    VARCHAR(255),
    job_title     VARCHAR(255),
    employee_id   VARCHAR(50),
    photo_url     VARCHAR(500),
    -- Auto-referência: gestor imediato do usuário (hierarquia ServiceNow)
    manager_id    INTEGER       REFERENCES "user"(id) ON DELETE SET NULL,
    is_supervisor BOOLEAN       NOT NULL DEFAULT FALSE,
    status        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_login    TIMESTAMPTZ
);

CREATE INDEX idx_user_type       ON "user"(type);
CREATE INDEX idx_user_email      ON "user"(email);
CREATE INDEX idx_user_manager_id ON "user"(manager_id);

-- ---------------------------------------------------------------------------
-- 2. shared_area – Áreas de compartilhamento gerenciadas por usuários internos
-- ---------------------------------------------------------------------------
CREATE TABLE shared_area (
    id           SERIAL        PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    -- Prefixo do "diretório" no S3 que mapeia esta área
    prefix_s3    VARCHAR(500)  NOT NULL,
    description  TEXT,
    status       BOOLEAN       NOT NULL DEFAULT TRUE,
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- Solicitante: usuário interno que criou a área
    applicant_id INTEGER       NOT NULL
                               REFERENCES "user"(id) ON DELETE RESTRICT
);

CREATE INDEX idx_shared_area_applicant_id ON shared_area(applicant_id);

-- ---------------------------------------------------------------------------
-- 3. areasupervisor – Tabela pivô N:N (shared_area ↔ user supervisores)
-- ---------------------------------------------------------------------------
CREATE TABLE areasupervisor (
    id            SERIAL  PRIMARY KEY,
    area_id       INTEGER NOT NULL REFERENCES shared_area(id) ON DELETE CASCADE,
    supervisor_id INTEGER NOT NULL REFERENCES "user"(id)      ON DELETE CASCADE,
    UNIQUE (area_id, supervisor_id)
);

CREATE INDEX idx_areasupervisor_area_id       ON areasupervisor(area_id);
CREATE INDEX idx_areasupervisor_supervisor_id ON areasupervisor(supervisor_id);

-- ---------------------------------------------------------------------------
-- 4. share – Compartilhamentos de arquivos destinados a um e-mail externo
-- ---------------------------------------------------------------------------
CREATE TABLE share (
    id                 SERIAL            PRIMARY KEY,
    name               VARCHAR(255),
    description        VARCHAR(1000),
    area_id            INTEGER           REFERENCES shared_area(id) ON DELETE SET NULL,
    external_email     VARCHAR(255)      NOT NULL,
    status             share_status      NOT NULL DEFAULT 'pendente',
    consumption_policy token_consumption NOT NULL DEFAULT 'apos_todos',
    -- Validade solicitada pelo criador (em horas); convertida em expires_at na aprovação
    expiration_hours   INTEGER           NOT NULL DEFAULT 72,
    expires_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    -- Criador do compartilhamento (usuário interno)
    created_by_id      INTEGER           NOT NULL
                                         REFERENCES "user"(id) ON DELETE RESTRICT,
    -- Aprovador (supervisor da área)
    approver_id        INTEGER           REFERENCES "user"(id) ON DELETE SET NULL,
    approved_at        TIMESTAMPTZ,
    rejected_at        TIMESTAMPTZ,
    rejection_reason   VARCHAR(500),
    approval_comments  VARCHAR(500)
);

CREATE INDEX idx_share_area_id        ON share(area_id);
CREATE INDEX idx_share_external_email ON share(external_email);
CREATE INDEX idx_share_status         ON share(status);
CREATE INDEX idx_share_created_by_id  ON share(created_by_id);

-- ---------------------------------------------------------------------------
-- 5. restricted_file – Arquivos restritos vinculados a uma área no S3
-- ---------------------------------------------------------------------------
CREATE TABLE restricted_file (
    id          SERIAL         PRIMARY KEY,
    area_id     INTEGER        NOT NULL REFERENCES shared_area(id) ON DELETE RESTRICT,
    name        VARCHAR(255)   NOT NULL,
    -- Chave (path) do objeto no bucket S3
    key_s3      VARCHAR(1000)  NOT NULL,
    size_bytes  BIGINT,
    mime_type   VARCHAR(127),
    -- Checksum SHA-256 ou MD5 para verificação de integridade
    checksum    VARCHAR(128),
    -- Usuário que realizou o upload
    upload_id   INTEGER        REFERENCES "user"(id) ON DELETE SET NULL,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    status      BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_restricted_file_area_id   ON restricted_file(area_id);
CREATE INDEX idx_restricted_file_upload_id ON restricted_file(upload_id);

-- ---------------------------------------------------------------------------
-- 6. share_file – Associação entre compartilhamento e arquivo (N:N com estado)
-- ---------------------------------------------------------------------------
CREATE TABLE share_file (
    id            SERIAL      PRIMARY KEY,
    share_id      INTEGER     NOT NULL REFERENCES share(id)           ON DELETE CASCADE,
    file_id       INTEGER     NOT NULL REFERENCES restricted_file(id) ON DELETE RESTRICT,
    downloaded    BOOLEAN     NOT NULL DEFAULT FALSE,
    downloaded_at TIMESTAMPTZ,
    UNIQUE (share_id, file_id)
);

CREATE INDEX idx_share_file_share_id   ON share_file(share_id);
CREATE INDEX idx_share_file_file_id    ON share_file(file_id);
CREATE INDEX idx_share_file_downloaded ON share_file(downloaded);

-- ---------------------------------------------------------------------------
-- 7. token_access – Tokens OTP e de acesso emitidos por compartilhamento
-- ---------------------------------------------------------------------------
CREATE TABLE token_access (
    id            SERIAL      PRIMARY KEY,
    type          type_token  NOT NULL,
    -- Para tipo ACCESS: token url-safe em texto claro
    token         VARCHAR(512) UNIQUE,
    -- Para tipo OTP: hash do código de 6 dígitos
    token_hash    VARCHAR(512),
    user_id       INTEGER     NOT NULL REFERENCES "user"(id)  ON DELETE CASCADE,
    share_id      INTEGER     NOT NULL REFERENCES share(id)   ON DELETE CASCADE,
    expires_at    TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used          BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Controle de rate-limit / bloqueio após tentativas excessivas
    attempts      INTEGER     NOT NULL DEFAULT 0,
    blocked_until TIMESTAMPTZ
);

CREATE INDEX idx_token_access_type          ON token_access(type);
CREATE INDEX idx_token_access_token         ON token_access(token);
CREATE INDEX idx_token_access_user_id       ON token_access(user_id);
CREATE INDEX idx_token_access_share_id      ON token_access(share_id);
CREATE INDEX idx_token_access_used          ON token_access(used);
CREATE INDEX idx_token_access_attempts      ON token_access(attempts);
CREATE INDEX idx_token_access_blocked_until ON token_access(blocked_until);

-- ---------------------------------------------------------------------------
-- 8. audit – Registro imutável de auditoria de todas as ações do sistema
-- ---------------------------------------------------------------------------
CREATE TABLE audit (
    id         SERIAL      PRIMARY KEY,
    -- Ex.: "UPLOAD", "EMITIR_TOKEN", "DOWNLOAD", "ACK", "EXCLUIR_AREA"
    action     VARCHAR(100) NOT NULL,
    level      type_level   NOT NULL DEFAULT 'success',
    -- Referências opcionais (nulas em ações de sistema sem contexto)
    user_id    INTEGER      REFERENCES "user"(id)          ON DELETE SET NULL,
    share_id   INTEGER      REFERENCES share(id)           ON DELETE SET NULL,
    file_id    INTEGER      REFERENCES restricted_file(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    -- JSON / texto com metadados adicionais da ação
    detail     TEXT
);

CREATE INDEX idx_audit_level    ON audit(level);
CREATE INDEX idx_audit_user_id  ON audit(user_id);
CREATE INDEX idx_audit_share_id ON audit(share_id);
CREATE INDEX idx_audit_file_id  ON audit(file_id);

-- ---------------------------------------------------------------------------
-- 9. credential_local – Credenciais de senha para auth local (sem Entra ID)
-- ---------------------------------------------------------------------------
CREATE TABLE credential_local (
    id              SERIAL       PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    -- Hash SHA-256 da senha com salt
    password_hash   VARCHAR(64)  NOT NULL,
    salt            VARCHAR(32)  NOT NULL,
    failed_attempts INTEGER      NOT NULL DEFAULT 0,
    blocked_until   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_credential_local_user_id         ON credential_local(user_id);
CREATE INDEX idx_credential_local_failed_attempts ON credential_local(failed_attempts);
CREATE INDEX idx_credential_local_blocked_until   ON credential_local(blocked_until);

-- ---------------------------------------------------------------------------
-- 10. email_log – Rastreamento de e-mails enviados via AWS SES
-- ---------------------------------------------------------------------------
CREATE TABLE email_log (
    id             SERIAL          PRIMARY KEY,
    -- ID retornado pelo SES (usado para correlacionar webhooks SNS)
    message_id     VARCHAR(255)    NOT NULL UNIQUE,
    email_type     email_type_enum NOT NULL,
    from_email     VARCHAR(255)    NOT NULL,
    to_email       VARCHAR(255)    NOT NULL,
    subject        VARCHAR(500)    NOT NULL,
    body_preview   VARCHAR(500),
    status         email_status    NOT NULL DEFAULT 'pending',
    -- Timestamps de ciclo de vida do e-mail
    sent_at        TIMESTAMPTZ,
    delivered_at   TIMESTAMPTZ,
    opened_at      TIMESTAMPTZ,
    clicked_at     TIMESTAMPTZ,
    bounced_at     TIMESTAMPTZ,
    error_message  VARCHAR(1000),
    error_code     VARCHAR(50),
    user_id        INTEGER         REFERENCES "user"(id)  ON DELETE SET NULL,
    share_id       INTEGER         REFERENCES share(id)   ON DELETE SET NULL,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    -- Metadados extras em JSON serializado
    extra_metadata TEXT
);

CREATE INDEX idx_email_log_message_id ON email_log(message_id);
CREATE INDEX idx_email_log_email_type ON email_log(email_type);
CREATE INDEX idx_email_log_to_email   ON email_log(to_email);
CREATE INDEX idx_email_log_status     ON email_log(status);
CREATE INDEX idx_email_log_user_id    ON email_log(user_id);
CREATE INDEX idx_email_log_share_id   ON email_log(share_id);

-- ---------------------------------------------------------------------------
-- 11. notification – Notificações internas entregues ao painel do usuário
-- ---------------------------------------------------------------------------
CREATE TABLE notification (
    id             SERIAL                PRIMARY KEY,
    user_id        INTEGER               NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type           notification_type     NOT NULL DEFAULT 'info',
    priority       notification_priority NOT NULL DEFAULT 'medium',
    title          VARCHAR(255)          NOT NULL,
    message        VARCHAR(1000)         NOT NULL,
    read           BOOLEAN               NOT NULL DEFAULT FALSE,
    action_label   VARCHAR(100),
    action_url     VARCHAR(500),
    -- Metadados extras em JSON serializado
    extra_metadata TEXT,
    created_at     TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_type    ON notification(type);
CREATE INDEX idx_notification_read    ON notification(read);

-- ---------------------------------------------------------------------------
-- 12. session_token – Tokens de sessão persistidos (refresh / reset de senha)
-- ---------------------------------------------------------------------------
CREATE TABLE session_token (
    id          SERIAL             PRIMARY KEY,
    user_id     INTEGER            NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    -- Hash do token (o valor em texto claro nunca é armazenado)
    token_hash  VARCHAR(512)       NOT NULL,
    token_type  session_token_type NOT NULL,
    expires_at  TIMESTAMPTZ        NOT NULL,
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    used        BOOLEAN            NOT NULL DEFAULT FALSE,
    revoked     BOOLEAN            NOT NULL DEFAULT FALSE,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    -- E-mail associado ao token de reset (pode diferir do cadastro)
    email       VARCHAR(255)
);

CREATE INDEX idx_session_token_user_id    ON session_token(user_id);
CREATE INDEX idx_session_token_token_hash ON session_token(token_hash);
CREATE INDEX idx_session_token_token_type ON session_token(token_type);

-- =============================================================================
-- FIM DO SCRIPT
-- =============================================================================
