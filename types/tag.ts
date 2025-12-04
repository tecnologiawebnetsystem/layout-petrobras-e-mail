export interface Tag {
  id: string
  name: string
  color: string
  description?: string
  count: number
}

export const PREDEFINED_TAGS: Tag[] = [
  { id: "1", name: "Financeiro", color: "#10B981", description: "Documentos financeiros e contábeis", count: 0 },
  { id: "2", name: "Contratos", color: "#3B82F6", description: "Contratos e acordos", count: 0 },
  { id: "3", name: "Técnico", color: "#8B5CF6", description: "Documentação técnica", count: 0 },
  { id: "4", name: "RH", color: "#F59E0B", description: "Recursos Humanos", count: 0 },
  { id: "5", name: "Jurídico", color: "#EF4444", description: "Documentos jurídicos", count: 0 },
  { id: "6", name: "Operacional", color: "#06B6D4", description: "Operações e processos", count: 0 },
  { id: "7", name: "Confidencial", color: "#DC2626", description: "Documentos confidenciais", count: 0 },
  { id: "8", name: "Urgente", color: "#F97316", description: "Requer atenção imediata", count: 0 },
]
