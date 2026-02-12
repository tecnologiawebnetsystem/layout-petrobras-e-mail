-- =====================================================
-- Petrobras Email File Transfer System
-- Script 003: Dados de Demonstracao (Seed)
-- Compativel com qualquer PostgreSQL 14+
-- =====================================================

-- Limpar dados existentes (ordem importa por FKs)
DELETE FROM download_logs;
DELETE FROM email_history;
DELETE FROM otp_codes;
DELETE FROM notifications;
DELETE FROM audit_logs;
DELETE FROM expiration_logs;
DELETE FROM file_upload_steps;
DELETE FROM file_upload_items;
DELETE FROM file_uploads;
DELETE FROM sessions;
DELETE FROM users;

-- =====================================================
-- 1. USERS - Usuarios de demonstracao
-- Senha: demo123 -> bcrypt hash
-- =====================================================
INSERT INTO users (id, email, name, password_hash, user_type, job_title, department, office_location, mobile_phone, employee_id) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'kleber.goncalves.prestserv@petrobras.com.br',
    'Kleber Gonçalves',
    '$2b$10$dPzYBnMBNRvlMGCy1C8I3eQXh0HBkFMGvMuD1v5FoHhAq5fCr5MKi',
    'internal',
    'Analista de TI',
    'TIC/TIC-E&P',
    'EDISE - Rio de Janeiro',
    '(21) 99999-1111',
    'PREST-001'
),
(
    '22222222-2222-2222-2222-222222222222',
    'wagner.brazil@petrobras.com.br',
    'Wagner Gaspar Brazil',
    '$2b$10$dPzYBnMBNRvlMGCy1C8I3eQXh0HBkFMGvMuD1v5FoHhAq5fCr5MKi',
    'supervisor',
    'Gerente de Segurança da Informação',
    'TIC/TIC-CORP/SI',
    'EDISE - Rio de Janeiro',
    '(21) 99999-2222',
    'PETR-002'
),
(
    '33333333-3333-3333-3333-333333333333',
    'cliente@empresa.com',
    'Maria Santos',
    '$2b$10$dPzYBnMBNRvlMGCy1C8I3eQXh0HBkFMGvMuD1v5FoHhAq5fCr5MKi',
    'external',
    'Gerente de Projetos',
    'Empresa Parceira S.A.',
    'São Paulo',
    '(11) 99999-3333',
    NULL
),
(
    '44444444-4444-4444-4444-444444444444',
    'demo@exemplo.com.br',
    'Pedro Teste',
    '$2b$10$dPzYBnMBNRvlMGCy1C8I3eQXh0HBkFMGvMuD1v5FoHhAq5fCr5MKi',
    'external',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
);

-- Kleber reporta para Wagner
UPDATE users SET manager_id = '22222222-2222-2222-2222-222222222222' WHERE id = '11111111-1111-1111-1111-111111111111';

-- =====================================================
-- 2. FILE_UPLOADS - Envios de demonstracao
-- =====================================================

-- Upload 1: Aprovado (Kleber -> Maria)
INSERT INTO file_uploads (id, name, description, sender_id, recipient_email, status, expiration_hours, expires_at, current_step, total_steps, approval_date, approved_by, created_at) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Relatório Técnico Q4 2025',
    'Relatório técnico trimestral com dados de produção',
    '11111111-1111-1111-1111-111111111111',
    'cliente@empresa.com',
    'approved',
    48,
    CURRENT_TIMESTAMP + INTERVAL '48 hours',
    3,
    3,
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    'Wagner Gaspar Brazil',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Upload 2: Pendente (Kleber -> Maria)
INSERT INTO file_uploads (id, name, description, sender_id, recipient_email, status, expiration_hours, current_step, total_steps, created_at) VALUES
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Planilha de Custos - Projeto Alpha',
    'Planilha com detalhamento de custos do projeto',
    '11111111-1111-1111-1111-111111111111',
    'cliente@empresa.com',
    'pending',
    24,
    1,
    3,
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
);

