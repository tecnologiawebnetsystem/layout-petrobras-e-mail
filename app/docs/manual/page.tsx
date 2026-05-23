"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Book, 
  Users, 
  Upload, 
  FolderOpen, 
  CheckCircle, 
  Shield, 
  Mail, 
  Download, 
  Key, 
  Clock, 
  FileText, 
  ChevronRight,
  Home,
  User,
  UserCheck,
  Globe,
  Settings,
  Search,
  Menu,
  X,
  ArrowRight,
  AlertCircle,
  Info,
  Lightbulb,
  Monitor,
  Smartphone,
  ExternalLink
} from "lucide-react"
import { cn } from "@/lib/utils"

// Tipos
type Section = {
  id: string
  title: string
  icon: React.ReactNode
  subsections?: { id: string; title: string }[]
}

// Navegacao
const sections: Section[] = [
  {
    id: "visao-geral",
    title: "Visao Geral",
    icon: <Book className="h-4 w-4" />,
    subsections: [
      { id: "sobre-sistema", title: "Sobre o Sistema" },
      { id: "arquitetura", title: "Arquitetura" },
      { id: "perfis-usuario", title: "Perfis de Usuario" },
    ]
  },
  {
    id: "usuario-interno",
    title: "Usuario Interno",
    icon: <User className="h-4 w-4" />,
    subsections: [
      { id: "interno-login", title: "Login (SSO)" },
      { id: "interno-upload", title: "Upload de Arquivos" },
      { id: "interno-compartilhamentos", title: "Meus Compartilhamentos" },
      { id: "interno-criar-compartilhamento", title: "Criar Compartilhamento" },
    ]
  },
  {
    id: "supervisor",
    title: "Supervisor",
    icon: <UserCheck className="h-4 w-4" />,
    subsections: [
      { id: "supervisor-painel", title: "Painel do Supervisor" },
      { id: "supervisor-aprovar", title: "Aprovar/Rejeitar" },
      { id: "supervisor-auto-aprovacao", title: "Auto-Aprovacao" },
      { id: "supervisor-auditoria", title: "Auditoria" },
    ]
  },
  {
    id: "usuario-externo",
    title: "Usuario Externo",
    icon: <Globe className="h-4 w-4" />,
    subsections: [
      { id: "externo-email", title: "Recebendo o E-mail" },
      { id: "externo-verificacao", title: "Verificacao OTP" },
      { id: "externo-download", title: "Download de Arquivos" },
    ]
  },
  {
    id: "admin-global",
    title: "Admin Global",
    icon: <Shield className="h-4 w-4" />,
    subsections: [
      { id: "admin-dashboard", title: "Dashboard" },
      { id: "admin-usuarios", title: "Gerenciar Usuarios" },
      { id: "admin-compartilhamentos", title: "Compartilhamentos" },
      { id: "admin-logs", title: "Logs do Sistema" },
      { id: "admin-rastreamento", title: "Rastreamento" },
    ]
  },
  {
    id: "faq",
    title: "Perguntas Frequentes",
    icon: <Lightbulb className="h-4 w-4" />,
  },
]

// Componentes de UI
function InfoBox({ type, children }: { type: "info" | "warning" | "tip"; children: React.ReactNode }) {
  const styles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    tip: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
  }
  const icons = {
    info: <Info className="h-5 w-5 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    tip: <Lightbulb className="h-5 w-5 flex-shrink-0" />,
  }
  
  return (
    <div className={cn("flex gap-3 p-4 rounded-lg border", styles[type])}>
      {icons[type]}
      <div className="text-sm">{children}</div>
    </div>
  )
}

function ScreenMockup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card shadow-lg">
      <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-muted-foreground ml-2">{title}</span>
      </div>
      <div className="p-4 bg-background">
        {children}
      </div>
    </div>
  )
}

function StepIndicator({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
        {number}
      </div>
      <div className="flex-1 pb-8 border-l-2 border-muted pl-6 -ml-5">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}

function FlowDiagram({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium whitespace-nowrap">
            {step}
          </span>
          {index < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      ))}
    </div>
  )
}

