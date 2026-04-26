-- Seed data para o Roadmap
-- Insere dados iniciais nas tabelas do roadmap

-- Limpar dados existentes (ordem importa por causa das FKs)
DELETE FROM roadmap_entrega_dependencias;
DELETE FROM roadmap_fase_dependencias;
DELETE FROM roadmap_entregas;
DELETE FROM roadmap_fases;
DELETE FROM roadmap_marcos;
DELETE FROM roadmap_burndown;

-- Inserir Fases
INSERT INTO roadmap_fases (id, nome, periodo, data_inicio, data_fim, status, progresso, cor, descricao, responsavel, risco, ordem) VALUES
(1, 'Fase 1 - Front-End', 'Novembro - Dezembro 2025', '2025-11-01', '2025-12-31', 'concluido', 100, 'from-blue-500 to-cyan-500', 'Desenvolvimento completo do Front-End com Next.js, telas e componentes', 'Time Front-End', 'baixo', 1),
(2, 'Fase 2 - Back-End', 'Dezembro 2025 - Janeiro 2026', '2025-12-01', '2026-01-31', 'concluido', 100, 'from-green-500 to-emerald-500', 'Desenvolvimento completo do Back-End Python com FastAPI e servicos AWS', 'Time Back-End', 'baixo', 2),
(3, 'Fase 3 - Integracao Front + Back', 'Janeiro - Fevereiro 2026', '2026-01-15', '2026-02-28', 'em_progresso', 40, 'from-purple-500 to-indigo-500', 'Integracao entre Front-End e Back-End, fluxos completos e testes', 'Time Full-Stack', 'medio', 3),
(4, 'Fase 4 - Docker e Containerizacao', 'Fevereiro - Marco 2026', '2026-02-15', '2026-03-15', 'pendente', 0, 'from-cyan-500 to-teal-500', 'Containerizacao da aplicacao com Docker para ambientes consistentes', 'Time DevOps', 'baixo', 4),
(5, 'Fase 5 - AWS e Infraestrutura', 'Marco 2026', '2026-03-01', '2026-03-31', 'pendente', 0, 'from-orange-500 to-amber-500', 'Configuracao da infraestrutura AWS (ECS, ECR, Load Balancer, etc.)', 'Time DevOps', 'medio', 5),
(6, 'Fase 6 - Deploy Desenvolvimento', 'Marco - Abril 2026', '2026-03-20', '2026-04-10', 'pendente', 0, 'from-sky-500 to-blue-500', 'Deploy e validacao no ambiente de Desenvolvimento', 'Time DevOps + QA', 'baixo', 6),
(7, 'Fase 7 - Deploy Homologacao', 'Abril 2026', '2026-04-05', '2026-04-25', 'pendente', 0, 'from-yellow-500 to-orange-500', 'Deploy e validacao no ambiente de Homologacao com usuarios', 'Time DevOps + QA + Usuarios', 'alto', 7),
(8, 'Fase 8 - Deploy Producao', 'Final de Abril 2026', '2026-04-20', '2026-04-30', 'pendente', 0, 'from-red-500 to-rose-500', 'Deploy final em Producao e Go-Live do sistema', 'Time DevOps + Todos', 'alto', 8);

-- Reset sequence
SELECT setval('roadmap_fases_id_seq', 8, true);

-- Inserir dependencias entre fases
INSERT INTO roadmap_fase_dependencias (fase_id, depende_de_fase_id) VALUES
(2, 1),
(3, 1), (3, 2),
(4, 3),
(5, 4),
(6, 5),
(7, 6),
(8, 7);

-- Inserir Entregas da Fase 1
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(1, 'Setup do projeto Next.js', 'concluido', 'tecnico', '2025-11-05', '2025-11-03', 'Configuracao inicial do projeto concluida com sucesso', 1),
(1, 'Configuracao Tailwind + shadcn/ui', 'concluido', 'tecnico', '2025-11-10', '2025-11-08', NULL, 2),
(1, 'Tela de Login com Microsoft Entra ID', 'concluido', 'frontend', '2025-11-20', '2025-11-18', NULL, 3),
(1, 'Tela de Upload de Arquivos', 'concluido', 'frontend', '2025-11-25', '2025-11-24', NULL, 4),
(1, 'Tela do Supervisor (Aprovacoes)', 'concluido', 'frontend', '2025-12-05', '2025-12-03', NULL, 5),
(1, 'Tela de Download Externo', 'concluido', 'frontend', '2025-12-10', '2025-12-09', NULL, 6),
(1, 'Tela de Historico', 'concluido', 'frontend', '2025-12-15', '2025-12-14', NULL, 7),
(1, 'Tela de Auditoria', 'concluido', 'frontend', '2025-12-20', '2025-12-18', NULL, 8),
(1, 'Tela de Configuracoes', 'concluido', 'frontend', '2025-12-25', '2025-12-22', NULL, 9),
(1, 'Componentes de UI reutilizaveis', 'concluido', 'frontend', '2025-12-28', '2025-12-26', NULL, 10),
(1, 'Sistema de Notificacoes (UI)', 'concluido', 'frontend', '2025-12-30', '2025-12-28', NULL, 11);

