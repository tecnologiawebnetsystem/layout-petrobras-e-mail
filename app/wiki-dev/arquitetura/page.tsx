import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, FolderTree, Code, Layers, PlusCircle } from "lucide-react"
import Link from "next/link"

export default function ArquiteturaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/wiki-dev">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Home className="h-4 w-4" />
              Voltar para Wiki-Dev
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Arquitetura do Sistema
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Como o código está organizado e como adicionar novas funcionalidades
          </p>
        </div>

        <Tabs defaultValue="estrutura" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="estrutura" className="text-sm">
              Estrutura
            </TabsTrigger>
            <TabsTrigger value="padroes" className="text-sm">
              Padrões
            </TabsTrigger>
            <TabsTrigger value="decisoes" className="text-sm">
              Decisões
            </TabsTrigger>
            <TabsTrigger value="adicionar" className="text-sm">
              Adicionar Features
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estrutura" className="space-y-6">
            <Card className="border-indigo-200 bg-indigo-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-indigo-600" />
                  Estrutura de Pastas Front-End (Next.js)
                </CardTitle>
                <CardDescription>Como as pastas estão organizadas no projeto React/Next.js</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`/
├── app/                          # Páginas (App Router Next.js 16)
│   ├── page.tsx                  # Homepage
│   ├── login/page.tsx            # Página de login
│   ├── upload/page.tsx           # Upload de arquivos
│   ├── compartilhamentos/page.tsx # Lista de compartilhamentos
│   ├── supervisor/page.tsx       # Aprovações do supervisor
│   ├── download/[token]/page.tsx # Download externo (OTP)
│   ├── historico/page.tsx        # Histórico de ações
│   ├── auditoria/page.tsx        # Logs de auditoria
│   └── api/                      # API Routes (Next.js)
│       ├── send-email/route.ts   # Envio de emails
│       └── send-otp-email/route.ts
│
├── components/                    # Componentes React
│   ├── auth/                     # Autenticação
│   │   ├── entra-provider.tsx    # Provider Microsoft Entra ID
│   │   ├── login-form.tsx        # Form de login
│   │   └── protected-route.tsx   # Rota protegida
│   ├── shared/                   # Compartilhados
│   │   ├── app-header.tsx        # Header do app
│   │   ├── app-sidebar.tsx       # Sidebar
│   │   └── global-alert-provider.tsx # Alertas globais
│   ├── upload/                   # Upload
│   │   ├── file-upload-zone.tsx  # Drag & drop
│   │   └── upload-success-modal.tsx
│   └── ui/                       # Componentes UI (shadcn)
│       ├── button.tsx
│       ├── card.tsx
│       └── ... (58 componentes)
│
├── lib/                          # Bibliotecas e utilitários
│   ├── stores/                   # Zustand stores (estado global)
│   │   ├── auth-store.ts         # Estado de autenticação
│   │   ├── workflow-store.ts     # Fluxo de compartilhamento
│   │   └── audit-log-store.ts    # Logs de auditoria
│   ├── auth/                     # Lógica de autenticação
│   │   ├── entra-config.ts       # Config Entra ID
│   │   └── graph-api.ts          # Microsoft Graph API
│   ├── services/                 # Serviços
│   │   └── microsoft-graph-mail.ts # Email via Graph API
│   └── utils.ts                  # Funções auxiliares
│
├── types/                        # TypeScript types
│   ├── index.ts                  # Tipos gerais (User, Upload)
│   └── workflow.ts               # Tipos de workflow
│
└── public/                       # Arquivos estáticos
    └── images/`}</pre>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>app/</Badge>
                      Páginas e Rotas
                    </h4>
                    <p className="text-sm text-gray-600">
                      Cada arquivo page.tsx dentro de app/ vira automaticamente uma rota. Ex: app/upload/page.tsx =
                      /upload
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>components/</Badge>
                      Componentes Reutilizáveis
                    </h4>
                    <p className="text-sm text-gray-600">
                      Pedaços de UI que podem ser usados em várias páginas. Ex: Button, Card, Header
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>lib/stores/</Badge>
                      Estado Global (Zustand)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Dados que precisam ser compartilhados entre várias páginas. Ex: usuário logado, uploads em
                      andamento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-purple-600" />
                  Estrutura de Pastas Back-End (Python/FastAPI)
                </CardTitle>
                <CardDescription>Como o código Python está organizado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{`back-end/python/
├── app/
│   ├── main.py                   # Aplicação FastAPI principal
│   ├── core/
│   │   ├── config.py             # Configurações (env vars)
│   │   └── security.py           # JWT, passwords
│   ├── db/
│   │   └── session.py            # Conexão PostgreSQL
│   ├── models/                   # Tabelas do banco (SQLAlchemy)
│   │   ├── user.py
│   │   ├── arquivo.py
│   │   ├── share.py
│   │   └── audit.py
│   ├── schemas/                  # Validação (Pydantic)
│   │   ├── user_schema.py
│   │   ├── file_schema.py
│   │   └── share_schema.py
│   ├── api/v1/                   # Endpoints da API
│   │   ├── routes_users.py       # /api/v1/users/*
│   │   ├── routes_files.py       # /api/v1/files/*
│   │   ├── routes_shares.py      # /api/v1/shares/*
│   │   ├── routes_supervisor.py  # /api/v1/supervisor/*
│   │   └── routes_audit.py       # /api/v1/audit/*
│   └── services/                 # Lógica de negócio
│       ├── auth_service.py
│       ├── file_service.py
│       └── s3_service.py         # Upload para AWS S3
│
└── requirements.txt              # Dependências Python`}</pre>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>models/</Badge>
                      Tabelas do Banco
                    </h4>
                    <p className="text-sm text-gray-600">
                      Classes Python que representam as tabelas do PostgreSQL. Ex: class User = tabela "users"
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>schemas/</Badge>
                      Validação de Dados
                    </h4>
                    <p className="text-sm text-gray-600">
                      Define quais campos são obrigatórios, tipos, validações. Ex: email precisa ser válido
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>api/v1/routes_*</Badge>
                      Endpoints da API
                    </h4>
                    <p className="text-sm text-gray-600">
                      Funções que respondem às requisições HTTP. Ex: POST /api/v1/files/upload
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Badge>services/</Badge>
                      Lógica de Negócio
                    </h4>
                    <p className="text-sm text-gray-600">
                      Código que faz o trabalho pesado: enviar para S3, gerar JWT, buscar dados, etc
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="padroes" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-blue-600" />
                  Padrões de Código Front-End
                </CardTitle>
                <CardDescription>Convenções que seguimos no React/Next.js</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">1. Componentes Server vs Client</h3>
                    <div className="space-y-3">
                      <div>
                        <Badge className="mb-2">Server Component (padrão)</Badge>
                        <p className="text-sm text-gray-600 mb-2">Renderiza no servidor. Mais rápido, melhor SEO.</p>
                        <div className="bg-gray-50 border rounded p-3">
                          <code className="text-xs">
                            {`// Sem "use client" no topo
export default function Page() {
  return <div>Conteúdo estático</div>
}`}
                          </code>
                        </div>
                      </div>

                      <div>
                        <Badge className="mb-2 bg-orange-600">Client Component</Badge>
                        <p className="text-sm text-gray-600 mb-2">Usa hooks (useState, useEffect). Interativo.</p>
                        <div className="bg-gray-50 border rounded p-3">
                          <code className="text-xs">
                            {`"use client"  // <-- Obrigatório

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">2. Estado Global com Zustand</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Para dados que precisam ser acessados de várias páginas (usuário logado, uploads, etc)
                    </p>
                    <div className="bg-gray-50 border rounded p-3">
                      <code className="text-xs whitespace-pre">
                        {`// lib/stores/auth-store.ts
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}))

