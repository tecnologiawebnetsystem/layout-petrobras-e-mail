-- ============================================================
-- Seed data para PostgreSQL - compativel com modelos Python
-- Dados de demonstracao para desenvolvimento
-- ============================================================

-- Limpar dados existentes (ordem correta por FKs)
TRUNCATE email_log, notification, audit, token_access, share_file, share, restricted_file, areasupervisor, shared_area, credential_local, "user" RESTART IDENTITY CASCADE;

-- ====================
-- USUARIOS
-- ====================
-- Senhas hasheadas com SHA-256 (salt+password) conforme CredentialLocal.set_password()
-- Para demo, usamos hashes pre-computados

INSERT INTO "user" (id, type, name, email, phone, department, job_title, status, created_at) VALUES
(1, 'internal', 'Kleber Linux', 'kleber@petrobras.com.br', '(21) 99999-0001', 'TI', 'Desenvolvedor', TRUE, NOW()),
(2, 'supervisor', 'Wagner Silva', 'wagner@petrobras.com.br', '(21) 99999-0002', 'Seguranca', 'Supervisor', TRUE, NOW()),
(3, 'externo', 'Maria Santos', 'cliente@empresa.com', '(21) 99999-0003', NULL, NULL, TRUE, NOW()),
(4, 'externo', 'Pedro Teste', 'demo@exemplo.com.br', '(21) 99999-0004', NULL, NULL, TRUE, NOW());

-- Resetar sequence do user
SELECT setval(pg_get_serial_sequence('"user"', 'id'), 4);

