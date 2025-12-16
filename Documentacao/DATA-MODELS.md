# Modelos de Dados - Sistema de Transferência Petrobras

## 1. Users (petrobras-users)

Armazena informações dos usuários do sistema.

```json
{
  "userId": "usr_123456",
  "email": "joao.silva@petrobras.com.br",
  "name": "João Silva",
  "role": "internal | external | supervisor",
  "department": "TI",
  "phone": "+55 11 98765-4321",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-20T14:22:00Z",
  "lastLogin": "2024-01-20T14:22:00Z",
  "preferences": {
    "notifications": {
      "email": true,
      "inApp": true
    },
    "theme": "light | dark"
  },
  "metadata": {
    "loginCount": 45,
    "failedLoginAttempts": 0
  }
}
```

**Índices:**
- EmailIndex (GSI): Busca por email
- RoleIndex (GSI): Filtrar por perfil

---

## 2. Files (petrobras-files)

Armazena informações dos arquivos enviados e seu ciclo de vida.

```json
{
  "fileId": "file_789012",
  "name": "Relatório Anual 2023",
  "description": "Relatório financeiro consolidado",
  "uploadedBy": "usr_123456",
  "uploaderName": "João Silva",
  "uploaderEmail": "joao.silva@petrobras.com.br",
  "recipientEmail": "cliente@gmail.com",
  "recipientName": "Pedro Oliveira",
  "files": [
    {
      "fileName": "Relatorio_Anual_2023.pdf",
      "fileSize": 13421772,
      "fileType": "application/pdf",
      "s3Key": "uploads/file_789012/Relatorio_Anual_2023.pdf",
      "s3Bucket": "petrobras-secure-files"
    }
  ],
  "status": "pending | approved | rejected | expired",
  "expirationHours": 72,
  "expiresAt": "2024-01-22T10:30:00Z",
  "createdAt": "2024-01-20T10:30:00Z",
  "updatedAt": "2024-01-20T11:00:00Z",
  "approvalDate": "2024-01-20T11:00:00Z",
  "approvedBy": "usr_999888",
  "approverName": "Carlos Supervisor",
  "rejectionReason": null,
  "downloadCount": 0,
  "lastDownloadAt": null,
  "message": "Documentos solicitados",
  "ttl": 1706097000,
  "metadata": {
    "totalSize": 13421772,
    "fileCount": 1,
    "isZipValidated": true,
    "hasPassword": false
  }
}
```

**Índices:**
- UploaderIndex (GSI): Buscar uploads por usuário + data
- RecipientIndex (GSI): Buscar downloads por destinatário + data
- StatusIndex (GSI): Filtrar por status + data

**TTL:**
- Campo `ttl` expira automaticamente arquivos após período definido

---

## 3. Audit Logs (petrobras-audit-logs)

Rastreamento completo de todas as ações do sistema.

```json
{
  "logId": "log_555666",
  "timestamp": "2024-01-20T10:30:00Z",
  "userId": "usr_123456",
  "userName": "João Silva",
  "userEmail": "joao.silva@petrobras.com.br",
  "userType": "internal",
  "action": "upload | download | approve | reject | login | logout | expiration_change | delete",
  "level": "info | success | warning | error",
  "fileId": "file_789012",
  "fileName": "Relatório Anual 2023",
  "description": "Upload de 3 arquivos para externo@exemplo.com",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "recipient": "externo@exemplo.com",
    "fileCount": 3,
    "expirationHours": 72,
    "previousValue": null,
    "newValue": 72
  }
}
```

**Índices:**
- UserIndex (GSI): Logs por usuário + timestamp
- ActionIndex (GSI): Logs por tipo de ação + timestamp
- FileIndex (GSI): Logs por arquivo + timestamp
- LevelIndex (GSI): Logs por nível + timestamp

---

## 4. Notifications (petrobras-notifications)

Sistema de notificações em tempo real.

```json
{
  "notificationId": "notif_111222",
  "userId": "usr_123456",
  "type": "success | error | info | warning | approval | download | expiration",
  "priority": "low | medium | high | critical",
  "title": "Upload Aprovado!",
  "message": "Seu envio para cliente@gmail.com foi aprovado",
  "isRead": false,
  "actionLabel": "Ver Detalhes",
  "actionUrl": "/historico",
  "createdAt": "2024-01-20T11:00:00Z",
  "readAt": null,
  "metadata": {
    "fileId": "file_789012",
    "fileName": "Relatório Anual 2023",
    "approver": "Carlos Supervisor"
  },
  "ttl": 1707318000
}
```

**Índices:**
- UserNotificationsIndex (GSI): Notificações por usuário + data
- UnreadNotificationsIndex (GSI): Notificações não lidas por usuário
- PriorityIndex (GSI): Notificações por prioridade + data

**TTL:**
- Notificações expiram após 30 dias automaticamente

---

## 5. Sessions (petrobras-sessions)

Controle de sessões e tokens JWT.

```json
{
  "sessionId": "sess_333444",
  "userId": "usr_123456",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "isActive": true,
  "createdAt": "2024-01-20T10:00:00Z",
  "lastActivityAt": "2024-01-20T14:30:00Z",
  "expiresAt": "2024-01-21T10:00:00Z",
  "ttl": 1705921200
}
```

**Índices:**
- UserSessionsIndex (GSI): Sessões por usuário

**TTL:**
- Sessões expiram automaticamente após 24 horas

---

## 6. Expiration Logs (petrobras-expiration-logs)

Histórico de alterações de tempo de expiração.

```json
{
  "logId": "explog_777888",
  "timestamp": "2024-01-20T15:00:00Z",
  "fileId": "file_789012",
  "fileName": "Relatório Anual 2023",
  "changedBy": "usr_999888",
  "changerName": "Carlos Supervisor",
  "previousValue": 72,
  "newValue": 168,
  "reason": "Solicitação do destinatário para mais tempo",
  "metadata": {
    "uploadedBy": "João Silva",
    "recipientEmail": "cliente@gmail.com"
  }
}
```

**Índices:**
- FileExpirationIndex (GSI): Logs por arquivo + timestamp
- ChangedByIndex (GSI): Logs por quem alterou + timestamp

---

## Queries Comuns

### Buscar uploads de um usuário interno
```python
response = table.query(
    IndexName='UploaderIndex',
    KeyConditionExpression='uploadedBy = :userId',
    ExpressionAttributeValues={':userId': 'usr_123456'}
)
```

### Buscar downloads de um externo
```python
response = table.query(
    IndexName='RecipientIndex',
    KeyConditionExpression='recipientEmail = :email',
    ExpressionAttributeValues={':email': 'cliente@gmail.com'}
)
```

### Buscar arquivos pendentes
```python
response = table.query(
    IndexName='StatusIndex',
    KeyConditionExpression='#status = :status',
    ExpressionAttributeNames={'#status': 'status'},
    ExpressionAttributeValues={':status': 'pending'}
)
```

### Buscar notificações não lidas
```python
response = table.query(
    IndexName='UnreadNotificationsIndex',
    KeyConditionExpression='userId = :userId AND isRead = :isRead',
    ExpressionAttributeValues={
        ':userId': 'usr_123456',
        ':isRead': 'false'
    }
)
```

### Buscar logs de um arquivo específico
```python
response = table.query(
    IndexName='FileIndex',
    KeyConditionExpression='fileId = :fileId',
    ExpressionAttributeValues={':fileId': 'file_789012'},
    ScanIndexForward=False  # Ordem decrescente
)
