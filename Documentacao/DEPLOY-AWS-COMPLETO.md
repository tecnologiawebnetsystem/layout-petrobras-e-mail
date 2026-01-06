# Deploy Completo na AWS com Domínio Provisório

## Visão Geral

Este guia mostra como publicar a aplicação Next.js na AWS usando:
- **CloudFront URL** como domínio provisório (gratuito, ex: `d111111abcdef8.cloudfront.net`)
- **S3** para armazenamento de arquivos estáticos
- **Lambda@Edge** para funções serverless
- **CloudFront** para CDN global

---

## Opção 1: Deploy com Amplify (MAIS FÁCIL)

### Vantagens:
✅ Domínio provisório gratuito incluído (ex: `https://main.d3abc123.amplifyapp.com`)  
✅ CI/CD automático com Git  
✅ SSL/HTTPS automático  
✅ Deploy em 5 minutos  

### Passo a Passo:

#### 1. Criar App no Amplify

```bash
# Instalar AWS CLI (se ainda não tiver)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configurar credenciais AWS
aws configure
# AWS Access Key ID: [SUA_KEY]
# AWS Secret Access Key: [SEU_SECRET]
# Default region: us-east-1
# Default output format: json
```

#### 2. Conectar Repositório GitHub

**Via Console AWS:**
1. Acesse: https://console.aws.amazon.com/amplify
2. Clique em "New app" → "Host web app"
3. Selecione "GitHub"
4. Autorize AWS Amplify no GitHub
5. Escolha o repositório `Layout_Petrobras_E_mail`
6. Branch: `main`

#### 3. Configurar Build

```yaml
# amplify.yml (criar na raiz do projeto)
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 4. Adicionar Variáveis de Ambiente

No console Amplify:
1. Clique em "Environment variables"
2. Adicione todas as variáveis:

```
NEXT_PUBLIC_ENTRA_CLIENT_ID=da3aaaad-619f-4bee-a434-51efd11faf7c
NEXT_PUBLIC_ENTRA_TENANT_ID=5b6f6241-9a57-4be4-8e50-1dfa72e79a57
NEXT_PUBLIC_ENTRA_REDIRECT_URI=https://main.d3abc123.amplifyapp.com
DATABASE_URL=postgresql://...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

#### 5. Deploy Automático

Amplify faz deploy automaticamente em cada push:
```bash
git add .
git commit -m "Deploy para AWS Amplify"
git push origin main
```

#### 6. Seu Domínio Provisório

Após deploy (3-5 minutos):
- **URL Provisória**: `https://main.d3abc123.amplifyapp.com`
- **SSL**: Automático (certificado AWS)
- **Global CDN**: Incluído

---

## Opção 2: Deploy Manual com S3 + CloudFront (MAIS CONTROLE)

### Vantagens:
✅ Controle total da infraestrutura  
✅ Custos mais baixos (~$1-5/mês)  
✅ Domínio CloudFront gratuito (ex: `https://d111111abcdef8.cloudfront.net`)  

### Passo a Passo:

#### 1. Build da Aplicação

```bash
# No seu computador local
npm run build
npm run export  # Gera pasta /out com arquivos estáticos
```

#### 2. Criar Bucket S3

```bash
# Nome único global
BUCKET_NAME="petrobras-compartilhamento-hml"

# Criar bucket
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Configurar como site estático
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document 404.html
```

#### 3. Upload dos Arquivos

```bash
# Fazer upload de tudo
aws s3 sync ./out s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --acl public-read

# HTML sem cache (para atualizações)
aws s3 sync ./out s3://$BUCKET_NAME \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --acl public-read
```

#### 4. Criar Distribuição CloudFront

```bash
# Criar distribuição
aws cloudfront create-distribution \
  --origin-domain-name $BUCKET_NAME.s3.amazonaws.com \
  --default-root-object index.html
```

**Via Console (mais fácil):**
1. Acesse: https://console.aws.amazon.com/cloudfront
2. Clique "Create Distribution"
3. **Origin domain**: Selecione seu bucket S3
4. **Viewer protocol policy**: Redirect HTTP to HTTPS
5. **Default root object**: `index.html`
6. Clique "Create Distribution"

#### 5. Aguardar Deploy

- Status muda de "In Progress" para "Deployed" (10-15 min)
- **Seu domínio provisório**: `https://d111111abcdef8.cloudfront.net`

#### 6. Configurar Custom Error Pages

No CloudFront:
1. Aba "Error Pages"
2. Adicionar:
   - 403: Redirect to `/index.html` (200)
   - 404: Redirect to `/index.html` (200)

Isso permite SPA routing funcionar corretamente.

---

## Opção 3: Deploy com Docker + ECS (PRODUÇÃO COMPLETA)

