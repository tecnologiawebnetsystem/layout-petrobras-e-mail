-- Seed data para o Roadmap
-- Insere dados iniciais nas tabelas do roadmap

-- Limpar dados existentes (ordem importa por causa das FKs)
DELETE FROM roadmap_entrega_dependencias;
DELETE FROM roadmap_fase_dependencias;
DELETE FROM roadmap_entregas;
DELETE FROM roadmap_fases;
DELETE FROM roadmap_marcos;
DELETE FROM roadmap_burndown;

-- Inserir 12 Fases (7 concluidas)
INSERT INTO roadmap_fases (id, nome, periodo, data_inicio, data_fim, status, progresso, cor, descricao, responsavel, risco, ordem) VALUES
(1, 'Fase 1 - Planejamento', 'Outubro 2025', '2025-10-01', '2025-10-31', 'concluido', 100, 'from-blue-500 to-cyan-500', 'Planejamento inicial e definicao de requisitos', 'Time Produto', 'baixo', 1),
(2, 'Fase 2 - Front-End', 'Novembro - Dezembro 2025', '2025-11-01', '2025-12-31', 'concluido', 100, 'from-green-500 to-emerald-500', 'Desenvolvimento completo do Front-End com Next.js', 'Time Front-End', 'baixo', 2),
(3, 'Fase 3 - Back-End', 'Dezembro 2025 - Janeiro 2026', '2025-12-01', '2026-01-31', 'concluido', 100, 'from-purple-500 to-indigo-500', 'Desenvolvimento completo do Back-End Python com FastAPI', 'Time Back-End', 'baixo', 3),
(4, 'Fase 4 - Integracao', 'Janeiro - Fevereiro 2026', '2026-01-15', '2026-02-28', 'concluido', 100, 'from-pink-500 to-rose-500', 'Integracao entre Front-End e Back-End', 'Time Full-Stack', 'baixo', 4),
(5, 'Fase 5 - Testes', 'Fevereiro 2026', '2026-02-01', '2026-02-28', 'concluido', 100, 'from-yellow-500 to-orange-500', 'Testes integrados e validacoes', 'Time QA', 'baixo', 5),
(6, 'Fase 6 - Docker', 'Marco 2026', '2026-03-01', '2026-03-15', 'concluido', 100, 'from-cyan-500 to-teal-500', 'Containerizacao com Docker', 'Time DevOps', 'baixo', 6),
(7, 'Fase 7 - AWS Setup', 'Marco 2026', '2026-03-16', '2026-03-31', 'concluido', 100, 'from-indigo-500 to-purple-500', 'Configuracao da infraestrutura AWS', 'Time DevOps', 'medio', 7),
(8, 'Fase 8 - Deploy DEV', 'Abril 2026', '2026-04-01', '2026-04-10', 'em_progresso', 60, 'from-sky-500 to-blue-500', 'Deploy no ambiente de Desenvolvimento', 'Time DevOps', 'baixo', 8),
(9, 'Fase 9 - Deploy HML', 'Abril 2026', '2026-04-11', '2026-04-20', 'pendente', 0, 'from-amber-500 to-yellow-500', 'Deploy no ambiente de Homologacao', 'Time DevOps + QA', 'medio', 9),
(10, 'Fase 10 - Testes UAT', 'Abril 2026', '2026-04-21', '2026-04-27', 'pendente', 0, 'from-lime-500 to-green-500', 'Testes de aceitacao com usuarios', 'Time QA + Usuarios', 'alto', 10),
(11, 'Fase 11 - Deploy PRD', 'Final Abril 2026', '2026-04-28', '2026-04-30', 'pendente', 0, 'from-red-500 to-rose-500', 'Deploy final em Producao', 'Time DevOps + Todos', 'alto', 11),
(12, 'Fase 12 - Suporte Pos Go-Live', 'Maio 2026', '2026-05-01', '2026-05-31', 'pendente', 0, 'from-violet-500 to-purple-500', 'Suporte e ajustes pos lancamento', 'Time Completo', 'medio', 12);