-- Inserir Entregas da Fase 2
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(2, 'Setup FastAPI + estrutura de pastas', 'concluido', 'backend', '2025-12-10', '2025-12-08', NULL, 1),
(2, 'Configuracao AWS (IAM, credenciais)', 'concluido', 'aws', '2025-12-15', '2025-12-14', NULL, 2),
(2, 'Endpoints de Autenticacao', 'concluido', 'backend', '2025-12-20', '2025-12-19', NULL, 3),
(2, 'Endpoints de Upload/Download', 'concluido', 'backend', '2025-12-28', '2025-12-27', NULL, 4),
(2, 'Endpoints de Aprovacao', 'concluido', 'backend', '2026-01-05', '2026-01-04', NULL, 5),
(2, 'Endpoints de Historico/Auditoria', 'concluido', 'backend', '2026-01-12', '2026-01-10', NULL, 6),
(2, 'Integracao com DynamoDB', 'concluido', 'aws', '2026-01-18', '2026-01-16', NULL, 7),
(2, 'Integracao com S3', 'concluido', 'aws', '2026-01-22', '2026-01-20', NULL, 8),
(2, 'Envio de emails (SES/Graph API)', 'concluido', 'aws', '2026-01-28', '2026-01-26', NULL, 9),
(2, 'Validacao de arquivos ZIP', 'concluido', 'backend', '2026-01-31', '2026-01-29', NULL, 10);

-- Inserir Entregas da Fase 3
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, notas, bloqueios, ordem) VALUES
(3, 'Conectar Front com APIs reais', 'em_progresso', 'integracao', '2026-02-05', 'Em andamento - 70% concluido', 'Aguardando ajustes no endpoint de autenticacao', 1),
(3, 'Fluxo completo de Login/SSO', 'em_progresso', 'integracao', '2026-02-08', 'Integracao com Microsoft Entra em testes', NULL, 2),
(3, 'Fluxo completo de Upload', 'em_progresso', 'integracao', '2026-02-12', NULL, NULL, 3),
(3, 'Fluxo completo de Aprovacao', 'pendente', 'integracao', '2026-02-16', NULL, NULL, 4),
(3, 'Fluxo completo de Download Externo', 'pendente', 'integracao', '2026-02-20', NULL, NULL, 5),
(3, 'Sistema de Notificacoes integrado', 'pendente', 'integracao', '2026-02-24', NULL, NULL, 6),
(3, 'Auditoria e Logs integrados', 'pendente', 'seguranca', '2026-02-26', NULL, NULL, 7),
(3, 'Testes de Integracao E2E', 'pendente', 'teste', '2026-02-28', NULL, NULL, 8);

-- Inserir Entregas da Fase 4
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(4, 'Dockerfile do Front-End (Next.js)', 'pendente', 'devops', '2026-02-20', 1),
(4, 'Dockerfile do Back-End (FastAPI)', 'pendente', 'devops', '2026-02-25', 2),
(4, 'Docker Compose para ambiente local', 'pendente', 'devops', '2026-03-01', 3),
(4, 'Configuracao de variaveis de ambiente', 'pendente', 'devops', '2026-03-05', 4),
(4, 'Otimizacao de imagens Docker', 'pendente', 'devops', '2026-03-10', 5),
(4, 'Testes em containers locais', 'pendente', 'teste', '2026-03-15', 6);