### Vantagens:
✅ Suporta Server-Side Rendering (SSR)  
✅ API Routes funcionam  
✅ Escalabilidade automática  
✅ Melhor para produção  

### Passo a Passo:

#### 1. Criar Dockerfile

```dockerfile
# Dockerfile (na raiz do projeto)
FROM node:18-alpine AS base

# Instalar dependências
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Configurar next.config.js

```javascript
// next.config.mjs
const nextConfig = {
  output: 'standalone', // Importante para Docker
  // ... resto da config
}

export default nextConfig
```

#### 3. Build e Push para ECR

```bash
# Criar repositório ECR
aws ecr create-repository --repository-name petrobras-compartilhamento --region us-east-1

# Fazer login no ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build da imagem
docker build -t petrobras-compartilhamento .

# Tag
docker tag petrobras-compartilhamento:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/petrobras-compartilhamento:latest

# Push
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/petrobras-compartilhamento:latest
```

#### 4. Criar Cluster ECS

```bash
# Criar cluster
aws ecs create-cluster --cluster-name petrobras-cluster --region us-east-1

# Criar task definition (task-definition.json)
```

```json
{
  "family": "petrobras-compartilhamento",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "nextjs-app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/petrobras-compartilhamento:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_ENTRA_CLIENT_ID",
          "value": "da3aaaad-619f-4bee-a434-51efd11faf7c"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/petrobras-compartilhamento",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Registrar task
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 5. Criar Application Load Balancer

```bash
# Via Console AWS (mais fácil)
# 1. EC2 → Load Balancers → Create Load Balancer
# 2. Application Load Balancer
# 3. Internet-facing
# 4. Criar Target Group (porta 3000)
```

#### 6. Criar Service

```bash
aws ecs create-service \
  --cluster petrobras-cluster \
  --service-name petrobras-service \
  --task-definition petrobras-compartilhamento:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=nextjs-app,containerPort=3000"
```

#### 7. Seu Domínio Provisório

- **URL do ALB**: `http://petrobras-alb-123456789.us-east-1.elb.amazonaws.com`
- Adicionar CloudFront na frente para HTTPS

---

## Comparação de Custos (Mensal)

| Opção | Custo HML | Custo Produção | Facilidade |
|-------|-----------|----------------|------------|
| **Amplify** | $5-15 | $15-50 | ⭐⭐⭐⭐⭐ |
| **S3 + CloudFront** | $1-5 | $5-20 | ⭐⭐⭐⭐ |
| **ECS Fargate** | $15-30 | $50-200 | ⭐⭐⭐ |

---

## Recomendação por Ambiente

### HML (Homologação):
👉 **AWS Amplify** - Domínio provisório gratuito, CI/CD automático

### Produção:
👉 **ECS Fargate + CloudFront** - Escalável, confiável, suporta SSR

---

## Atualizar Redirect URI no Azure AD

Após obter seu domínio provisório (ex: `https://main.d3abc123.amplifyapp.com`):

1. Atualizar variável de ambiente:
```bash
NEXT_PUBLIC_ENTRA_REDIRECT_URI=https://main.d3abc123.amplifyapp.com
```

2. Solicitar ao admin do Azure AD adicionar essa URL nas Redirect URIs

---

## Troubleshooting

### Erro: "Cannot find module 'next'"
```bash
# No Dockerfile, usar npm ci --production=false
```

### CloudFront não atualiza
```bash
# Invalidar cache
aws cloudfront create-invalidation \
  --distribution-id EXAMPLEID \
  --paths "/*"
```

### ECS Task falha ao iniciar
```bash
# Ver logs
aws logs tail /ecs/petrobras-compartilhamento --follow
```

---

## Scripts Úteis

### Script de Deploy S3 + CloudFront

```bash
#!/bin/bash
# deploy-s3.sh

echo "🚀 Iniciando deploy..."

# Build
npm run build
npm run export

# Upload para S3
aws s3 sync ./out s3://petrobras-compartilhamento-hml --delete

# Invalidar CloudFront
aws cloudfront create-invalidation \
  --distribution-id E123456789ABC \
  --paths "/*"

echo "✅ Deploy concluído!"
```

### Script de Deploy Amplify

```bash
#!/bin/bash
# deploy-amplify.sh

git add .
git commit -m "Deploy para HML"
git push origin main

echo "✅ Deploy iniciado! Acompanhe em:"
echo "https://console.aws.amazon.com/amplify"
```

---

## Próximos Passos

1. ✅ Escolher método de deploy (recomendo Amplify para HML)
2. ✅ Obter domínio provisório
3. ✅ Atualizar variáveis de ambiente
4. ✅ Solicitar atualização do Azure AD
5. ✅ Testar SSO com novo domínio
6. ✅ Migrar para domínio definitivo quando aprovado
