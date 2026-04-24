import { neon } from '@neondatabase/serverless'

// Cliente SQL para queries no Neon
// export const sql = neon(process.env.DATABASE_URL!)

let _sql: ReturnType<typeof neon> | null = null

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida')
  }

  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL)
  }

  return _sql as unknown as (...args: unknown[]) => Promise<Record<string, unknown>[]>
}

// Tipos TypeScript para o Roadmap
export type Status = 'concluido' | 'em_progresso' | 'pendente'
export type Risco = 'baixo' | 'medio' | 'alto'

export interface Entrega {
  id: number
  fase_id: number
  nome: string
  status: Status
  tipo: string
  data_prevista: string | null
  data_conclusao: string | null
  notas: string | null
  bloqueios: string | null
  ordem: number
  depende_de?: number[]
}

export interface Fase {
  id: number
  nome: string
  periodo: string
  data_inicio: string
  data_fim: string
  status: Status
  progresso: number
  cor: string
  descricao: string | null
  responsavel: string | null
  risco: Risco
  ordem: number
  depende_de?: number[]
  entregas?: Entrega[]
}

export interface Marco {
  id: number
  nome: string
  data: string
  status: 'concluido' | 'pendente'
  ordem: number
}

export interface BurndownData {
  id: number
  semana: string
  planejado: number
  real: number | null
  entregas: number | null
  ordem: number
}

export interface RoadmapConfig {
  progresso_geral: number
}

// Funcoes de acesso ao banco
export async function getFases(): Promise<Fase[]> {
  const sql = getSql()
  const fases = await sql`
    SELECT f.*, 
           COALESCE(
             (SELECT array_agg(depende_de_fase_id) FROM roadmap_fase_dependencias WHERE fase_id = f.id),
             '{}'
           ) as depende_de
    FROM roadmap_fases f 
    ORDER BY f.ordem, f.id
  ` as unknown as unknown as Fase[]
  
  // Buscar entregas para cada fase
  for (const fase of fases) {
    const sql = getSql()
    const entregas = await sql`
      SELECT e.*, 
             COALESCE(
               (SELECT array_agg(depende_de_fase_id) FROM roadmap_entrega_dependencias WHERE entrega_id = e.id),
               '{}'
             ) as depende_de
      FROM roadmap_entregas e 
      WHERE e.fase_id = ${fase.id} 
      ORDER BY e.ordem, e.id
    `
    fase.entregas = entregas as unknown as Entrega[]
  }
  
  return fases as unknown as Fase[]
}

export async function getFaseById(id: number): Promise<Fase | null> {
  const sql = getSql()
  const [fase] = await sql`
    SELECT f.*, 
           COALESCE(
             (SELECT array_agg(depende_de_fase_id) FROM roadmap_fase_dependencias WHERE fase_id = f.id),
             '{}'
           ) as depende_de
    FROM roadmap_fases f 
    WHERE f.id = ${id}
  `
  
  if (!fase) return null
  
  const entregas = await sql`
    SELECT e.*, 
           COALESCE(
             (SELECT array_agg(depende_de_fase_id) FROM roadmap_entrega_dependencias WHERE entrega_id = e.id),
             '{}'
           ) as depende_de
    FROM roadmap_entregas e 
    WHERE e.fase_id = ${id} 
    ORDER BY e.ordem, e.id
  `
  fase.entregas = entregas as unknown as Entrega[]
  
  return fase as unknown as Fase
}

export async function createFase(data: Omit<Fase, 'id' | 'entregas'>): Promise<Fase> {
  const sql = getSql()
  const [fase] = await sql`
    INSERT INTO roadmap_fases (nome, periodo, data_inicio, data_fim, status, progresso, cor, descricao, responsavel, risco, ordem)
    VALUES (${data.nome}, ${data.periodo}, ${data.data_inicio}, ${data.data_fim}, ${data.status}, ${data.progresso}, ${data.cor}, ${data.descricao}, ${data.responsavel}, ${data.risco}, ${data.ordem})
    RETURNING *
  `
  
  // Inserir dependencias
  if (data.depende_de && data.depende_de.length > 0) {
    for (const depId of data.depende_de) {
      await sql`INSERT INTO roadmap_fase_dependencias (fase_id, depende_de_fase_id) VALUES (${fase.id}, ${depId})`
    }
  }
  
  return fase as unknown as Fase
}

