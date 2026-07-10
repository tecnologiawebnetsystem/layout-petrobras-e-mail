"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronDown,
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
  ExternalLink,
  Eye,
  Lock,
  Send,
  Bell,
  History,
  BarChart3,
  Activity,
  RefreshCw,
  Trash2,
  Edit,
  Copy,
  LogIn,
  MessageSquare,
  Zap,
  Target,
  Layers,
  Server,
  XCircle,
  AlertTriangle,
  MousePointer,
  Keyboard,
  LayoutDashboard,
  PanelLeft,
  Filter,
  Calendar,
  Moon,
  ArrowUpFromLine,
  Text,
  HardDrive,
  Share2,
  Headphones,
  UserPlus,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  subsections?: { id: string; title: string }[];
};

// Navegação
const sections: Section[] = [
  {
    id: "visao-geral",
    title: "Visão Geral",
    icon: <Book className="h-4 w-4" />,
    description: "Introdução ao sistema",
    subsections: [
      { id: "sobre-sistema", title: "Sobre o Sistema" },
      { id: "arquitetura", title: "Arquitetura" },
      { id: "perfis-usuario", title: "Perfis de Usuário" },
      { id: "fluxo-geral", title: "Fluxo Geral" },
    ],
  },
  {
    id: "usuario-interno",
    title: "Usuário Interno",
    icon: <User className="h-4 w-4" />,
    description: "Colaborador Petrobras",
    subsections: [
      { id: "interno-login", title: "1. Login (SSO)" },
      { id: "interno-dashboard", title: "2. Dashboard Inicial" },
      { id: "interno-upload", title: "3. Upload e Compartilhamento" },
      { id: "interno-compartilhamentos", title: "4. Meus Compartilhamentos" },
    ],
  },
  {
    id: "usuario-externo",
    title: "Usuário Externo",
    icon: <Globe className="h-4 w-4" />,
    description: "Terceiros e Parceiros",
    subsections: [
      { id: "externo-email", title: "1. Recebendo o E-mail" },
      { id: "externo-acesso-link", title: "2. Verificação de E-mail" },
      { id: "externo-verificacao", title: "3. Código OTP" },
      { id: "externo-download", title: "4. Download de Arquivos" },
      { id: "externo-problemas", title: "5. Problemas Comuns" },
    ],
  },
  {
    id: "supervisor",
    title: "Supervisor",
    icon: <UserCheck className="h-4 w-4" />,
    description: "Gestor de equipe",
    subsections: [
      { id: "supervisor-acesso", title: "1. Acessando o Painel" },
      { id: "supervisor-painel", title: "2. Painel do Supervisor" },
      { id: "supervisor-lista-pendentes", title: "3. Lista de Pendentes" },
      { id: "supervisor-detalhes", title: "4. Detalhes do Compartilhamento" },
      { id: "supervisor-aprovar", title: "5. Aprovar" },
      { id: "supervisor-rejeitar", title: "6. Rejeitar" },
      { id: "supervisor-auto-aprovacao", title: "7. Auto-Aprovação" },
      { id: "supervisor-auditoria", title: "8. Logs de Auditoria" },
    ],
  },
  {
    id: "admin-global",
    title: "Admin Global",
    icon: <Shield className="h-4 w-4" />,
    description: "Administrador do sistema",
    subsections: [
      { id: "admin-acesso", title: "1. Acessando o Admin" },
      { id: "admin-dashboard", title: "2. Dashboard" },
      { id: "admin-usuarios", title: "3. Gerenciar Usuários" },
      { id: "admin-shares", title: "4. Todos os Compartilhamentos" },
      { id: "admin-logs", title: "5. Logs do Sistema" },
      { id: "admin-rastreamento", title: "6. Rastreamento por Usuário" },
    ],
  },
];

// Componentes de UI
function InfoBox({
  type,
  title,
  children,
}: {
  type: "info" | "warning" | "tip" | "important";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",
    warning:
      "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
    tip: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
    important:
      "bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-400",
  };
  const icons = {
    info: <Info className="h-5 w-5 flex-shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 flex-shrink-0" />,
    tip: <Lightbulb className="h-5 w-5 flex-shrink-0" />,
    important: <Zap className="h-5 w-5 flex-shrink-0" />,
  };
  const titles = {
    info: "Informacao",
    warning: "Atencao",
    tip: "Dica",
    important: "Importante",
  };

  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border", styles[type])}>
      {icons[type]}
      <div className="flex-1">
        {title && <p className="font-semibold mb-1">{title}</p>}
        {!title && <p className="font-semibold mb-1">{titles[type]}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}

function ScreenMockup({
  title,
  description,
  children,
  variant = "desktop",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "desktop" | "mobile" | "email";
}) {
  return (
    <div className="border rounded-2xl overflow-hidden bg-card shadow-xl">
      <div className="bg-gradient-to-r from-muted/80 to-muted/50 border-b px-4 py-3 flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
          <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="px-4 py-1 rounded-lg bg-background/50 border text-xs text-muted-foreground max-w-md truncate">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {variant === "desktop" && (
            <Monitor className="h-4 w-4 text-muted-foreground" />
          )}
          {variant === "mobile" && (
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          )}
          {variant === "email" && (
            <Mail className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>
      {description && (
        <div className="bg-muted/20 border-b px-4 py-2">
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      )}
      <div className="p-6 bg-gradient-to-b from-background to-muted/10">
        {children}
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative pl-12 pb-8 last:pb-0">
      {/* Linha conectora */}
      <div className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-muted last:hidden" />

      {/* Numero do passo */}
      <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg">
        {number}
      </div>

      <div className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3 mb-2">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h4 className="font-semibold text-lg">{title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
        {children && <div className="mt-4 pl-0">{children}</div>}
      </div>
    </div>
  );
}

function FlowDiagram({
  steps,
  vertical = false,
}: {
  steps: {
    label: string;
    icon?: React.ReactNode;
    status?: "done" | "current" | "pending";
  }[];
  vertical?: boolean;
}) {
  return (
    <div
      className={cn(
        "p-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl border",
        vertical
          ? "space-y-3"
          : "flex flex-wrap items-center justify-center gap-3",
      )}
    >
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn("flex items-center gap-2", vertical && "justify-start")}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              step.status === "done" &&
                "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30",
              step.status === "current" &&
                "bg-primary text-primary-foreground shadow-lg scale-105",
              step.status === "pending" &&
                "bg-muted text-muted-foreground border",
              !step.status &&
                "bg-primary/10 text-primary border border-primary/20",
            )}
          >
            {step.icon}
            {step.label}
          </div>
          {index < steps.length - 1 &&
            (vertical ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground -ml-1" />
            ) : (
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            ))}
        </div>
      ))}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color = "primary",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    primary: "from-primary/20 to-primary/5 border-primary/20",
    green: "from-green-500/20 to-green-500/5 border-green-500/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
  };
  const iconColorClasses: Record<string, string> = {
    primary: "text-primary",
    green: "text-green-600",
    blue: "text-blue-600",
    amber: "text-amber-600",
    purple: "text-purple-600",
    red: "text-red-600",
  };

  return (
    <div
      className={cn(
        "p-5 rounded-xl border bg-gradient-to-br",
        colorClasses[color],
      )}
    >
      <div className={cn("mb-3", iconColorClasses[color])}>{icon}</div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "primary" | "secondary" | "success" | "danger";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-muted text-foreground border",
    success: "bg-green-600 text-white",
    danger: "bg-red-600 text-white",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm",
        variants[variant],
      )}
    >
      {icon}
      {label}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down";
}) {
  return (
    <div className="p-4 rounded-xl bg-card border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-muted-foreground">{icon}</span>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend === "up" ? "text-green-600" : "text-red-600",
            )}
          >
            {trend === "up" ? "+" : "-"}12%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function TableMockup({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              {headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variants = {
    default: "bg-muted text-foreground",
    success: "bg-green-500/20 text-green-700 dark:text-green-400",
    warning: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    danger: "bg-red-500/20 text-red-700 dark:text-red-400",
    info: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
        variants[variant],
      )}
    >
      {children}
    </span>
  );
}

