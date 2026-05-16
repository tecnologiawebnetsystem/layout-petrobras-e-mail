# Documentacao da API

## OpenAPI / Swagger

A documentacao completa da API esta disponivel no arquivo `openapi.yaml` nesta pasta.

### Visualizar Documentacao

#### Swagger UI (integrado ao FastAPI)

Acesse a documentacao interativa diretamente no servidor:

```
http://localhost:8000/docs
```

#### ReDoc (alternativa)

```
http://localhost:8000/redoc
```

#### Swagger Editor Online

1. Acesse https://editor.swagger.io/
2. Cole o conteudo de `openapi.yaml`

### Estrutura da API

A API esta organizada nas seguintes categorias:

| Tag | Descricao |
|-----|-----------|
| **Auth** | Autenticacao unificada (login, logout, refresh, reset password) |
| **Auth Internal** | Autenticacao para usuarios internos (Entra ID / Local) |
| **Auth External** | Autenticacao para usuarios externos (OTP) |
| **Users** | Gerenciamento de usuarios e perfil |
| **Files** | Upload e gerenciamento de arquivos |
| **Shares** | Compartilhamentos de arquivos |
| **Supervisor** | Aprovacao e gestao de compartilhamentos |
| **Notifications** | Notificacoes do sistema |
| **Audit** | Logs de auditoria e metricas |
| **Emails** | Envio e historico de emails |
| **Download** | Portal de download para usuarios externos |
| **Areas** | Gerenciamento de areas/departamentos |

### Autenticacao

A API suporta tres metodos de autenticacao:

1. **Bearer Token (JWT)** - Para usuarios internos
   ```
   Authorization: Bearer <token>
   ```

2. **Cookie de Sessao** - Alternativa para aplicacoes web
   ```
   Cookie: app_session=<token>
   ```

3. **Sessao Externa** - Para usuarios externos apos OTP
   ```
   Cookie: external_session=<token>
   ```

### Endpoints Principais

#### Fluxo de Compartilhamento (Interno)

1. `POST /files/upload` - Upload do arquivo
2. `POST /shares` - Criar compartilhamento
3. Aguardar aprovacao do supervisor

#### Fluxo de Aprovacao (Supervisor)

1. `GET /supervisor/pending` - Listar pendentes
2. `POST /supervisor/approve/{id}` - Aprovar
3. Ou `POST /supervisor/reject/{id}` - Rejeitar

#### Fluxo de Download (Externo)

1. `POST /download/verify` - Verificar token do email
2. `POST /download/authenticate` - Autenticar com OTP
3. `GET /download/files` - Listar arquivos disponiveis
4. `GET /download/files/{id}/url` - Obter URL de download

### Codigos de Status

| Codigo | Descricao |
|--------|-----------|
| 200 | Sucesso |
| 201 | Recurso criado |
| 400 | Requisicao invalida |
| 401 | Nao autenticado |
| 403 | Acesso negado |
| 404 | Recurso nao encontrado |
| 413 | Arquivo muito grande |
| 423 | Conta bloqueada |
| 429 | Muitas requisicoes |
| 500 | Erro interno |

### Exemplos de Uso

#### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "usuario@petrobras.com.br", "password": "senha123"}'
```

#### Upload de Arquivo

```bash
curl -X POST http://localhost:8000/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@documento.pdf" \
  -F "area_id=1"
```

#### Criar Compartilhamento

```bash
curl -X POST http://localhost:8000/api/v1/shares \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email": "auditor@kpmg.com.br",
    "file_ids": [1, 2, 3],
    "expiration_hours": 48
  }'
```

#### Aprovar Compartilhamento

```bash
curl -X POST http://localhost:8000/api/v1/supervisor/approve/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Aprovado para auditoria"}'
```

### Gerando Clientes

O arquivo `openapi.yaml` pode ser usado para gerar clientes automaticamente:

#### TypeScript/JavaScript

```bash
npx openapi-typescript-codegen \
  --input docs/openapi.yaml \
  --output src/api \
  --client axios
```

#### Python

```bash
pip install openapi-python-client
openapi-python-client generate --path docs/openapi.yaml
```

### Validacao

Para validar o arquivo OpenAPI:

```bash
npx @redocly/cli lint docs/openapi.yaml
```
