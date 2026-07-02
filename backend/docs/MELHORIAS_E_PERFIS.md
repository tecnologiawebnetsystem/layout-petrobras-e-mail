# CSA-Backend — Melhorias, Consolidações e Perfis de Acesso

> **Data de referência:** 2026-06-02  
> **Escopo:** diagnósticos reais observados no código atual. Sem especulações.

---

## Parte 1 — Problemas Diagnosticados e Oportunidades de Melhoria

---

### 1.1 Duplicidade de Rotas OTP / Autenticação Externa

**Problema:** Existem dois conjuntos paralelos de endpoints que executam o mesmo fluxo OTP externo, com nomenclaturas e contratos diferentes:

| Conjunto A (`/download`) | Conjunto B (`/auth/external`) |
|--------------------------|-------------------------------|
| `POST /download/verify` | `POST /auth/external/request-code` |
| `POST /download/authenticate` | `POST /auth/external/verify-code` |

Ambos emitem OTP via `token_service.issue_otp`, enviam e-mail via `send_otp_email` e retornam um `TokenAccess`. O frontend precisa manter dois fluxos alternativos em sincronia para o mesmo caso de uso.

**Impacto:** Bug-prone — uma mudança no rate-limit ou no formato do OTP precisa ser replicada nos dois conjuntos. Testes duplicados em `test_routes_download.py`.

**Melhoria:** Consolidar no conjunto `/download` (que já está acoplado ao `ExternalAccessContext`) e remover `/auth/external/*` ou transformá-lo em um re-export idêntico mapeado internamente.

---

### 1.2 Duplicidade de Listagem de Arquivos para o Externo

**Problema:** Também existem dois endpoints que listam arquivos disponíveis para download externo:

| Conjunto A (`/download`) | Conjunto B (`/external`) |
|--------------------------|--------------------------|
| `GET /download/files` | `GET /external/list-files` |

O conjunto `/external` usa `token` como **query param** e não usa `ExternalAccessContext`. O `/download` usa o `ExternalAccessContext` via header `Authorization: Bearer`. São dois contratos distintos para o mesmo recurso.

**Impacto:** O frontend (e o SDK externo) precisa decidir qual usar. O `/external/list-files` não aproveita o middleware de validação centralizado do `ExternalAccessContext`.

**Melhoria:** Deprecar `/external/list-files` e `/external/logout` (migrar para `/download`). Manter apenas um padrão de autenticação para externos.

---

### 1.3 `core/security.py` — Arquivo Stub Inativo

**Problema:** O arquivo `app/core/security.py` contém apenas `# autenticação (JWT / Cognito)` — uma linha de comentário. Toda a lógica de JWT está em `app/utils/session_jwt.py` e os guards estão em `app/utils/authz.py`. O módulo `app.core.security` é importado em `routes_support.py` (`from app.core.security import get_current_user_from_token`), causando **ImportError em produção** se esse endpoint for chamado.

**Impacto crítico:** `routes_support.py` usa `get_current_user_from_token` que não existe. O endpoint `/support/users` lança `ImportError`.

**Melhoria:** Substituir `from app.core.security import get_current_user_from_token` por `from app.utils.authz import get_current_user` em `routes_support.py`. Remover ou popular `core/security.py`.

---

### 1.4 `core/scheduler.py` — Arquivo Vazio

**Problema:** `app/core/scheduler.py` existe mas está vazio. Não há nenhum job agendado no sistema. Expiração de shares, limpeza de tokens e desativação de usuários externos são feitos de forma reativa (on-demand), não via scheduler.

**Impacto:** Tokens expirados e shares com prazo vencido permanecem no banco sem marcação proativa. A função `deactivate_external_if_no_active_share` é chamada apenas durante logout/verify, não periodicamente.

**Melhoria (quando priorizar):** Implementar jobs com APScheduler ou Celery Beat:
- Diariamente: varrer `Share` com `expires_at < now` e `status ∈ (APPROVED, ACTIVE)` → setar `EXPIRED`
- Semanalmente: limpar `TokenAccess` com `used=True` e `expires_at < now - 30d`
- Diariamente: desativar `User` externos sem share ativo

