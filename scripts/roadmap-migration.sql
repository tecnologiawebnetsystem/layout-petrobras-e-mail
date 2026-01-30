-- Roadmap Database Migration
-- Sistema de Transferencia de Arquivos - Petrobras

-- Tabela de configuracoes gerais do roadmap
CREATE TABLE IF NOT EXISTS roadmap_config (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de fases do roadmap
CREATE TABLE IF NOT EXISTS roadmap_fases (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  periodo VARCHAR(100) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('concluido', 'em_progresso', 'pendente')),
  progresso INTEGER NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  cor VARCHAR(100) NOT NULL DEFAULT 'from-slate-400 to-slate-500',
  descricao TEXT,
  responsavel VARCHAR(255),
  risco VARCHAR(10) DEFAULT 'baixo' CHECK (risco IN ('baixo', 'medio', 'alto')),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dependencias entre fases
CREATE TABLE IF NOT EXISTS roadmap_fase_dependencias (
  id SERIAL PRIMARY KEY,
  fase_id INTEGER NOT NULL REFERENCES roadmap_fases(id) ON DELETE CASCADE,
  depende_de_fase_id INTEGER NOT NULL REFERENCES roadmap_fases(id) ON DELETE CASCADE,
  UNIQUE(fase_id, depende_de_fase_id)
);

-- Tabela de entregas (deliverables)
CREATE TABLE IF NOT EXISTS roadmap_entregas (
  id SERIAL PRIMARY KEY,
  fase_id INTEGER NOT NULL REFERENCES roadmap_fases(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('concluido', 'em_progresso', 'pendente')),
  tipo VARCHAR(50) NOT NULL DEFAULT 'Feature',
  data_prevista DATE,
  data_conclusao DATE,
  notas TEXT,
  bloqueios TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dependencias entre entregas e fases
CREATE TABLE IF NOT EXISTS roadmap_entrega_dependencias (
  id SERIAL PRIMARY KEY,
  entrega_id INTEGER NOT NULL REFERENCES roadmap_entregas(id) ON DELETE CASCADE,
  depende_de_fase_id INTEGER NOT NULL REFERENCES roadmap_fases(id) ON DELETE CASCADE,
  UNIQUE(entrega_id, depende_de_fase_id)
);

-- Tabela de marcos (milestones)
CREATE TABLE IF NOT EXISTS roadmap_marcos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  data DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('concluido', 'pendente')),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dados do burndown chart
CREATE TABLE IF NOT EXISTS roadmap_burndown (
  id SERIAL PRIMARY KEY,
  semana VARCHAR(20) NOT NULL,
  planejado INTEGER NOT NULL DEFAULT 100,
  real INTEGER,
  entregas INTEGER,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir configuracao inicial do progresso geral
INSERT INTO roadmap_config (chave, valor) VALUES ('progresso_geral', '75') ON CONFLICT (chave) DO NOTHING;

-- Indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_entregas_fase_id ON roadmap_entregas(fase_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON roadmap_entregas(status);
CREATE INDEX IF NOT EXISTS idx_fases_status ON roadmap_fases(status);
CREATE INDEX IF NOT EXISTS idx_fases_ordem ON roadmap_fases(ordem);