// ========================================
// SECAO: VISAO GERAL
// ========================================
function VisaoGeralSection() {
  return (
    <div className="space-y-12">
      {/* Sobre o Sistema */}
      <section id="sobre-sistema" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sobre o Sistema</h2>
            <p className="text-muted-foreground">
              SCAC - Soluções de Compartilhamento de Arquivos Confidenciais
            </p>
          </div>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
          <p className="text-lg text-muted-foreground leading-relaxed">
            O{" "}
            <strong className="text-foreground">
              SCAC - Soluções de Compartilhamento de Arquivos Confidenciais
            </strong>{" "}
            da Petrobras é uma plataforma desenvolvida para permitir o
            compartilhamento controlado e auditado de documentos com usuarios
            externos, como terceiros, parceiros e fornecedores, garantindo total
            conformidade com as políticas de segurança da informação.
          </p>
          <br />
          <p className="text-lg text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Observação: </strong> imagens
            meramente ilustrativas, não representam a interface final do
            sistema. O foco é demonstrar a funcionalidade e o fluxo de
            compartilhamento seguro de arquivos confidenciais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <FeatureCard
            icon={<Shield className="h-8 w-8" />}
            title="Seguro"
            description="Criptografia de ponta a ponta e autenticação em duas etapas (OTP)"
            color="green"
          />
          <FeatureCard
            icon={<Activity className="h-8 w-8" />}
            title="Auditado"
            description="Todos os acessos, downloads e ações são registrados em log"
            color="blue"
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8" />}
            title="Controlado"
            description="Links com data de expiração"
            color="amber"
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Aprovado"
            description="Fluxo de aprovação por supervisor antes do envio"
            color="purple"
          />
        </div>

        <InfoBox type="info" title="Conformidade">
          O sistema foi desenvolvido para atender aos requisitos de segurança da
          informação da Petrobras, garantindo conformidade com as politicas
          internas de compartilhamento de dados e LGPD.
        </InfoBox>
      </section>

      {/* Arquitetura */}
      <section id="arquitetura" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Arquitetura do Sistema</h2>
            <p className="text-muted-foreground">
              Como o sistema funciona internamente
            </p>
          </div>
        </div>

        <ScreenMockup
          title="Arquitetura - Visao Geral"
          description="Diagrama simplificado dos componentes do sistema"
        >
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Server className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400">
                    Ambiente Interno (Intranet)
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Autenticacao corporativa via CAv4 (SSO)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Acesso restrito a rede corporativa
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Upload e gerenciamento de arquivos
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Criação e aprovação de compartilhamentos
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-700 dark:text-green-400">
                    Ambiente Externo (Internet)
                  </h4>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Autenticação via código OTP por e-mail
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Acesso via internet publica
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Download de arquivos compartilhados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Links com expiracao e limite de uso
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* Perfis de Usuario */}
      <section id="perfis-usuario" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Perfis de Usuario</h2>
            <p className="text-muted-foreground">
              Tipos de acesso e permissoes
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Usuario Interno */}
          <div className="p-6 rounded-2xl border bg-gradient-to-br from-blue-500/5 to-transparent hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold">Usuario Interno</h3>
                  <Badge variant="info">Colaborador Petrobras</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Colaborador da Petrobras que faz upload de arquivos e cria
                  compartilhamentos para usuarios externos. Acessa o sistema via
                  SSO corporativo (CAv4) usando suas credenciais Petrobras.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    <Upload className="h-3 w-3" /> Upload de Arquivos
                  </Badge>
                  <Badge variant="default">
                    <Send className="h-3 w-3" /> Criar Compartilhamentos
                  </Badge>
                  <Badge variant="default">
                    <FolderOpen className="h-3 w-3" /> Gerenciar Links
                  </Badge>
                  <Badge variant="default">
                    <History className="h-3 w-3" /> Visualizar Historico
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Supervisor */}
          <div className="p-6 rounded-2xl border bg-gradient-to-br from-amber-500/5 to-transparent hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold">Supervisor</h3>
                  <Badge variant="warning">Gestor de Equipe</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Usuário interno com flag <code>supervisor</code>. Responsável
                  por aprovar ou rejeitar os compartilhamentos criados pelos
                  membros da sua equipe (via <code>supervisionado</code>). Pode
                  acessar logs de auditoria e criar compartilhamentos com
                  auto-aprovação via aba &quot;Compartilhar&quot; do painel{" "}
                  <code>/supervisor</code>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3" /> Aprovar/Rejeitar
                  </Badge>
                  <Badge variant="default">
                    <RefreshCw className="h-3 w-3" /> Estender Prazo
                  </Badge>
                  <Badge variant="default">
                    <Activity className="h-3 w-3" /> Logs de Auditoria
                  </Badge>
                  <Badge variant="default">
                    <Zap className="h-3 w-3" /> Auto-Aprovacao
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Usuario Externo */}
          <div className="p-6 rounded-2xl border bg-gradient-to-br from-green-500/5 to-transparent hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Globe className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold">Usuario Externo</h3>
                  <Badge variant="success">Terceiros / Parceiros</Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Usuarios fora da rede Petrobras (terceiros, parceiros,
                  fornecedores) que recebem arquivos compartilhados. Acesso via
                  link por e-mail com autenticação OTP (código de verificação).
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    <Mail className="h-3 w-3" /> Recebe E-mail
                  </Badge>
                  <Badge variant="default">
                    <Key className="h-3 w-3" /> Verificacao OTP
                  </Badge>
                  <Badge variant="default">
                    <Download className="h-3 w-3" /> Download de Arquivos
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Global */}
          <div className="p-6 rounded-2xl border bg-gradient-to-br from-purple-500/5 to-transparent hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold">Admin Logs</h3>
                  <Badge variant="info">
                    Visão de logs do sistema completa
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">
                  Usuário interno com flag <code>administrador</code>. Acesso
                  irrestrito ao painel
                  <code>/admin</code> com 4 abas: Dashboard (métricas globais),
                  Usuários (Listagem de usuários cadastrados e níveis de
                  acesso), Compartilhamentos (todos os shares do sistema) e Logs
                  (auditoria completa). Também possui rastreamento de atividades
                  por e-mail.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">
                    <BarChart3 className="h-3 w-3" /> Dashboard Global
                  </Badge>
                  <Badge variant="default">
                    <Users className="h-3 w-3" /> Gerenciar Usuários
                  </Badge>
                  <Badge variant="default">
                    <Activity className="h-3 w-3" /> Logs do Sistema
                  </Badge>
                  <Badge variant="default">
                    <Eye className="h-3 w-3" /> Rastreamento
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fluxo Geral */}
      <section id="fluxo-geral" className="scroll-mt-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Fluxo Geral do Sistema</h2>
            <p className="text-muted-foreground">
              Ciclo completo de um compartilhamento
            </p>
          </div>
        </div>

        <ScreenMockup
          title="Fluxo de Compartilhamento"
          description="Do upload ao download pelo usuario externo"
        >
          <FlowDiagram
            steps={[
              {
                label: "1. Upload + Compartilhamento",
                icon: <Upload className="h-4 w-4" />,
              },
              {
                label: "2. Aguardar Aprovação",
                icon: <Clock className="h-4 w-4" />,
              },
              {
                label: "3. Supervisor Aprova",
                icon: <CheckCircle className="h-4 w-4" />,
              },
              {
                label: "4. E-mail ao Externo",
                icon: <Mail className="h-4 w-4" />,
              },
              {
                label: "5. Externo Acessa /external-verify",
                icon: <Globe className="h-4 w-4" />,
              },
              {
                label: "6. Verifica OTP",
                icon: <Key className="h-4 w-4" />,
              },
              {
                label: "7. Download em /download",
                icon: <Download className="h-4 w-4" />,
              },
            ]}
          />
        </ScreenMockup>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <InfoBox type="tip" title="Auto-Aprovação para Supervisores">
            Quando um supervisor cria um compartilhamento pela aba
            &quot;Compartilhar&quot; do painel <code>/supervisor</code>, o mesmo
            é aprovado automaticamente, pulando a etapa de aguardar aprovação.
          </InfoBox>
          <InfoBox type="info" title="Notificações por E-mail">
            O sistema envia e-mails em cada etapa: ao supervisor quando há
            pendência, ao remetente com o resultado (aprovado/rejeitado) e ao
            destinatário externo com o link de acesso após aprovação.
          </InfoBox>
        </div>
      </section>
    </div>
  );
}