// Conteudo das secoes
function VisaoGeralSection() {
  return (
    <div className="space-y-8">
      {/* Sobre o Sistema */}
      <section id="sobre-sistema" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Book className="h-6 w-6 text-primary" />
          Sobre o Sistema
        </h2>
        <p className="text-muted-foreground mb-4">
          O <strong>Sistema de Transferencia Segura de Arquivos</strong> da Petrobras permite o compartilhamento 
          controlado de documentos com usuarios externos (terceiros, parceiros, fornecedores) de forma segura e auditada.
        </p>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-card">
            <Shield className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-semibold">Seguro</h4>
            <p className="text-sm text-muted-foreground">Criptografia de ponta a ponta e autenticacao em duas etapas</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <h4 className="font-semibold">Auditado</h4>
            <p className="text-sm text-muted-foreground">Todos os acessos e downloads sao registrados em log</p>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <Clock className="h-8 w-8 text-amber-600 mb-2" />
            <h4 className="font-semibold">Controlado</h4>
            <p className="text-sm text-muted-foreground">Links com expiracao e limite de downloads</p>
          </div>
        </div>

        <InfoBox type="info">
          O sistema foi desenvolvido para atender aos requisitos de seguranca da informacao da Petrobras, 
          garantindo conformidade com as politicas internas de compartilhamento de dados.
        </InfoBox>
      </section>

      {/* Arquitetura */}
      <section id="arquitetura" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          Arquitetura do Sistema
        </h2>
        
        <ScreenMockup title="Fluxo de Compartilhamento">
          <div className="space-y-4">
            <FlowDiagram steps={["Usuario Interno", "Upload Arquivo", "Aprovacao Supervisor", "E-mail Enviado", "Usuario Externo Acessa"]} />
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Ambiente Interno</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Autenticacao via Microsoft Entra ID (SSO)</li>
                  <li>• Acesso a rede corporativa</li>
                  <li>• Upload e gerenciamento de arquivos</li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Ambiente Externo</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Autenticacao via OTP por e-mail</li>
                  <li>• Acesso via internet publica</li>
                  <li>• Download de arquivos compartilhados</li>
                </ul>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* Perfis de Usuario */}
      <section id="perfis-usuario" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Perfis de Usuario
        </h2>
        
        <div className="grid gap-4">
          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Usuario Interno</h3>
                <p className="text-muted-foreground mb-3">Colaborador Petrobras que faz upload e compartilha arquivos com externos</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600">Upload de Arquivos</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600">Criar Compartilhamentos</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600">Gerenciar Links</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Supervisor</h3>
                <p className="text-muted-foreground mb-3">Responsavel por aprovar ou rejeitar os compartilhamentos da sua equipe</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600">Aprovar/Rejeitar</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600">Visualizar Auditoria</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/10 text-amber-600">Auto-Aprovacao</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Usuario Externo</h3>
                <p className="text-muted-foreground mb-3">Terceiros, parceiros ou fornecedores que recebem arquivos compartilhados</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600">Verificacao OTP</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600">Download de Arquivos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">Admin Global</h3>
                <p className="text-muted-foreground mb-3">Administrador com acesso total ao sistema, incluindo configuracoes e logs</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-600">Dashboard Completo</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-600">Gerenciar Usuarios</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-600">Logs do Sistema</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-600">Rastreamento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function UsuarioInternoSection() {
  return (
    <div className="space-y-8">
      {/* Login SSO */}
      <section id="interno-login" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          Login (SSO)
        </h2>
        <p className="text-muted-foreground mb-4">
          O acesso ao sistema para usuarios internos e feito atraves do <strong>Microsoft Entra ID</strong> (antigo Azure AD), 
          utilizando Single Sign-On (SSO) com suas credenciais corporativas.
        </p>

        <ScreenMockup title="Tela de Login - Sistema Petrobras">
          <div className="max-w-sm mx-auto p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Transferencia Segura</h3>
            <p className="text-sm text-muted-foreground mb-6">Sistema de compartilhamento de arquivos</p>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 bg-[#00a4ef] rounded-sm" />
                <span className="font-medium">Entrar com Microsoft</span>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6 space-y-4">
          <StepIndicator 
            number={1} 
            title="Acesse o sistema" 
            description="Abra o navegador e acesse a URL do sistema de transferencia segura."
          />
          <StepIndicator 
            number={2} 
            title="Clique em 'Entrar com Microsoft'" 
            description="Voce sera redirecionado para a pagina de login da Microsoft."
          />
          <StepIndicator 
            number={3} 
            title="Insira suas credenciais" 
            description="Use seu e-mail corporativo (@petrobras.com.br) e senha."
          />
          <StepIndicator 
            number={4} 
            title="Autenticacao MFA" 
            description="Se habilitado, confirme o acesso no Microsoft Authenticator."
          />
        </div>

        <InfoBox type="tip">
          Se voce ja estiver logado em outro sistema Microsoft (Outlook, Teams, etc.), o login pode ser automatico.
        </InfoBox>
      </section>

      {/* Upload de Arquivos */}
      <section id="interno-upload" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" />
          Upload de Arquivos
        </h2>
        <p className="text-muted-foreground mb-4">
          A pagina de upload permite enviar arquivos para o sistema antes de criar um compartilhamento.
        </p>

        <ScreenMockup title="Pagina de Upload - /upload">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium">Arraste arquivos aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground mt-2">Maximo: 100MB por arquivo</p>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">documento_projeto.pdf</p>
                <p className="text-xs text-muted-foreground">2.5 MB</p>
              </div>
              <div className="text-green-500 text-sm font-medium">100%</div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Tipos de arquivos permitidos:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["PDF", "DOC/DOCX", "XLS/XLSX", "PPT/PPTX", "TXT", "CSV", "ZIP", "Imagens"].map((tipo) => (
              <div key={tipo} className="px-3 py-2 rounded-lg bg-muted text-sm text-center">
                {tipo}
              </div>
            ))}
          </div>
        </div>

        <InfoBox type="warning">
          Arquivos executaveis (.exe, .bat, .sh) e scripts nao sao permitidos por questoes de seguranca.
        </InfoBox>
      </section>

      {/* Meus Compartilhamentos */}
      <section id="interno-compartilhamentos" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          Meus Compartilhamentos
        </h2>
        <p className="text-muted-foreground mb-4">
          Visualize todos os compartilhamentos que voce criou, seus status e informacoes de acesso.
        </p>

        <ScreenMockup title="Pagina Meus Compartilhamentos - /compartilhamentos">
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <FileText className="h-10 w-10 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Relatorio Trimestral Q1</p>
                <p className="text-sm text-muted-foreground">Para: joao.silva@empresa.com</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-600">
                Aprovado
              </span>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <FileText className="h-10 w-10 text-amber-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Proposta Comercial</p>
                <p className="text-sm text-muted-foreground">Para: maria@fornecedor.com</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600">
                Pendente
              </span>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
              <FileText className="h-10 w-10 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">Documento Confidencial</p>
                <p className="text-sm text-muted-foreground">Para: pedro@parceiro.com</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-600">
                Rejeitado
              </span>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Status dos Compartilhamentos:</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <div>
                <p className="font-medium">Pendente</p>
                <p className="text-xs text-muted-foreground">Aguardando aprovacao do supervisor</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="font-medium">Aprovado</p>
                <p className="text-xs text-muted-foreground">E-mail enviado ao destinatario</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="font-medium">Rejeitado</p>
                <p className="text-xs text-muted-foreground">Compartilhamento negado pelo supervisor</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <span className="w-3 h-3 rounded-full bg-gray-500" />
              <div>
                <p className="font-medium">Expirado</p>
                <p className="text-xs text-muted-foreground">Link passou da data de validade</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Criar Compartilhamento */}
      <section id="interno-criar-compartilhamento" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Criar Compartilhamento
        </h2>
        <p className="text-muted-foreground mb-4">
          Passo a passo para criar um novo compartilhamento de arquivos.
        </p>

        <ScreenMockup title="Formulario de Compartilhamento">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium">Arquivo</label>
              <div className="mt-1 p-3 rounded-lg border bg-muted/30 flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <span className="text-sm">documento_projeto.pdf</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">E-mail do Destinatario</label>
              <input 
                type="text" 
                placeholder="exemplo@empresa.com"
                className="mt-1 w-full p-2 rounded-lg border bg-background text-sm"
                readOnly
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Nome do Destinatario</label>
              <input 
                type="text" 
                placeholder="Joao da Silva"
                className="mt-1 w-full p-2 rounded-lg border bg-background text-sm"
                readOnly
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Mensagem (opcional)</label>
              <textarea 
                placeholder="Segue o documento solicitado..."
                className="mt-1 w-full p-2 rounded-lg border bg-background text-sm h-20 resize-none"
                readOnly
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Expiracao</label>
                <select className="mt-1 w-full p-2 rounded-lg border bg-background text-sm">
                  <option>7 dias</option>
                  <option>14 dias</option>
                  <option>30 dias</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Max Downloads</label>
                <select className="mt-1 w-full p-2 rounded-lg border bg-background text-sm">
                  <option>1 vez</option>
                  <option>5 vezes</option>
                  <option>10 vezes</option>
                </select>
              </div>
            </div>
            
            <button className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium">
              Enviar para Aprovacao
            </button>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Fluxo apos envio:</h4>
          <FlowDiagram steps={["Compartilhamento Criado", "Notifica Supervisor", "Aguarda Aprovacao", "E-mail Enviado"]} />
        </div>

        <InfoBox type="info">
          Apos a aprovacao, o destinatario recebera um e-mail com o link seguro para acessar o arquivo.
        </InfoBox>
      </section>
    </div>
  )
}

