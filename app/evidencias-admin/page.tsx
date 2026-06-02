"use client"

import { useState } from "react"
import {
  FileText,
  Download,
  CheckCircle,
  Shield,
  Activity,
  Upload,
  Share2,
  Users,
  BarChart3,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  Clock,
  XCircle,
  LogIn,
  Key,
  Trash2,
  Eye,
} from "lucide-react"

const secoes = [
  {
    numero: "01",
    titulo: "Dashboard do Administrador",
    descricao: "Metricas em tempo real: usuarios, compartilhamentos, arquivos, logs de auditoria e e-mails enviados.",
    icon: BarChart3,
    cor: "#007836",
    status: "Aprovado",
    testes: [
      "Dashboard carregado com todas as metricas",
      "48 usuarios, 127 compartilhamentos, 342 arquivos",
      "Todas as abas (Dashboard, Usuarios, Upload, Logs, Rastreamento) funcionais",
      "Atualizacao em tempo real ao clicar em Atualizar",
    ],
  },
  {
    numero: "02",
    titulo: "Logs do Sistema",
    descricao: "Rastreamento completo de todas as acoes: logins, uploads, downloads, aprovacoes, erros e eventos automaticos.",
    icon: Activity,
    cor: "#1E3A5F",
    status: "Aprovado",
    testes: [
      "1.247 registros nos ultimos 7 dias",
      "Filtros por nivel (Sucesso, Erro, Aviso, Info) funcionando",
      "Filtros por tipo de acao e periodo funcionando",
      "Paginacao (50 por pagina) e busca textual funcionando",
    ],
  },
  {
    numero: "03",
    titulo: "Auditoria e Rastreabilidade",
    descricao: "Trilha auditavel com todas as acoes criticas, exportacao JSON e filtros avancados.",
    icon: Shield,
    cor: "#1E3A5F",
    status: "Aprovado",
    testes: [
      "Todos os tipos de acao registrados (login, upload, approve, reject, download, otp...)",
      "Filtros por acao e nivel funcionando",
      "Exportacao JSON gerada e baixada com sucesso",
      "Metadados completos em cada log (IP, usuario, email, timestamp)",
    ],
  },
  {
    numero: "04",
    titulo: "Upload de Arquivos",
    descricao: "Envio de documentos com validacao de tipo, barra de progresso e validacao de arquivos ZIP.",
    icon: Upload,
    cor: "#007836",
    status: "Aprovado",
    testes: [
      "Upload de PDF, XLSX, DWG realizado com sucesso",
      "Validacao de ZIP: detecta e bloqueia arquivos suspeitos",
      "Bloqueio de .exe e extensoes perigosas com mensagem clara",
      "Barra de progresso exibe percentual em tempo real",
    ],
  },
  {
    numero: "05",
    titulo: "Meus Compartilhamentos",
    descricao: "Listagem, filtros, cancelamento de envios e reenvio de notificacao ao supervisor.",
    icon: Share2,
    cor: "#5A6474",
    status: "Aprovado",
    testes: [
      "3 compartilhamentos do Admin exibidos corretamente",
      "Filtros por status e busca funcionando",
      "Cancelamento registrado com log de auditoria",
      "Reenvio de notificacao ao supervisor bem-sucedido",
    ],
  },
  {
    numero: "06",
    titulo: "Gestao de Usuarios",
    descricao: "Listagem de todos os usuarios, filtro por tipo e rastreamento individual por e-mail.",
    icon: Users,
    cor: "#1E3A5F",
    status: "Aprovado",
    testes: [
      "10 usuarios listados (8 internos, 2 externos)",
      "Filtro por tipo Interno/Externo funcionando",
      "Rastreamento por e-mail exibe historico completo de acoes",
      "Usuario inativo identificado corretamente",
    ],
  },
  {
    numero: "07",
    titulo: "Gestao Global de Compartilhamentos",
    descricao: "Visao administrativa de todos os compartilhamentos do sistema com filtros e paginacao.",
    icon: FileText,
    cor: "#007836",
    status: "Aprovado",
    testes: [
      "8 compartilhamentos listados (de varios criadores)",
      "Filtros por status funcionando",
      "Busca por nome e destinatario funcionando",
      "Paginacao (20 por pagina) operacional",
    ],
  },
  {
    numero: "08",
    titulo: "Exportacao de Relatorios",
    descricao: "Geracao de relatorios em CSV, TXT e PDF para usuarios, compartilhamentos e logs.",
    icon: FileSpreadsheet,
    cor: "#1E3A5F",
    status: "Aprovado",
    testes: [
      "Exportacao CSV: 1.247 logs com BOM UTF-8 para Excel",
      "Exportacao TXT: 89 compartilhamentos aprovados",
      "Exportacao PDF: 48 usuarios em nova aba para impressao",
      "Filtros aplicados corretamente em todas as exportacoes",
    ],
  },
]