// Usar em qualquer componente:
const { user, setUser } = useAuthStore()`}
                      </code>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">3. Buscar Dados: SWR ou Server Components</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      NUNCA use fetch dentro de useEffect. Use SWR para cache automático.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">✓ CORRETO:</p>
                        <div className="bg-gray-50 border rounded p-3">
                          <code className="text-xs">
                            {`import useSWR from 'swr'

const { data, error } = useSWR('/api/v1/uploads', fetcher)`}
                          </code>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-red-700 mb-1">❌ ERRADO:</p>
                        <div className="bg-gray-50 border rounded p-3">
                          <code className="text-xs">
                            {`useEffect(() => {
  fetch('/api/uploads').then(...)  // NÃO faça isso!
}, [])`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">4. Nomear Arquivos e Componentes</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Componentes: PascalCase → LoginForm.tsx, UploadButton.tsx</li>
                      <li>• Arquivos normais: kebab-case → auth-store.ts, graph-api.ts</li>
                      <li>• Tipos: interfaces em PascalCase → User, Upload, ShareWorkflow</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-green-600" />
                  Padrões de Código Back-End
                </CardTitle>
                <CardDescription>Convenções que seguimos no Python/FastAPI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">1. Estrutura de um Endpoint</h3>
                    <div className="bg-gray-50 border rounded p-3">
                      <code className="text-xs whitespace-pre">
                        {`# api/v1/routes_files.py