function SupervisorSection() {
  return (
    <div className="space-y-8">
      {/* Painel do Supervisor */}
      <section id="supervisor-painel" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          Painel do Supervisor
        </h2>
        <p className="text-muted-foreground mb-4">
          O supervisor tem acesso a um painel especial para gerenciar os compartilhamentos da sua equipe.
        </p>

        <ScreenMockup title="Painel do Supervisor - /supervisor">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-3xl font-bold text-amber-600">5</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                <p className="text-3xl font-bold text-green-600">23</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
              </div>
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-3xl font-bold text-red-600">2</p>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 font-medium">Aguardando Aprovacao</div>
              <div className="divide-y">
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium">Proposta_Comercial.pdf</p>
                    <p className="text-sm text-muted-foreground">De: Carlos Mendes | Para: fornecedor@empresa.com</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-green-500 text-white text-sm">Aprovar</button>
                    <button className="px-3 py-1 rounded bg-red-500 text-white text-sm">Rejeitar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Menus disponiveis para o Supervisor:</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border bg-card">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Aprovacoes Pendentes
              </h5>
              <p className="text-sm text-muted-foreground">Lista de compartilhamentos aguardando aprovacao da equipe</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <FolderOpen className="h-4 w-4 text-blue-500" />
                Historico
              </h5>
              <p className="text-sm text-muted-foreground">Todos os compartilhamentos aprovados e rejeitados</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-amber-500" />
                Minha Equipe
              </h5>
              <p className="text-sm text-muted-foreground">Usuarios subordinados ao supervisor</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h5 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Auditoria
              </h5>
              <p className="text-sm text-muted-foreground">Logs de acoes dos subordinados (somente visualizacao)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Aprovar/Rejeitar */}
      <section id="supervisor-aprovar" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-primary" />
          Aprovar ou Rejeitar Compartilhamentos
        </h2>
        <p className="text-muted-foreground mb-4">
          Ao clicar em um compartilhamento pendente, o supervisor visualiza os detalhes completos.
        </p>

        <ScreenMockup title="Detalhes do Compartilhamento">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Arquivo</p>
                <p className="font-medium">Proposta_Comercial_2024.pdf</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamanho</p>
                <p className="font-medium">2.5 MB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Solicitante</p>
                <p className="font-medium">Carlos Mendes (carlos.mendes@petrobras.com.br)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destinatario</p>
                <p className="font-medium">Joao Silva (joao@fornecedor.com)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiracao</p>
                <p className="font-medium">7 dias</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Max Downloads</p>
                <p className="font-medium">5 vezes</p>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">Mensagem do Solicitante:</p>
              <p className="text-sm">Segue a proposta comercial conforme alinhado em reuniao.</p>
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 py-2 rounded-lg bg-green-500 text-white font-medium flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovar
              </button>
              <button className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium flex items-center justify-center gap-2">
                <X className="h-4 w-4" />
                Rejeitar
              </button>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">O que acontece apos a decisao:</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h5 className="font-semibold text-green-700 dark:text-green-400 mb-2">Se Aprovado:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• E-mail e enviado ao destinatario externo</li>
                <li>• Link de download fica ativo</li>
                <li>• Solicitante e notificado da aprovacao</li>
                <li>• Registro criado no log de auditoria</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h5 className="font-semibold text-red-700 dark:text-red-400 mb-2">Se Rejeitado:</h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nenhum e-mail e enviado</li>
                <li>• Arquivo permanece no sistema</li>
                <li>• Solicitante e notificado da rejeicao</li>
                <li>• Motivo pode ser informado (opcional)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Aprovacao */}
      <section id="supervisor-auto-aprovacao" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Auto-Aprovacao
        </h2>
        <p className="text-muted-foreground mb-4">
          O supervisor pode criar compartilhamentos que sao aprovados automaticamente (sem necessidade de outro aprovador).
        </p>

        <ScreenMockup title="Compartilhamento com Auto-Aprovacao">
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Supervisor criando compartilhamento</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Como voce e supervisor, seu compartilhamento sera <strong>aprovado automaticamente</strong> apos a criacao.
                </p>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <InfoBox type="tip">
          A auto-aprovacao so e valida quando o supervisor cria compartilhamentos para sua propria area. 
          Compartilhamentos de outras areas ainda precisam de aprovacao do supervisor responsavel.
        </InfoBox>
      </section>

      {/* Auditoria */}
      <section id="supervisor-auditoria" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Auditoria
        </h2>
        <p className="text-muted-foreground mb-4">
          O supervisor pode visualizar os logs de auditoria das acoes realizadas pelos seus subordinados. 
          <strong> Esta funcionalidade e somente leitura.</strong>
        </p>

        <ScreenMockup title="Logs de Auditoria - /auditoria">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600">UPLOAD</span>
                <div>
                  <p className="text-sm font-medium">carlos.mendes@petrobras.com.br</p>
                  <p className="text-xs text-muted-foreground">Fez upload de Proposta_Comercial.pdf</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Hoje, 14:32</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-600">APROVADO</span>
                <div>
                  <p className="text-sm font-medium">supervisor@petrobras.com.br</p>
                  <p className="text-xs text-muted-foreground">Aprovou compartilhamento #1234</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Hoje, 14:45</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-600">DOWNLOAD</span>
                <div>
                  <p className="text-sm font-medium">joao@fornecedor.com</p>
                  <p className="text-xs text-muted-foreground">Baixou arquivo do compartilhamento #1234</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Hoje, 15:10</span>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Tipos de eventos registrados:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 text-sm text-center">Upload</div>
            <div className="px-3 py-2 rounded-lg bg-green-500/10 text-green-600 text-sm text-center">Aprovacao</div>
            <div className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-sm text-center">Rejeicao</div>
            <div className="px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 text-sm text-center">Download</div>
            <div className="px-3 py-2 rounded-lg bg-amber-500/10 text-amber-600 text-sm text-center">Login</div>
            <div className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-600 text-sm text-center">OTP Enviado</div>
            <div className="px-3 py-2 rounded-lg bg-pink-500/10 text-pink-600 text-sm text-center">Link Expirado</div>
            <div className="px-3 py-2 rounded-lg bg-gray-500/10 text-gray-600 text-sm text-center">Erro</div>
          </div>
        </div>

        <InfoBox type="warning">
          O supervisor pode apenas <strong>visualizar</strong> os logs de auditoria. 
          Somente o Admin Global pode exportar ou configurar parametros de auditoria.
        </InfoBox>
      </section>
    </div>
  )
}

