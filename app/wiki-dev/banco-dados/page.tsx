import { AlertDescription } from "@/components/ui/alert"
import { AlertTitle } from "@/components/ui/alert"
import { Home, Database, Info, Terminal, Mouse, Code, GitBranch, Save, CheckCircle, TestTube } from "your-icon-library"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
} from "your-ui-library"
import Link from "next/link"

export default function BancoDadosPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link
          href="/wiki-dev"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-4 w-4" />
          Voltar para Wiki-Dev
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Banco de Dados - Guia Prático
          </h1>
          <p className="text-lg text-muted-foreground">Como conectar, consultar e gerenciar o banco de dados</p>
        </div>

        <Tabs defaultValue="conectar" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="conectar">Conectar</TabsTrigger>
            <TabsTrigger value="consultas">Consultas SQL</TabsTrigger>
            <TabsTrigger value="migrations">Migrations</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="dados-teste">Dados de Teste</TabsTrigger>
          </TabsList>

          <TabsContent value="conectar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Como Conectar no Banco de Dados
                </CardTitle>
                <CardDescription>Use psql ou cliente visual como DBeaver</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Banco de Dados PostgreSQL</AlertTitle>
                  <AlertDescription>O sistema usa PostgreSQL hospedado no AWS RDS ou Neon</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Opção 1: Conectar via psql (Terminal)
                    </h3>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Instalar psql (se não tiver)
brew install postgresql  # Mac
sudo apt install postgresql-client  # Linux

# Conectar no banco
psql "postgresql://usuario:senha@host:5432/banco"

# Exemplo DEV
psql "postgresql://dev_user:dev123@localhost:5432/petrobras_dev"

# Exemplo PRD (cuidado!)
psql "$DATABASE_URL"`}
                    </pre>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Mouse className="h-4 w-4" />
                      Opção 2: Conectar via DBeaver (Visual)
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Baixe DBeaver: dbeaver.io</li>
                      <li>Clique em "Nova Conexão"</li>
                      <li>Selecione "PostgreSQL"</li>
                      <li>
                        Preencha os dados:
                        <ul className="ml-8 mt-1 space-y-1">
                          <li>Host: localhost (local) ou URL do RDS</li>
                          <li>Port: 5432</li>
                          <li>Database: petrobras_dev</li>
                          <li>Username: dev_user</li>
                          <li>Password: dev123</li>
                        </ul>
                      </li>
                      <li>Clique em "Test Connection"</li>
                      <li>Se OK, clique em "Finish"</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                    <h3 className="font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                      Onde estão as credenciais?
                    </h3>
                    <ul className="text-sm space-y-1">
                      <li>
                        <strong>Local:</strong> arquivo <code className="bg-muted px-1 rounded">.env.local</code>
                      </li>
                      <li>
                        <strong>DEV/HML/PRD:</strong> Vercel Dashboard → Settings → Environment Variables
                      </li>
                      <li>
                        <strong>Variável:</strong> <code className="bg-muted px-1 rounded">DATABASE_URL</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="consultas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-600" />
                  Consultas SQL Úteis
                </CardTitle>
                <CardDescription>Comandos SQL prontos para copiar e usar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Ver todas as tabelas</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`\\dt  -- no psql
-- ou
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ver todos os usuários</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`SELECT id, name, email, user_type, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ver todos os compartilhamentos</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`SELECT 
  s.id,
  s.title,
  s.status,
  u.name as sender_name,
  s.recipient_email,
  s.created_at
FROM shares s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC
LIMIT 20;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ver compartilhamentos aguardando aprovação</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`SELECT 
  s.title,
  u.name as sender,
  s.recipient_email,
  s.created_at
FROM shares s
JOIN users u ON s.user_id = u.id
WHERE s.status = 'pending_approval'
ORDER BY s.created_at DESC;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Ver logs de auditoria (últimos 50)</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`SELECT 
  a.action,
  u.name as user_name,
  a.details,
  a.created_at