from fastapi import APIRouter, Depends
from app.schemas.file_schema import FileCreate, FileResponse
from app.services import file_service

router = APIRouter()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile,
    current_user: User = Depends(get_current_user)  # Auth
):
    """Upload de arquivo para S3"""
    return await file_service.upload(file, current_user)`}
                      </code>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">2. Validação com Pydantic</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Schemas validam automaticamente os dados de entrada/saída
                    </p>
                    <div className="bg-gray-50 border rounded p-3">
                      <code className="text-xs whitespace-pre">
                        {`# schemas/user_schema.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr  # Valida email automaticamente
    name: str
    
class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime`}
                      </code>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">3. Separação: Routes → Services → Models</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>
                        • <strong>Routes:</strong> Recebe requisição, valida, chama service
                      </li>
                      <li>
                        • <strong>Service:</strong> Lógica de negócio (enviar S3, enviar email, etc)
                      </li>
                      <li>
                        • <strong>Models:</strong> Interação direta com banco de dados
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">4. Tratamento de Erros</h3>
                    <div className="bg-gray-50 border rounded p-3">
                      <code className="text-xs whitespace-pre">
                        {`from fastapi import HTTPException

# Sempre levante HTTPException com status code apropriado
if not user:
    raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
if not authorized:
    raise HTTPException(status_code=403, detail="Sem permissão")`}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="decisoes" className="space-y-6">
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-600" />
                  Decisões Arquiteturais
                </CardTitle>
                <CardDescription>Por que escolhemos estas tecnologias?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-black text-white">Next.js 16</Badge>
                      <h3 className="font-semibold">Front-End</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que Next.js?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Server Components (renderização mais rápida)</li>
                      <li>Roteamento automático baseado em pastas</li>
                      <li>Deploy fácil no Vercel</li>
                      <li>TypeScript nativo</li>
                      <li>React 19 com novas features</li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-green-600">FastAPI</Badge>
                      <h3 className="font-semibold">Back-End</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que FastAPI?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Muito rápido (async nativo)</li>
                      <li>Validação automática com Pydantic</li>
                      <li>Documentação automática (Swagger)</li>
                      <li>Type hints nativo (Python moderno)</li>
                      <li>Fácil de integrar com PostgreSQL</li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-purple-600">Zustand</Badge>
                      <h3 className="font-semibold">Estado Global</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que Zustand ao invés de Redux?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Muito mais simples (menos boilerplate)</li>
                      <li>API minimalista e intuitiva</li>
                      <li>Leve (1KB vs 20KB do Redux)</li>
                      <li>TypeScript perfeito</li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-blue-600">PostgreSQL</Badge>
                      <h3 className="font-semibold">Banco de Dados</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que PostgreSQL?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Relacional robusto (dados estruturados)</li>
                      <li>ACID completo (transações seguras)</li>
                      <li>JSON nativo (flexibilidade quando necessário)</li>
                      <li>Suporte excelente do SQLAlchemy</li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-orange-600">AWS S3</Badge>
                      <h3 className="font-semibold">Armazenamento</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que S3 + CloudFront?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Escalável (armazena terabytes sem problemas)</li>
                      <li>Durabilidade 99.999999999% (11 noves)</li>
                      <li>CloudFront distribui arquivos globalmente</li>
                      <li>Presigned URLs para acesso temporário</li>
                    </ul>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-indigo-600">Microsoft Graph API</Badge>
                      <h3 className="font-semibold">Emails</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Por que Microsoft Graph ao invés de AWS SES?</p>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Usa conta Microsoft 365 da Petrobras</li>
                      <li>Emails vêm de @petrobras.com.br</li>
                      <li>Sem custo adicional (já têm M365)</li>
                      <li>Integração nativa com Entra ID</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="adicionar" className="space-y-6">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-green-600" />
                  Como Adicionar Novas Features
                </CardTitle>
                <CardDescription>Passo a passo para implementar uma nova funcionalidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Exemplo: Adicionar "Comentários em Arquivos"</h3>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Definir o que precisa (Back-End)</h4>
                        <p className="text-sm text-gray-600 mb-3">Criar tabela, schema e endpoint</p>
                        <div className="space-y-2">
                          <div className="bg-gray-50 border rounded p-3">
                            <p className="text-xs font-semibold mb-1">1.1. Criar tabela (models/comment.py):</p>
                            <code className="text-xs">
                              {`class Comment(Base):
    id = Column(Integer, primary_key=True)
    arquivo_id = Column(Integer, ForeignKey("arquivo.id"))
    user_id = Column(Integer, ForeignKey("user.id"))
    text = Column(String)
    created_at = Column(DateTime)`}
                            </code>
                          </div>

                          <div className="bg-gray-50 border rounded p-3">
                            <p className="text-xs font-semibold mb-1">1.2. Criar schema (schemas/comment_schema.py):</p>
                            <code className="text-xs">
                              {`class CommentCreate(BaseModel):
    arquivo_id: int
    text: str`}
                            </code>
                          </div>

                          <div className="bg-gray-50 border rounded p-3">
                            <p className="text-xs font-semibold mb-1">
                              1.3. Criar endpoint (api/v1/routes_comments.py):
                            </p>
                            <code className="text-xs">
                              {`@router.post("/", response_model=CommentResponse)