function UsuarioExternoSection() {
  return (
    <div className="space-y-8">
      {/* Recebendo o E-mail */}
      <section id="externo-email" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          Recebendo o E-mail
        </h2>
        <p className="text-muted-foreground mb-4">
          Quando um compartilhamento e aprovado, o usuario externo recebe um e-mail com o link para acessar os arquivos.
        </p>

        <ScreenMockup title="E-mail Recebido - Caixa de Entrada">
          <div className="max-w-lg mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg border">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                P
              </div>
              <div>
                <p className="font-medium">Petrobras - Transferencia Segura</p>
                <p className="text-sm text-muted-foreground">noreply@petrobras.com.br</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Voce recebeu um arquivo compartilhado</h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Ola Joao Silva,<br/><br/>
              Carlos Mendes compartilhou o arquivo <strong>Proposta_Comercial.pdf</strong> com voce.
            </p>
            
            <div className="p-4 rounded-lg bg-muted/50 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Mensagem:</p>
              <p className="text-sm italic">Segue a proposta comercial conforme alinhado em reuniao.</p>
            </div>
            
            <a href="#" className="block w-full py-3 rounded-lg bg-green-600 text-white text-center font-medium">
              Acessar Arquivo
            </a>
            
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Este link expira em 7 dias. Maximo de 5 downloads.
            </p>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Informacoes do e-mail:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Nome do arquivo compartilhado
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Nome do remetente (colaborador Petrobras)
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Mensagem opcional do remetente
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Data de expiracao do link
            </li>
            <li className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-primary" />
              Botao para acessar o arquivo
            </li>
          </ul>
        </div>

        <InfoBox type="warning">
          Verifique se o e-mail veio de um remetente legitimo (@petrobras.com.br). 
          Em caso de duvida, entre em contato com o remetente por outro canal.
        </InfoBox>
      </section>

      {/* Verificacao OTP */}
      <section id="externo-verificacao" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          Verificacao OTP
        </h2>
        <p className="text-muted-foreground mb-4">
          Ao clicar no link do e-mail, voce sera direcionado para a pagina de verificacao de identidade.
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Passo 1: Confirme seu e-mail</h4>
            <ScreenMockup title="Verificacao de Identidade - Passo 1">
              <div className="max-w-sm mx-auto p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verificacao de Identidade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para sua seguranca, precisamos verificar sua identidade.
                </p>
                <input 
                  type="email" 
                  value="joao@fornecedor.com"
                  className="w-full p-3 rounded-lg border bg-background text-center"
                  readOnly
                />
                <button className="w-full mt-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                  Enviar Codigo
                </button>
              </div>
            </ScreenMockup>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Passo 2: Receba o codigo por e-mail</h4>
            <ScreenMockup title="E-mail com Codigo OTP">
              <div className="max-w-lg mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-4">
                  Seu codigo de verificacao e:
                </p>
                <div className="text-4xl font-mono font-bold text-center tracking-widest mb-4">
                  847291
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Este codigo expira em <strong>3 minutos</strong>.
                </p>
              </div>
            </ScreenMockup>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Passo 3: Digite o codigo</h4>
            <ScreenMockup title="Verificacao de Identidade - Passo 2">
              <div className="max-w-sm mx-auto p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Key className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Digite o Codigo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enviamos um codigo de 6 digitos para seu e-mail.
                </p>
                <div className="flex justify-center gap-2 mb-4">
                  {["8", "4", "7", "2", "9", "1"].map((digit, i) => (
                    <div key={i} className="w-10 h-12 rounded-lg border-2 border-primary flex items-center justify-center text-xl font-bold">
                      {digit}
                    </div>
                  ))}
                </div>
                <button className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium">
                  Verificar
                </button>
                <button className="w-full mt-2 py-2 text-sm text-muted-foreground">
                  Reenviar codigo
                </button>
              </div>
            </ScreenMockup>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Regras do codigo OTP:</h4>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-2xl font-bold text-primary">6</p>
              <p className="text-sm text-muted-foreground">digitos</p>
            </div>
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">minutos de validade</p>
            </div>
            <div className="p-3 rounded-lg border bg-card text-center">
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">tentativas maximas</p>
            </div>
          </div>
        </div>

        <InfoBox type="tip">
          Se nao receber o codigo, verifique sua pasta de spam. 
          Voce pode solicitar um novo codigo apos alguns segundos.
        </InfoBox>
      </section>

      {/* Download de Arquivos */}
      <section id="externo-download" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" />
          Download de Arquivos
        </h2>
        <p className="text-muted-foreground mb-4">
          Apos a verificacao, voce tera acesso a pagina de download do arquivo.
        </p>

        <ScreenMockup title="Pagina de Download - /download">
          <div className="max-w-md mx-auto p-6">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold">Proposta_Comercial.pdf</h3>
              <p className="text-sm text-muted-foreground">2.5 MB</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enviado por:</span>
                <span>Carlos Mendes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data de envio:</span>
                <span>22/05/2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expira em:</span>
                <span className="text-amber-600">5 dias</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Downloads restantes:</span>
                <span>4 de 5</span>
              </div>
            </div>
            
            <button className="w-full py-3 rounded-lg bg-green-600 text-white font-medium flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              Baixar Arquivo
            </button>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <FlowDiagram steps={["Recebe E-mail", "Clica no Link", "Informa E-mail", "Recebe OTP", "Digita Codigo", "Baixa Arquivo"]} />
        </div>

        <InfoBox type="info">
          Cada download e registrado no sistema. Quando atingir o limite de downloads 
          ou a data de expiracao, o link sera automaticamente desativado.
        </InfoBox>
      </section>
    </div>
  )
}

