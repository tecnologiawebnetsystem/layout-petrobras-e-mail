import { AppHeader } from "@/components/shared/app-header"
import { RoadmapCard } from "@/components/roadmap/roadmap-card"
import { MetricCard } from "@/components/roadmap/metric-card"

export const metadata = {
  title: "Roadmap - Petrobras",
  description: "Próximos passos e evolução do sistema",
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <AppHeader subtitle="Roadmap de Evolução" />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Roadmap de Evolução
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Planejamento estratégico para transformar o sistema de transferência de arquivos em uma plataforma
              corporativa de classe mundial
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-blue-500 to-purple-500" />

            {/* Phase 1 - Curto Prazo */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg ring-4 ring-white dark:ring-slate-900">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fase 1 - Curto Prazo</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">3-6 meses</p>
                </div>
              </div>

              <div className="ml-24 grid gap-6 md:grid-cols-2">
                <RoadmapCard
                  icon="🔒"
                  title="1. Auditoria e Compliance"
                  items={[
                    "Log detalhado de todas as ações",
                    "Relatórios LGPD/GDPR",
                    "Rastreabilidade completa",
                    "Assinatura digital SHA-256",
                    "Certificado de entrega",
                  ]}
                  priority="high"
                />
                <RoadmapCard
                  icon="🛡️"
                  title="2. Segurança Avançada"
                  items={[
                    "Criptografia end-to-end",
                    "2FA obrigatório para downloads",
                    "Bloqueio após X tentativas",
                    "Whitelist/Blacklist de domínios",
                    "Auto-destruição de arquivos",
                  ]}
                  priority="high"
                />
              </div>
            </div>

            {/* Phase 2 - Médio Prazo */}
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-slate-900">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fase 2 - Médio Prazo</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">6-12 meses</p>
                </div>
              </div>

              <div className="ml-24 grid gap-6 md:grid-cols-2">
                <RoadmapCard
                  icon="⚙️"
                  title="3. Workflow Inteligente"
                  items={[
                    "Regras automáticas de aprovação",
                    "Aprovação paralela",
                    "Escalação automática",
                    "Templates pré-configurados",
                    "IA para classificação de documentos",
                  ]}
                  priority="medium"
                />
                <RoadmapCard
                  icon="📧"
                  title="4. Comunicação e Notificações"
                  items={[
                    "Email real ao destinatário",
                    "SMS com código de verificação",
                    "Notificações push",
                    "Resumo diário/semanal",
                    "Alertas de expiração",
                  ]}
                  priority="medium"
                />
                <RoadmapCard
                  icon="📊"
                  title="5. Analytics e Inteligência"
                  items={[
                    "Dashboard executivo com KPIs",
                    "Tempo médio de aprovação",
                    "Taxa de rejeição",
                    "Heatmap de atividades",
                    "ML para previsão de carga",
                  ]}
                  priority="medium"
                />
                <RoadmapCard
                  icon="🔗"
                  title="6. Integração e Automação"
                  items={[
                    "API REST completa",
                    "Webhooks para eventos",
                    "Azure AD / LDAP",
                    "SharePoint/OneDrive",
                    "Scanner de vírus automático",
                  ]}
                  priority="medium"
                />
              </div>
            </div>

            {/* Phase 3 - Longo Prazo */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg ring-4 ring-white dark:ring-slate-900">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Fase 3 - Longo Prazo</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">12+ meses</p>
                </div>
              </div>

              <div className="ml-24 grid gap-6 md:grid-cols-2">
                <RoadmapCard
                  icon="✨"
                  title="7. Experiência do Usuário"
                  items={[
                    "Upload múltiplo com drag & drop",
                    "Compressão automática",
                    "Preview de documentos",
                    "Modo offline",
                    "Atalhos de teclado",
                  ]}
                  priority="low"
                />
                <RoadmapCard
                  icon="⚡"
                  title="8. Gestão e Administração"
                  items={[
                    "Painel admin completo",
                    "Políticas de retenção",
                    "Gestão de quotas",
                    "Backup automático",
                    "Monitoramento de performance",
                  ]}
                  priority="low"
                />
              </div>
            </div>
          </div>

          {/* Metrics Section */}
          <div className="mt-16 p-8 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20 rounded-2xl border border-teal-200 dark:border-teal-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Métricas de Sucesso</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MetricCard value="90%" label="Redução de tempo de aprovação" />
              <MetricCard value="100%" label="Conformidade LGPD" />
              <MetricCard value="50%" label="Redução de retrabalho" />
              <MetricCard value="95%" label="Satisfação dos usuários" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