-- Reset sequence
SELECT setval('roadmap_fases_id_seq', 12, true);

-- Inserir dependencias entre fases
INSERT INTO roadmap_fase_dependencias (fase_id, depende_de_fase_id) VALUES
(2, 1),
(3, 1),
(4, 2), (4, 3),
(5, 4),
(6, 5),
(7, 6),
(8, 7),
(9, 8),
(10, 9),
(11, 10),
(12, 11);

-- Inserir 97 Entregas (distribuidas pelas 12 fases)

-- Fase 1: Planejamento (8 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(1, 'Levantamento de requisitos', 'concluido', 'planejamento', '2025-10-05', '2025-10-04', 'Requisitos levantados com sucesso', 1),
(1, 'Definicao de arquitetura', 'concluido', 'planejamento', '2025-10-10', '2025-10-09', NULL, 2),
(1, 'Escolha de tecnologias', 'concluido', 'planejamento', '2025-10-12', '2025-10-11', NULL, 3),
(1, 'Definicao de fluxos', 'concluido', 'planejamento', '2025-10-15', '2025-10-14', NULL, 4),
(1, 'Prototipacao de telas', 'concluido', 'planejamento', '2025-10-20', '2025-10-19', NULL, 5),
(1, 'Validacao com stakeholders', 'concluido', 'planejamento', '2025-10-25', '2025-10-24', NULL, 6),
(1, 'Planejamento de sprints', 'concluido', 'planejamento', '2025-10-28', '2025-10-27', NULL, 7),
(1, 'Configuracao de repositorios', 'concluido', 'tecnico', '2025-10-31', '2025-10-30', NULL, 8);

-- Fase 2: Front-End (12 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(2, 'Setup do projeto Next.js', 'concluido', 'frontend', '2025-11-05', '2025-11-03', NULL, 1),
(2, 'Configuracao Tailwind + shadcn/ui', 'concluido', 'frontend', '2025-11-10', '2025-11-08', NULL, 2),
(2, 'Tela de Login', 'concluido', 'frontend', '2025-11-15', '2025-11-14', NULL, 3),
(2, 'Tela de Upload', 'concluido', 'frontend', '2025-11-20', '2025-11-19', NULL, 4),
(2, 'Tela do Supervisor', 'concluido', 'frontend', '2025-11-25', '2025-11-24', NULL, 5),
(2, 'Tela de Download Externo', 'concluido', 'frontend', '2025-12-01', '2025-11-30', NULL, 6),
(2, 'Tela de Historico', 'concluido', 'frontend', '2025-12-05', '2025-12-04', NULL, 7),
(2, 'Tela de Auditoria', 'concluido', 'frontend', '2025-12-10', '2025-12-09', NULL, 8),
(2, 'Tela de Configuracoes', 'concluido', 'frontend', '2025-12-15', '2025-12-14', NULL, 9),
(2, 'Componentes reutilizaveis', 'concluido', 'frontend', '2025-12-20', '2025-12-19', NULL, 10),
(2, 'Sistema de notificacoes UI', 'concluido', 'frontend', '2025-12-27', '2025-12-26', NULL, 11),
(2, 'Wiki-Dev documentacao', 'concluido', 'documentacao', '2025-12-31', '2025-12-30', NULL, 12);

-- Fase 3: Back-End (10 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(3, 'Setup FastAPI', 'concluido', 'backend', '2025-12-10', '2025-12-08', NULL, 1),
(3, 'Configuracao AWS', 'concluido', 'aws', '2025-12-15', '2025-12-14', NULL, 2),
(3, 'Endpoints de Autenticacao', 'concluido', 'backend', '2025-12-20', '2025-12-19', NULL, 3),
(3, 'Endpoints de Upload/Download', 'concluido', 'backend', '2025-12-28', '2025-12-27', NULL, 4),
(3, 'Endpoints de Aprovacao', 'concluido', 'backend', '2026-01-05', '2026-01-04', NULL, 5),
(3, 'Endpoints de Historico/Auditoria', 'concluido', 'backend', '2026-01-12', '2026-01-10', NULL, 6),
(3, 'Integracao com DynamoDB', 'concluido', 'aws', '2026-01-18', '2026-01-16', NULL, 7),
(3, 'Integracao com S3', 'concluido', 'aws', '2026-01-22', '2026-01-20', NULL, 8),
(3, 'Envio de emails SES/Graph', 'concluido', 'aws', '2026-01-28', '2026-01-26', NULL, 9),
(3, 'Validacao de arquivos ZIP', 'concluido', 'backend', '2026-01-31', '2026-01-29', NULL, 10);

-- Fase 4: Integracao (8 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(4, 'Conectar Front com APIs', 'concluido', 'integracao', '2026-02-05', '2026-02-04', NULL, 1),
(4, 'Fluxo completo de Login/SSO', 'concluido', 'integracao', '2026-02-08', '2026-02-07', NULL, 2),
(4, 'Fluxo completo de Upload', 'concluido', 'integracao', '2026-02-12', '2026-02-11', NULL, 3),
(4, 'Fluxo completo de Aprovacao', 'concluido', 'integracao', '2026-02-16', '2026-02-15', NULL, 4),
(4, 'Fluxo completo de Download', 'concluido', 'integracao', '2026-02-20', '2026-02-19', NULL, 5),
(4, 'Sistema de Notificacoes', 'concluido', 'integracao', '2026-02-24', '2026-02-23', NULL, 6),
(4, 'Auditoria e Logs', 'concluido', 'integracao', '2026-02-26', '2026-02-25', NULL, 7),
(4, 'Ajustes finais de integracao', 'concluido', 'integracao', '2026-02-28', '2026-02-27', NULL, 8);

-- Fase 5: Testes (9 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(5, 'Testes unitarios Front-End', 'concluido', 'teste', '2026-02-05', '2026-02-04', NULL, 1),
(5, 'Testes unitarios Back-End', 'concluido', 'teste', '2026-02-08', '2026-02-07', NULL, 2),
(5, 'Testes de integracao', 'concluido', 'teste', '2026-02-12', '2026-02-11', NULL, 3),
(5, 'Testes E2E', 'concluido', 'teste', '2026-02-15', '2026-02-14', NULL, 4),
(5, 'Testes de carga', 'concluido', 'teste', '2026-02-18', '2026-02-17', NULL, 5),
(5, 'Testes de seguranca', 'concluido', 'teste', '2026-02-21', '2026-02-20', NULL, 6),
(5, 'Validacao de fluxos criticos', 'concluido', 'teste', '2026-02-24', '2026-02-23', NULL, 7),
(5, 'Correcao de bugs encontrados', 'concluido', 'teste', '2026-02-27', '2026-02-26', NULL, 8),
(5, 'Revalidacao pos correcoes', 'concluido', 'teste', '2026-02-28', '2026-02-27', NULL, 9);

-- Fase 6: Docker (6 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(6, 'Dockerfile Front-End', 'concluido', 'devops', '2026-03-03', '2026-03-02', NULL, 1),
(6, 'Dockerfile Back-End', 'concluido', 'devops', '2026-03-06', '2026-03-05', NULL, 2),
(6, 'Docker Compose local', 'concluido', 'devops', '2026-03-09', '2026-03-08', NULL, 3),
(6, 'Variaveis de ambiente', 'concluido', 'devops', '2026-03-11', '2026-03-10', NULL, 4),
(6, 'Otimizacao de imagens', 'concluido', 'devops', '2026-03-13', '2026-03-12', NULL, 5),
(6, 'Testes em containers', 'concluido', 'teste', '2026-03-15', '2026-03-14', NULL, 6);

-- Fase 7: AWS Setup (10 entregas) - Todas concluidas
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(7, 'Configurar ECR', 'concluido', 'aws', '2026-03-18', '2026-03-17', NULL, 1),
(7, 'Configurar ECS', 'concluido', 'aws', '2026-03-20', '2026-03-19', NULL, 2),
(7, 'Configurar Load Balancer', 'concluido', 'aws', '2026-03-22', '2026-03-21', NULL, 3),
(7, 'Configurar VPC e Security Groups', 'concluido', 'aws', '2026-03-24', '2026-03-23', NULL, 4),
(7, 'Configurar dominio e SSL', 'concluido', 'aws', '2026-03-26', '2026-03-25', NULL, 5),
(7, 'Configurar CloudWatch', 'concluido', 'aws', '2026-03-27', '2026-03-26', NULL, 6),
(7, 'Configurar CloudTrail', 'concluido', 'aws', '2026-03-28', '2026-03-27', NULL, 7),
(7, 'Configurar backup e recovery', 'concluido', 'aws', '2026-03-29', '2026-03-28', NULL, 8),
(7, 'Pipeline CI/CD', 'concluido', 'devops', '2026-03-30', '2026-03-29', NULL, 9),
(7, 'Validacao da infraestrutura', 'concluido', 'aws', '2026-03-31', '2026-03-30', NULL, 10);

-- Fase 8: Deploy DEV (8 entregas) - 5 concluidas, 3 em progresso
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, ordem) VALUES
(8, 'Deploy Front-End em DEV', 'concluido', 'deploy', '2026-04-02', '2026-04-01', NULL, 1),
(8, 'Deploy Back-End em DEV', 'concluido', 'deploy', '2026-04-03', '2026-04-02', NULL, 2),
(8, 'Configurar banco DEV', 'concluido', 'aws', '2026-04-04', '2026-04-03', NULL, 3),
(8, 'Configurar variaveis DEV', 'concluido', 'devops', '2026-04-05', '2026-04-04', NULL, 4),
(8, 'Testes funcionais DEV', 'concluido', 'teste', '2026-04-07', '2026-04-06', NULL, 5),
(8, 'Validacao de integracao DEV', 'em_progresso', 'teste', '2026-04-08', NULL, 'Em andamento - 80%', 6),
(8, 'Correcao de bugs DEV', 'em_progresso', 'tecnico', '2026-04-09', NULL, 'Em andamento - 60%', 7),
(8, 'Revalidacao DEV', 'em_progresso', 'teste', '2026-04-10', NULL, 'Aguardando correcoes', 8);

-- Fase 9: Deploy HML (8 entregas) - Todas pendentes
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(9, 'Deploy Front-End em HML', 'pendente', 'deploy', '2026-04-12', 1),
(9, 'Deploy Back-End em HML', 'pendente', 'deploy', '2026-04-13', 2),
(9, 'Configurar banco HML', 'pendente', 'aws', '2026-04-14', 3),
(9, 'Configurar variaveis HML', 'pendente', 'devops', '2026-04-15', 4),
(9, 'Testes funcionais HML', 'pendente', 'teste', '2026-04-16', 5),
(9, 'Validacao de integracao HML', 'pendente', 'teste', '2026-04-17', 6),
(9, 'Correcao de bugs HML', 'pendente', 'tecnico', '2026-04-19', 7),
(9, 'Aprovacao para UAT', 'pendente', 'marco', '2026-04-20', 8);

-- Fase 10: Testes UAT (6 entregas) - Todas pendentes
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(10, 'Preparacao ambiente UAT', 'pendente', 'teste', '2026-04-21', 1),
(10, 'Testes de aceitacao', 'pendente', 'teste', '2026-04-23', 2),
(10, 'Testes de usabilidade', 'pendente', 'teste', '2026-04-24', 3),
(10, 'Validacao com usuarios finais', 'pendente', 'teste', '2026-04-25', 4),
(10, 'Ajustes finais UAT', 'pendente', 'tecnico', '2026-04-26', 5),
(10, 'Aprovacao stakeholders', 'pendente', 'marco', '2026-04-27', 6);

-- Fase 11: Deploy PRD (6 entregas) - Todas pendentes
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(11, 'Deploy Front-End em PRD', 'pendente', 'deploy', '2026-04-28', 1),
(11, 'Deploy Back-End em PRD', 'pendente', 'deploy', '2026-04-28', 2),
(11, 'Configurar banco PRD', 'pendente', 'aws', '2026-04-29', 3),
(11, 'Configurar monitoramento PRD', 'pendente', 'aws', '2026-04-29', 4),
(11, 'Smoke tests PRD', 'pendente', 'teste', '2026-04-30', 5),
(11, 'Go-Live Producao', 'pendente', 'marco', '2026-04-30', 6);

-- Fase 12: Suporte Pos Go-Live (6 entregas) - Todas pendentes
INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, ordem) VALUES
(12, 'Monitoramento pos Go-Live', 'pendente', 'suporte', '2026-05-05', 1),
(12, 'Correcao de bugs criticos', 'pendente', 'suporte', '2026-05-10', 2),
(12, 'Ajustes de performance', 'pendente', 'suporte', '2026-05-15', 3),
(12, 'Melhorias de usabilidade', 'pendente', 'suporte', '2026-05-20', 4),
(12, 'Documentacao final', 'pendente', 'documentacao', '2026-05-25', 5),
(12, 'Transicao para suporte', 'pendente', 'marco', '2026-05-31', 6);

-- Inserir Marcos
INSERT INTO roadmap_marcos (nome, data, status, ordem) VALUES
('Planejamento Concluido', '2025-10-31', 'concluido', 1),
('Front-End Concluido', '2025-12-31', 'concluido', 2),
('Back-End Concluido', '2026-01-31', 'concluido', 3),
('Integracao Completa', '2026-02-28', 'concluido', 4),
('Testes Validados', '2026-02-28', 'concluido', 5),
('Docker Configurado', '2026-03-15', 'concluido', 6),
('AWS Infraestrutura Pronta', '2026-03-31', 'concluido', 7),
('Ambiente DEV Pronto', '2026-04-10', 'pendente', 8),
('Ambiente HML Pronto', '2026-04-20', 'pendente', 9),
('UAT Aprovado', '2026-04-27', 'pendente', 10),
('Go-Live Producao', '2026-04-30', 'pendente', 11);

-- Inserir dados do Burndown (97 entregas no total)
INSERT INTO roadmap_burndown (semana, planejado, real, entregas, ordem) VALUES
('Out S1', 97, 97, 97, 1),
('Out S2', 95, 95, 95, 2),
('Out S3', 92, 92, 92, 3),
('Out S4', 89, 89, 89, 4),
('Nov S1', 86, 86, 86, 5),
('Nov S2', 83, 83, 83, 6),
('Nov S3', 80, 80, 80, 7),
('Nov S4', 77, 77, 77, 8),
('Dez S1', 74, 74, 74, 9),
('Dez S2', 71, 71, 71, 10),
('Dez S3', 68, 68, 68, 11),
('Dez S4', 65, 65, 65, 12),
('Jan S1', 62, 62, 62, 13),
('Jan S2', 59, 59, 59, 14),
('Jan S3', 56, 56, 56, 15),
('Jan S4', 53, 53, 53, 16),
('Fev S1', 50, 50, 50, 17),
('Fev S2', 47, 47, 47, 18),
('Fev S3', 44, 44, 44, 19),
('Fev S4', 41, 41, 41, 20),
('Mar S1', 38, 38, 38, 21),
('Mar S2', 35, 35, 35, 22),
('Mar S3', 32, 32, 32, 23),
('Mar S4', 29, 29, 29, 24),
('Abr S1', 26, 24, 24, 25),
('Abr S2', 23, NULL, NULL, 26),
('Abr S3', 20, NULL, NULL, 27),
('Abr S4', 17, NULL, NULL, 28),
('Mai S1', 14, NULL, NULL, 29),
('Mai S2', 11, NULL, NULL, 30),
('Mai S3', 8, NULL, NULL, 31),
('Mai S4', 5, NULL, NULL, 32),
('Jun S1', 0, NULL, NULL, 33);

-- Atualizar configuracao de progresso geral para 80%
UPDATE roadmap_config SET valor = '80' WHERE chave = 'progresso_geral';