-- ====================
-- CREDENCIAIS (senha: demo123 para todos)
-- Salt fixo para seed: 'devsalt1234567890abcdef'
-- Hash SHA-256 de 'devsalt1234567890abcdefdemo123'
-- ====================
INSERT INTO credential_local (user_id, password_hash, salt, failed_attempts, created_at) VALUES
(1, '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'devsalt1234567890abcdef', 0, NOW()),
(2, '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'devsalt1234567890abcdef', 0, NOW());

-- ====================
-- AREAS COMPARTILHADAS
-- ====================
INSERT INTO shared_area (id, name, prefix_s3, description, status, applicant_id, created_at) VALUES
(1, 'Relatorios Financeiros Q4', 'areas/relatorios-q4/', 'Relatorios financeiros do quarto trimestre', TRUE, 1, NOW()),
(2, 'Documentos Contratuais', 'areas/contratos/', 'Contratos e documentos juridicos', TRUE, 1, NOW());

SELECT setval(pg_get_serial_sequence('shared_area', 'id'), 2);

-- ====================
-- SUPERVISORES DE AREAS
-- ====================
INSERT INTO areasupervisor (area_id, supervisor_id) VALUES
(1, 2),
(2, 2);

-- ====================
-- ARQUIVOS RESTRITOS
-- ====================
INSERT INTO restricted_file (id, area_id, name, key_s3, size_bytes, mime_type, upload_id, status, created_at) VALUES
(1, 1, 'relatorio-financeiro-q4.pdf', 'areas/relatorios-q4/relatorio-financeiro-q4.pdf', 2048576, 'application/pdf', 1, TRUE, NOW()),
(2, 1, 'planilha-custos.xlsx', 'areas/relatorios-q4/planilha-custos.xlsx', 1024000, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1, TRUE, NOW()),
(3, 2, 'contrato-servicos-2025.pdf', 'areas/contratos/contrato-servicos-2025.pdf', 3145728, 'application/pdf', 1, TRUE, NOW());

SELECT setval(pg_get_serial_sequence('restricted_file', 'id'), 3);

-- ====================
-- COMPARTILHAMENTOS
-- ====================
INSERT INTO share (id, name, description, area_id, external_email, status, consumption_policy, expiration_hours, expires_at, created_at, created_by_id, approver_id, approved_at) VALUES
(1, 'Envio Relatorios Q4', 'Relatorios financeiros para revisao externa', 1, 'cliente@empresa.com', 'aprovado', 'apos_todos', 72, NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 hour', 1, 2, NOW() - INTERVAL '30 minutes'),
(2, 'Contrato para assinatura', 'Contrato de servicos para assinatura digital', 2, 'demo@exemplo.com.br', 'pendente', 'apos_primeiro', 48, NULL, NOW(), 1, NULL, NULL);

SELECT setval(pg_get_serial_sequence('share', 'id'), 2);

-- ====================
-- SHARE FILES (vinculo share <-> arquivo)
-- ====================
INSERT INTO share_file (share_id, file_id, downloaded, downloaded_at) VALUES
(1, 1, FALSE, NULL),
(1, 2, FALSE, NULL),
(2, 3, FALSE, NULL);

-- ====================
-- AUDIT LOGS
-- ====================
INSERT INTO audit (action, level, user_id, share_id, file_id, ip_address, user_agent, detail) VALUES
('LOGIN', 'success', 1, NULL, NULL, '192.168.1.100', 'Mozilla/5.0', 'Login de usuario interno'),
('UPLOAD', 'success', 1, NULL, 1, '192.168.1.100', 'Mozilla/5.0', 'Upload de relatorio-financeiro-q4.pdf'),
('UPLOAD', 'success', 1, NULL, 2, '192.168.1.100', 'Mozilla/5.0', 'Upload de planilha-custos.xlsx'),
('CRIAR_COMPARTILHAMENTO', 'success', 1, 1, NULL, '192.168.1.100', 'Mozilla/5.0', 'Compartilhamento criado para cliente@empresa.com'),
('APROVAR_COMPARTILHAMENTO', 'success', 2, 1, NULL, '192.168.1.101', 'Mozilla/5.0', 'Compartilhamento aprovado pelo supervisor'),
('LOGIN', 'success', 2, NULL, NULL, '192.168.1.101', 'Mozilla/5.0', 'Login de supervisor');

-- ====================
-- NOTIFICACOES
-- ====================
INSERT INTO notification (user_id, type, priority, title, message, read, created_at) VALUES
(1, 'success', 'medium', 'Upload concluido', 'Seus arquivos foram enviados com sucesso.', TRUE, NOW() - INTERVAL '2 hours'),
(1, 'approval', 'high', 'Compartilhamento aprovado', 'O supervisor Wagner Silva aprovou seu compartilhamento "Envio Relatorios Q4".', FALSE, NOW() - INTERVAL '30 minutes'),
(2, 'info', 'high', 'Nova solicitacao de aprovacao', 'Kleber Linux solicitou aprovacao para compartilhar arquivos com cliente@empresa.com.', TRUE, NOW() - INTERVAL '1 hour'),
(2, 'info', 'high', 'Nova solicitacao pendente', 'Kleber Linux solicitou aprovacao para "Contrato para assinatura".', FALSE, NOW()),
(3, 'download', 'medium', 'Arquivos disponiveis', 'Voce tem 2 arquivos disponiveis para download.', FALSE, NOW() - INTERVAL '25 minutes');

-- ====================
-- EMAIL LOGS
-- ====================
INSERT INTO email_log (message_id, email_type, from_email, to_email, subject, body_preview, status, sent_at, delivered_at, user_id, share_id) VALUES
('msg-001-demo', 'approval_request', 'noreply@petrobras.com.br', 'wagner@petrobras.com.br', 'Solicitacao de Aprovacao - Envio Relatorios Q4', 'Kleber Linux solicita aprovacao para compartilhar arquivos...', 'delivered', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '59 minutes', 1, 1),
('msg-002-demo', 'approval_granted', 'noreply@petrobras.com.br', 'kleber@petrobras.com.br', 'Compartilhamento Aprovado', 'Seu compartilhamento foi aprovado pelo supervisor Wagner Silva.', 'delivered', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '29 minutes', 2, 1),
('msg-003-demo', 'file_share', 'noreply@petrobras.com.br', 'cliente@empresa.com', 'Arquivos disponveis para download', 'Voce recebeu 2 arquivos para download da Petrobras.', 'delivered', NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '27 minutes', 1, 1);

-- ====================
-- FIM DO SEED
-- ====================