---

### 1.5 `routes_areas.py` — Sem Guarda de Autorização

**Problema:** As rotas de criação e encerramento de áreas (`POST /areas/`, `POST /areas/{id}/close`) não verificam se o usuário autenticado tem permissão para criar/fechar uma área de outro usuário. A `applicant_id` vem do `payload` (body da requisição), não do token JWT.

```python
# routes_areas.py — problema
area = SharedArea(
    applicant_id=payload.applicant_id,  # ← valor vem do cliente, não verificado
    ...
)
```

**Impacto:** Um usuário autenticado pode criar uma área em nome de outro usuário simplesmente passando outro `applicant_id`.

**Melhoria:** Derivar `applicant_id` do `get_current_user()` injetado via `Depends`, não do body.

---

### 1.6 Schemas Inline nos Routers (Violação de Organização)

**Problema:** Vários routers definem seus próprios schemas Pydantic inline (`class ShareCreateRequest`, `class LoginRequest`, `class ApproveRequest`, etc.) em vez de usar a pasta `schemas/`. Isso dificulta reuso e documentação centralizada.

Exemplos:
- `routes_shares.py` → `ShareCreateRequest`, `ShareCancelRequest`
- `routes_supervisor.py` → `ApproveRequest`, `RejectRequest`, `ExtendRequest`
- `routes_auth.py` → `LoginRequest`, `LoginResponse`, `ForgotPasswordRequest`, etc.
- `routes_emails.py` → `SendEmailRequest`, `OTPEmailRequest`, `LogExternalEmailRequest`

**Melhoria:** Mover schemas de request/response para os respectivos arquivos em `app/schemas/`.

---

### 1.7 Lógica de Negócio Dentro dos Routers

**Problema:** `routes_shares.py` realiza a criação do `Share` e associação de arquivos diretamente no router, duplicando lógica que também existe em `share_service.create_share`. O router decide quando chamar `get_or_create_external_user`, cria o objeto `Share`, itera `file_ids` e faz commit — tudo sem passar pelo service.

**Impacto:** `create_share` (service) e o endpoint `POST /shares/` têm divergências sutis (ex: tratamento do `consumption_policy`).

**Melhoria:** Delegar toda a criação ao `share_service.create_share`, passando apenas o payload. O router fica responsável apenas por autenticação e serialização da resposta.

---

### 1.8 `TypeUser` sem Enum para `support`

**Problema:** `routes_support.py` verifica `current_user.type != TypeUser.SUPPORT`, mas `TypeUser` no modelo `user.py` define apenas `EXTERNAL` e `INTERNAL`. Não existe `TypeUser.SUPPORT`.

**Impacto:** A comparação `TypeUser.SUPPORT` lança `AttributeError` em tempo de execução. O endpoint de suporte nunca funciona corretamente via esse guard.

**Melhoria (opções):**
- Adicionar `SUPPORT = "support"` ao `TypeUser` (solução mais limpa)
- Usar o campo `is_supervisor` existente como substituto temporário
- Criar campo `is_support: bool` no modelo `User` (preferível para controle granular)

---

### 1.9 `routes_audit.py` — Sem Restrição de Acesso Adequada

**Problema:** `GET /audit/logs` aceita `get_current_user` (qualquer usuário autenticado, incluindo externos). Um usuário externo com TokenAccess pode — em teoria — listar logs de auditoria passando qualquer `user_id`.

**Melhoria:** Restringir para `require_internal` ou `require_supervisor`. Aplicar escopo: usuário interno vê apenas seus próprios logs; supervisor vê os de seus supervisionados; admin vê todos (já existe em `/admin/logs`).

---

### 1.10 Refresh Token em Dois Lugares

**Problema:** O refresh de token existe em dois endpoints distintos com implementações separadas:
- `POST /auth/refresh` (em `routes_auth.py`) — lê `refresh_token` do **body JSON**
- `POST /auth/entra/refresh` (em `routes_entra_auth.py`) — lê do **header `X-Refresh-Token`**