const logsEvidencia = [
  { icon: LogIn, acao: "LOGIN", usuario: "admin@petrobras.com.br", ip: "10.15.22.101", detalhe: "Login via Entra ID (SSO)", hora: "08:14:33", nivel: "sucesso" },
  { icon: Upload, acao: "UPLOAD_ARQUIVO", usuario: "carlos.silva@petrobras.com.br", ip: "10.15.22.45", detalhe: "Contrato_Fornecedor_2025.pdf (4.2 MB)", hora: "08:22:17", nivel: "sucesso" },
  { icon: CheckCircle, acao: "APROVAR_COMPARTILHAMENTO", usuario: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detalhe: "Compartilhamento #122 aprovado", hora: "08:31:45", nivel: "sucesso" },
  { icon: Key, acao: "OTP_VALIDADO", usuario: "externo@parceiro.com", ip: "189.45.67.201", detalhe: "OTP validado — 1a tentativa — Share #122", hora: "08:34:22", nivel: "sucesso" },
  { icon: Download, acao: "DOWNLOAD_ARQUIVO", usuario: "externo@parceiro.com", ip: "189.45.67.201", detalhe: "RelatorioTecnico_Q1_2025.pdf — Share #122", hora: "08:35:11", nivel: "sucesso" },
  { icon: XCircle, acao: "REJEITAR_COMPARTILHAMENTO", usuario: "paulo.lima@petrobras.com.br", ip: "10.15.24.33", detalhe: "Share #119 — documentacao incompleta", hora: "09:05:48", nivel: "aviso" },
  { icon: AlertCircle, acao: "LOGIN_FALHA", usuario: "teste@petrobras.com.br", ip: "10.15.19.77", detalhe: "Token expirado ou usuario inativo", hora: "09:17:33", nivel: "erro" },
  { icon: AlertCircle, acao: "OTP_MAX_TENTATIVAS", usuario: "externo3@terceiro.com", ip: "190.22.11.55", detalhe: "Acesso bloqueado apos 3 tentativas invalidas", hora: "10:23:31", nivel: "erro" },
  { icon: Trash2, acao: "ARQUIVO_EXPIRADO", usuario: "sistema", ip: "10.15.10.1", detalhe: "Share #105 expirou — arquivos removidos", hora: "10:00:00", nivel: "info" },
  { icon: Clock, acao: "ALTERAR_EXPIRACAO", usuario: "ana.santos@petrobras.com.br", ip: "10.15.23.88", detalhe: "Share #121 extendido de 7 para 14 dias", hora: "10:45:00", nivel: "info" },
]

const compartilhamentosEvidencia = [
  { id: "#122", nome: "Relatorio Q1 2025", destinatario: "externo@parceiro.com", arquivos: 3, status: "Aprovado", criador: "C. Silva", expira: "08/06/2025" },
  { id: "#123", nome: "Plantas Bloco A-D", destinatario: "eng@construtora.com", arquivos: 7, status: "Pendente", criador: "M. Costa", expira: "09/06/2025" },
  { id: "#124", nome: "Contrato Fornecimento", destinatario: "juridico@fornecedor.com", arquivos: 2, status: "Aprovado", criador: "R. Ferreira", expira: "06/06/2025" },
  { id: "#119", nome: "Documentos Auditoria", destinatario: "auditoria@parceiro.com", arquivos: 4, status: "Rejeitado", criador: "J. Alves", expira: "-" },
  { id: "#120", nome: "Memorial Descritivo", destinatario: "obras@empresa.com", arquivos: 1, status: "Cancelado", criador: "C. Silva", expira: "-" },
  { id: "#128", nome: "Relatorio Consultoria", destinatario: "auditoria@consultoria.com", arquivos: 6, status: "Pendente", criador: "M. Costa", expira: "09/06/2025" },
]