FROM audit_logs a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Buscar compartilhamento por email</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`SELECT * 
FROM shares 
WHERE recipient_email ILIKE '%@gmail.com%'
ORDER BY created_at DESC;`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Estatísticas do sistema</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`-- Total de usuários
SELECT COUNT(*) FROM users;

-- Total de compartilhamentos
SELECT COUNT(*) FROM shares;

-- Compartilhamentos por status
SELECT status, COUNT(*) 
FROM shares 
GROUP BY status;

-- Top 5 usuários que mais compartilham
SELECT u.name, COUNT(s.id) as total
FROM users u
JOIN shares s ON u.id = s.user_id
GROUP BY u.id, u.name
ORDER BY total DESC
LIMIT 5;`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="migrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  Migrations (Alterações no Banco)
                </CardTitle>
                <CardDescription>Como criar e rodar migrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>O que são Migrations?</AlertTitle>
                  <AlertDescription>
                    São scripts SQL que alteram a estrutura do banco (criar tabelas, adicionar colunas, etc)
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Como criar uma nova Migration</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Criar arquivo de migration
cd back-end/python
python -m alembic revision -m "adiciona coluna employee_id em users"

# Isso cria um arquivo em: alembic/versions/xxxxx_adiciona_coluna.py`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Editar a Migration</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Abra o arquivo criado e edite:
def upgrade():
    op.add_column('users', 
        sa.Column('employee_id', sa.String(20), nullable=True)
    )

def downgrade():
    op.drop_column('users', 'employee_id')`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Rodar a Migration</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Aplicar migration no banco
python -m alembic upgrade head

# Ver histórico de migrations
python -m alembic history

# Voltar 1 migration
python -m alembic downgrade -1`}
                    </pre>
                  </div>

                  <Alert variant="destructive">
                    <GitBranch className="h-4 w-4" />
                    <AlertTitle>CUIDADO em Produção!</AlertTitle>
                    <AlertDescription>
                      SEMPRE teste migrations em DEV antes de rodar em PRD
                      <br />
                      Migrations podem apagar dados se mal escritas
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-orange-600" />
                  Backup e Restore
                </CardTitle>
                <CardDescription>Como fazer backup do banco e restaurar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Fazer Backup Completo</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Backup completo do banco
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Exemplo: backup_20250113.sql

# Backup de uma tabela específica
pg_dump "$DATABASE_URL" -t users > backup_users.sql`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Restaurar Backup</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`# Restaurar backup completo
psql "$DATABASE_URL" < backup_20250113.sql

# Restaurar tabela específica
psql "$DATABASE_URL" < backup_users.sql`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Backup Automático (Recomendado)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Configure backup automático no AWS RDS ou Neon:
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Backup diário automático</li>
                      <li>Retenção de 7 dias</li>
                      <li>Point-in-time recovery</li>
                    </ul>
                  </div>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Boas Práticas de Backup</AlertTitle>
                    <AlertDescription>
                      • Faça backup ANTES de rodar migrations
                      <br />• Faça backup ANTES de deploy em PRD
                      <br />• Teste restauração mensalmente
                      <br />• Guarde backups em local seguro (S3)
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dados-teste" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-pink-600" />
                  Popular Banco com Dados de Teste
                </CardTitle>
                <CardDescription>Scripts para criar dados fake para desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>Use dados de teste APENAS em DEV, NUNCA em PRD!</AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Rodar Script de Seed</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`cd back-end/python
python -m app.scripts.seed_dev`}
                    </pre>
                    <p className="text-sm text-muted-foreground mt-2">Este script cria:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside mt-1">
                      <li>10 usuários internos</li>
                      <li>5 usuários externos</li>
                      <li>20 compartilhamentos com status variados</li>
                      <li>50 logs de auditoria</li>
                      <li>3 áreas (TI, RH, Financeiro)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Criar Usuário de Teste Manualmente</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`INSERT INTO users (
  name, 
  email, 
  user_type, 
  employee_id
) VALUES (
  'João Silva',
  'joao.silva@petrobras.com.br',
  'internal',
  '12345'
);`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Limpar Todos os Dados</h4>
                    <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
                      {`-- CUIDADO: Apaga TUDO!
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE share_files CASCADE;
TRUNCATE TABLE shares CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE areas CASCADE;`}
                    </pre>
                  </div>

                  <Alert variant="destructive">
                    <TestTube className="h-4 w-4" />
                    <AlertTitle>ATENÇÃO!</AlertTitle>
                    <AlertDescription>
                      Comandos TRUNCATE apagam dados permanentemente.
                      <br />
                      Use APENAS em ambiente DEV local!
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
