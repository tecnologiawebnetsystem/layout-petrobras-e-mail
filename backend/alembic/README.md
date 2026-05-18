# Alembic - Database Migrations

Este diretório contém as migrations do banco de dados usando Alembic.

## Estrutura

```
alembic/
├── env.py              # Configuração do Alembic
├── script.py.mako      # Template para novas migrations
├── versions/           # Arquivos de migration
│   └── 001_initial_schema.py  # Schema inicial completo
└── README.md           # Este arquivo
```

## Pré-requisitos

1. PostgreSQL (Aurora) instalado e rodando
2. Variável de ambiente `DATABASE_URL` configurada

```bash
# Formato da URL para Aurora PostgreSQL
export DATABASE_URL="postgresql+psycopg://user:password@host:5432/database"
```

## Comandos Principais

### Ver status atual

```bash
cd backend
alembic current
```

### Aplicar todas as migrations

```bash
cd backend
alembic upgrade head
```

### Aplicar migration específica

```bash
cd backend
alembic upgrade 001_initial_schema
```

### Reverter última migration

```bash
cd backend
alembic downgrade -1
```

### Reverter todas as migrations

```bash
cd backend
alembic downgrade base
```

### Criar nova migration

```bash
cd backend
# Migration manual
alembic revision -m "descricao_da_migration"

# Migration automática (detecta mudanças nos models)
alembic revision --autogenerate -m "descricao_da_migration"
```

### Ver histórico de migrations

```bash
cd backend
alembic history
```

### Ver SQL que seria executado (sem aplicar)

```bash
cd backend
alembic upgrade head --sql
```

## Tabelas Criadas

### 1. `user`
Armazena todos os usuários do sistema.

| Tipo | Descrição |
|------|-----------|
| **Interno** | `type='internal'`, `is_supervisor=False`, `is_admin=False` |
| **Externo** | `type='externo'` |
| **Supervisor** | `type='internal'`, `is_supervisor=True` |
| **Admin Global** | `type='internal'`, `is_admin=True` |

### 2. `credential_local`
Credenciais de login para usuários externos (hash de senha).

### 3. `shared_area`
Áreas/pastas de compartilhamento no S3.

### 4. `areasupervisor`
Associação N:N entre áreas e supervisores.

### 5. `restricted_file`
Metadados dos arquivos armazenados no S3.

### 6. `share`
Compartilhamentos de arquivos com usuários externos.

### 7. `share_file`
Associação N:N entre shares e arquivos.

### 8. `token_access`
Tokens OTP e de acesso para usuários externos.

### 9. `audit`
Logs de auditoria de todas as ações do sistema.

### 10. `notification`
Notificações in-app para usuários.

### 11. `email_log`
Rastreamento de emails enviados pelo sistema (SES).

### 12. `session_token`
Tokens de sessão (refresh e reset de senha).

### 13. `support_registration`
Registros de cadastros feitos pelo time de suporte.

### 14. `support_audit`
Auditoria de ações do time de suporte.

## ENUMs Criados

| ENUM | Valores |
|------|---------|
| `usertype` | `externo`, `internal` |
| `sharestatus` | `pendente`, `aprovado`, `rejeitado`, `ativo`, `concluido`, `expirado`, `cancelado` |
| `consumptionpolicy` | `apos_todos`, `apos_primeiro` |
| `tokentype` | `otp`, `access` |
| `auditlevel` | `info`, `success`, `warning`, `error` |
| `notificationtype` | `info`, `success`, `warning`, `error`, `approval`, `rejection`, `download`, `expiration` |
| `notificationpriority` | `low`, `medium`, `high`, `urgent` |
| `emailstatus` | `pending`, `queued`, `sent`, `delivered`, `opened`, `clicked`, `bounced`, `complained`, `failed` |
| `emailtype` | `otp_verification`, `share_notification`, `share_approved`, `share_rejected`, `download_complete`, `expiration_warning`, `password_reset`, `welcome`, `support_notification` |
| `sessiontokentype` | `refresh`, `reset` |
| `supportstatus` | `ativo`, `pendente`, `inativo`, `cancelado` |
| `supportaction` | `CADASTRO`, `REATIVACAO`, `INATIVACAO`, `ALTERACAO`, `CONSULTA` |

## Troubleshooting

### Erro: "Target database is not up to date"

```bash
alembic stamp head  # Marca como atualizado
```

### Erro: "Can't locate revision"

```bash
alembic history --verbose  # Ver histórico completo
alembic stamp base         # Resetar para base
alembic upgrade head       # Aplicar todas
```

### Erro de conexão

Verifique se `DATABASE_URL` está correta e o banco está acessível.

```bash
# Testar conexão
psql $DATABASE_URL -c "SELECT 1"
```