export async function updateFase(id: number, data: Partial<Omit<Fase, 'id' | 'entregas'>>): Promise<Fase | null> {
  const sql = getSql()
  const updates: string[] = []
  const values: Record<string, unknown> = { id }
  
  if (data.nome !== undefined) { updates.push('nome'); values.nome = data.nome }
  if (data.periodo !== undefined) { updates.push('periodo'); values.periodo = data.periodo }
  if (data.data_inicio !== undefined) { updates.push('data_inicio'); values.data_inicio = data.data_inicio }
  if (data.data_fim !== undefined) { updates.push('data_fim'); values.data_fim = data.data_fim }
  if (data.status !== undefined) { updates.push('status'); values.status = data.status }
  if (data.progresso !== undefined) { updates.push('progresso'); values.progresso = data.progresso }
  if (data.cor !== undefined) { updates.push('cor'); values.cor = data.cor }
  if (data.descricao !== undefined) { updates.push('descricao'); values.descricao = data.descricao }
  if (data.responsavel !== undefined) { updates.push('responsavel'); values.responsavel = data.responsavel }
  if (data.risco !== undefined) { updates.push('risco'); values.risco = data.risco }
  if (data.ordem !== undefined) { updates.push('ordem'); values.ordem = data.ordem }
  
  const [fase] = await sql`
    UPDATE roadmap_fases SET
      nome = COALESCE(${data.nome}, nome),
      periodo = COALESCE(${data.periodo}, periodo),
      data_inicio = COALESCE(${data.data_inicio}, data_inicio),
      data_fim = COALESCE(${data.data_fim}, data_fim),
      status = COALESCE(${data.status}, status),
      progresso = COALESCE(${data.progresso}, progresso),
      cor = COALESCE(${data.cor}, cor),
      descricao = COALESCE(${data.descricao}, descricao),
      responsavel = COALESCE(${data.responsavel}, responsavel),
      risco = COALESCE(${data.risco}, risco),
      ordem = COALESCE(${data.ordem}, ordem),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  
  // Atualizar dependencias se fornecidas
  if (data.depende_de !== undefined) {
    await sql`DELETE FROM roadmap_fase_dependencias WHERE fase_id = ${id}`
    for (const depId of data.depende_de) {
      await sql`INSERT INTO roadmap_fase_dependencias (fase_id, depende_de_fase_id) VALUES (${id}, ${depId})`
    }
  }
  
  return fase as unknown as Fase || null
}

export async function deleteFase(id: number): Promise<boolean> {
  const sql = getSql()
  const result = await sql`DELETE FROM roadmap_fases WHERE id = ${id} RETURNING id`
  return result.length > 0
}

// CRUD para Entregas
export async function getEntregasByFase(faseId: number): Promise<Entrega[]> {
  const sql = getSql()
  const entregas = await sql`
    SELECT e.*, 
           COALESCE(
             (SELECT array_agg(depende_de_fase_id) FROM roadmap_entrega_dependencias WHERE entrega_id = e.id),
             '{}'
           ) as depende_de
    FROM roadmap_entregas e 
    WHERE e.fase_id = ${faseId} 
    ORDER BY e.ordem, e.id
  `
  return entregas as unknown as Entrega[]
}

export async function createEntrega(data: Omit<Entrega, 'id'>): Promise<Entrega> {
  const sql = getSql()
  const [entrega] = await sql`
    INSERT INTO roadmap_entregas (fase_id, nome, status, tipo, data_prevista, data_conclusao, notas, bloqueios, ordem)
    VALUES (${data.fase_id}, ${data.nome}, ${data.status}, ${data.tipo}, ${data.data_prevista}, ${data.data_conclusao}, ${data.notas}, ${data.bloqueios}, ${data.ordem})
    RETURNING *
  `
  
  if (data.depende_de && data.depende_de.length > 0) {
    for (const depId of data.depende_de) {
      await sql`INSERT INTO roadmap_entrega_dependencias (entrega_id, depende_de_fase_id) VALUES (${entrega.id}, ${depId})`
    }
  }
  
  return entrega as unknown as Entrega
}

export async function updateEntrega(id: number, data: Partial<Omit<Entrega, 'id'>>): Promise<Entrega | null> {
  const sql = getSql()
  const [entrega] = await sql`
    UPDATE roadmap_entregas SET
      fase_id = COALESCE(${data.fase_id}, fase_id),
      nome = COALESCE(${data.nome}, nome),
      status = COALESCE(${data.status}, status),
      tipo = COALESCE(${data.tipo}, tipo),
      data_prevista = COALESCE(${data.data_prevista}, data_prevista),
      data_conclusao = COALESCE(${data.data_conclusao}, data_conclusao),
      notas = COALESCE(${data.notas}, notas),
      bloqueios = COALESCE(${data.bloqueios}, bloqueios),
      ordem = COALESCE(${data.ordem}, ordem),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  
  if (data.depende_de !== undefined) {
    await sql`DELETE FROM roadmap_entrega_dependencias WHERE entrega_id = ${id}`
    for (const depId of data.depende_de) {
      await sql`INSERT INTO roadmap_entrega_dependencias (entrega_id, depende_de_fase_id) VALUES (${id}, ${depId})`
    }
  }
  
  return entrega as unknown as Entrega || null
}