O frontend precisa saber qual usar dependendo do modo de login.

**Melhoria:** Unificar em `POST /auth/refresh` aceitando tanto body quanto header, ou documentar claramente o contrato de cada fluxo.

---

### 1.11 `CORS allow_origins=["*"]` em Produção

**Problema:** `main.py` configura `allow_origins=["*"]` com comentário "Em producao, especificar origens permitidas". Isso nunca foi restringido.

**Impacto:** Qualquer origem pode fazer requisições autenticadas ao backend se obtiver um token válido.

**Melhoria:** Configurar `ALLOWED_ORIGINS` como variável de ambiente e passar para `allow_origins`.

---

## Parte 2 — Perfis de Acesso com Entra ID

> Esta seção propõe como evoluir o modelo de autorização do sistema aproveitando os dados já disponíveis via Microsoft Entra ID / Graph API.

---

### 2.1 Perfis Atuais

O sistema possui atualmente os seguintes perfis mapeados no banco:

| Perfil | Critério no banco | Quem pode fazer |
|--------|-------------------|-----------------|
| **Externo** | `type=EXTERNAL` | Receber e baixar arquivos via OTP |
| **Interno** | `type=INTERNAL` | Fazer upload, criar shares, ver histórico |
| **Supervisor** | `type=INTERNAL + is_supervisor=True` | Aprovar/rejeitar shares dos seus supervisionados |
| **Admin** | `type=INTERNAL + is_admin=True` | Visualizar tudo, promover usuários, painel global |

---

### 2.2 Problema Central: Aprovação Sempre Obrigatória

O fluxo atual exige que **todo** share passe por aprovação do supervisor antes de ser acessado pelo destinatário externo. Isso cria atrito desnecessário para usuários de confiança que já possuem delegação formal.

**Exemplo real:** Um gerente (cargo com is_supervisor=True) que precisa enviar um relatório de rotina a um parceiro externo deve aguardar a aprovação de outro supervisor — que frequentemente é ele mesmo.

---

### 2.3 Nova Prerrogativa: Liberação Direta por Cargo

#### Conceito

Certos perfis internos devem poder enviar arquivos **sem etapa de aprovação** (`Share` vai diretamente para `APPROVED` na criação). A elegibilidade pode ser determinada por:

1. **Cargo via Graph API** (`jobTitle` sincronizado no campo `job_title`)
2. **Grupo Entra ID** (grupos de segurança configuráveis via `ENTRA_AUTO_APPROVE_GROUP_IDS`)
3. **Flag explícita no banco** (`can_auto_approve: bool` no modelo `User`)

#### Modelo de Dados Proposto

```python
# Adição ao modelo User
can_auto_approve: bool = Field(default=False)
# True = o share criado por este usuário é aprovado automaticamente,
# sem depender de nenhum supervisor.
```

#### Critérios de Elegibilidade (por prioridade)

```
1. user.can_auto_approve == True  ← flag explícita (override manual pelo admin)
2. user.job_title ∈ CARGOS_AUTO_APROVACAO  ← lista configurável
3. Membro de grupo Entra ID em settings.entra_auto_approve_group_ids
```

Os cargos da lista podem incluir (configurável via env `AUTO_APPROVE_JOB_TITLES`):

```
gerente, diretor, superintendente, coordenador-geral, gerente-executivo
```

> **Nota:** Supervisores comuns (is_supervisor=True) **não** devem ter auto-aprovação por padrão. A prerrogativa é para cargos que já têm responsabilidade formal no envio, não para quem aprova os outros.

#### Fluxo Modificado

```
POST /shares/  ← criação de share

    ↓
resolve_approval_mode(user) → 'auto' | 'requires_supervisor'

    ↓ auto                            ↓ requires_supervisor
Share(status=APPROVED)           Share(status=PENDING)
expires_at = now + expiration_h  e-mail ao supervisor
issue_token_access()
e-mail ao destinatário externo
```