async def create_comment(comment: CommentCreate):
    return db.add(comment)`}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Criar tipos no Front-End</h4>
                        <div className="bg-gray-50 border rounded p-3">
                          <p className="text-xs font-semibold mb-1">types/index.ts:</p>
                          <code className="text-xs">
                            {`export interface Comment {
  id: number
  arquivo_id: number
  user_id: number
  text: string
  created_at: string
}`}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Criar componente React</h4>
                        <div className="bg-gray-50 border rounded p-3">
                          <p className="text-xs font-semibold mb-1">components/comments/comment-list.tsx:</p>
                          <code className="text-xs">
                            {`"use client"
import useSWR from 'swr'

export function CommentList({ arquivoId }: { arquivoId: number }) {
  const { data } = useSWR(\`/api/v1/comments?arquivo_id=\${arquivoId}\`)
  
  return (
    <div>
      {data?.map(comment => (
        <div key={comment.id}>{comment.text}</div>
      ))}
    </div>
  )
}`}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Adicionar na página</h4>
                        <div className="bg-gray-50 border rounded p-3">
                          <p className="text-xs font-semibold mb-1">app/historico/page.tsx:</p>
                          <code className="text-xs">
                            {`import { CommentList } from '@/components/comments/comment-list'

export default function HistoricoPage() {
  return (
    <div>
      {/* Conteúdo existente */}
      <CommentList arquivoId={arquivo.id} />
    </div>
  )
}`}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                        ✓
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2">Testar e documentar</h4>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Teste localmente (front + back)</li>
                          <li>Adicione na documentação da wiki-dev</li>
                          <li>Commitar no Git com mensagem clara</li>
                          <li>Deploy para HML antes de produção</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Checklist Geral:</h4>
                  <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                    <li>✓ Back-End: Model → Schema → Endpoint → Service (se necessário)</li>
                    <li>✓ Front-End: Type → Component → Page</li>
                    <li>✓ Adicionar auditoria se for ação importante</li>
                    <li>✓ Adicionar na wiki-dev (endpoints API)</li>
                    <li>✓ Testar em DEV antes de HML/PRD</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
