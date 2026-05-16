import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Database, Server, Code, CheckCircle2, Clock, AlertTriangle, Home } from "lucide-react"
import Link from "next/link"

export default function SincronizacaoBackendPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki-Dev
            </Button>
          </Link>
        </div>

        <div className="mb-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
              <Server className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">Guia de Sincronização Back-end</h1>
              <p className="mt-2 text-lg text-slate-600">
                Passo a passo completo para implementar no Python tudo que foi feito no front-end
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-blue-600" />
                  Banco de Dados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">5</div>
                <p className="text-sm text-slate-600">Scripts SQL necessários</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5 text-purple-600" />
                  Endpoints API
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">8</div>
                <p className="text-sm text-slate-600">Novos endpoints FastAPI</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Tempo Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">40-60h</div>
                <p className="text-sm text-slate-600">Implementação completa</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="database" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints API</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Executar os scripts SQL na ordem indicada para criar tabelas e campos necessários.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  Tabela: otp_codes
                </CardTitle>
                <CardDescription>Sistema de códigos OTP para usuários externos - 3 minutos de validade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-900 p-4">
                  <pre className="overflow-x-auto text-sm text-slate-100">
                    {`-- scripts/006_create_otp_table.sql
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    email VARCHAR(255) NOT NULL,
    share_id INTEGER REFERENCES shared_areas(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_otp_email (email),
    INDEX idx_otp_code (code),
    INDEX idx_otp_expires (expires_at)
);`}
                  </pre>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Por quê?</strong> Sistema de autenticação OTP implementado no front-end precisa armazenar
                    códigos com validade de 3 minutos e controle de tentativas (máximo 3).
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  Tabela: rate_limit_attempts
                </CardTitle>
                <CardDescription>Controle de tentativas falhadas e bloqueio automático por IP</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-900 p-4">
                  <pre className="overflow-x-auto text-sm text-slate-100">
                    {`-- scripts/007_create_rate_limit_table.sql
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(255) NULL,
    attempt_type VARCHAR(50) NOT NULL, -- 'login', 'otp', 'api'
    failed_attempts INTEGER DEFAULT 1,
    first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_until TIMESTAMP NULL,
    
    INDEX idx_rate_limit_ip (ip_address),
    INDEX idx_rate_limit_email (email),
    INDEX idx_rate_limit_blocked (blocked_until)
);`}
                  </pre>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Por quê?</strong> Rate Limiting implementado no front-end (5 tentativas em 15 minutos,
                    bloqueio de 30 minutos) precisa persistir tentativas falhadas no banco.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  Tabela: session_contexts
                </CardTitle>
                <CardDescription>Validação de contexto para detectar session hijacking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-900 p-4">
                  <pre className="overflow-x-auto text-sm text-slate-100">
                    {`-- scripts/008_create_session_contexts_table.sql
CREATE TABLE IF NOT EXISTS session_contexts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    user_agent VARCHAR(500) NOT NULL,
    screen_resolution VARCHAR(50) NOT NULL,
    timezone_offset INTEGER NOT NULL,
    fingerprint VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    hijack_detected BOOLEAN DEFAULT FALSE,
    hijack_detected_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    INDEX idx_session_token (session_token),
    INDEX idx_session_user (user_id),
    INDEX idx_session_valid (is_valid)
);`}
                  </pre>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Por quê?</strong> Session Hijacking Protection valida User-Agent, resolução e timezone a
                    cada 30 segundos. Detecta mudanças suspeitas e força logout.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">4</Badge>
                  Campos: shared_areas
                </CardTitle>
                <CardDescription>Novos campos para cancelamento e supervisor do AD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-900 p-4">
                  <pre className="overflow-x-auto text-sm text-slate-100">
                    {`-- scripts/009_add_fields_shared_areas.sql
ALTER TABLE shared_areas 
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS cancellation_date TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS supervisor_id INTEGER REFERENCES users(id) NULL,
ADD COLUMN IF NOT EXISTS supervisor_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS supervisor_email VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS otp_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS otp_sent_at TIMESTAMP NULL;`}
                  </pre>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Por quê?</strong> Funcionalidades de cancelamento de compartilhamento e captura automática
                    de supervisor via Microsoft Graph API precisam desses campos.
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline">5</Badge>
                  Campos: audit_logs
                </CardTitle>
                <CardDescription>Expansão de logs de auditoria com dados de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-slate-900 p-4">
                  <pre className="overflow-x-auto text-sm text-slate-100">
                    {`-- scripts/010_expand_audit_logs.sql
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS action_type VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL,
ADD COLUMN IF NOT EXISTS session_id VARCHAR(500) NULL,
ADD COLUMN IF NOT EXISTS metadata JSONB NULL,
ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'info';

-- action_type: 'login', 'logout', 'upload', 'approve', 'reject', 
--              'cancel', 'download', 'otp_request', 'otp_verify'
-- security_level: 'info', 'warning', 'critical'`}
                  </pre>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="text-sm text-blue-900">
                    <strong>Por quê?</strong> Logs de auditoria expandidos com informações de segurança (IP, User-Agent,
                    sessão) e metadados extras em formato JSON.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Endpoints API Necessários</CardTitle>
                <CardDescription>8 novos endpoints FastAPI para sincronizar com o front-end</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-green-600">POST</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/otp/generate</code>
                      <p className="mt-1 text-sm text-slate-600">Gera código OTP de 6 dígitos e envia por email</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-green-600">POST</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/otp/verify</code>
                      <p className="mt-1 text-sm text-slate-600">Verifica código OTP fornecido pelo usuário externo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-orange-600">PATCH</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/shares/{"{id}"}/cancel</code>
                      <p className="mt-1 text-sm text-slate-600">Cancela compartilhamento pendente (usuário interno)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-blue-600">GET</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/rate-limit/status</code>
                      <p className="mt-1 text-sm text-slate-600">Verifica status de rate limiting para IP/email</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-green-600">POST</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/session/validate</code>
                      <p className="mt-1 text-sm text-slate-600">
                        Valida contexto da sessão (detecta session hijacking)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-blue-600">GET</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/graph/user/{"{email}"}</code>
                      <p className="mt-1 text-sm text-slate-600">
                        Busca dados do usuário no Microsoft Graph (foto, cargo, departamento)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-blue-600">GET</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/graph/user/{"{email}"}/manager</code>
                      <p className="mt-1 text-sm text-slate-600">Busca supervisor direto do usuário no AD Petrobras</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border p-4">
                    <Badge className="mt-1 bg-blue-600">GET</Badge>
                    <div className="flex-1">
                      <code className="text-sm font-semibold">/shares/external/{"{email}"}</code>
                      <p className="mt-1 text-sm text-slate-600">
                        Lista compartilhamentos aprovados para usuário externo específico
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Services de Lógica de Negócio</CardTitle>
                <CardDescription>4 novos services Python para implementar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">email_service.py</h3>
                    <p className="mb-3 text-sm text-slate-600">Integração com Resend para envio de emails OTP</p>
                    <Badge variant="outline">Resend API</Badge>
                    <Badge variant="outline" className="ml-2">
                      HTML Templates
                    </Badge>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">rate_limit_service.py</h3>
                    <p className="mb-3 text-sm text-slate-600">Controle de tentativas falhadas e bloqueio automático</p>
                    <Badge variant="outline">5 tentativas / 15min</Badge>
                    <Badge variant="outline" className="ml-2">
                      Bloqueio 30min
                    </Badge>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">session_service.py</h3>
                    <p className="mb-3 text-sm text-slate-600">Validação de contexto para detectar session hijacking</p>
                    <Badge variant="outline">User-Agent</Badge>
                    <Badge variant="outline" className="ml-2">
                      Fingerprint
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      Timezone
                    </Badge>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-2 font-semibold">graph_service.py</h3>
                    <p className="mb-3 text-sm text-slate-600">Integração com Microsoft Graph API</p>
                    <Badge variant="outline">Perfil completo</Badge>
                    <Badge variant="outline" className="ml-2">
                      Supervisor
                    </Badge>
                    <Badge variant="outline" className="ml-2">
                      Foto
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  Checklist de Implementação
                </CardTitle>
                <CardDescription>
                  Siga esta ordem para garantir que todas as dependências sejam atendidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">Semana 1: Banco de Dados (15-20h)</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Executar script 006: Criar tabela otp_codes
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Executar script 007: Criar tabela rate_limit_attempts
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Executar script 008: Criar tabela session_contexts
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Executar script 009: Adicionar campos em shared_areas
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Executar script 010: Expandir audit_logs
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Criar modelos Python (SQLModel)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar migrations e rollback
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">Semana 2: Services e Endpoints (15-25h)</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Implementar email_service.py (Resend)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Implementar rate_limit_service.py
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Implementar session_service.py
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Implementar graph_service.py (Microsoft Graph API)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Criar rotas OTP (routes_otp.py)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Criar rotas Session (routes_session.py)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Criar rotas Graph (routes_graph.py)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Adicionar endpoint PATCH /shares/{"{id}"}/cancel
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-slate-900">Semana 3: Testes e Deploy (10-15h)</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar fluxo OTP completo
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar rate limiting (5 tentativas)
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar session hijacking detection
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar cancelamento de compartilhamento
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Testar Microsoft Graph API
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Configurar variáveis de ambiente
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Deploy em staging para testes integrados
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-1 h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                        Atualizar Swagger/OpenAPI docs
                      </li>
                    </ul>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tempo Total Estimado:</strong> 40-60 horas distribuídas em 3 semanas de trabalho. Este guia
                    completo está disponível em <code className="mx-1">back-end/GUIA-SINCRONIZACAO-BACKEND.md</code> com
                    código completo pronto para copiar e colar.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