#### Implementação no Backend

**1. Atualizar `Settings` (`core/config.py`):**
```python
auto_approve_job_titles: list[str] = Field(
    default=["gerente", "diretor", "superintendente"],
    description="Cargos com liberação direta sem aprovação"
)
entra_auto_approve_group_ids: list[str] = Field(
    default=[],
    description="IDs de grupos Entra ID com auto-aprovação"
)
```

**2. Adicionar campo ao modelo `User`:**
```python
can_auto_approve: bool = Field(default=False)
# Sincronizado pelo entra_auth ao fazer login se o cargo/grupo se enquadrar
```

**3. Criar função em `auth_service.py`:**
```python
def resolve_auto_approve(user: User) -> bool:
    """
    Retorna True se o usuário pode criar shares sem aprovação do supervisor.
    Prioridade: flag explícita > cargo > grupo Entra ID.
    """
    if user.can_auto_approve:
        return True
    if user.job_title:
        title = user.job_title.lower()
        for cargo in settings.auto_approve_job_titles:
            if cargo.lower() in title:
                return True
    # Verificação de grupo é feita no login (sincronizada no campo can_auto_approve)
    return False
```

**4. Usar em `routes_shares.py`:**
```python
from app.services.auth_service import resolve_auto_approve

# Dentro do endpoint POST /shares/
auto_approve = resolve_auto_approve(user)

if auto_approve:
    share.status = ShareStatus.APPROVED
    share.expires_at = datetime.now(UTC) + timedelta(hours=payload.expiration_hours)
    share.approver_id = user.id  # auto-aprovado pelo próprio criador
    share.approved_at = datetime.now(UTC)
    share.approval_comments = "Aprovação automática por cargo/grupo"
    session.commit()
    # Emite TokenAccess e envia e-mail ao externo imediatamente
    issue_token_access(session, recipient, share, ...)
    background_tasks.add_task(send_share_approved_external_email, ...)
else:
    share.status = ShareStatus.PENDING
    session.commit()
    background_tasks.add_task(send_supervisor_approval_request_email, ...)
```

**5. Sincronizar `can_auto_approve` no callback Entra ID:**
```python
# Em routes_entra_auth.py — callback após Graph API
user.can_auto_approve = resolve_auto_approve_from_groups(
    entra_group_ids=user_groups,
    auto_approve_group_ids=settings.entra_auto_approve_group_ids
)
```

---

### 2.4 Perfis Completos Propostos

| Perfil | Critério | Permissões |
|--------|----------|------------|
| **Externo** | `type=EXTERNAL` | Download via OTP (read-only) |
| **Interno** | `type=INTERNAL` | Upload, criar shares (fluxo padrão com aprovação) |
| **Liberação Direta** | `INTERNAL + can_auto_approve=True` | Upload + criar shares **sem aprovação** |
| **Supervisor** | `INTERNAL + is_supervisor=True` | Aprovar/rejeitar shares dos supervisionados |
| **Supervisor com Liberação** | `INTERNAL + is_supervisor=True + can_auto_approve=True` | Tudo acima + auto-aprovação dos próprios shares |
| **Suporte** | `INTERNAL + is_support=True` (novo campo) | Cadastrar usuários externos via chamado |
| **Admin** | `INTERNAL + is_admin=True` | Acesso global, promover/rebaixar usuários, painel de métricas |

---

### 2.5 Sincronização via Entra ID no Login

Na sincronização do perfil Graph API (já feita em `enrich_graph_profile` + `sync_user_from_access`), adicionar:

```python
# Após obter jobTitle e groups do Graph API:

# 1. Resolver is_supervisor pelos grupos Entra configurados
user.is_supervisor = (
    any(gid in settings.entra_supervisor_group_ids for gid in user_groups)
    or any(title in (user.job_title or "").lower() for title in _SUPERVISOR_TITLES)
)

# 2. Resolver can_auto_approve pelos grupos ou cargos
user.can_auto_approve = (
    any(gid in settings.entra_auto_approve_group_ids for gid in user_groups)
    or any(title in (user.job_title or "").lower() for title in settings.auto_approve_job_titles)
)

# 3. Resolver is_support (grupo dedicado de suporte)
user.is_support = any(gid in settings.entra_support_group_ids for gid in user_groups)
```

