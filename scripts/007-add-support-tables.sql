-- ============================================================
-- Script de Migracao: Adicionar tabelas e tipos para Suporte
-- Data: 2026-04-25
-- Descricao: Adiciona tipo de usuario 'support' e tabela de 
--            registro de cadastros de usuarios pelo suporte
-- ============================================================

-- ====================
-- ATUALIZAR ENUM typeuser para incluir 'support'
-- ====================
-- PostgreSQL nao permite ALTER TYPE ... ADD VALUE dentro de transacao
-- Por isso usamos DO block com exception handling

DO $$ 
BEGIN
    -- Adiciona 'support' ao enum typeuser se nao existir
    ALTER TYPE typeuser ADD VALUE IF NOT EXISTS 'support';
EXCEPTION 
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Valor support ja existe no enum typeuser';
END $$;

-- ====================
-- TABELA: support_registration
-- Registra cadastros de usuarios externos feitos pelo suporte
-- ====================
CREATE TABLE IF NOT EXISTS support_registration (
    id SERIAL PRIMARY KEY,
    
    -- Numero da solicitacao (ServiceNow ou outro sistema)
    request_number VARCHAR(50) NOT NULL,
    
    -- Email do solicitante interno (quem pediu o cadastro)
    requester_email VARCHAR(255) NOT NULL,
    
    -- Email do usuario externo que foi cadastrado
    external_user_email VARCHAR(255) NOT NULL,
    
    -- ID do usuario externo criado (referencia a tabela user)
    external_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    
    -- ID do atendente de suporte que realizou o cadastro
    registered_by_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    
    -- Nome do atendente (desnormalizado para historico)
    registered_by_name VARCHAR(255) NOT NULL,
    
    -- Status do cadastro
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' 
        CHECK (status IN ('ativo', 'pendente', 'inativo', 'cancelado')),
    
    -- Observacoes adicionais
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- Se foi reativado (usuario ja existia mas estava inativo)
    is_reactivation BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_support_reg_request_number ON support_registration(request_number);
CREATE INDEX IF NOT EXISTS idx_support_reg_requester_email ON support_registration(requester_email);
CREATE INDEX IF NOT EXISTS idx_support_reg_external_email ON support_registration(external_user_email);
CREATE INDEX IF NOT EXISTS idx_support_reg_registered_by ON support_registration(registered_by_id);
CREATE INDEX IF NOT EXISTS idx_support_reg_status ON support_registration(status);
CREATE INDEX IF NOT EXISTS idx_support_reg_created_at ON support_registration(created_at DESC);

-- ====================
-- TABELA: support_audit
-- Auditoria especifica de acoes do suporte
-- ====================
CREATE TABLE IF NOT EXISTS support_audit (
    id SERIAL PRIMARY KEY,
    
    -- Tipo de acao realizada
    action VARCHAR(50) NOT NULL 
        CHECK (action IN ('CADASTRO', 'REATIVACAO', 'INATIVACAO', 'ALTERACAO', 'CONSULTA')),
    
    -- Descricao da acao
    description VARCHAR(500) NOT NULL,
    
    -- Detalhes adicionais (JSON)
    details TEXT,
    
    -- ID do atendente que realizou a acao
    support_user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    
    -- ID do registro de suporte relacionado (se aplicavel)
    registration_id INTEGER REFERENCES support_registration(id) ON DELETE SET NULL,
    
    -- ID do usuario afetado pela acao (se aplicavel)
    affected_user_id INTEGER REFERENCES "user"(id) ON DELETE SET NULL,
    
    -- Informacoes de rastreamento
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_support_audit_action ON support_audit(action);
CREATE INDEX IF NOT EXISTS idx_support_audit_support_user ON support_audit(support_user_id);
CREATE INDEX IF NOT EXISTS idx_support_audit_registration ON support_audit(registration_id);
CREATE INDEX IF NOT EXISTS idx_support_audit_affected_user ON support_audit(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_support_audit_created_at ON support_audit(created_at DESC);

-- ====================
-- COMENTARIOS NAS TABELAS
-- ====================
COMMENT ON TABLE support_registration IS 'Registra cadastros de usuarios externos realizados pelo time de suporte';
COMMENT ON COLUMN support_registration.request_number IS 'Numero da solicitacao do ServiceNow ou outro sistema de tickets';
COMMENT ON COLUMN support_registration.requester_email IS 'Email do colaborador interno que solicitou o cadastro';
COMMENT ON COLUMN support_registration.external_user_email IS 'Email do usuario externo que foi cadastrado no sistema';
COMMENT ON COLUMN support_registration.is_reactivation IS 'Indica se foi uma reativacao de usuario previamente inativo';

COMMENT ON TABLE support_audit IS 'Auditoria de todas as acoes realizadas pelo time de suporte';
COMMENT ON COLUMN support_audit.details IS 'Dados adicionais em formato JSON (email anterior, motivo, etc)';

-- ====================
-- FIM DO SCRIPT
-- ====================