export async function deleteEntrega(id: number): Promise<boolean> {
  const sql = getSql()
  const result = await sql`DELETE FROM roadmap_entregas WHERE id = ${id} RETURNING id`
  return result.length > 0
}

// CRUD para Marcos
export async function getMarcos(): Promise<Marco[]> {
  const sql = getSql()
  const marcos = await sql`SELECT * FROM roadmap_marcos ORDER BY ordem, data`
  return marcos as unknown as Marco[]
}

export async function createMarco(data: Omit<Marco, 'id'>): Promise<Marco> {
  const sql = getSql()
  const [marco] = await sql`
    INSERT INTO roadmap_marcos (nome, data, status, ordem)
    VALUES (${data.nome}, ${data.data}, ${data.status}, ${data.ordem})
    RETURNING *
  `
  return marco as unknown as Marco
}

export async function updateMarco(id: number, data: Partial<Omit<Marco, 'id'>>): Promise<Marco | null> {
  const sql = getSql()
  const [marco] = await sql`
    UPDATE roadmap_marcos SET
      nome = COALESCE(${data.nome}, nome),
      data = COALESCE(${data.data}, data),
      status = COALESCE(${data.status}, status),
      ordem = COALESCE(${data.ordem}, ordem),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `
  return marco as unknown as Marco || null
}

export async function deleteMarco(id: number): Promise<boolean> {
  const sql = getSql()
  const result = await sql`DELETE FROM roadmap_marcos WHERE id = ${id} RETURNING id`
  return result.length > 0
}

// CRUD para Burndown
export async function getBurndownData(): Promise<BurndownData[]> {
  const sql = getSql()
  const data = await sql`SELECT * FROM roadmap_burndown ORDER BY ordem, id`
  return data as unknown as BurndownData[]
}

export async function createBurndownEntry(data: Omit<BurndownData, 'id'>): Promise<BurndownData> {
  const sql = getSql()
  const [entry] = await sql`
    INSERT INTO roadmap_burndown (semana, planejado, real, entregas, ordem)
    VALUES (${data.semana}, ${data.planejado}, ${data.real}, ${data.entregas}, ${data.ordem})
    RETURNING *
  `
  return entry as unknown as BurndownData
}

export async function updateBurndownEntry(id: number, data: Partial<Omit<BurndownData, 'id'>>): Promise<BurndownData | null> {
  const sql = getSql()
  const [entry] = await sql`
    UPDATE roadmap_burndown SET
      semana = COALESCE(${data.semana}, semana),
      planejado = COALESCE(${data.planejado}, planejado),
      real = COALESCE(${data.real}, real),
      entregas = COALESCE(${data.entregas}, entregas),
      ordem = COALESCE(${data.ordem}, ordem)
    WHERE id = ${id}
    RETURNING *
  `
  return entry as unknown as BurndownData || null
}

export async function deleteBurndownEntry(id: number): Promise<boolean> {
  const sql = getSql()
  const result = await sql`DELETE FROM roadmap_burndown WHERE id = ${id} RETURNING id`
  return result.length > 0
}

// Config
export async function getConfig(): Promise<RoadmapConfig> {
  const sql = getSql()
  const [config] = await sql`SELECT valor FROM roadmap_config WHERE chave = 'progresso_geral'`
  return { progresso_geral: config ? parseInt(config.valor as string) : 0 }
}

export async function updateConfig(progresso: number): Promise<void> {
  const sql = getSql()
  await sql`
    INSERT INTO roadmap_config (chave, valor, updated_at) 
    VALUES ('progresso_geral', ${progresso.toString()}, CURRENT_TIMESTAMP)
    ON CONFLICT (chave) DO UPDATE SET valor = ${progresso.toString()}, updated_at = CURRENT_TIMESTAMP
  `
}