Dessa forma, a cada login via Entra ID o perfil é re-derivado da fonte de verdade (Azure AD), sem depender de intervenção manual do admin — exceto para overrides pontuais via `is_admin=True` ou `can_auto_approve=True` definidos manualmente.

---

### 2.6 Visão de Fluxo Completo com os Novos Perfis

```
[Login via Entra ID]
      │
      └─ Sincroniza perfil do Graph API
             jobTitle, department, manager, groups
             ↓
             Resolve flags:
               is_supervisor      ← grupo supervisor OU cargo _SUPERVISOR_TITLES
               can_auto_approve   ← grupo auto-approve OU cargo settings.auto_approve_job_titles
               is_support         ← grupo suporte
               is_admin           ← mantido apenas via admin panel (não sincronizado por grupo)

[Criar Share]
      │
      ├─ resolve_auto_approve(user) == True?
      │         ↓ Sim                    ↓ Não
      │   Share(APPROVED)           Share(PENDING)
      │   TokenAccess emitido       → e-mail supervisor
      │   e-mail ao externo
      │
      └─ Supervisor aprova
               ↓
         Share(APPROVED) → TokenAccess → e-mail externo

[Acesso Externo]
      │
      ├─ OTP verificado → TokenAccess
      └─ Download dos arquivos
```

---

### 2.7 Impacto nas Migrações de Banco

Para implementar, serão necessárias as seguintes migrações Alembic:

```sql
-- 1. Novo campo no modelo User
ALTER TABLE "user" ADD COLUMN can_auto_approve BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Novo campo para suporte (se optar por is_support ao invés de TypeUser.SUPPORT)
ALTER TABLE "user" ADD COLUMN is_support BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Novo campo em Share para rastrear auto-aprovação
ALTER TABLE share ADD COLUMN auto_approved BOOLEAN NOT NULL DEFAULT FALSE;
```

---

### 2.8 Configurações de Ambiente Adicionais

```bash
# Grupos Entra ID com auto-aprovação direta
ENTRA_AUTO_APPROVE_GROUP_IDS=["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]

# Grupos Entra ID do time de suporte
ENTRA_SUPPORT_GROUP_IDS=["xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"]

# Cargos com auto-aprovação (separados por vírgula)
AUTO_APPROVE_JOB_TITLES=gerente,diretor,superintendente

# Se omitido, usa os padrões definidos em Settings
```

---

## Resumo Executivo

| # | Tipo | Problema | Criticidade | Esforço |
|---|------|----------|-------------|---------|
| 1.1 | Duplicidade | Dois fluxos OTP paralelos | Médio | Baixo |
| 1.2 | Duplicidade | Dois endpoints de listagem de arquivos externos | Médio | Baixo |
| 1.3 | Bug crítico | `core/security.py` importado mas vazio → ImportError em `/support` | **Alto** | Mínimo |
| 1.4 | Dívida técnica | Scheduler vazio, expiração reativa | Baixo | Alto |
| 1.5 | Segurança | `routes_areas.py` sem guard de ownership | **Alto** | Baixo |
| 1.6 | Organização | Schemas Pydantic inline nos routers | Baixo | Médio |
| 1.7 | Arquitetura | Lógica de negócio no router de shares | Médio | Médio |
| 1.8 | Bug crítico | `TypeUser.SUPPORT` não existe no enum | **Alto** | Mínimo |
| 1.9 | Segurança | Logs de auditoria acessíveis por externos | **Alto** | Baixo |
| 1.10 | UX/Contrato | Dois endpoints de refresh com contratos distintos | Médio | Baixo |
| 1.11 | Segurança | CORS `allow_origins=["*"]` em produção | **Alto** | Mínimo |
| 2.x | Feature | Liberação direta por cargo/grupo Entra ID | — | Médio |