// ========================================
// SECAO: USUARIO INTERNO
// ========================================
function UsuarioInternoSection() {
  return (
    <div className="space-y-12">
      {/* Introducao */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <User className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Guia do Usuário Interno</h2>
            <p className="text-muted-foreground">
              Este guia detalha todas as funcionalidades disponíveis para
              colaboradores Petrobras, desde o login até o gerenciamento de
              compartilhamentos.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Login SSO */}
      <section id="interno-login" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-primary" />
          </div>
          1. Login (SSO)
        </h2>

        <ScreenMockup
          title="petrobras-transfer.com.br"
          description="Tela inicial de login do sistema"
        >
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-xl">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">SCAC</h3>
            <p className="text-muted-foreground mb-8">
              Soluções de Compartilhamento de Arquivos Confidenciais - Petrobras
            </p>

            <div className="p-4 rounded-xl bg-gradient-to-r from-[#0078d4] to-[#106ebe] text-white cursor-pointer hover:opacity-90 transition-opacity shadow-lg">
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#f25022] rounded-tl rounded-br" />
                </div>
                <span className="font-semibold">Login corporativo</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              Use suas credenciais corporativas @petrobras.com.br
            </p>
          </div>
        </ScreenMockup>

        <div className="mt-8 space-y-0">
          <StepCard
            number={1}
            title="Acesse o Sistema"
            description="Abra o navegador e acesse a URL do sistema de transferencia segura."
            icon={<Globe className="h-5 w-5" />}
          />
          <StepCard
            number={2}
            title="Clique em 'Login Corporativo'"
            description="Voce sera redirecionado para a pagina de autenticacao corporativa (CAv4)."
            icon={<MousePointer className="h-5 w-5" />}
          />
          <StepCard
            number={3}
            title="Insira suas Credenciais"
            description="Digite seu e-mail corporativo (@petrobras.com.br) e sua senha."
            icon={<Keyboard className="h-5 w-5" />}
          />
          <StepCard
            number={4}
            title="Autenticacao MFA"
            description="Se habilitado, confirme o acesso no Microsoft Authenticator ou outro metodo MFA."
            icon={<Smartphone className="h-5 w-5" />}
          />
          <StepCard
            number={5}
            title="Acesso Concedido"
            description="Após a autenticação, você será redirecionado ao dashboard do sistema."
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6">
          <InfoBox type="tip" title="Login Automatico">
            Se voce ja estiver logado em outro sistema Microsoft (Outlook,
            Teams, SharePoint), o login pode ser automatico sem necessidade de
            digitar a senha novamente.
          </InfoBox>
        </div>
      </section>

      {/* 2. Dashboard Inicial */}
      <section id="interno-dashboard" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          2. Dashboard Inicial
        </h2>

        <ScreenMockup
          title="Dashboard - /dashboard"
          description="Tela principal apos o login"
        >
          <div className="space-y-6">
            {/* Header simulado */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold">SCAC</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                  <Moon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm">Joao Silva</span>
                </div>
              </div>
            </div>

            {/* Cards de Metricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Total enviados"
                value="12"
                icon={<FileText className="h-5 w-5" />}
              />
              <MetricCard
                label="Aguardando aprovação"
                value="8"
                icon={<Clock className="h-5 w-5" />}
              />
              <MetricCard
                label="Aprovados"
                value="2"
                icon={<CheckCircle className="h-5 w-5" />}
              />
              <MetricCard
                label="Rejeitados"
                value="45"
                icon={<XCircle className="h-5 w-5" />}
              />
            </div>

            {/* Ações Rápidas */}
            <div>
              <h4 className="font-semibold mb-3">Ações Rápidas</h4>
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  icon={<ArrowUpFromLine className="h-4 w-4" />}
                  label="Transferencia Segura de Arquivos"
                  variant="secondary"
                />
                <ActionButton
                  icon={<FolderOpen className="h-4 w-4" />}
                  label="Meus Compartilhamentos"
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <InfoBox type="info" title="Notificações">
            O ícone de sino mostra notificações importantes como aprovações,
            rejeições e downloads realizados.
          </InfoBox>
          <InfoBox type="tip" title="Atalho Rapido">
            Use as "Ações Rápidas" para acessar rapidamente as funcionalidades
            mais utilizadas.
          </InfoBox>
        </div>
      </section>

      {/* 3. Upload e Compartilhamento */}
      <section id="interno-upload" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          3. Upload e Compartilhamento
        </h2>

        <ScreenMockup
          title="/upload"
          description="Página de upload e criação de compartilhamento em uma única etapa"
        >
          <div className="space-y-6">
            {/* Área de Drag and Drop */}
            <div className="border-2 border-dashed border-primary/30 rounded-2xl p-10 text-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="h-14 w-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="text-lg font-semibold mb-2">
                Arraste arquivos aqui
              </p>
              <p className="text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <ActionButton
                icon={<FolderOpen className="h-4 w-4" />}
                label="Selecionar Arquivos"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Máximo: 100MB por arquivo
              </p>
            </div>

            {/* Arquivo selecionado */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Arquivos</h4>
              <div className="flex items-center gap-4 p-3 rounded-xl border bg-card">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    Proposta_Comercial_2024.pdf
                  </p>
                  <p className="text-xs text-muted-foreground">2.5 MB</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>
            </div>

            {/* Dados do destinatário */}
            <div className="p-4 rounded-xl border bg-card space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Destinatário Externo
              </h4>
              <div>
                <label className="text-xs font-medium mb-1 block text-muted-foreground">
                  E-mail do Destinatário *
                </label>
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="contato@empresa.com"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Configurações */}
            <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Configurações do Compartilhamento
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">
                    Prazo de Expiração
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <select className="flex-1 bg-transparent outline-none text-sm">
                      <option>24 horas (1 dia)</option>
                      <option>48 horas (2 dias)</option>
                      <option>72 horas (3 dias)</option>
                      <option>96 horas (4 dias)</option>
                      <option>120 horas (5 dias)</option>
                      <option>144 horas (6 dias)</option>
                      <option>168 horas (7 dias)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block text-muted-foreground">
                    Descrição
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                    <Text className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Contexto do envio..."
                      className="flex-1 bg-transparent outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botão */}
            <div className="flex justify-end">
              <ActionButton
                icon={<Send className="h-4 w-4" />}
                label="Enviar para Aprovação"
                variant="success"
              />
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-8 space-y-0">
          <StepCard
            number={1}
            title="Acesse /upload"
            description="Clique em 'Transferência Segura de Arquivos' no dashboard ou acesse /upload diretamente."
            icon={<Upload className="h-5 w-5" />}
          />
          <StepCard
            number={2}
            title="Selecione os Arquivos"
            description="Arraste e solte os arquivos na área indicada ou clique em 'Selecionar Arquivos'. O upload inicia automaticamente."
            icon={<FolderOpen className="h-5 w-5" />}
          />
          <StepCard
            number={3}
            title="Informe o Destinatário"
            description="Digite o e-mail do usuário externo (terceiro, parceiro ou fornecedor) que receberá os arquivos."
            icon={<Mail className="h-5 w-5" />}
          />
          <StepCard
            number={4}
            title="Defina Prazo e Descrição"
            description="Defina o prazo de expiração do link (padrão: 7 dias) e adicione uma descrição para contextualizar o envio."
            icon={<Clock className="h-5 w-5" />}
          />
          <StepCard
            number={5}
            title="Enviar para Aprovação"
            description="Clique em 'Enviar para Aprovação'. O sistema cria o compartilhamento com status PENDENTE e notifica o supervisor por e-mail."
            icon={<Send className="h-5 w-5" />}
          />
          <StepCard
            number={6}
            title="Confirmação"
            description="A tela exibe um resumo do compartilhamento criado. Acompanhe o status em 'Meus Compartilhamentos'."
            icon={<CheckCircle className="h-5 w-5" />}
          />
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <InfoBox type="warning" title="Arquivos Não Permitidos">
            Arquivos executáveis (.exe, .bat, .sh, .cmd) e scripts não são
            permitidos por motivos de segurança. Se necessário, compacte em ZIP.
          </InfoBox>
          <InfoBox type="info" title="Fluxo de Aprovação">
            Após o envio, o compartilhamento fica com status{" "}
            <strong>Pendente</strong> até que o supervisor aprove ou rejeite.
            Somente após aprovação o e-mail é enviado ao destinatário externo.
          </InfoBox>
        </div>
      </section>

      {/* 4. Meus Compartilhamentos */}
      <section id="interno-compartilhamentos" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          4. Meus Compartilhamentos
        </h2>

        <ScreenMockup
          title="/compartilhamentos"
          description="Lista de todos os seus compartilhamentos"
        >
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 pb-4 border-b">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground">
                <Filter className="h-4 w-4" />
                <span className="text-sm">Todos</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Aprovados/Ativos</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Rejeitados</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Expirados</span>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      Relatorio Trimestral Q1
                    </p>
                    <Badge variant="success">
                      <CheckCircle className="h-3 w-3" /> Aprovado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para: joao.silva@empresa.com
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expira em: 5 dias
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-muted">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Item Pendente */}
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all border-l-4 border-l-amber-500">
                <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">Proposta Comercial</p>
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" /> Pendente
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para: maria@fornecedor.com
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aguardando aprovação do supervisor
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-muted">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-muted text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Item Rejeitado */}
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all border-l-4 border-l-red-500">
                <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      Documento Confidencial
                    </p>
                    <Badge variant="danger">
                      <XCircle className="h-3 w-3" /> Rejeitado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Para: pedro@parceiro.com
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Motivo: Informacao classificada nao pode ser compartilhada
                    externamente
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-muted">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border bg-card">
            <h4 className="font-semibold mb-3">Legenda de Status</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">
                  <strong>Pendente:</strong> Aguardando aprovação do supervisor
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm">
                  <strong>Aprovado / Ativo:</strong> E-mail enviado, link
                  disponível
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">
                  <strong>Concluído:</strong> Arquivos foram baixados
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">
                  <strong>Rejeitado:</strong> Negado pelo supervisor
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm">
                  <strong>Expirado:</strong> Prazo de validade encerrado
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-gray-600" />
                <span className="text-sm">
                  <strong>Cancelado:</strong> Cancelado pelo remetente
                </span>
              </div>
            </div>
          </div>

          <InfoBox type="tip" title="Ações Disponíveis">
            <ul className="space-y-1 mt-2">
              <li>
                <strong>Ver:</strong> Visualizar detalhes do compartilhamento
              </li>
              <li>
                <strong>Copiar:</strong> Copiar link de download (se aprovado)
              </li>
              <li>
                <strong>Cancelar:</strong> Cancelar compartilhamento pendente ou
                ativo
              </li>
            </ul>
          </InfoBox>
        </div>
      </section>
    </div>
  );
}
function UsuarioExternoSection() {
  return (
    <div className="space-y-12">
      {/* Introducao */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Globe className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Guia do Usuario Externo</h2>
            <p className="text-muted-foreground">
              Este guia explica como terceiros, parceiros e fornecedores podem
              acessar e baixar arquivos compartilhados pela Petrobras de forma
              segura.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Recebendo o E-mail */}
      <section id="externo-email" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-green-600" />
          </div>
          1. Recebendo o E-mail
        </h2>

        <ScreenMockup
          title="Caixa de Entrada"
          description="E-mail recebido do sistema Petrobras"
          variant="email"
        >
          <div className="max-w-lg mx-auto">
            <div className="p-6 rounded-xl border bg-white dark:bg-slate-900">
              {/* Cabecalho do E-mail */}
              <div className="flex items-center gap-4 pb-4 border-b mb-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-xl">
                  P
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Petrobras - SCAC</p>
                  <p className="text-sm text-muted-foreground">
                    noreply@petrobras.com.br
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Hoje, 14:32
                </span>
              </div>

              {/* Assunto */}
              <h3 className="text-lg font-semibold mb-4">
                Voce recebeu um arquivo compartilhado
              </h3>

              {/* Corpo do E-mail */}
              <div className="space-y-4 text-sm">
                <p>
                  Ola <strong>Joao</strong>,
                </p>
                <p>
                  <strong>Carlos Mendes</strong> da Petrobras compartilhou um
                  arquivo com voce atraves do SCAC - Soluções de
                  Compartilhamento de Arquivos Confidenciais.
                </p>

                <div className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3 mb-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Proposta_Comercial_2024.pdf</p>
                      <p className="text-xs text-muted-foreground">2.5 MB</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mensagem: &quot;Segue a proposta comercial conforme alinhado
                    em reuniao.&quot;
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center cursor-pointer hover:opacity-90 transition-opacity">
                  <span className="font-semibold">Acessar Arquivo</span>
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-400">
                        Informações Importantes:
                      </p>
                      <ul className="mt-1 space-y-1 text-muted-foreground">
                        <li>
                          • Este link expira em <strong>7 dias</strong>
                        </li>
                        <li>
                          • Limite de <strong>5 downloads</strong>
                        </li>
                        <li>• Voce precisara verificar seu e-mail</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="warning" title="Verifique o Remetente">
            Sempre verifique se o e-mail veio de um endereco oficial da
            Petrobras (@petrobras.com.br). Desconfie de e-mails suspeitos e
            nunca informe dados pessoais alem do necessario.
          </InfoBox>
        </div>
      </section>

      {/* 2. Acessando o Link */}
      <section id="externo-acesso-link" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <ExternalLink className="h-5 w-5 text-green-600" />
          </div>
          2. Acessando o Link
        </h2>

        <ScreenMockup
          title="/external-verify"
          description="Primeira etapa de acesso ao arquivo - informe seu e-mail"
        >
          <div className="max-w-md mx-auto text-center">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-xl">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              Verificacao de Seguranca
            </h3>
            <p className="text-muted-foreground mb-8">
              Para acessar o arquivo compartilhado, precisamos verificar seu
              e-mail.
            </p>

            <div className="p-5 rounded-xl border bg-card text-left mb-6">
              <label className="text-sm font-medium mb-2 block">
                Seu e-mail
              </label>
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value="joao@empresa.com"
                  className="flex-1 bg-transparent outline-none text-sm"
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                O e-mail deve ser o mesmo para o qual o arquivo foi
                compartilhado.
              </p>
            </div>

            <ActionButton
              icon={<Send className="h-4 w-4" />}
              label="Enviar Codigo de Verificacao"
              variant="success"
            />
          </div>
        </ScreenMockup>
      </section>

      {/* 3. Verificacao OTP */}
      <section id="externo-verificacao" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Key className="h-5 w-5 text-green-600" />
          </div>
          3. Verificacao OTP
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <ScreenMockup
            title="Digite o Codigo OTP"
            description="Codigo de 6 digitos enviado por e-mail"
          >
            <div className="max-w-sm mx-auto text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Key className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Digite o Codigo</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Enviamos um código de 6 dígitos para{" "}
                <strong>joao@empresa.com</strong>
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-14 rounded-lg border-2 border-primary bg-card flex items-center justify-center text-2xl font-bold"
                  >
                    {i <= 4 ? "•" : ""}
                  </div>
                ))}
              </div>

              <ActionButton
                icon={<CheckCircle className="h-4 w-4" />}
                label="Verificar"
                variant="success"
              />

              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Não recebeu o código?
                  <button className="text-primary font-medium ml-1">
                    Reenviar
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  O código expira em <strong>10 minutos</strong>. Máx. 5
                  tentativas.
                </p>
              </div>
            </div>
          </ScreenMockup>

          <ScreenMockup title="E-mail com Codigo OTP" variant="email">
            <div className="p-4 rounded-xl border bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3 pb-3 border-b mb-3">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
                  P
                </div>
                <div>
                  <p className="font-medium text-sm">
                    Petrobras - Codigo de Verificacao
                  </p>
                  <p className="text-xs text-muted-foreground">
                    noreply@petrobras.com.br
                  </p>
                </div>
              </div>

              <p className="text-sm mb-4">Seu código de verificação é:</p>

              <div className="p-4 rounded-lg bg-muted text-center mb-4">
                <p className="text-3xl font-bold tracking-widest">847291</p>
              </div>

              <p className="text-xs text-muted-foreground">
                Este código é válido por 10 minutos. Não compartilhe com
                ninguém. Máximo de 5 tentativas.
              </p>
            </div>
          </ScreenMockup>
        </div>
      </section>

      {/* 4. Download de Arquivos */}
      <section id="externo-download" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          4. Download de Arquivos
        </h2>

        <ScreenMockup
          title="/download"
          description="Lista de arquivos disponíveis após verificação OTP"
        >
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto mb-4 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Verificacao Concluida!</h3>
              <p className="text-muted-foreground">
                Seu arquivo esta pronto para download
              </p>
            </div>

            <div className="p-5 rounded-xl border bg-card mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-7 w-7 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Proposta_Comercial_2024.pdf</p>
                  <p className="text-sm text-muted-foreground">2.5 MB</p>
                </div>
              </div>

              <div className="space-y-2 p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enviado por:</span>
                  <span>Carlos Mendes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de envio:</span>
                  <span>22/05/2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expira em:</span>
                  <span className="text-amber-600 font-medium">5 dias</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Download className="h-5 w-5" />
              <span className="font-semibold">Baixar Arquivo</span>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <FlowDiagram
            steps={[
              {
                label: "Recebe E-mail",
                icon: <Mail className="h-4 w-4" />,
                status: "done",
              },
              {
                label: "Clica no Link",
                icon: <ExternalLink className="h-4 w-4" />,
                status: "done",
              },
              {
                label: "Informa E-mail",
                icon: <User className="h-4 w-4" />,
                status: "done",
              },
              {
                label: "Recebe OTP",
                icon: <Key className="h-4 w-4" />,
                status: "done",
              },
              {
                label: "Digita Codigo",
                icon: <Keyboard className="h-4 w-4" />,
                status: "done",
              },
              {
                label: "Baixa Arquivo",
                icon: <Download className="h-4 w-4" />,
                status: "current",
              },
            ]}
          />
        </div>
      </section>

      {/* 5. Problemas Comuns */}
      <section id="externo-problemas" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          5. Problemas Comuns
        </h2>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border bg-card">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Não recebi o e-mail com o código OTP
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• Verifique a pasta de Spam/Lixo Eletronico</li>
              <li>• Aguarde alguns minutos e tente reenviar</li>
              <li>• Confirme se o e-mail digitado esta correto</li>
              <li>• Entre em contato com o remetente da Petrobras</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border bg-card">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Link expirado ou inválido
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• O link tem prazo de validade definido pelo remetente</li>
              <li>• Solicite ao remetente um novo compartilhamento</li>
              <li>• Verifique se copiou o link completo</li>
            </ul>
          </div>

          <div className="p-5 rounded-xl border bg-card">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Codigo OTP expirado ou bloqueado
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-7">
              <li>• O código é válido por apenas 10 minutos</li>
              <li>
                • Você tem no máximo <strong>5 tentativas</strong> por sessão
              </li>
              <li>
                • Após 5 tentativas incorretas, aguarde{" "}
                <strong>15 minutos</strong>
              </li>
              <li>
                • Clique em &quot;Reenviar código&quot; para receber um novo
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

