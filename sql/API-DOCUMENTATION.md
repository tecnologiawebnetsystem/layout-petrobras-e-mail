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
description: Descrição do envio
\`\`\`

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "fileId": "file_789012",
    "name": "Envio para Pedro Oliveira",
    "description": "Documentos solicitados",
    "uploadedBy": "usr_123456",
    "uploaderName": "João Silva",
    "uploaderEmail": "joao.silva@petrobras.com.br",
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
    "expirationHours": 48,
    "expiresAt": null,
    "createdAt": "2024-01-20T10:30:00Z",
    "message": "Documentos solicitados"
  }
}
\`\`\`

#### GET /files
Listar arquivos do usuário

**Query Parameters:**
- `status`: pending | approved | rejected | expired
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 20)
- `sortBy`: createdAt | expiresAt | name
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

#### GET /files/:fileId/expiration-logs
Obter histórico de alterações de expiração

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "fileId": "file_789012",
    "fileName": "Relatório Anual 2023",
    "logs": [
      {
        "logId": "explog_777888",
        "timestamp": "2024-01-20T15:00:00Z",
        "changedBy": "Carlos Supervisor",
        "previousValue": 72,
        "newValue": 168,
        "reason": "Solicitação do destinatário"
      }
    ]
  }
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
    "files": [
      {
        "fileId": "file_789012",
        "name": "Relatório Anual 2023",
        "uploadedBy": "João Silva",
        "recipientEmail": "cliente@gmail.com",
        "fileCount": 2,
        "uploadDate": "2024-01-20T10:30:00Z",
        "expirationHours": 72
      }
    ],
    "total": 5
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

#### GET /supervisor/metrics
Obter métricas para dashboard do supervisor

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "totalForReview": 5,
    "pending": 3,
    "approved": 156,
    "rejected": 8,
    "thisWeekApprovals": 12,
    "thisWeekRejections": 2,
    "avgApprovalTime": "2.5 hours"
  }
}
\`\`\`

---

### 5. Download (Usuário Externo)

#### POST /download/verify
Verificar acesso e enviar código de 6 dígitos

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
  "message": "Código de verificação de 6 dígitos enviado para o email",
  "expiresIn": 300
}
\`\`\`

#### POST /download/authenticate
Autenticar com código de 6 dígitos

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
    "expiresIn": 3600,
    "user": {
      "email": "externo@exemplo.com",
      "name": "Pedro Oliveira",
      "role": "external"
    }
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
- `priority`: low | medium | high | critical
- `type`: success | error | info | warning | approval | download | expiration
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
        "type": "approval",
        "priority": "high",
        "title": "Arquivo Aprovado",
        "message": "Seu arquivo para externo@exemplo.com foi aprovado",
        "isRead": false,
        "actionLabel": "Ver Detalhes",
        "actionUrl": "/historico",
        "createdAt": "2024-01-20T11:00:00Z",
        "metadata": {
          "fileId": "file_789012",
          "approver": "Carlos Supervisor"
        }
      }
    ],
    "unreadCount": 3,
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
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
- `action`: upload | download | approve | reject | login | logout | expiration_change | delete
- `level`: info | success | warning | error
- `fileId`: filtrar por arquivo
- `startDate`: data inicial (ISO 8601)
- `endDate`: data final (ISO 8601)
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
        "timestamp": "2024-01-20T10:30:00Z",
        "userId": "usr_123456",
        "userName": "João Silva",
        "userEmail": "joao.silva@petrobras.com.br",
        "userType": "internal",
        "action": "upload",
        "level": "info",
        "description": "Upload de 3 arquivos para externo@exemplo.com",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "metadata": {
          "fileId": "file_789012",
          "fileCount": 3,
          "recipient": "externo@exemplo.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 245
    }
  }
}
\`\`\`

#### GET /audit/metrics
Obter métricas do sistema (apenas admin)

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "totalUploads": 245,
    "pendingApprovals": 12,
    "approvedFiles": 198,
    "rejectedFiles": 15,
    "expiredFiles": 20,
    "totalDownloads": 450,
    "activeUsers": 45,
    "storageUsed": "15.4 GB",
    "loginCount": 1234,
    "expirationChanges": 23
  }
}
\`\`\`

#### GET /audit/activity-history
Histórico de atividades para usuários internos

**Query Parameters:**
- `activityType`: upload | download | all
- `startDate`: data inicial
- `endDate`: data final
- `page`: número da página
- `limit`: itens por página

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "activities": [
      {
        "activityId": "act_999888",
        "type": "upload",
        "timestamp": "2024-01-20T10:30:00Z",
        "fileName": "Relatório Anual 2023",
        "recipientEmail": "cliente@gmail.com",
        "status": "approved",
        "description": "Arquivo aprovado e enviado"
      }
    ],
    "stats": {
      "totalUploads": 45,
      "totalDownloads": 0,
      "pendingApprovals": 2
    }
  }
}
\`\`\`

---

### 8. Métricas Dashboard (Interno)

#### GET /metrics/dashboard
Obter métricas para o dashboard do usuário interno

**Response (200):**
\`\`\`json
{
  "success": true,
  "data": {
    "total": {
      "count": 12,
      "trend": "+15%",
      "files": []
    },
    "pending": {
      "count": 3,
      "trend": "-5%",
      "files": []
    },
    "approved": {
      "count": 8,
      "trend": "+20%",
      "files": []
    },
    "rejected": {
      "count": 1,
      "trend": "0%",
      "files": []
    }
  }
}
\`\`\`

---

## Códigos de Erro

| Código | Mensagem | Descrição |
|--------|----------|-----------|
| 400 | Bad Request | Requisição inválida ou parâmetros faltando |
| 401 | Unauthorized | Token inválido, expirado ou ausente |
| 403 | Forbidden | Sem permissão para acessar o recurso |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (ex: email já cadastrado) |
| 413 | Payload Too Large | Arquivo excede tamanho máximo (100MB) |
| 422 | Unprocessable Entity | Validação de dados falhou |
| 429 | Too Many Requests | Rate limit excedido |
| 500 | Internal Server Error | Erro interno do servidor |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

**Formato de Erro:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha incorretos",
    "details": {
      "field": "password",
      "issue": "senha não confere"
    },
    "timestamp": "2024-01-20T10:30:00Z"
  }
}
\`\`\`

---

## Rate Limiting

- **Autenticação**: 5 tentativas por minuto por IP
- **Verificação externa**: 3 códigos por hora por email
- **Upload**: 10 uploads por hora por usuário interno
- **Download**: 50 downloads por hora por IP externo
- **API Geral**: 100 requisições por minuto por usuário autenticado
- **API Pública**: 20 requisições por minuto por IP

**Headers de Rate Limit:**
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1674221400
\`\`\`

---

## Webhooks (Futuro)

O sistema poderá enviar webhooks para endpoints configurados quando:
- Arquivo for aprovado
- Arquivo for rejeitado  
- Arquivo expirar
- Download for realizado
- Tempo de expiração for alterado

**Formato do Webhook:**
\`\`\`json
{
  "event": "file.approved",
  "timestamp": "2024-01-20T11:00:00Z",
  "data": {
    "fileId": "file_789012",
    "fileName": "Relatório Anual 2023",
    "uploadedBy": "João Silva",
    "approvedBy": "Carlos Supervisor",
    "recipientEmail": "cliente@gmail.com"
  }
}
\`\`\`

---

## Validações de Segurança

### Upload de Arquivos
- Tamanho máximo: 100MB por arquivo
- Tipos permitidos: PDF, DOCX, XLSX, PPTX, ZIP, PNG, JPG
- Validação de ZIP: verificação de arquivos maliciosos
- Scan de vírus: integração com AWS GuardDuty (futuro)

### Autenticação Externa
- Código de 6 dígitos numérico
- Válido por 5 minutos
- Máximo 3 tentativas
- Rate limit: 3 códigos por hora

### Senhas
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

---

## Logs e Auditoria

Todos os eventos são logados com:
- Timestamp preciso (ISO 8601)
- IP do usuário
- User Agent
- Ação realizada
- Resultado (sucesso/erro)
- Metadata adicional

Logs disponíveis via CloudWatch para análise.