-- Upload 3: Rejeitado (Kleber -> Maria)
INSERT INTO file_uploads (id, name, description, sender_id, recipient_email, status, expiration_hours, current_step, total_steps, rejection_reason, created_at) VALUES
(
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Dados Sensíveis - CONFIDENCIAL',
    'Documento com dados sensíveis para análise',
    '11111111-1111-1111-1111-111111111111',
    'cliente@empresa.com',
    'rejected',
    24,
    2,
    3,
    'Documento contém informações classificadas que não podem ser compartilhadas externamente.',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
);

-- Upload 4: Aprovado (Kleber -> Pedro) - para teste de externo vazio
INSERT INTO file_uploads (id, name, description, sender_id, recipient_email, status, expiration_hours, expires_at, current_step, total_steps, approval_date, approved_by, created_at) VALUES
(
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'Manual de Integração API v2',
    'Documentação técnica da API de integração',
    '11111111-1111-1111-1111-111111111111',
    'demo@exemplo.com.br',
    'approved',
    72,
    CURRENT_TIMESTAMP + INTERVAL '72 hours',
    3,
    3,
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    'Wagner Gaspar Brazil',
    CURRENT_TIMESTAMP - INTERVAL '12 hours'
);

-- =====================================================
-- 3. FILE_UPLOAD_ITEMS - Arquivos individuais
-- =====================================================

-- Items do Upload 1
INSERT INTO file_upload_items (upload_id, name, size, type) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'relatorio_tecnico_q4_2025.pdf', '2.4 MB', 'application/pdf'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'anexo_dados_producao.xlsx', '1.1 MB', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'graficos_resumo.png', '456 KB', 'image/png');

-- Items do Upload 2
INSERT INTO file_upload_items (upload_id, name, size, type) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'custos_projeto_alpha.xlsx', '3.2 MB', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'justificativa_orcamento.docx', '890 KB', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

-- Items do Upload 3
INSERT INTO file_upload_items (upload_id, name, size, type) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dados_sensiveis.zip', '15.7 MB', 'application/zip');

-- Items do Upload 4
INSERT INTO file_upload_items (upload_id, name, size, type) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'manual_api_v2.pdf', '4.5 MB', 'application/pdf'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'swagger_spec.json', '125 KB', 'application/json');

-- =====================================================
-- 4. FILE_UPLOAD_STEPS - Etapas do workflow
-- =====================================================

-- Steps do Upload 1 (todos aprovados)
INSERT INTO file_upload_steps (upload_id, title, status, step_order, completed_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Verificação de Segurança', 'approved', 1, CURRENT_TIMESTAMP - INTERVAL '23 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Aprovação do Supervisor', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Liberação para Download', 'approved', 3, CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Steps do Upload 2 (step 1 in_progress)
INSERT INTO file_upload_steps (upload_id, title, status, step_order) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Verificação de Segurança', 'in_progress', 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Aprovação do Supervisor', 'pending', 2),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Liberação para Download', 'pending', 3);

-- Steps do Upload 3 (step 2 rejected)
INSERT INTO file_upload_steps (upload_id, title, status, step_order, completed_date, comments) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Verificação de Segurança', 'approved', 1, CURRENT_TIMESTAMP - INTERVAL '47 hours', NULL),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Aprovação do Supervisor', 'rejected', 2, CURRENT_TIMESTAMP - INTERVAL '46 hours', 'Documento contém informações classificadas'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Liberação para Download', 'pending', 3, NULL, NULL);

-- Steps do Upload 4 (todos aprovados)
INSERT INTO file_upload_steps (upload_id, title, status, step_order, completed_date) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Verificação de Segurança', 'approved', 1, CURRENT_TIMESTAMP - INTERVAL '11 hours'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Aprovação do Supervisor', 'approved', 2, CURRENT_TIMESTAMP - INTERVAL '5 hours'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Liberação para Download', 'approved', 3, CURRENT_TIMESTAMP - INTERVAL '5 hours');