// ========================================
// SECAO: SUPERVISOR
// ========================================
function SupervisorSection() {
  return (
    <div className="space-y-12">
      {/* Introducao */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <UserCheck className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Guia do Supervisor</h2>
            <p className="text-muted-foreground">
              Este guia detalha as funcionalidades exclusivas do supervisor,
              incluindo aprovação de compartilhamentos, gerenciamento de equipe
              e visualização de logs de auditoria.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Acessando o Painel */}
      <section id="supervisor-acesso" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-amber-600" />
          </div>
          1. Acessando o Painel
        </h2>

        <p className="text-muted-foreground mb-6">
          O acesso ao painel do supervisor e feito da mesma forma que o usuario
          interno (via SSO). Após o login, o sistema detecta automaticamente seu
          perfil de supervisor e exibe as opções adicionais.
        </p>
      </section>

      {/* 2. Dashboard do Supervisor */}
      <section id="supervisor-painel" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-amber-600" />
          </div>
          2. Dashboard do Supervisor
        </h2>

        <ScreenMockup
          title="Painel do Supervisor - /supervisor"
          description="Visão geral das aprovações e métricas da equipe"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Painel do Supervisor</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie aprovações, compartilhamentos e visualize logs
                </p>
              </div>
            </div>

            {/* Cards de Metricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="h-10 w-10 mb-3 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold">30</p>
                <p className="text-sm text-muted-foreground">
                  Total para Analise
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                <div className="h-10 w-10 mb-3 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600">5</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="h-10 w-10 mb-3 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">23</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <div className="h-10 w-10 mb-3 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-sm text-muted-foreground">Rejeitados</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              <button className="px-4 py-2 border-b-2 border-primary font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprovações
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs">
                  5
                </span>
              </button>
              <button className="px-4 py-2 text-muted-foreground flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Compartilhar
              </button>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 3. Lista de Pendentes */}
      <section id="supervisor-lista-pendentes" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          3. Lista de Pendentes
        </h2>

        <ScreenMockup
          title="Aprovações Pendentes"
          description="Lista de compartilhamentos aguardando sua aprovação"
        >
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border bg-background">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Buscar por nome, remetente..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
              <button className="p-2 rounded-lg border hover:bg-muted">
                <Filter className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg border hover:bg-muted">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de itens */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl border bg-card hover:shadow-md transition-all border-l-4 border-l-amber-500">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-100">
                    <FileText className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        Proposta_Comercial_2024.pdf
                      </h4>
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" /> Pendente
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>
                        <User className="h-3 w-3 inline mr-1" /> Carlos Mendes
                      </span>
                      <span>
                        <Mail className="h-3 w-3 inline mr-1" />{" "}
                        joao@empresa.com
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" /> Solicitado:
                      22/05/2024 14:32 | 2 arquivo(s)
                    </p>
                  </div>
                  <ActionButton
                    icon={<Eye className="h-4 w-4" />}
                    label="Ver Detalhes"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-card hover:shadow-md transition-all border-l-4 border-l-amber-500">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-100">
                    <FileText className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">
                        Relatorio_Trimestral_Q2.xlsx
                      </h4>
                      <Badge variant="warning">
                        <Clock className="h-3 w-3" /> Pendente
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>
                        <User className="h-3 w-3 inline mr-1" /> Maria Silva
                      </span>
                      <span>
                        <Mail className="h-3 w-3 inline mr-1" />{" "}
                        parceiro@fornecedor.com
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3 inline mr-1" /> Solicitado:
                      22/05/2024 10:15 | 1 arquivo(s)
                    </p>
                  </div>
                  <ActionButton
                    icon={<Eye className="h-4 w-4" />}
                    label="Ver Detalhes"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 4. Detalhes do Compartilhamento */}
      <section id="supervisor-detalhes" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Eye className="h-5 w-5 text-amber-600" />
          </div>
          4. Detalhes do Compartilhamento
        </h2>

        <ScreenMockup
          title="Detalhes - Compartilhamento #1234"
          description="Visualizacao completa antes de aprovar ou rejeitar"
        >
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Informações do Arquivo */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações do Arquivo
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Nome do Arquivo
                  </p>
                  <p className="font-medium">Proposta_Comercial_2024.pdf</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamanho</p>
                  <p className="font-medium">2.5 MB</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Data de Upload
                  </p>
                  <p className="font-medium">22/05/2024 14:30</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">PDF</p>
                </div>
              </div>
            </div>

            {/* Solicitante */}
            <div className="p-5 rounded-xl border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Solicitante (Remetente)
              </h4>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Carlos Mendes</p>
                  <p className="text-sm text-muted-foreground">
                    carlos.mendes@petrobras.com.br
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Departamento: TI | Cargo: Analista
                  </p>
                </div>
              </div>
            </div>

            {/* Destinatario */}
            <div className="p-5 rounded-xl border bg-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Destinatario (Externo)
              </h4>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Globe className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">Joao Silva</p>
                  <p className="text-sm text-muted-foreground">
                    joao@empresa.com
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagem */}
            <div className="p-5 rounded-xl bg-muted/50 border">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagem do Solicitante
              </h4>
              <p className="text-sm text-muted-foreground italic">
                &quot;Segue a proposta comercial conforme alinhado na reuniao de
                ontem. Por favor, analise e retorne com comentarios.&quot;
              </p>
            </div>

            {/* Botoes de Acao */}
            <div className="flex gap-4">
              <button className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                <CheckCircle className="h-5 w-5" />
                Aprovar
              </button>
              <button className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                <XCircle className="h-5 w-5" />
                Rejeitar
              </button>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 5. Aprovar Compartilhamento */}
      <section id="supervisor-aprovar" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          5. Aprovar Compartilhamento
        </h2>

        <ScreenMockup
          title="Confirmacao de Aprovacao"
          description="Modal de confirmacao antes de aprovar"
        >
          <div className="max-w-md mx-auto">
            <div className="p-6 rounded-xl border bg-card text-center">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Confirmar Aprovacao</h3>
              <p className="text-muted-foreground mb-6">
                Ao aprovar, o e-mail sera enviado automaticamente para o
                destinatario com o link de acesso ao arquivo.
              </p>

              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-left mb-6">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  O que acontece apos aprovar:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" /> E-mail
                    enviado ao destinatario
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" /> Link de
                    download fica ativo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />{" "}
                    Solicitante e notificado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" /> Registro
                    no log de auditoria
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 py-2 rounded-lg border hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button className="flex-1 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors">
                  Confirmar Aprovacao
                </button>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 6. Rejeitar Compartilhamento */}
      <section id="supervisor-rejeitar" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          6. Rejeitar Compartilhamento
        </h2>

        <ScreenMockup
          title="Motivo da Rejeição"
          description="Informe o motivo da rejeição para o solicitante"
        >
          <div className="max-w-md mx-auto">
            <div className="p-6 rounded-xl border bg-card">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-center">
                Rejeitar Compartilhamento
              </h3>
              <p className="text-muted-foreground mb-6 text-center">
                Informe o motivo da rejeição. O solicitante será notificado.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Motivo da Rejeicao *
                  </label>
                  <textarea
                    placeholder="Adicione mais detalhes sobre a rejeição..."
                    className="w-full p-3 rounded-lg border bg-background resize-none h-24"
                  />
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                    O que acontece apos rejeitar:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" /> Nenhum e-mail
                      enviado ao externo
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" /> Solicitante
                      notificado com motivo
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-500" /> Arquivo
                      permanece no sistema
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-2 rounded-lg border hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors">
                    Confirmar Rejeicao
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 7. Auto-Aprovacao */}
      <section id="supervisor-auto-aprovacao" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          7. Auto-Aprovação
        </h2>

        <p className="text-muted-foreground mb-6">
          Como supervisor, seus próprios compartilhamentos criados na{" "}
          <strong>aba "Compartilhar"</strong> do painel
          <code>/supervisor</code> são aprovados automaticamente, sem
          necessidade de aprovação de outro supervisor.
        </p>

        <ScreenMockup
          title="/supervisor — Aba Compartilhar"
          description="Aviso de auto-aprovação"
        >
          <div className="max-w-md mx-auto">
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    Auto-Aprovacao Habilitada
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Como voce e supervisor, seu compartilhamento sera{" "}
                    <strong>aprovado automaticamente</strong> apos a criacao. O
                    e-mail sera enviado imediatamente ao destinatario.
                  </p>
                </div>
              </div>
            </div>

            <ActionButton
              icon={<Send className="h-4 w-4" />}
              label="Criar e Aprovar Automaticamente"
              variant="success"
            />
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="important" title="Responsabilidade">
            A auto-aprovação é um privilégio que exige responsabilidade. Todos
            os compartilhamentos sao registrados em log de auditoria e podem ser
            revisados pelo Admin Global.
          </InfoBox>
        </div>
      </section>

      {/* 8. Logs de Auditoria */}
      <section id="supervisor-auditoria" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          8. Logs de Auditoria
        </h2>

        <ScreenMockup
          title="Auditoria - /auditoria"
          description="Logs de ações da sua equipe (somente visualização)"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Tipos</option>
                <option>Upload</option>
                <option>Download</option>
                <option>Aprovacao</option>
                <option>Rejeicao</option>
              </select>
              <div className="flex-1" />
              <p className="text-sm text-muted-foreground">
                Exibindo ultimos 7 dias
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                <Badge variant="info">
                  <Upload className="h-3 w-3" /> UPLOAD
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    carlos.mendes@petrobras.com.br
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fez upload de Proposta_Comercial.pdf
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Hoje, 14:32
                </span>
              </div>

              <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                <Badge variant="success">
                  <CheckCircle className="h-3 w-3" /> APROVADO
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">voce (supervisor)</p>
                  <p className="text-xs text-muted-foreground">
                    Aprovou compartilhamento #1234
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Hoje, 14:45
                </span>
              </div>

              <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                <Badge variant="default">
                  <Download className="h-3 w-3" /> DOWNLOAD
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    joao@empresa.com (externo)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Baixou arquivo do compartilhamento #1234
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Hoje, 15:10
                </span>
              </div>

              <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
                <Badge variant="danger">
                  <XCircle className="h-3 w-3" /> REJEITADO
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">voce (supervisor)</p>
                  <p className="text-xs text-muted-foreground">
                    Rejeitou compartilhamento #1230 - Motivo: Informacao
                    confidencial
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  Ontem, 16:20
                </span>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="warning" title="Somente Leitura">
            Como supervisor, voce pode apenas <strong>visualizar</strong> os
            logs de auditoria da sua equipe. Somente o Admin Global pode
            exportar dados ou alterar configurações de auditoria.
          </InfoBox>
        </div>
      </section>
    </div>
  );
}

