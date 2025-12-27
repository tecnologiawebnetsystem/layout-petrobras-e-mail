# AWS CDK - Infrastructure as Code

Este diretório contém todos os scripts para criar automaticamente a infraestrutura AWS necessária para o sistema de compartilhamento de arquivos da Petrobras.

## O que é AWS CDK?

**AWS CDK (Cloud Development Kit)** permite escrever infraestrutura AWS usando Python (ou outras linguagens). Você escreve código Python normal e o CDK transforma em CloudFormation (a linguagem que a AWS entende) automaticamente.

### Analogia simples:
- **Sem CDK**: Você precisa criar cada serviço AWS manualmente no console (clicando em botões)
- **Com CDK**: Você escreve um script Python e executa `cdk deploy` - pronto, tudo é criado automaticamente!

## Pré-requisitos

### 1. Instalar Node.js (necessário para o CDK CLI)
\`\`\`bash
# Ubuntu/Debian
sudo apt install nodejs npm

# macOS
brew install node

# Verificar instalação
node --version
npm --version
\`\`\`

### 2. Instalar AWS CLI
\`\`\`bash
# Ubuntu/Debian
sudo apt install awscli

# macOS
brew install awscli

# Verificar instalação
aws --version
\`\`\`

### 3. Configurar credenciais AWS
\`\`\`bash
aws configure
\`\`\`

Você vai precisar informar:
- **AWS Access Key ID**: Pegar no console AWS (IAM)
- **AWS Secret Access Key**: Pegar no console AWS (IAM)
- **Default region**: `us-east-1` (Norte da Virgínia)
- **Default output format**: `json`

### 4. Instalar AWS CDK CLI
\`\`\`bash
npm install -g aws-cdk

# Verificar instalação
cdk --version
\`\`\`

### 5. Instalar dependências Python
\`\`\`bash
cd back-end/aws
python3 -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
\`\`\`

## Como Usar

### Passo 1: Configurar ID da conta AWS

Abra o arquivo `app.py` e substitua:
\`\`\`python
account="YOUR_AWS_ACCOUNT_ID",  # Substitua pelo ID da sua conta AWS
\`\`\`

Para descobrir seu ID da conta AWS:
\`\`\`bash
aws sts get-caller-identity --query Account --output text
\`\`\`

### Passo 2: Bootstrap (Primeira vez apenas)

O bootstrap prepara sua conta AWS para usar o CDK:
\`\`\`bash
cdk bootstrap aws://SEU_ACCOUNT_ID/us-east-1
\`\`\`

Exemplo:
\`\`\`bash
cdk bootstrap aws://123456789012/us-east-1
\`\`\`

### Passo 3: Visualizar o que será criado

Antes de criar, você pode ver o que o CDK vai fazer:
\`\`\`bash
cdk synth
\`\`\`

Isso gera o CloudFormation template (arquivo YAML gigante) - você não precisa entender, é só para ver.

### Passo 4: Ver diferenças (Opcional)

Se já tiver infraestrutura criada, veja o que vai mudar:
\`\`\`bash
cdk diff
\`\`\`

### Passo 5: DEPLOY - Criar tudo na AWS! 🚀

\`\`\`bash
cdk deploy --all
\`\`\`

O CDK vai:
1. Mostrar tudo que será criado
2. Pedir confirmação
3. Criar todas as stacks (tabelas DynamoDB, buckets S3, Lambdas, API Gateway)
4. Mostrar os outputs (URLs, nomes, etc)

**Tempo estimado: 5-10 minutos**

### Passo 6: Ver os recursos criados

Após deploy, o CDK mostra os outputs:
\`\`\`
Outputs:
PetrobrasDatabaseStack.UploadsTableName = petrobras-uploads
PetrobrasDatabaseStack.UsersTableName = petrobras-users
PetrobrasStorageStack.FilesBucketName = petrobras-shared-files
PetrobrasApiStack.APIEndpoint = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
\`\`\`

Copie esses valores e adicione nas variáveis de ambiente do seu projeto.

## Estrutura do Projeto

\`\`\`
back-end/aws/
├── app.py                    # Arquivo principal - orquestra todas as stacks
├── requirements.txt          # Dependências Python
├── README.md                # Este arquivo
└── stacks/                  # Pasta com definições de cada stack
    ├── database_stack.py    # Cria tabelas DynamoDB
    ├── storage_stack.py     # Cria buckets S3
    ├── email_stack.py       # Configura AWS SES
    ├── lambda_stack.py      # Cria funções Lambda
    └── api_stack.py         # Cria API Gateway
\`\`\`

## O que cada Stack cria

### 1. DatabaseStack (database_stack.py)
Cria 5 tabelas DynamoDB:
- `petrobras-uploads` - Informações de uploads
- `petrobras-users` - Usuários do sistema
- `petrobras-audit-logs` - Logs de auditoria
- `petrobras-notifications` - Notificações
- `petrobras-sessions` - Sessões de usuários

### 2. StorageStack (storage_stack.py)
Cria 2 buckets S3:
- `petrobras-shared-files` - Armazenamento de arquivos
- `petrobras-logs-backup` - Logs e backups

### 3. EmailStack (email_stack.py)
Configura AWS SES para enviar e-mails:
- Verifica domínio `petrobras.com.br`
- Cria role IAM para envio de e-mails

### 4. LambdaStack (lambda_stack.py)
Cria funções Lambda:
- `petrobras-upload-processor` - Processa uploads
- `petrobras-auth-servicenow` - Autenticação

### 5. ApiStack (api_stack.py)
Cria API Gateway REST:
- `POST /auth/login` - Login
- `POST /uploads` - Criar upload
- `GET /uploads` - Listar uploads

## Comandos Úteis

### Listar todas as stacks
\`\`\`bash
cdk list
\`\`\`

### Fazer deploy de uma stack específica
\`\`\`bash
cdk deploy PetrobrasDatabaseStack
\`\`\`

### Destruir tudo (CUIDADO!)
\`\`\`bash
cdk destroy --all
\`\`\`

### Ver logs de uma stack
\`\`\`bash
cdk watch
\`\`\`

## Custos Estimados

Com os recursos criados:
- **DynamoDB (Pay-per-request)**: ~$0.25 por 1 milhão de requisições
- **S3 (Standard)**: ~$0.023 por GB/mês
- **Lambda**: 1 milhão de requisições grátis/mês
- **API Gateway**: ~$3.50 por 1 milhão de requisições

**Custo estimado mensal (uso moderado): $10-50/mês**

## Troubleshooting

### Erro: "Unable to resolve AWS account"
\`\`\`bash
aws configure
# Configure suas credenciais novamente
\`\`\`

### Erro: "Stack already exists"
\`\`\`bash
cdk destroy NOME_DA_STACK
# Depois faça deploy novamente
\`\`\`

### Erro: "Insufficient permissions"
Sua conta AWS precisa ter permissões de administrador ou pelo menos:
- DynamoDB: CreateTable, DescribeTable
- S3: CreateBucket, PutBucketPolicy
- Lambda: CreateFunction, UpdateFunctionCode
- IAM: CreateRole, AttachRolePolicy
- API Gateway: CreateRestApi

## Próximos Passos

Após criar a infraestrutura:

1. **Copiar outputs** para variáveis de ambiente
2. **Adicionar registros DNS** para AWS SES (envio de e-mails)
3. **Criar funções Lambda** (código Python)
4. **Conectar front-end** aos endpoints da API

## Suporte

Dúvidas? Consulte:
- [Documentação AWS CDK](https://docs.aws.amazon.com/cdk/)
- [Exemplos CDK Python](https://github.com/aws-samples/aws-cdk-examples/tree/master/python)
