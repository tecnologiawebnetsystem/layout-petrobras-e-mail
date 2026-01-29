"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Home,
  Copy,
  Check,
  Monitor,
  Server,
  Database,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  Download,
  Play,
  Settings,
  FolderOpen,
  RefreshCw,
  Layers,
  Globe,
} from "lucide-react"
import Link from "next/link"

export default function DockerLocalPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("introducao")

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedId === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/wiki-dev">
            <Button variant="ghost" size="sm" className="gap-2">
              <Home className="h-4 w-4" />
              Voltar para Wiki
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <Layers className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-slate-900">Docker Local - Guia Completo para Leigos</h1>
          <p className="text-lg text-slate-600">
            Como configurar o Docker para rodar o Front-End (React/Next.js) e Back-End (Python/FastAPI) na sua maquina local
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-blue-100 text-blue-700">React/Next.js</Badge>
            <Badge className="bg-green-100 text-green-700">Python/FastAPI</Badge>
            <Badge className="bg-purple-100 text-purple-700">Docker</Badge>
            <Badge className="bg-orange-100 text-orange-700">Passo a Passo</Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="introducao">Introducao</TabsTrigger>
            <TabsTrigger value="instalacao">Instalacao Docker</TabsTrigger>
            <TabsTrigger value="frontend">Front-End</TabsTrigger>
            <TabsTrigger value="backend">Back-End</TabsTrigger>
            <TabsTrigger value="completo">Tudo Junto</TabsTrigger>
            <TabsTrigger value="comandos">Comandos Uteis</TabsTrigger>
          </TabsList>

          {/* TAB 1: Introducao */}
          <TabsContent value="introducao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Laptop className="h-6 w-6" />
                  O que e Docker? (Explicacao para Leigos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Analogia simples:</strong> Docker e como uma "caixa" que contem tudo que seu programa precisa para funcionar. 
                    E como se voce pegasse seu computador inteiro, com todos os programas instalados, e colocasse numa caixa 
                    que pode rodar em qualquer outro computador!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Por que usar Docker?</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Funciona em qualquer lugar</strong>
                        <p className="text-sm text-green-700">Se funciona na sua maquina, funciona em qualquer lugar</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Nao suja seu computador</strong>
                        <p className="text-sm text-green-700">Tudo fica isolado dentro do Docker</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Facil de compartilhar</strong>
                        <p className="text-sm text-green-700">Qualquer colega pode rodar com 1 comando</p>
                      </div>
                    </div>
                    <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div>
                        <strong className="text-green-900">Igual a producao</strong>
                        <p className="text-sm text-green-700">Seu ambiente local e igual ao servidor</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Nosso Sistema</h3>
                  <div className="rounded-lg border p-4 bg-slate-50">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Front-End:</span>
                        <Badge>React + Next.js</Badge>
                        <span className="text-slate-500">Porta 3000</span>
                      </div>
                      <div className="text-slate-300">|</div>
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Back-End:</span>
                        <Badge>Python + FastAPI</Badge>
                        <span className="text-slate-500">Porta 8000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">O que voce vai precisar:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-700">
                    <li>Um computador com Windows 10/11, Mac ou Linux</li>
                    <li>Pelo menos 8GB de RAM (recomendado 16GB)</li>
                    <li>10GB de espaco em disco livre</li>
                    <li>Conexao com internet (para baixar as imagens Docker)</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Instalacao Docker */}
          <TabsContent value="instalacao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Passo 1: Instalar o Docker Desktop
                </CardTitle>
                <CardDescription>Siga EXATAMENTE estes passos para seu sistema operacional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Windows */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500 text-white">Windows 10/11</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">1</span>
                      <div>
                        <p className="font-medium">Abra o navegador e acesse:</p>
                        <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 underline">https://www.docker.com/products/docker-desktop/</a>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">2</span>
                      <p>Clique no botao <strong>"Download for Windows"</strong></p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                      <p>Abra o arquivo <code className="bg-slate-100 px-2 py-1 rounded">Docker Desktop Installer.exe</code> que foi baixado</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">4</span>
                      <div>
                        <p>Na tela de instalacao, MARQUE as opcoes:</p>
                        <ul className="list-disc list-inside ml-4 text-sm text-slate-600">
                          <li>Use WSL 2 instead of Hyper-V (recomendado)</li>
                          <li>Add shortcut to desktop</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">5</span>
                      <p>Clique em <strong>"OK"</strong> e aguarde a instalacao (pode demorar 5-10 minutos)</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">6</span>
                      <p><strong>REINICIE O COMPUTADOR</strong> quando pedir</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">7</span>
                      <p>Apos reiniciar, abra o <strong>Docker Desktop</strong> pelo icone na area de trabalho</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">8</span>
                      <p>Aceite os termos de uso e aguarde o Docker iniciar (icone fica verde na barra de tarefas)</p>
                    </div>
                  </div>

                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Se aparecer erro de WSL:</strong> Abra o PowerShell como Administrador e execute: 
                      <code className="bg-yellow-100 px-2 py-1 rounded ml-2">wsl --install</code>
                      Depois reinicie novamente.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Mac */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-700 text-white">macOS</Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">1</span>
                      <div>
                        <p className="font-medium">Acesse:</p>
                        <a href="https://www.docker.com/products/docker-desktop/" target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 underline">https://www.docker.com/products/docker-desktop/</a>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">2</span>
                      <p>Clique em <strong>"Download for Mac"</strong> - escolha Intel ou Apple Chip conforme seu Mac</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">3</span>
                      <p>Abra o arquivo <code className="bg-slate-100 px-2 py-1 rounded">Docker.dmg</code></p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">4</span>
                      <p>Arraste o icone Docker para a pasta <strong>Applications</strong></p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">5</span>
                      <p>Abra o Docker pela pasta Aplicativos</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">6</span>
                      <p>Aceite as permissoes quando pedir e aguarde iniciar</p>
                    </div>
                  </div>
                </div>

                {/* Linux */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500 text-white">Linux (Ubuntu/Debian)</Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600">Abra o Terminal e execute os comandos abaixo UM POR UM:</p>
                  
                  <CodeBlock 
                    id="linux-docker"
                    code={`# 1. Atualizar pacotes
sudo apt-get update

# 2. Instalar dependencias
sudo apt-get install -y ca-certificates curl gnupg

# 3. Adicionar chave GPG do Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 4. Configurar repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Permitir usar sem sudo
sudo usermod -aG docker $USER

# 7. FAZER LOGOUT E LOGIN NOVAMENTE

# 8. Testar
docker --version`}
                  />
                </div>

                {/* Verificar Instalacao */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <CheckCircle2 className="h-5 w-5" />
                      Verificar se instalou corretamente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-green-700">Abra o Terminal (Windows: PowerShell ou CMD) e execute:</p>
                    <CodeBlock 
                      id="verify-docker"
                      code={`# Verificar versao do Docker
docker --version

# Deve mostrar algo como: Docker version 24.x.x

# Verificar se esta rodando
docker info

# Testar com Hello World
docker run hello-world`}
                    />
                    <Alert className="border-green-300 bg-green-100">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Se aparecer <strong>"Hello from Docker!"</strong> o Docker esta funcionando!
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Front-End */}
          <TabsContent value="frontend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-6 w-6 text-blue-600" />
                  Rodar o Front-End (React/Next.js) no Docker
                </CardTitle>
                <CardDescription>Passo a passo para rodar a interface do usuario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Passo 1 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">1</span>
                    <h3 className="font-semibold text-lg">Criar o arquivo Dockerfile para o Front-End</h3>
                  </div>
                  <p className="text-slate-600">Na raiz do projeto (onde esta o package.json), crie um arquivo chamado <code className="bg-slate-100 px-2 py-1 rounded">Dockerfile</code></p>
                  <CodeBlock 
                    id="frontend-dockerfile"
                    code={`# Dockerfile (Front-End Next.js)
# Coloque este arquivo na RAIZ do projeto front-end

# Imagem base com Node.js
FROM node:20-alpine

# Pasta de trabalho dentro do container
WORKDIR /app

# Copiar arquivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar todo o codigo
COPY . .

# Porta que o Next.js usa
EXPOSE 3000

# Comando para rodar em desenvolvimento
CMD ["npm", "run", "dev"]`}
                  />
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">2</span>
                    <h3 className="font-semibold text-lg">Criar o arquivo .dockerignore</h3>
                  </div>
                  <p className="text-slate-600">Na mesma pasta, crie um arquivo <code className="bg-slate-100 px-2 py-1 rounded">.dockerignore</code> para ignorar arquivos desnecessarios:</p>
                  <CodeBlock 
                    id="frontend-dockerignore"
                    code={`# .dockerignore
node_modules
.next
.git
.gitignore
README.md
.env.local
.env*.local
npm-debug.log*
.DS_Store`}
                  />
                </div>

                {/* Passo 3 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">3</span>
                    <h3 className="font-semibold text-lg">Criar o docker-compose.yml para o Front-End</h3>
                  </div>
                  <p className="text-slate-600">Crie o arquivo <code className="bg-slate-100 px-2 py-1 rounded">docker-compose.yml</code> na raiz:</p>
                  <CodeBlock 
                    id="frontend-compose"
                    code={`# docker-compose.yml (Front-End)
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: petrobras-frontend
    ports:
      - "3000:3000"
    volumes:
      # Sincroniza o codigo - qualquer mudanca reflete automaticamente
      - .:/app
      # Evita sobrescrever node_modules do container
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
    # Reinicia automaticamente se falhar
    restart: unless-stopped`}
                  />
                </div>

                {/* Passo 4 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">4</span>
                    <h3 className="font-semibold text-lg">Rodar o Front-End</h3>
                  </div>
                  <p className="text-slate-600">Abra o Terminal na pasta do projeto e execute:</p>
                  <CodeBlock 
                    id="frontend-run"
                    code={`# Construir e iniciar o container
docker-compose up --build

# Aguarde aparecer: "ready started server on 0.0.0.0:3000"

# Abra o navegador em: http://localhost:3000`}
                  />
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Primeira vez demora mais!</strong> O Docker precisa baixar a imagem do Node.js e instalar as dependencias.
                      Pode levar 3-5 minutos. Nas proximas vezes sera muito mais rapido.
                    </AlertDescription>
                  </Alert>
                </div>

                {/* Passo 5 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">5</span>
                    <h3 className="font-semibold text-lg">Parar o Front-End</h3>
                  </div>
                  <CodeBlock 
                    id="frontend-stop"
                    code={`# Para parar, pressione Ctrl+C no terminal

# OU em outro terminal, execute:
docker-compose down`}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Back-End */}
          <TabsContent value="backend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-6 w-6 text-green-600" />
                  Rodar o Back-End (Python/FastAPI) no Docker
                </CardTitle>
                <CardDescription>Passo a passo para rodar a API do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Passo 1 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">1</span>
                    <h3 className="font-semibold text-lg">Verificar o Dockerfile existente</h3>
                  </div>
                  <p className="text-slate-600">O projeto ja tem um Dockerfile em <code className="bg-slate-100 px-2 py-1 rounded">back-end/python/Dockerfile</code>. Vamos melhorar ele:</p>
                  <CodeBlock 
                    id="backend-dockerfile"
                    code={`# Dockerfile (Back-End Python)
# Coloque em: back-end/python/Dockerfile

# Imagem base com Python 3.10
FROM python:3.10-slim

# Pasta de trabalho
WORKDIR /app

# Instalar dependencias do sistema (se precisar)
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivo de dependencias
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo o codigo
COPY . .

# Porta que o FastAPI usa
EXPOSE 8000

# Comando para rodar com hot-reload (desenvolvimento)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]`}
                  />
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">2</span>
                    <h3 className="font-semibold text-lg">Criar .dockerignore para o Back-End</h3>
                  </div>
                  <p className="text-slate-600">Em <code className="bg-slate-100 px-2 py-1 rounded">back-end/python/.dockerignore</code>:</p>
                  <CodeBlock 
                    id="backend-dockerignore"
                    code={`# .dockerignore
__pycache__
*.pyc
*.pyo
.git
.gitignore
.env
.env.local
.venv
venv
*.egg-info
.pytest_cache
.coverage
htmlcov
.mypy_cache`}
                  />
                </div>

                {/* Passo 3 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">3</span>
                    <h3 className="font-semibold text-lg">Atualizar o docker-compose.yml do Back-End</h3>
                  </div>
                  <p className="text-slate-600">Atualize <code className="bg-slate-100 px-2 py-1 rounded">back-end/python/docker-compose.yml</code>:</p>
                  <CodeBlock 
                    id="backend-compose"
                    code={`# docker-compose.yml (Back-End)
version: '3.8'

services:
  # API Python/FastAPI
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: petrobras-backend
    ports:
      - "8000:8000"
    volumes:
      # Sincroniza codigo - mudancas refletem automaticamente
      - .:/app
    environment:
      - ENV=local
      - DEBUG=true
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
      - DYNAMODB_ENDPOINT=http://localstack:4566
      - S3_ENDPOINT=http://localstack:4566
    depends_on:
      - localstack
    restart: unless-stopped

  # LocalStack - Simula AWS localmente (DynamoDB, S3, etc)
  localstack:
    image: localstack/localstack:latest
    container_name: petrobras-localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=dynamodb,s3,ses
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - ./localstack_data:/tmp/localstack/data
    restart: unless-stopped

  # Interface visual para ver o DynamoDB
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: petrobras-dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://localstack:4566
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      - localstack
    restart: unless-stopped`}
                  />
                </div>

                {/* Passo 4 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">4</span>
                    <h3 className="font-semibold text-lg">Rodar o Back-End</h3>
                  </div>
                  <p className="text-slate-600">Abra o Terminal na pasta <code className="bg-slate-100 px-2 py-1 rounded">back-end/python</code> e execute:</p>
                  <CodeBlock 
                    id="backend-run"
                    code={`# Navegar para a pasta do back-end
cd back-end/python

# Construir e iniciar todos os containers
docker-compose up --build

# Aguarde aparecer: "Uvicorn running on http://0.0.0.0:8000"

# Teste a API em: http://localhost:8000
# Veja a documentacao em: http://localhost:8000/docs
# DynamoDB Admin em: http://localhost:8001`}
                  />
                </div>

                {/* Interfaces disponiveis */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800">URLs Disponiveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-lg border border-green-300 bg-white p-4">
                        <Globe className="h-5 w-5 text-green-600 mb-2" />
                        <strong>API FastAPI</strong>
                        <p className="text-sm text-slate-600">http://localhost:8000</p>
                      </div>
                      <div className="rounded-lg border border-green-300 bg-white p-4">
                        <FolderOpen className="h-5 w-5 text-green-600 mb-2" />
                        <strong>Swagger (Docs)</strong>
                        <p className="text-sm text-slate-600">http://localhost:8000/docs</p>
                      </div>
                      <div className="rounded-lg border border-green-300 bg-white p-4">
                        <Database className="h-5 w-5 text-green-600 mb-2" />
                        <strong>DynamoDB Admin</strong>
                        <p className="text-sm text-slate-600">http://localhost:8001</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Tudo Junto */}
          <TabsContent value="completo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-6 w-6 text-purple-600" />
                  Rodar TUDO Junto (Front + Back + AWS Local)
                </CardTitle>
                <CardDescription>Um unico arquivo para rodar todo o sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <Alert className="border-purple-200 bg-purple-50">
                  <Settings className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Recomendado!</strong> Este e o metodo mais facil - roda front-end, back-end e banco de dados com um unico comando.
                  </AlertDescription>
                </Alert>

                {/* Passo 1 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold">1</span>
                    <h3 className="font-semibold text-lg">Criar docker-compose.yml na RAIZ do projeto</h3>
                  </div>
                  <p className="text-slate-600">Na pasta raiz (onde tem as pastas <code className="bg-slate-100 px-2 py-1 rounded">app/</code> e <code className="bg-slate-100 px-2 py-1 rounded">back-end/</code>), crie:</p>
                  <CodeBlock 
                    id="full-compose"
                    code={`# docker-compose.yml (RAIZ DO PROJETO)
# Este arquivo roda TUDO: front-end, back-end e banco de dados local

version: '3.8'

services:
  # =============================================
  # FRONT-END (React/Next.js) - Porta 3000
  # =============================================
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: petrobras-frontend
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - WATCHPACK_POLLING=true
    depends_on:
      - api
    restart: unless-stopped

  # =============================================
  # BACK-END (Python/FastAPI) - Porta 8000
  # =============================================
  api:
    build:
      context: ./back-end/python
      dockerfile: Dockerfile
    container_name: petrobras-backend
    ports:
      - "8000:8000"
    volumes:
      - ./back-end/python:/app
    environment:
      - ENV=local
      - DEBUG=true
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
      - DYNAMODB_ENDPOINT=http://localstack:4566
      - S3_ENDPOINT=http://localstack:4566
      - SES_ENDPOINT=http://localstack:4566
    depends_on:
      localstack:
        condition: service_healthy
    restart: unless-stopped

  # =============================================
  # LOCALSTACK (AWS Local) - DynamoDB, S3, SES
  # =============================================
  localstack:
    image: localstack/localstack:latest
    container_name: petrobras-localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=dynamodb,s3,ses
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - ./localstack_data:/tmp/localstack/data
      - /var/run/docker.sock:/var/run/docker.sock
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # =============================================
  # DYNAMODB ADMIN - Interface Visual - Porta 8001
  # =============================================
  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: petrobras-dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://localstack:4566
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=test
      - AWS_SECRET_ACCESS_KEY=test
    depends_on:
      - localstack
    restart: unless-stopped

# Rede para os containers se comunicarem
networks:
  default:
    name: petrobras-network`}
                  />
                </div>

                {/* Passo 2 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold">2</span>
                    <h3 className="font-semibold text-lg">Criar Dockerfile.frontend na raiz</h3>
                  </div>
                  <CodeBlock 
                    id="dockerfile-frontend-root"
                    code={`# Dockerfile.frontend
# Para o Next.js - coloque na raiz do projeto

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]`}
                  />
                </div>

                {/* Passo 3 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold">3</span>
                    <h3 className="font-semibold text-lg">Criar arquivo .env na raiz</h3>
                  </div>
                  <CodeBlock 
                    id="env-file"
                    code={`# .env (variaveis de ambiente locais)

# Front-End
NEXT_PUBLIC_API_URL=http://localhost:8000

# Back-End
ENV=local
DEBUG=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Endpoints locais (LocalStack)
DYNAMODB_ENDPOINT=http://localhost:4566
S3_ENDPOINT=http://localhost:4566
SES_ENDPOINT=http://localhost:4566`}
                  />
                </div>

                {/* Passo 4 */}
                <div className="rounded-lg border p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white font-bold">4</span>
                    <h3 className="font-semibold text-lg">Rodar TUDO com um comando</h3>
                  </div>
                  <CodeBlock 
                    id="run-all"
                    code={`# Na pasta raiz do projeto, execute:
docker-compose up --build

# Primeira vez demora mais (5-10 min)
# Aguarde aparecer logs de todos os servicos

# Para rodar em segundo plano (background):
docker-compose up --build -d

# Ver logs quando em background:
docker-compose logs -f`}
                  />
                </div>

                {/* URLs */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-purple-800">Todas as URLs Disponiveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-purple-300 bg-white p-4">
                        <Monitor className="h-5 w-5 text-blue-600 mb-2" />
                        <strong>Front-End</strong>
                        <p className="text-sm text-slate-600">http://localhost:3000</p>
                      </div>
                      <div className="rounded-lg border border-purple-300 bg-white p-4">
                        <Server className="h-5 w-5 text-green-600 mb-2" />
                        <strong>Back-End API</strong>
                        <p className="text-sm text-slate-600">http://localhost:8000</p>
                      </div>
                      <div className="rounded-lg border border-purple-300 bg-white p-4">
                        <FolderOpen className="h-5 w-5 text-orange-600 mb-2" />
                        <strong>API Docs</strong>
                        <p className="text-sm text-slate-600">http://localhost:8000/docs</p>
                      </div>
                      <div className="rounded-lg border border-purple-300 bg-white p-4">
                        <Database className="h-5 w-5 text-purple-600 mb-2" />
                        <strong>DynamoDB Admin</strong>
                        <p className="text-sm text-slate-600">http://localhost:8001</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: Comandos Uteis */}
          <TabsContent value="comandos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-6 w-6" />
                  Comandos Docker Mais Usados
                </CardTitle>
                <CardDescription>Guarde esta pagina - voce vai usar esses comandos sempre!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Comandos Basicos */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-600" />
                    Iniciar e Parar
                  </h3>
                  <CodeBlock 
                    id="commands-basic"
                    code={`# Iniciar todos os containers
docker-compose up

# Iniciar em segundo plano (background)
docker-compose up -d

# Iniciar e reconstruir (se mudou Dockerfile)
docker-compose up --build

# Parar todos os containers
docker-compose down

# Parar e remover volumes (limpa dados)
docker-compose down -v`}
                  />
                </div>

                {/* Ver Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    Ver Status e Logs
                  </h3>
                  <CodeBlock 
                    id="commands-status"
                    code={`# Ver containers rodando
docker-compose ps

# Ver logs de todos
docker-compose logs

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um servico especifico
docker-compose logs -f frontend
docker-compose logs -f api
docker-compose logs -f localstack`}
                  />
                </div>

                {/* Entrar no Container */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-purple-600" />
                    Entrar Dentro do Container
                  </h3>
                  <CodeBlock 
                    id="commands-exec"
                    code={`# Entrar no container do front-end
docker-compose exec frontend sh

# Entrar no container do back-end
docker-compose exec api bash

# Executar comando no container sem entrar
docker-compose exec api python -c "print('Hello!')"

# Instalar pacote npm no front
docker-compose exec frontend npm install pacote

# Instalar pacote pip no back
docker-compose exec api pip install pacote`}
                  />
                </div>

                {/* Reiniciar */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-orange-600" />
                    Reiniciar e Limpar
                  </h3>
                  <CodeBlock 
                    id="commands-restart"
                    code={`# Reiniciar um servico especifico
docker-compose restart frontend
docker-compose restart api

# Reconstruir um servico
docker-compose build frontend
docker-compose build api

# Limpar imagens nao usadas
docker system prune

# Limpar TUDO (cuidado!)
docker system prune -a --volumes`}
                  />
                </div>

                {/* Problemas Comuns */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <CardTitle className="text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Problemas Comuns e Solucoes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="rounded-lg border border-yellow-300 bg-white p-4">
                        <strong className="text-yellow-800">Porta ja em uso?</strong>
                        <p className="text-sm text-slate-600 mb-2">Erro: "port is already allocated"</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          # Windows: netstat -ano | findstr :3000<br/>
                          # Mac/Linux: lsof -i :3000 | kill -9 PID
                        </code>
                      </div>
                      
                      <div className="rounded-lg border border-yellow-300 bg-white p-4">
                        <strong className="text-yellow-800">Container nao inicia?</strong>
                        <p className="text-sm text-slate-600 mb-2">Tente reconstruir do zero:</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          docker-compose down -v && docker-compose up --build
                        </code>
                      </div>
                      
                      <div className="rounded-lg border border-yellow-300 bg-white p-4">
                        <strong className="text-yellow-800">Mudancas nao refletem?</strong>
                        <p className="text-sm text-slate-600 mb-2">Reinicie o container:</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          docker-compose restart frontend
                        </code>
                      </div>
                      
                      <div className="rounded-lg border border-yellow-300 bg-white p-4">
                        <strong className="text-yellow-800">Pouco espaco em disco?</strong>
                        <p className="text-sm text-slate-600 mb-2">Limpe imagens antigas:</p>
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                          docker system prune -a
                        </code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