// ========================================
// SECAO: ADMIN GLOBAL
// ========================================
function AdminGlobalSection() {
  return (
    <div className="space-y-12">
      {/* Introducao */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Guia do Admin Global</h2>
            <p className="text-muted-foreground">
              O Admin Global é um colaborador Petrobras com a flag{" "}
              <code>is_admin=true</code>. Tem acesso ao painel{" "}
              <code>/admin</code> com quatro abas: <strong>Dashboard</strong>,{" "}
              <strong>Usuários</strong>, <strong>Compartilhamentos</strong> e{" "}
              <strong>Logs</strong>.
            </p>
          </div>
        </div>
      </div>

      <InfoBox type="important" title="Acesso Restrito">
        O Admin Global tem acesso aos logs e rastreabilidade de todos os
        usuários do sistema. Use este acesso com responsabilidade e siga as
        políticas de segurança da informação.
      </InfoBox>

      {/* 1. Acessando o Admin */}
      <section id="admin-acesso" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-purple-600" />
          </div>
          1. Acessando o Painel Admin
        </h2>

        <p className="text-muted-foreground mb-6">
          O acesso ao painel administrativo é feito via SSO. Após o login, o
          sistema detecta automaticamente seu perfil de administrador e libera o
          acesso ao menu &quot;Administração&quot;.
        </p>
      </section>

      {/* 2. Logs do Sistema */}
      <section id="admin-dashboard" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          2. Dashboard do Admin
        </h2>

        <p className="text-muted-foreground mb-6">
          A aba <strong>Dashboard</strong> exibe um resumo em tempo real da
          saúde do sistema: usuários cadastrados, compartilhamentos por status e
          armazenamento utilizado.
        </p>

        <ScreenMockup
          title="/admin — Aba Dashboard"
          description="Visão geral do sistema com métricas e status"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Usuários",
                  value: "142",
                  icon: <Users className="h-5 w-5 text-blue-500" />,
                },
                {
                  label: "Compartilhamentos",
                  value: "538",
                  icon: <Share2 className="h-5 w-5 text-purple-500" />,
                },
                {
                  label: "Armazenamento",
                  value: "12.4 GB",
                  icon: <HardDrive className="h-5 w-5 text-amber-500" />,
                },
                {
                  label: "Pendentes",
                  value: "17",
                  icon: <Clock className="h-5 w-5 text-red-500" />,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-4 rounded-xl border bg-card flex flex-col gap-2"
                >
                  {m.icon}
                  <p className="text-2xl font-bold">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <h4 className="text-sm font-semibold mb-3">
                Compartilhamentos por Status
              </h4>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Pendente", color: "bg-amber-500", pct: "12%" },
                  { label: "Aprovado", color: "bg-blue-500", pct: "45%" },
                  { label: "Concluído", color: "bg-green-500", pct: "28%" },
                  { label: "Expirado", color: "bg-gray-400", pct: "10%" },
                  { label: "Rejeitado", color: "bg-red-500", pct: "5%" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full", s.color)} />
                    {s.label} ({s.pct})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 3. Gerenciar Usuarios */}
      <section id="admin-usuarios" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          3. Gerenciar Usuários
        </h2>

        <p className="text-muted-foreground mb-6">
          A aba <strong>Usuários</strong> lista todos os usuários do sistema. O
          admin pode visualizar detalhes, alterar permissões (promover/rebaixar
          admin) e filtrar por tipo ou status.
        </p>

        <ScreenMockup
          title="/admin — Aba Usuários"
          description="Gerenciamento de todos os usuários cadastrados"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Tipos</option>
                <option>Interno</option>
                <option>Externo</option>
                <option>Supervisor</option>
                <option>Admin</option>
                <option>Suporte</option>
              </select>
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Status</option>
                <option>Ativo</option>
                <option>Inativo</option>
              </select>
            </div>
            <TableMockup
              headers={["Nome", "E-mail", "Tipo", "Admin", "Ações"]}
              rows={[
                [
                  <span key="n1" className="font-medium">
                    Carlos Mendes
                  </span>,
                  <span key="e1" className="text-sm">
                    carlos@petrobras.com.br
                  </span>,
                  <Badge key="t1" variant="info">
                    Interno
                  </Badge>,
                  <Badge key="a1" variant="default">
                    Não
                  </Badge>,
                  <button
                    key="b1"
                    className="text-xs px-2 py-1 rounded border hover:bg-muted"
                  >
                    Promover
                  </button>,
                ],
                [
                  <span key="n2" className="font-medium">
                    Ana Lima
                  </span>,
                  <span key="e2" className="text-sm">
                    ana.lima@petrobras.com.br
                  </span>,
                  <Badge key="t2" variant="warning">
                    Supervisor
                  </Badge>,
                  <Badge key="a2" variant="success">
                    Sim
                  </Badge>,
                  <button
                    key="b2"
                    className="text-xs px-2 py-1 rounded border hover:bg-muted"
                  >
                    Rebaixar
                  </button>,
                ],
              ]}
            />
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="info" title="Promover / Rebaixar Admin">
            A promoção de admin é feita via{" "}
            <code>PATCH /admin/users/&#123;id&#125;/admin</code>. O usuário
            precisa ser do tipo <strong>interno</strong> para receber a flag{" "}
            <code>is_admin=true</code>.
          </InfoBox>
        </div>
      </section>

      {/* 4. Todos os Compartilhamentos */}
      <section id="admin-shares" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-purple-600" />
          </div>
          4. Todos os Compartilhamentos
        </h2>

        <p className="text-muted-foreground mb-6">
          A aba <strong>Compartilhamentos</strong> lista todos os
          compartilhamentos criados no sistema, permitindo filtrar por status,
          usuário ou data.
        </p>

        <ScreenMockup
          title="/admin — Aba Compartilhamentos"
          description="Visão geral de todos os compartilhamentos do sistema"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Status</option>
                <option>Pendente</option>
                <option>Aprovado</option>
                <option>Ativo</option>
                <option>Concluído</option>
                <option>Rejeitado</option>
                <option>Expirado</option>
                <option>Cancelado</option>
              </select>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>
            <TableMockup
              headers={[
                "Remetente",
                "Destinatário",
                "Arquivo",
                "Status",
                "Expira",
              ]}
              rows={[
                [
                  <span key="r1" className="text-sm">
                    carlos@petrobras.com.br
                  </span>,
                  <span key="d1" className="text-sm">
                    joao@empresa.com
                  </span>,
                  <span key="a1" className="text-sm">
                    Proposta.pdf
                  </span>,
                  <Badge key="s1" variant="info">
                    Ativo
                  </Badge>,
                  <span key="e1" className="text-sm">
                    30/06/2024
                  </span>,
                ],
                [
                  <span key="r2" className="text-sm">
                    maria@petrobras.com.br
                  </span>,
                  <span key="d2" className="text-sm">
                    pedro@ext.com
                  </span>,
                  <span key="a2" className="text-sm">
                    Contrato.docx
                  </span>,
                  <Badge key="s2" variant="warning">
                    Pendente
                  </Badge>,
                  <span key="e2" className="text-sm">
                    15/06/2024
                  </span>,
                ],
              ]}
            />
          </div>
        </ScreenMockup>
      </section>

      {/* 5. Logs do Sistema */}
      <section id="admin-logs" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          5. Logs do Sistema
        </h2>

        <ScreenMockup
          title="Aba Logs - /admin"
          description="Registro completo de todas as ações do sistema"
        >
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Tipos</option>
                <option>Login</option>
                <option>Upload</option>
                <option>Download</option>
                <option>Aprovacao</option>
                <option>Rejeicao</option>
                <option>Erro</option>
              </select>
              <select className="px-3 py-2 rounded-lg border bg-background text-sm">
                <option>Todos os Niveis</option>
                <option>INFO</option>
                <option>WARNING</option>
                <option>ERROR</option>
              </select>
              <input
                type="date"
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              />
              <div className="flex-1" />
              <ActionButton
                icon={<Download className="h-4 w-4" />}
                label="Exportar"
                variant="secondary"
              />
            </div>

            {/* Lista de Logs */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              <div className="p-3 rounded-lg border bg-green-500/5 flex items-start gap-3">
                <Badge variant="success">INFO</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong>LOGIN</strong> - carlos@petrobras.com.br realizou
                    login via SSO
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: 10.0.0.45 | 22/05/2024 14:32:15
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-blue-500/5 flex items-start gap-3">
                <Badge variant="info">INFO</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong>UPLOAD</strong> - Arquivo Proposta.pdf enviado por
                    carlos@petrobras.com.br
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamanho: 2.5MB | 22/05/2024 14:33:45
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-amber-500/5 flex items-start gap-3">
                <Badge variant="warning">WARN</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong>OTP_RETRY</strong> - joao@empresa.com tentou código
                    OTP inválido (2/3)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: 189.45.67.89 | 22/05/2024 14:35:22
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-red-500/5 flex items-start gap-3">
                <Badge variant="danger">ERROR</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong>UPLOAD_FAIL</strong> - Falha no upload de arquivo
                    (timeout de conexao)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usuario: pedro@petrobras.com.br | 22/05/2024 14:40:01
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-green-500/5 flex items-start gap-3">
                <Badge variant="success">INFO</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <strong>DOWNLOAD</strong> - joao@empresa.com baixou arquivo
                    do compartilhamento #1234
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: 189.45.67.89 | 22/05/2024 15:10:33
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="tip" title="Dica">
            Use os filtros para encontrar logs específicos. Você pode filtrar
            por tipo de ação, nível de severidade e data para facilitar a
            análise.
          </InfoBox>
        </div>
      </section>

      {/* 6. Rastreamento por Usuario */}
      <section id="admin-rastreamento" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Eye className="h-5 w-5 text-purple-600" />
          </div>
          6. Rastreamento por Usuario
        </h2>

        <ScreenMockup
          title="Aba Rastreamento - /admin"
          description="Acompanhamento detalhado de atividades por usuário"
        >
          <div className="space-y-6">
            {/* Busca */}
            <div className="flex gap-3">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border bg-background">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Digite o e-mail do usuário para rastrear..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
              <ActionButton
                icon={<Search className="h-4 w-4" />}
                label="Rastrear"
              />
            </div>

            {/* Resultado */}
            <div className="p-5 rounded-xl border bg-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Carlos Mendes</h4>
                  <p className="text-sm text-muted-foreground">
                    carlos.mendes@petrobras.com.br
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="info">Interno</Badge>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm">Último login</p>
                  <p className="font-medium">22/05/2024 14:32</p>
                </div>
              </div>

              {/* Estatisticas */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">
                    Shares Criados
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-xs text-muted-foreground">
                    Shares Aprovados
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">25</p>
                  <p className="text-xs text-muted-foreground">
                    Arquivos Enviados
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Total de Logs</p>
                </div>
              </div>

              {/* Timeline */}
              <h4 className="font-semibold mb-3">Atividade Recente</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Upload de Proposta_Comercial.pdf</p>
                    <p className="text-xs text-muted-foreground">
                      22/05/2024 14:33
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Send className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Criou compartilhamento #1234</p>
                    <p className="text-xs text-muted-foreground">
                      22/05/2024 14:35
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <LogIn className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Login via SSO</p>
                    <p className="text-xs text-muted-foreground">
                      22/05/2024 14:32
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="info" title="Funcionalidade">
            O rastreamento permite visualizar todo o histórico de atividades de
            um usuário específico, incluindo logins, uploads, compartilhamentos
            criados e downloads realizados.
          </InfoBox>
        </div>
      </section>
    </div>
  );
}

// ========================================
// SECAO: SUPORTE
// ========================================
function SuporteSection() {
  return (
    <div className="space-y-12">
      {/* Introducao */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Headphones className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Guia da Equipe de Suporte
            </h2>
            <p className="text-muted-foreground">
              A equipe de suporte tem acesso ao painel <code>/suporte</code>{" "}
              para cadastrar usuários externos mediante número de solicitação
              aprovada. O acesso é feito via SSO Petrobras (perfil{" "}
              <code>support</code>).
            </p>
          </div>
        </div>
      </div>

      {/* 1. Acessando o Suporte */}
      <section id="suporte-acesso" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-cyan-600" />
          </div>
          1. Acessando o Painel de Suporte
        </h2>

        <p className="text-muted-foreground mb-6">
          O acesso ao painel de suporte é feito via SSO. Após o login, o sistema
          detecta automaticamente o perfil <strong>suporte</strong> e libera o
          menu <code>/suporte</code>.
        </p>

        <ScreenMockup
          title="/suporte"
          description="Painel principal da equipe de suporte"
        >
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-3">
                <Headphones className="h-5 w-5 text-cyan-600" />
                <p className="font-medium text-sm">
                  Bem-vindo ao Painel de Suporte
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1 ml-8">
                Gerencie o cadastro de usuários externos mediante solicitações
                aprovadas.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-xl border bg-card hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4 text-cyan-600" />
                Novo Cadastro
              </button>
              <button className="flex-1 py-3 rounded-xl border bg-card hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2">
                <List className="h-4 w-4 text-cyan-600" />
                Lista de Cadastros
              </button>
            </div>
          </div>
        </ScreenMockup>
      </section>

      {/* 2. Cadastrar Usuario Externo */}
      <section id="suporte-cadastro" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-cyan-600" />
          </div>
          2. Cadastrar Usuário Externo
        </h2>

        <p className="text-muted-foreground mb-6">
          Para cadastrar um usuário externo, informe o número da solicitação
          aprovada no sistema MIP/Purview, o e-mail do solicitante interno e o
          e-mail do destinatário externo.
        </p>

        <ScreenMockup
          title="/suporte — Novo Cadastro"
          description="Formulário de cadastro de usuário externo"
        >
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Número da Solicitação *
              </label>
              <input
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Ex: SOL-2024-00123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                E-mail do Solicitante Interno *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="colaborador@petrobras.com.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                E-mail do Usuário Externo *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="usuario@empresa.com"
              />
            </div>
            <ActionButton
              icon={<UserPlus className="h-4 w-4" />}
              label="Cadastrar Usuário Externo"
              variant="primary"
            />
          </div>
        </ScreenMockup>

        <div className="mt-6">
          <InfoBox type="important" title="Pré-requisito">
            O cadastro só pode ser realizado com um número de solicitação
            previamente aprovado no sistema MIP/Purview. Solicitações inválidas
            ou duplicadas serão rejeitadas.
          </InfoBox>
        </div>
      </section>

      {/* 3. Lista de Cadastros */}
      <section id="suporte-lista" className="scroll-mt-20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <List className="h-5 w-5 text-cyan-600" />
          </div>
          3. Lista de Cadastros
        </h2>

        <ScreenMockup
          title="/suporte — Lista de Cadastros"
          description="Histórico de usuários externos cadastrados pela equipe de suporte"
        >
          <div className="space-y-3">
            <TableMockup
              headers={[
                "Solicitação",
                "Solicitante",
                "E-mail Externo",
                "Data",
                "Status",
              ]}
              rows={[
                [
                  <span key="s1" className="text-sm font-mono">
                    SOL-2024-00123
                  </span>,
                  <span key="sol1" className="text-sm">
                    carlos@petrobras.com.br
                  </span>,
                  <span key="e1" className="text-sm">
                    joao@empresa.com
                  </span>,
                  <span key="d1" className="text-sm">
                    22/05/2024
                  </span>,
                  <Badge key="st1" variant="success">
                    Ativo
                  </Badge>,
                ],
                [
                  <span key="s2" className="text-sm font-mono">
                    SOL-2024-00124
                  </span>,
                  <span key="sol2" className="text-sm">
                    maria@petrobras.com.br
                  </span>,
                  <span key="e2" className="text-sm">
                    pedro@ext.com
                  </span>,
                  <span key="d2" className="text-sm">
                    21/05/2024
                  </span>,
                  <Badge key="st2" variant="default">
                    Expirado
                  </Badge>,
                ],
              ]}
            />
          </div>
        </ScreenMockup>
      </section>
    </div>
  );
}
export default function ManualDoUsuarioPage() {
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "visao-geral",
  ]);

  const toggleExpanded = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "visao-geral":
        return <VisaoGeralSection />;
      case "usuario-interno":
        return <UsuarioInternoSection />;
      case "usuario-externo":
        return <UsuarioExternoSection />;
      case "supervisor":
        return <SupervisorSection />;
      case "admin-global":
        return <AdminGlobalSection />;
      case "suporte":
        return <SuporteSection />;
      default:
        return <VisaoGeralSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/petrobras-logo.png"
                alt="Petrobras"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
              <div className="h-8 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Manual do Usuário
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  SCAC - Soluções de Compartilhamento de Arquivos Confidenciais
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
              >
                <ExternalLink className="h-4 w-4" />
                Voltar ao App
              </Link>
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside
            className={cn(
              "lg:col-span-1",
              mobileMenuOpen ? "block" : "hidden lg:block",
            )}
          >
            <nav className="sticky top-24 space-y-2 p-4 rounded-2xl border bg-card/50 backdrop-blur-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                Navegacao
              </p>
              {sections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => {
                      setActiveSection(section.id);
                      toggleExpanded(section.id);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                      activeSection === section.id
                        ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                        : "hover:bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "p-1.5 rounded-lg",
                        activeSection === section.id
                          ? "bg-white/20"
                          : "bg-muted",
                      )}
                    >
                      {section.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium block">{section.title}</span>
                      {section.description && (
                        <span
                          className={cn(
                            "text-xs block truncate",
                            activeSection === section.id
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {section.description}
                        </span>
                      )}
                    </div>
                    {section.subsections && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedSections.includes(section.id) && "rotate-180",
                        )}
                      />
                    )}
                  </button>

                  {section.subsections &&
                    expandedSections.includes(section.id) && (
                      <div className="ml-4 mt-1 space-y-1 pl-4 border-l-2 border-muted">
                        {section.subsections.map((sub) => (
                          <button
                            key={sub.id}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-left"
                            onClick={() => {
                              setActiveSection(section.id);
                              setMobileMenuOpen(false);
                              setTimeout(() => {
                                const element = document.getElementById(sub.id);
                                if (element) {
                                  element.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }
                              }, 100);
                            }}
                          >
                            <ChevronRight className="h-3 w-3" />
                            {sub.title}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-gradient-to-b from-transparent to-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/petrobras-logo.png"
                alt="Petrobras"
                width={32}
                height={32}
                className="object-contain"
              />
              <div className="text-sm">
                <p className="font-medium">
                  SCAC - Soluções de Compartilhamento de Arquivos Confidenciais
                </p>
                <p className="text-muted-foreground">Petrobras S.A.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Manual do Usuário v1.0 - Atualizado em Maio 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