-- =====================================================
-- 5. EXPIRATION_LOGS
-- =====================================================
INSERT INTO expiration_logs (upload_id, changed_by, previous_value, new_value, reason) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Wagner Gaspar Brazil', 24, 48, 'Estendido para permitir download no prazo adequado');

-- =====================================================
-- 6. AUDIT_LOGS - Logs de auditoria de exemplo
-- =====================================================
INSERT INTO audit_logs (action, level, user_id, user_name, user_email, user_type, user_employee_id, target_id, target_name, description, ip_address, created_at) VALUES
('login', 'success', '11111111-1111-1111-1111-111111111111', 'Kleber Gonçalves', 'kleber.goncalves.prestserv@petrobras.com.br', 'internal', 'PREST-001', NULL, NULL, 'Login realizado com sucesso', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('upload', 'success', '11111111-1111-1111-1111-111111111111', 'Kleber Gonçalves', 'kleber.goncalves.prestserv@petrobras.com.br', 'internal', 'PREST-001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Relatório Técnico Q4 2025', 'Upload de arquivos realizado: Relatório Técnico Q4 2025 (3 arquivos)', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('approve', 'success', '22222222-2222-2222-2222-222222222222', 'Wagner Gaspar Brazil', 'wagner.brazil@petrobras.com.br', 'supervisor', 'PETR-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Relatório Técnico Q4 2025', 'Envio aprovado pelo supervisor', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('upload', 'success', '11111111-1111-1111-1111-111111111111', 'Kleber Gonçalves', 'kleber.goncalves.prestserv@petrobras.com.br', 'internal', 'PREST-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Planilha de Custos - Projeto Alpha', 'Upload de arquivos realizado: Planilha de Custos - Projeto Alpha (2 arquivos)', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('reject', 'warning', '22222222-2222-2222-2222-222222222222', 'Wagner Gaspar Brazil', 'wagner.brazil@petrobras.com.br', 'supervisor', 'PETR-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Dados Sensíveis - CONFIDENCIAL', 'Envio rejeitado: Documento contém informações classificadas', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '46 hours'),
('login', 'success', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'cliente@empresa.com', 'external', NULL, NULL, NULL, 'Login externo via código de verificação', '203.0.113.45', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('download', 'success', '33333333-3333-3333-3333-333333333333', 'Maria Santos', 'cliente@empresa.com', 'external', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'relatorio_tecnico_q4_2025.pdf', 'Download realizado: relatorio_tecnico_q4_2025.pdf', '203.0.113.45', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
('expiration_change', 'info', '22222222-2222-2222-2222-222222222222', 'Wagner Gaspar Brazil', 'wagner.brazil@petrobras.com.br', 'supervisor', 'PETR-002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Relatório Técnico Q4 2025', 'Prazo de expiração alterado de 24h para 48h', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('login', 'error', NULL, NULL, 'hacker@malicious.com', NULL, NULL, NULL, NULL, 'Tentativa de login com credenciais inválidas', '45.33.32.156', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
('upload', 'success', '11111111-1111-1111-1111-111111111111', 'Kleber Gonçalves', 'kleber.goncalves.prestserv@petrobras.com.br', 'internal', 'PREST-001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Manual de Integração API v2', 'Upload de arquivos realizado: Manual de Integração API v2 (2 arquivos)', '192.168.1.100', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
('approve', 'success', '22222222-2222-2222-2222-222222222222', 'Wagner Gaspar Brazil', 'wagner.brazil@petrobras.com.br', 'supervisor', 'PETR-002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Manual de Integração API v2', 'Envio aprovado pelo supervisor', '192.168.1.101', CURRENT_TIMESTAMP - INTERVAL '5 hours');

-- =====================================================
-- 7. NOTIFICATIONS - Notificacoes de exemplo
-- =====================================================
INSERT INTO notifications (user_id, type, priority, title, message, read, action_label, action_url) VALUES
-- Para Kleber (interno)
('11111111-1111-1111-1111-111111111111', 'approval', 'high', 'Envio Aprovado', 'Seu envio "Relatório Técnico Q4 2025" foi aprovado por Wagner Gaspar Brazil.', true, 'Ver detalhes', '/upload'),
('11111111-1111-1111-1111-111111111111', 'rejection', 'critical', 'Envio Rejeitado', 'Seu envio "Dados Sensíveis - CONFIDENCIAL" foi rejeitado. Motivo: Documento contém informações classificadas.', false, 'Ver detalhes', '/upload'),
('11111111-1111-1111-1111-111111111111', 'download', 'medium', 'Arquivo Baixado', 'Maria Santos baixou o arquivo "relatorio_tecnico_q4_2025.pdf" do envio "Relatório Técnico Q4 2025".', false, 'Ver atividade', '/upload'),
-- Para Wagner (supervisor)
('22222222-2222-2222-2222-222222222222', 'pending', 'high', 'Novo Envio Pendente', 'Kleber Gonçalves enviou "Planilha de Custos - Projeto Alpha" para aprovação.', false, 'Revisar', '/supervisor'),
('22222222-2222-2222-2222-222222222222', 'security', 'medium', 'Tentativa de Acesso Bloqueada', 'Tentativa de login com credenciais inválidas detectada de IP 45.33.32.156.', false, 'Ver logs', '/audit'),
-- Para Maria (externa)
('33333333-3333-3333-3333-333333333333', 'file_available', 'high', 'Arquivo Disponível', 'Você tem um novo arquivo disponível para download: "Relatório Técnico Q4 2025".', false, 'Baixar', '/download');

-- =====================================================
-- 8. EMAIL_HISTORY - Historico de emails
-- =====================================================
INSERT INTO email_history (message_id, to_email, to_name, subject, body, status, sent_at, delivered_at) VALUES
('msg-001-abc', 'cliente@empresa.com', 'Maria Santos', 'Novo arquivo disponível para download', 'Olá Maria, um novo arquivo está disponível para download no sistema Petrobras.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '23 hours', CURRENT_TIMESTAMP - INTERVAL '23 hours'),
('msg-002-def', 'cliente@empresa.com', 'Maria Santos', 'Código de verificação - Petrobras', 'Seu código de verificação é: 123456', 'delivered', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
('msg-003-ghi', 'wagner.brazil@petrobras.com.br', 'Wagner Gaspar Brazil', 'Novo envio aguardando aprovação', 'Um novo envio de Kleber Gonçalves requer sua aprovação.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('msg-004-jkl', 'kleber.goncalves.prestserv@petrobras.com.br', 'Kleber Gonçalves', 'Envio rejeitado - Dados Sensíveis', 'Seu envio foi rejeitado pelo supervisor. Motivo: Documento contém informações classificadas.', 'delivered', CURRENT_TIMESTAMP - INTERVAL '46 hours', CURRENT_TIMESTAMP - INTERVAL '46 hours'),
('msg-005-mno', 'demo@exemplo.com.br', 'Pedro Teste', 'Novo arquivo disponível para download', 'Olá Pedro, um novo arquivo está disponível: Manual de Integração API v2.', 'sent', CURRENT_TIMESTAMP - INTERVAL '5 hours', NULL);

-- =====================================================
-- 9. DOWNLOAD_LOGS - Logs de downloads
-- =====================================================
INSERT INTO download_logs (upload_id, document_name, downloaded_by_email, ip_address, user_agent) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'relatorio_tecnico_q4_2025.pdf', 'cliente@empresa.com', '203.0.113.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'anexo_dados_producao.xlsx', 'cliente@empresa.com', '203.0.113.45', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