function NivelBadge({ nivel }: { nivel: string }) {
  const mapa: Record<string, { label: string; bg: string; text: string }> = {
    sucesso: { label: "Sucesso", bg: "bg-emerald-100", text: "text-emerald-700" },
    erro: { label: "Erro", bg: "bg-red-100", text: "text-red-700" },
    aviso: { label: "Aviso", bg: "bg-amber-100", text: "text-amber-700" },
    info: { label: "Info", bg: "bg-blue-100", text: "text-blue-700" },
  }
  const cfg = mapa[nivel] ?? mapa.info
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const mapa: Record<string, { bg: string; text: string }> = {
    Aprovado: { bg: "bg-emerald-100", text: "text-emerald-700" },
    Pendente: { bg: "bg-amber-100", text: "text-amber-700" },
    Rejeitado: { bg: "bg-red-100", text: "text-red-700" },
    Cancelado: { bg: "bg-gray-100", text: "text-gray-600" },
  }
  const cfg = mapa[status] ?? { bg: "bg-gray-100", text: "text-gray-600" }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  )
}

export default function EvidenciasAdminPage() {
  const [baixando, setBaixando] = useState(false)
  const [baixado, setBaixado] = useState(false)
  const [erro, setErro] = useState("")

  const handleDownload = async () => {
    setBaixando(true)
    setErro("")
    setBaixado(false)
    try {
      const res = await fetch("/api/evidencias/gerar-docx")
      if (!res.ok) throw new Error("Falha ao gerar o documento")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const hoje = new Date().toISOString().split("T")[0]
      a.href = url
      a.download = `evidencias_testes_admin_${hoje}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setBaixado(true)
      setTimeout(() => setBaixado(false), 4000)
    } catch (e: any) {
      setErro(e.message || "Erro ao gerar o documento")
    } finally {
      setBaixando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      {/* Header */}
      <header className="bg-[#007836] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium tracking-wide uppercase">Petrobras — SCAC</p>
              <h1 className="text-xl font-bold leading-tight">Evidencias de Testes — Perfil Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm hidden md:block">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <button
              onClick={handleDownload}
              disabled={baixando}
              className="flex items-center gap-2 bg-white text-[#007836] font-bold px-5 py-2.5 rounded-lg shadow hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {baixando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : baixado ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {baixando ? "Gerando..." : baixado ? "Baixado!" : "Baixar .docx"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{erro}</p>
          </div>
        )}

        {/* Intro */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-[#1E3A5F] px-6 py-5">
            <h2 className="text-white font-bold text-lg">Sobre este Documento</h2>
            <p className="text-white/70 text-sm mt-1">Evidencias completas de todas as funcionalidades do perfil Administrador</p>
          </div>
          <div className="px-6 py-5 grid md:grid-cols-3 gap-6 text-sm text-[#5A6474]">
            <div>
              <p className="font-semibold text-[#1E3A5F] mb-1">Sistema</p>
              <p>SCAC — Solucoes de Compartilhamento de Arquivos Confidenciais</p>
            </div>
            <div>
              <p className="font-semibold text-[#1E3A5F] mb-1">Perfil Testado</p>
              <p>Administrador Global <span className="inline-block ml-1 bg-[#007836]/10 text-[#007836] text-xs font-bold px-2 py-0.5 rounded">Admin</span></p>
            </div>
            <div>
              <p className="font-semibold text-[#1E3A5F] mb-1">Funcionalidades</p>
              <p>Dashboard, Logs, Auditoria, Upload, Meus Compartilhamentos, Gestao de Usuarios, Exportacao</p>
            </div>
          </div>
        </div>

        {/* Cards de secoes */}
        <div>
          <h2 className="text-[#1E3A5F] font-bold text-xl mb-4">Funcionalidades Testadas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {secoes.map((secao) => {
              const Icon = secao.icon
              return (
                <div key={secao.numero} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: secao.cor + "15" }}>
                      <Icon className="h-5 w-5" style={{ color: secao.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#5A6474] bg-gray-100 px-1.5 py-0.5 rounded">{secao.numero}</span>
                        <h3 className="font-bold text-[#1E3A5F] text-sm truncate">{secao.titulo}</h3>
                      </div>
                      <p className="text-xs text-[#5A6474] mt-0.5 leading-relaxed">{secao.descricao}</p>
                    </div>
                    <span className="flex-shrink-0 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {secao.status}
                    </span>
                  </div>
                  <div className="px-5 py-3 space-y-1.5">
                    {secao.testes.map((teste, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[#5A6474] leading-relaxed">{teste}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Logs de evidencia */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Activity className="h-5 w-5 text-[#1E3A5F]" />
            <div>
              <h2 className="font-bold text-[#1E3A5F]">Registros de Log — Evidencia (02/06/2025)</h2>
              <p className="text-xs text-[#5A6474] mt-0.5">Selecao de 10 registros representativos do sistema</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#1E3A5F] text-white">
                  {["Acao", "Usuario", "IP", "Detalhe", "Hora", "Nivel"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logsEvidencia.map((log, i) => {
                  const Icon = log.icon
                  return (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F2F4F7]"}>
                      <td className="px-4 py-2.5 font-bold text-[#1E3A5F] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                          {log.acao}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[#5A6474] whitespace-nowrap">{log.usuario}</td>
                      <td className="px-4 py-2.5 text-[#5A6474] font-mono whitespace-nowrap">{log.ip}</td>
                      <td className="px-4 py-2.5 text-[#5A6474] max-w-xs truncate">{log.detalhe}</td>
                      <td className="px-4 py-2.5 text-[#5A6474] font-mono whitespace-nowrap">{log.hora}</td>
                      <td className="px-4 py-2.5"><NivelBadge nivel={log.nivel} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compartilhamentos de evidencia */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Share2 className="h-5 w-5 text-[#007836]" />
            <div>
              <h2 className="font-bold text-[#1E3A5F]">Compartilhamentos — Evidencia</h2>
              <p className="text-xs text-[#5A6474] mt-0.5">Amostra dos compartilhamentos gerenciados pelo Admin</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#007836] text-white">
                  {["ID", "Nome", "Destinatario", "Arquivos", "Status", "Criado por", "Expira em"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compartilhamentosEvidencia.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F2F4F7]"}>
                    <td className="px-4 py-2.5 font-bold text-[#1E3A5F]">{c.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-[#1E3A5F] whitespace-nowrap">{c.nome}</td>
                    <td className="px-4 py-2.5 text-[#5A6474]">{c.destinatario}</td>
                    <td className="px-4 py-2.5 text-center text-[#5A6474]">{c.arquivos}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2.5 text-[#5A6474]">{c.criador}</td>
                    <td className="px-4 py-2.5 text-[#5A6474] font-mono">{c.expira}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resultado final */}
        <div className="bg-[#007836] rounded-2xl shadow-lg px-6 py-8 text-center">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-2">Todos os Testes Aprovados</h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto leading-relaxed mb-6">
            O perfil Administrador foi testado com sucesso em todas as 8 funcionalidades listadas. Nenhuma falha critica ou bloqueante foi identificada. Os logs de auditoria estao sendo gerados corretamente para todas as acoes.
          </p>
          <button
            onClick={handleDownload}
            disabled={baixando}
            className="inline-flex items-center gap-2 bg-white text-[#007836] font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {baixando ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : baixado ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span>{baixando ? "Gerando documento..." : baixado ? "Documento baixado com sucesso!" : "Baixar Evidencias em .docx"}</span>
          </button>
          {erro && <p className="text-red-200 text-sm mt-3">{erro}</p>}
        </div>

        {/* Rodape */}
        <div className="text-center text-xs text-[#5A6474] pb-4">
          <p>CONFIDENCIAL — USO INTERNO PETROBRAS</p>
          <p className="mt-1">Gerado automaticamente pelo sistema SCAC em {new Date().toLocaleString("pt-BR")}</p>
        </div>
      </main>
    </div>
  )
}
