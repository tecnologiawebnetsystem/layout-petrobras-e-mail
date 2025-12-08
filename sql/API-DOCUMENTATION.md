# Documentação da API - Sistema de Transferência de Arquivos Petrobras

## Base URL
\`\`\`
Production: https://api.petrobras-transfer.com.br/v1
Development: https://dev-api.petrobras-transfer.com.br/v1
\`\`\`

## Autenticação

Todas as requisições (exceto login) devem incluir o token JWT no header:
\`\`\`
Authorization: Bearer {token}
\`\`\`

---

## Endpoints

### 1. Autenticação

#### POST /auth/login
Autenticar usuário

**Request:**
\`\`\`json
{
  "email": "usuario@petrobras.com.br",
  "password": "senha123"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "userId": "usr_123456",
      "name": "João Silva",
      "email": "joao.silva@petrobras.com.br",
      "role": "internal",
      "department": "TI"
    }
  }
}
\`\`\`

#### POST /auth/refresh
Renovar token de acesso

**Request:**
\`\`\`json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
\`\`\`

#### POST /auth/logout
Fazer logout

**Request:**
\`\`\`json
{
  "sessionId": "sess_123456"
}
\`\`\`

#### POST /auth/forgot-password
Solicitar reset de senha

**Request:**
\`\`\`json
{
  "email": "usuario@exemplo.com"
}
\`\`\`

---

### 2. Usuários

#### GET /users/me
Obter dados do usuário logado

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "userId": "usr_123456",
    "name": "João Silva",
    "email": "joao.silva@petrobras.com.br",
    "role": "internal",
    "department": "TI",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-20T14:22:00Z"
  }
}
\`\`\`

#### PUT /users/me
Atualizar perfil do usuário

**Request:**
\`\`\`json
{
  "name": "João Silva Santos",
  "phone": "+55 11 98765-4321"
}
\`\`\`

#### POST /users
Criar novo usuário (apenas admin)

**Request:**
\`\`\`json
{
  "name": "Maria Santos",
  "email": "maria.santos@petrobras.com.br",
  "role": "supervisor",
  "department": "Operações",
  "password": "senhaTemporaria123"
}
\`\`\`

---

### 3. Arquivos (Upload)

#### POST /files/upload
Iniciar upload de arquivo

**Request (multipart/form-data):**
\`\`\`
recipientEmail: externo@exemplo.com
recipientName: Pedro Oliveira
files: [File, File, ...]
expiresInHours: 48
message: Mensagem opcional
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "fileId": "file_789012",
    "uploadedBy": "usr_123456",
    "recipientEmail": "externo@exemplo.com",
    "recipientName": "Pedro Oliveira",
    "files": [
      {
        "fileName": "documento.pdf",
        "fileSize": 2048576,
        "fileType": "application/pdf",
        "s3Key": "uploads/file_789012/documento.pdf"
      }
    ],
    "status": "pending",
    "expiresAt": "2024-01-22T10:30:00Z",
    "createdAt": "2024-01-20T10:30:00Z"
  }
}
\`\`\`

#### GET /files
Listar arquivos do usuário

**Query Parameters:**
- `status`: pending | approved | rejected | expired
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)
- `sortBy`: createdAt | expiresAt
- `order`: asc | desc

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "files": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 94,
      "itemsPerPage": 20
    }
  }
}
\`\`\`

#### GET /files/:fileId
Obter detalhes de um arquivo

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "fileId": "file_789012",
    "uploadedBy": {
      "userId": "usr_123456",
      "name": "João Silva",
      "email": "joao.silva@petrobras.com.br"
    },
    "recipientEmail": "externo@exemplo.com",
    "recipientName": "Pedro Oliveira",
    "files": [...],
    "status": "approved",
    "approvedBy": {
      "userId": "usr_999888",
      "name": "Carlos Supervisor",
      "email": "carlos.supervisor@petrobras.com.br"
    },
    "approvedAt": "2024-01-20T11:00:00Z",
    "expiresAt": "2024-01-22T10:30:00Z",
    "createdAt": "2024-01-20T10:30:00Z"
  }
}
\`\`\`

#### DELETE /files/:fileId
Deletar arquivo (apenas quem enviou)

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Arquivo deletado com sucesso"
}
\`\`\`

---

### 4. Supervisor

#### GET /supervisor/pending
Listar arquivos pendentes de aprovação

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "files": [...]
  }
}
\`\`\`

#### POST /supervisor/approve/:fileId
Aprovar arquivo

**Request:**
\`\`\`json
{
  "message": "Aprovado conforme política de segurança"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Arquivo aprovado com sucesso",
  "data": {
    "fileId": "file_789012",
    "status": "approved",
    "approvedBy": "usr_999888",
    "approvedAt": "2024-01-20T11:00:00Z"
  }
}
\`\`\`

#### POST /supervisor/reject/:fileId
Rejeitar arquivo

**Request:**
\`\`\`json
{
  "reason": "Arquivo contém informações confidenciais"
}
\`\`\`

#### PUT /supervisor/extend/:fileId
Estender tempo de expiração

**Request:**
\`\`\`json
{
  "additionalHours": 24,
  "reason": "Solicitação do destinatário"
}
\`\`\`

---

### 5. Download (Usuário Externo)

#### POST /download/verify
Verificar acesso e enviar código

**Request:**
\`\`\`json
{
  "email": "externo@exemplo.com"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Código de verificação enviado para o email"
}
\`\`\`

#### POST /download/authenticate
Autenticar com código

**Request:**
\`\`\`json
{
  "email": "externo@exemplo.com",
  "code": "123456"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
\`\`\`

#### GET /download/files
Listar arquivos disponíveis para download

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileId": "file_789012",
        "uploadedBy": "João Silva (Petrobras)",
        "files": [...],
        "expiresAt": "2024-01-22T10:30:00Z",
        "message": "Documentos solicitados"
      }
    ]
  }
}
\`\`\`

#### GET /download/files/:fileId/url
Obter URL temporária para download

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/...",
    "expiresIn": 300
  }
}
\`\`\`

---

### 6. Notificações

#### GET /notifications
Listar notificações do usuário

**Query Parameters:**
- `unreadOnly`: true | false
- `page`: número da página
- `limit`: itens por página

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "notificationId": "notif_111222",
        "type": "file_approved",
        "title": "Arquivo Aprovado",
        "message": "Seu arquivo para externo@exemplo.com foi aprovado",
        "isRead": false,
        "createdAt": "2024-01-20T11:00:00Z",
        "metadata": {
          "fileId": "file_789012"
        }
      }
    ],
    "unreadCount": 3
  }
}
\`\`\`

#### PUT /notifications/:notificationId/read
Marcar notificação como lida

#### PUT /notifications/read-all
Marcar todas como lidas

---

### 7. Auditoria

#### GET /audit/logs
Obter logs de auditoria (apenas supervisor/admin)

**Query Parameters:**
- `userId`: filtrar por usuário
- `action`: tipo de ação
- `fileId`: filtrar por arquivo
- `startDate`: data inicial
- `endDate`: data final
- `page`: número da página
- `limit`: itens por página

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "logs": [
      {
        "logId": "log_555666",
        "userId": "usr_123456",
        "userName": "João Silva",
        "action": "FILE_UPLOAD",
        "details": "Upload de 3 arquivos para externo@exemplo.com",
        "ipAddress": "192.168.1.100",
        "timestamp": "2024-01-20T10:30:00Z",
        "metadata": {
          "fileId": "file_789012",
          "fileCount": 3
        }
      }
    ],
    "pagination": {...}
  }
}
\`\`\`

#### GET /audit/metrics
Obter métricas do sistema

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "totalUploads": 245,
    "pendingApprovals": 12,
    "approvedFiles": 198,
    "rejectedFiles": 15,
    "totalDownloads": 450,
    "activeUsers": 45,
    "storageUsed": "15.4 GB"
  }
}
\`\`\`

---

## Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| 400 | Bad Request | Requisição inválida |
| 401 | Unauthorized | Token inválido ou expirado |
| 403 | Forbidden | Sem permissão para acessar |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: email já existe) |
| 413 | Payload Too Large | Arquivo muito grande |
| 422 | Unprocessable Entity | Validação falhou |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro no servidor |

**Formato de Erro:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha incorretos",
    "details": {}
  }
}
\`\`\`

---

## Rate Limiting

- **Autenticação**: 5 tentativas por minuto por IP
- **Upload**: 10 uploads por hora por usuário
- **Download**: 50 downloads por hora por IP
- **API Geral**: 100 requisições por minuto por usuário

---

## Webhooks (Futuro)

O sistema poderá enviar webhooks para sistemas externos quando:
- Arquivo for aprovado
- Arquivo for rejeitado
- Arquivo expirar
- Download for realizado