-- Inserir Entregas da Fase 5
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(5, 'Configurar Amazon ECR (Container Registry)', 'pendente', 'aws', '2026-03-05', 1),
(5, 'Configurar Amazon ECS (Container Service)', 'pendente', 'aws', '2026-03-10', 2),
(5, 'Configurar Application Load Balancer', 'pendente', 'aws', '2026-03-14', 3),
(5, 'Configurar VPC e Security Groups', 'pendente', 'aws', '2026-03-18', 4),
(5, 'Configurar dominio e SSL (Route53/ACM)', 'pendente', 'aws', '2026-03-22', 5),
(5, 'Configurar CloudWatch (Logs/Metricas)', 'pendente', 'aws', '2026-03-26', 6),
(5, 'Pipeline CI/CD (CodePipeline)', 'pendente', 'devops', '2026-03-31', 7);

-- Inserir Entregas da Fase 6
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(6, 'Deploy Front-End em DEV', 'pendente', 'deploy', '2026-03-25', 1),
(6, 'Deploy Back-End em DEV', 'pendente', 'deploy', '2026-03-28', 2),
(6, 'Configurar banco de dados DEV', 'pendente', 'aws', '2026-04-01', 3),
(6, 'Testes funcionais em DEV', 'pendente', 'teste', '2026-04-04', 4),
(6, 'Validacao de integracao em DEV', 'pendente', 'teste', '2026-04-07', 5),
(6, 'Correcao de bugs DEV', 'pendente', 'tecnico', '2026-04-10', 6);

-- Inserir Entregas da Fase 7
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(7, 'Deploy Front-End em HML', 'pendente', 'deploy', '2026-04-08', 1),
(7, 'Deploy Back-End em HML', 'pendente', 'deploy', '2026-04-10', 2),
(7, 'Configurar banco de dados HML', 'pendente', 'aws', '2026-04-12', 3),
(7, 'Testes de aceitacao (UAT)', 'pendente', 'teste', '2026-04-16', 4),
(7, 'Testes de carga e performance', 'pendente', 'teste', '2026-04-18', 5),
(7, 'Testes de seguranca', 'pendente', 'seguranca', '2026-04-21', 6),
(7, 'Aprovacao dos stakeholders', 'pendente', 'marco', '2026-04-25', 7);

-- Inserir Entregas da Fase 8
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(8, 'Deploy Front-End em PRD', 'pendente', 'deploy', '2026-04-22', 1),
(8, 'Deploy Back-End em PRD', 'pendente', 'deploy', '2026-04-24', 2),
(8, 'Configurar banco de dados PRD', 'pendente', 'aws', '2026-04-25', 3),
(8, 'Configurar monitoramento PRD', 'pendente', 'aws', '2026-04-26', 4),
(8, 'Configurar alertas e notificacoes', 'pendente', 'devops', '2026-04-27', 5),
(8, 'Smoke tests em PRD', 'pendente', 'teste', '2026-04-28', 6),
(8, 'Documentacao final', 'pendente', 'documentacao', '2026-04-29', 7),
(8, 'Go-Live Producao', 'pendente', 'marco', '2026-04-30', 8);

-- Inserir Marcos
INSERT INTO roadmap_marcos (nome, data, status, ordem) VALUES
('Front-End Concluido', '2025-12-31', 'concluido', 1),
('Back-End Concluido', '2026-01-31', 'concluido', 2),
('Integracao Completa', '2026-02-28', 'pendente', 3),
('Go-Live Producao', '2026-04-30', 'pendente', 4);

-- Inserir dados do Burndown
INSERT INTO roadmap_burndown (semana, planejado, real, entregas, ordem) VALUES
('Nov S1', 100, 100, 57, 1),
('Nov S2', 95, 96, 55, 2),
('Nov S3', 90, 91, 52, 3),
('Nov S4', 85, 86, 49, 4),
('Dez S1', 80, 81, 46, 5),
('Dez S2', 75, 76, 43, 6),
('Dez S3', 70, 71, 40, 7),
('Dez S4', 65, 65, 37, 8),
('Jan S1', 60, 60, 34, 9),
('Jan S2', 55, 55, 31, 10),
('Jan S3', 50, 50, 29, 11),
('Jan S4', 45, 45, 26, 12),
('Fev S1', 40, 40, 23, 13),
('Fev S2', 35, NULL, NULL, 14),
('Fev S3', 30, NULL, NULL, 15),
('Fev S4', 25, NULL, NULL, 16),
('Mar S1', 20, NULL, NULL, 17),
('Mar S2', 15, NULL, NULL, 18),
('Mar S3', 10, NULL, NULL, 19),
('Mar S4', 5, NULL, NULL, 20),
('Abr S1', 0, NULL, NULL, 21);

-- Atualizar configuracao de progresso geral
UPDATE roadmap_config SET valor = '75' WHERE chave = 'progresso_geral';