function AdminGlobalSection() {
  return (
    <div className="space-y-8">
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-purple-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-purple-700 dark:text-purple-400">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground">
              O Admin Global tem acesso total a todas as funcionalidades do sistema, incluindo dados de todos os usuarios,
              compartilhamentos, logs e configuracoes.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <section id="admin-dashboard" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Monitor className="h-6 w-6 text-primary" />
          Dashboard
        </h2>
        <p className="text-muted-foreground mb-4">
          Visao geral do sistema com metricas e estatisticas em tempo real.
        </p>

        <ScreenMockup title="Admin Dashboard - /admin">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Compartilhamentos</p>
                <p className="text-2xl font-bold">5,678</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-muted-foreground">Storage Usado</p>
                <p className="text-2xl font-bold">45 GB</p>
              </div>
            </div>
            
            <div className="flex gap-2 border-b">
              <button className="px-4 py-2 border-b-2 border-primary font-medium">Dashboard</button>
              <button className="px-4 py-2 text-muted-foreground">Usuarios</button>
              <button className="px-4 py-2 text-muted-foreground">Compartilhamentos</button>
              <button className="px-4 py-2 text-muted-foreground">Logs</button>
              <button className="px-4 py-2 text-muted-foreground">Rastreamento</button>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* Gerenciar Usuarios */}
      <section id="admin-usuarios" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Gerenciar Usuarios
        </h2>
        <p className="text-muted-foreground mb-4">
          Cadastro, edicao e gerenciamento de todos os usuarios do sistema (internos, externos, supervisores).
        </p>

        <ScreenMockup title="Aba Usuarios - /admin">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <input 
                type="text" 
                placeholder="Buscar usuarios..."
                className="px-3 py-2 rounded-lg border bg-background text-sm w-64"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                + Novo Usuario
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">E-mail</th>
                    <th className="px-4 py-2 text-left">Perfil</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2">Carlos Mendes</td>
                    <td className="px-4 py-2">carlos@petrobras.com.br</td>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600">Interno</span></td>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-600">Ativo</span></td>
                    <td className="px-4 py-2"><button className="text-primary text-xs">Editar</button></td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">Maria Silva</td>
                    <td className="px-4 py-2">maria@petrobras.com.br</td>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-600">Supervisor</span></td>
                    <td className="px-4 py-2"><span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-600">Ativo</span></td>
                    <td className="px-4 py-2"><button className="text-primary text-xs">Editar</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <h4 className="font-semibold mb-3">Acoes disponiveis:</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-medium">Criar Usuario</p>
              <p className="text-sm text-muted-foreground">Cadastrar novos usuarios internos ou externos</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-medium">Editar Usuario</p>
              <p className="text-sm text-muted-foreground">Alterar dados, perfil ou supervisor</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-medium">Desativar Usuario</p>
              <p className="text-sm text-muted-foreground">Bloquear acesso temporariamente</p>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <p className="font-medium">Resetar Acesso</p>
              <p className="text-sm text-muted-foreground">Enviar novo convite de acesso</p>
            </div>
          </div>
        </div>
      </section>

      {/* Compartilhamentos */}
      <section id="admin-compartilhamentos" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          Compartilhamentos
        </h2>
        <p className="text-muted-foreground mb-4">
          Visualizacao e gerenciamento de todos os compartilhamentos do sistema.
        </p>

        <ScreenMockup title="Aba Compartilhamentos - /admin">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Status</option>
                <option>Pendentes</option>
                <option>Aprovados</option>
                <option>Rejeitados</option>
                <option>Expirados</option>
              </select>
              <input 
                type="date" 
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <div className="p-4 rounded-lg border flex items-center gap-4">
                <FileText className="h-10 w-10 text-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">Relatorio_Anual_2024.pdf</p>
                  <p className="text-sm text-muted-foreground">De: carlos@petrobras.com.br → Para: joao@empresa.com</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-600">Aprovado</span>
                <span className="text-xs text-muted-foreground">Downloads: 2/5</span>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <InfoBox type="info">
          O Admin Global pode cancelar ou estender compartilhamentos, alterar limites de download 
          e visualizar detalhes completos de qualquer compartilhamento.
        </InfoBox>
      </section>

      {/* Logs do Sistema */}
      <section id="admin-logs" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Logs do Sistema
        </h2>
        <p className="text-muted-foreground mb-4">
          Registro completo de todas as acoes realizadas no sistema por qualquer usuario.
        </p>

        <ScreenMockup title="Aba Logs - /admin">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Tipos</option>
                <option>Login</option>
                <option>Upload</option>
                <option>Download</option>
                <option>Aprovacao</option>
                <option>Erro</option>
              </select>
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Niveis</option>
                <option>INFO</option>
                <option>WARNING</option>
                <option>ERROR</option>
              </select>
              <button className="px-4 py-2 rounded-lg border text-sm font-medium">
                Exportar CSV
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="p-3 rounded-lg border bg-green-500/5 flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-600">INFO</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><strong>LOGIN</strong> - carlos@petrobras.com.br realizou login via SSO</p>
                  <p className="text-xs text-muted-foreground">IP: 10.0.0.45 | 22/05/2024 14:32:15</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-amber-500/5 flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-600">WARN</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><strong>OTP_RETRY</strong> - joao@empresa.com tentou codigo OTP invalido (2/3)</p>
                  <p className="text-xs text-muted-foreground">IP: 189.45.67.89 | 22/05/2024 14:35:22</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-red-500/5 flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-600">ERROR</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm"><strong>UPLOAD_FAIL</strong> - Falha no upload de arquivo (timeout)</p>
                  <p className="text-xs text-muted-foreground">Usuario: maria@petrobras.com.br | 22/05/2024 14:40:01</p>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* Rastreamento */}
      <section id="admin-rastreamento" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          Rastreamento
        </h2>
        <p className="text-muted-foreground mb-4">
          Acompanhamento em tempo real de compartilhamentos e acessos.
        </p>

        <ScreenMockup title="Aba Rastreamento - /admin">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input 
                type="text" 
                placeholder="Buscar por ID, arquivo ou e-mail..."
                className="flex-1 px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Rastrear
              </button>
            </div>
            
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold">Compartilhamento #1234</p>
                  <p className="text-sm text-muted-foreground">Proposta_Comercial.pdf</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-600">Ativo</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Upload realizado</p>
                    <p className="text-xs text-muted-foreground">22/05/2024 10:00</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Aprovado pelo supervisor</p>
                    <p className="text-xs text-muted-foreground">22/05/2024 11:30</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">E-mail enviado</p>
                    <p className="text-xs text-muted-foreground">22/05/2024 11:31</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Download className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Download realizado (1/5)</p>
                    <p className="text-xs text-muted-foreground">22/05/2024 14:22</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <InfoBox type="tip">
          Use o rastreamento para investigar problemas de acesso, verificar se e-mails foram entregues 
          e acompanhar o ciclo de vida completo de um compartilhamento.
        </InfoBox>
      </section>
    </div>
  )
}

