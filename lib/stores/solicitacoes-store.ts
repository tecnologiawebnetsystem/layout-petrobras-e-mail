/**
 * Store global de solicitações cadastradas pelo Suporte.
 * Persiste em localStorage para que o usuário interno
 * consiga visualizá-las ao criar um compartilhamento.
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Solicitacao {
  id: string
  /** Número gerado pelo suporte, ex: "SOL-2024-001" */
  numeroSolicitacao: string
  /** E-mail do usuário interno (remetente) que abrirá o compartilhamento */
  emailSolicitante: string
  /** Nome do remetente (usuário interno) */
  nomeSolicitante: string
  /** E-mail do usuário externo (destinatário) */
  emailUsuarioExterno: string
  /** Status da solicitação */
  status: "ativo" | "pendente" | "inativo" | "erro"
  /** Data de cadastro */
  dataCadastro: string
  /** Nome do atendente que cadastrou */
  cadastradoPor: string
}

interface SolicitacoesState {
  solicitacoes: Solicitacao[]
  addSolicitacao: (s: Solicitacao) => void
  getSolicitacoesAtivas: () => Solicitacao[]
  getSolicitacoesPorEmail: (emailInterno: string) => Solicitacao[]
  markAsUsed: (id: string) => void
}

export const useSolicitacoesStore = create<SolicitacoesState>()(
  persist(
    (set, get) => ({
      solicitacoes: [],

      addSolicitacao: (s) =>
        set((state) => ({
          solicitacoes: [s, ...state.solicitacoes],
        })),

      getSolicitacoesAtivas: () =>
        get().solicitacoes.filter((s) => s.status === "ativo"),

      /** Retorna solicitações ativas onde o remetente é o usuário interno logado */
      getSolicitacoesPorEmail: (emailInterno: string) =>
        get().solicitacoes.filter(
          (s) =>
            s.status === "ativo" &&
            s.emailSolicitante.toLowerCase() === emailInterno.toLowerCase()
        ),

      /** Quando o interno usa a solicitação, mantém como ativo (pode ser reutilizada) */
      markAsUsed: (_id: string) => {
        // Intencionalmente não altera status — o suporte é quem inativa
      },
    }),
    {
      name: "petrobras-solicitacoes-storage",
    }
  )
)