function FAQSection() {
  const faqs = [
    {
      question: "Esqueci minha senha, como recuperar?",
      answer: "Para usuarios internos, a senha e gerenciada pelo Microsoft Entra ID. Acesse o portal de autoatendimento da Microsoft ou entre em contato com o suporte de TI. Usuarios externos nao possuem senha, apenas autenticacao via OTP."
    },
    {
      question: "O destinatario nao recebeu o e-mail, o que fazer?",
      answer: "Verifique se o e-mail do destinatario esta correto. Peca para ele verificar a pasta de spam. O Admin Global pode reenviar o e-mail pelo painel administrativo."
    },
    {
      question: "Posso cancelar um compartilhamento apos aprovado?",
      answer: "Sim, voce pode cancelar um compartilhamento na pagina 'Meus Compartilhamentos'. O link sera desativado imediatamente e o destinatario nao podera mais acessar o arquivo."
    },
    {
      question: "Qual o tamanho maximo de arquivo?",
      answer: "O limite padrao e de 100MB por arquivo. Para arquivos maiores, entre em contato com o Admin Global."
    },
    {
      question: "O codigo OTP expirou, como obter outro?",
      answer: "Na pagina de verificacao, clique em 'Reenviar codigo'. Um novo codigo sera enviado para seu e-mail."
    },
    {
      question: "Como sei se meu compartilhamento foi aprovado?",
      answer: "Voce recebera uma notificacao por e-mail quando o supervisor aprovar ou rejeitar seu compartilhamento. Voce tambem pode verificar o status na pagina 'Meus Compartilhamentos'."
    },
  ]

  return (
    <div className="space-y-8">
      <section id="faq" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-primary" />
          Perguntas Frequentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-lg border bg-card">
              <h4 className="font-semibold mb-2 flex items-start gap-2">
                <span className="text-primary">Q:</span>
                {faq.question}
              </h4>
              <p className="text-sm text-muted-foreground pl-6">
                <span className="text-green-600 font-medium">A:</span> {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Componente Principal
export default function ManualDoUsuarioPage() {
  const [activeSection, setActiveSection] = useState("visao-geral")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderContent = () => {
    switch (activeSection) {
      case "visao-geral":
        return <VisaoGeralSection />
      case "usuario-interno":
        return <UsuarioInternoSection />
      case "supervisor":
        return <SupervisorSection />
      case "usuario-externo":
        return <UsuarioExternoSection />
      case "admin-global":
        return <AdminGlobalSection />
      case "faq":
        return <FAQSection />
      default:
        return <VisaoGeralSection />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                <Book className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Manual do Usuario</h1>
                <p className="text-sm text-muted-foreground">Sistema de Transferencia Segura</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <FileText className="h-4 w-4" />
                Documentacao API
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Voltar ao App
              </Link>
              <button 
                className="md:hidden p-2 rounded-lg hover:bg-muted"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Desktop */}
          <aside className={cn(
            "lg:col-span-1 space-y-2",
            mobileMenuOpen ? "block" : "hidden lg:block"
          )}>
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                  </button>
                  
                  {section.subsections && activeSection === section.id && (
                    <div className="ml-4 mt-1 space-y-1">
                      {section.subsections.map((sub) => (
                        <a
                          key={sub.id}
                          href={`#${sub.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ChevronRight className="h-3 w-3" />
                          {sub.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}
