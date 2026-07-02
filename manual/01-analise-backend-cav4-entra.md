# Análise do Back-end — Autenticação CAv4 e Entra ID

> Documento de análise técnica gerado a partir da leitura completa da pasta `backend/`
> focada nos fluxos **CAv4 (OIDC/PKCE)** e **Microsoft Entra ID (MSAL/Graph)**.
> Objetivo: apontar o que está **errado**, o que é **risco de segurança**, o que está
> **correto** e o que pode ser **melhorado / corrigido**.

## Arquivos analisados

| Arquivo | Responsabilidade |
|---|---|
| `app/api/v1/routes_cav4_auth.py` | Endpoints CAv4 (login, callback, token, refresh, logout, session-check) |
| `app/api/v1/routes_entra_auth.py` | Endpoints Entra ID (token MSAL, refresh, logout, me, session-check, sync-group) |
| `app/services/cav4_auth_service.py` | OIDC discovery, PKCE, troca de código, validação JWT, roles CAv4 |
| `app/services/auth_service.py` | Emissão de JWT interno, sync de usuário, provisionamento de gestor |
| `app/services/group_sync_service.py` | Sincronização de usuários via grupo Entra (Graph API) |
| `app/utils/session_jwt.py` | Criação/decodificação do JWT interno (HS256) |
| `app/utils/authz.py` | `get_current_user`, guards `require_admin/supervisor/internal` |
| `app/core/config.py` | Settings (env vars) |
| `app/main.py` | Registro de routers, CORS, middleware |

---

## 1. Erros / Bugs (quebram ou podem quebrar em runtime)

### 1.1 [CRÍTICO] Imports quebrados em `routes_entra_auth.py`
O arquivo importa de `app.services.auth_service`:

```python
from app.services.auth_service import (
    is_user_authorized,      # NÃO EXISTE em lugar nenhum do projeto
    sync_user_from_group,    # existe em group_sync_service.py, NÃO em auth_service
    bulk_sync_group_members, # existe em group_sync_service.py, NÃO em auth_service
)
```

- `is_user_authorized` **não está definida em nenhum módulo** (confirmado por busca global).
- `sync_user_from_group` e `bulk_sync_group_members` estão em `group_sync_service.py`, não em `auth_service.py`.

**Consequência:** se `routes_entra_auth` fosse incluído, o `import` derrubaria a aplicação inteira no startup (`ImportError`).

**Situação atual:** o router **não está registrado** em `main.py` — ou seja, é **código morto** que dá falsa impressão de que o login Entra funciona pelo backend. Isso é uma fonte de confusão grave.

**Correção sugerida:**
- **Decisão A (recomendada):** como o `config.py` documenta *"Entra ID removido em Fase 3. Usar CAv4"*, **remover** `routes_entra_auth.py` e `group_sync_service.py` (ou movê-los para uma pasta `legacy/` fora do pacote) para eliminar código morto e imports quebrados.
- **Decisão B:** se o Entra ID ainda for necessário, corrigir os imports (`from app.services.group_sync_service import ...`), **implementar** `is_user_authorized`, registrar o router no `main.py` e criar as configs ausentes (ver 1.2).

### 1.2 [CRÍTICO] Configurações Entra ausentes em `Settings`
`routes_entra_auth.py` e `group_sync_service.py` referenciam settings que **não existem** em `config.py`:

```python
settings.entra_required_group_id       # AttributeError
settings.entra_required_group_name     # AttributeError
settings.entra_group_sync_strategy     # AttributeError
settings.entra_supervisor_group_ids    # AttributeError
```

O `config.py` define apenas `entra_tenant_id`, `entra_client_id`, `entra_client_secret` e os `*_purview`. Qualquer chamada a esses endpoints resultaria em `AttributeError` (HTTP 500).

**Correção:** se mantiver o Entra, adicionar em `Settings`:
```python
entra_required_group_id: str | None = None
entra_required_group_name: str = "Grupo Autorizado"
entra_group_sync_strategy: str = "block_login"  # "deactivate" | "block_login"
entra_supervisor_group_ids: List[str] = []
```

### 1.3 Indentação inconsistente em `add_role_to_user_with_fallback`
`cav4_auth_service.py`, linhas ~607-609: o bloco `try` usa 10 espaços de indentação (o padrão do projeto é 4). Funciona por acaso, mas é frágil:

```python
    try:
          assigned = add_role_to_user(...)   # 10 espaços
          return True, "user_token" if assigned else "user_token_already_assigned"
```

Além disso `return True, "x" if cond else "y"` depende de precedência de operador (é interpretado como `return (True, ("x" if cond else "y"))`). Está correto, mas é ilegível. Recomenda-se parênteses explícitos:
```python
return True, ("user_token" if assigned else "user_token_already_assigned")
```

### 1.4 `@app.on_event("startup")` obsoleto + `lifespan=None`
`main.py` usa `@app.on_event("startup")` (deprecado no FastAPI atual) e ao mesmo tempo passa `lifespan=None` ao construtor. Migrar para o padrão `lifespan` (context manager) evita warnings e comportamento indefinido em versões novas.

### 1.5 `AuthFacade.mode` não cobre "entra"
`auth_service.py`:
```python
mode: Literal["local", "cav4"] = settings.auth_mode or "local"
```
Se `AUTH_MODE=entra`, o valor viola o `Literal` (inconsistência de tipo/validação). Alinhar o `Literal` com os modos realmente suportados.

---

## 2. Riscos de Segurança

### 2.1 [ALTO] `jwt_secret` com default inseguro
`config.py`:
```python
jwt_secret: str = "dev-secret-local-insecure-change-in-prod"
```
Se a variável de ambiente não for injetada em produção, **todos os JWTs internos passam a ser assináveis/forjáveis** por qualquer um que conheça o default (que está no código-fonte). Como o JWT é HS256, o segredo é a única barreira.

**Correção:** falhar explicitamente quando `debug=False` e o segredo não foi fornecido:
```python
@model_validator(mode="after")
def _require_prod_secret(self):
    if not self.debug and self.jwt_secret.startswith("dev-secret"):
        raise RuntimeError("JWT_SECRET obrigatório em produção.")
    return self
```

### 2.2 [ALTO] State/nonce/PKCE do CAv4 em memória de processo
`routes_cav4_auth.py`:
```python
_PENDING_AUTH: dict[str, dict[str, str | datetime]] = {}
```
O `state`, `nonce` e `code_verifier` do fluxo OIDC ficam num **dict global em memória**. Em produção (ECS com mais de 1 task, ou Gunicorn/Uvicorn com múltiplos workers), o `/callback` pode cair em **outro processo** que não tem o `state` → login falha de forma intermitente ("State inválido ou expirado"). Também não sobrevive a restart/deploy.

**Correção:** persistir o pending auth em store compartilhado (Redis/Upstash, ou tabela no banco com TTL), OU trafegar o `code_verifier`/`nonce` em **cookie assinado httponly** setado no `/login` e lido no `/callback`.

### 2.3 [MÉDIO] `decode_app_jwt` usa `print` e engole exceções
`session_jwt.py`:
```python
except Exception as e:
    print(f"[ERRO JWT]: {str(e)}")
    return None
```
- `print` não é logging estruturado (não vai para o coletor de logs corretamente, sem nível/timestamp).
- Não diferencia **token expirado** de **token inválido** — dificulta auditoria e o cliente não recebe o motivo correto.

**Correção:** usar `logging.getLogger(__name__).warning(...)` e, idealmente, tratar `ExpiredSignatureError` separadamente. Nunca logar o token em si.

### 2.4 [MÉDIO] `get_client_credentials_token` usa scopes de usuário
`cav4_auth_service.py`:
```python
scopes = settings.ca_scopes or "openid profile"
payload = {"grant_type": "client_credentials", ..., "scope": scopes}
```
No fluxo **client_credentials** (máquina-a-máquina) não se usam scopes de usuário como `openid`/`profile`; normalmente é `<resource>/.default`. Com o scope errado o IdP pode recusar → a função retorna `None` silenciosamente e o fallback de atribuição de papel falha sem diagnóstico claro.

### 2.5 [MÉDIO] Foto de perfil como data URI base64 sem limite consistente
No Entra (`_enrich_from_graph`) a foto vira `data:image/jpeg;base64,...` sem truncamento. Em `group_sync_service` trunca a 500 chars (o que **corromperia** a imagem). Guardar imagens grandes em coluna de usuário e trafegá-las no login infla payloads e o banco.

**Correção:** armazenar a foto no S3/Blob e persistir apenas a URL; ou servir via endpoint dedicado com cache.

### 2.6 [BAIXO] `verify=False` de TLS permitido em debug
`_get_ssl_verify` permite `verify=False` quando `debug=True`. O fail-safe fora de debug está correto. Manter apenas garantindo que **produção nunca rode com `debug=True`**.

### 2.7 [BAIXO] Middleware de log imprime IP do cliente via `print`
`main.py` faz `print(f"[REQ] ... from {request.client.host}")`. Além de `print` (ver 2.3), logar IP em texto em toda request pode ser indesejado por privacidade/volume. Usar logging com nível configurável.

### 2.8 [INFO] Refresh token rotation sem detecção de replay
O refresh rotation está implementado (revoga o atual e emite novo — bom). Porém, se um refresh **já revogado** for reapresentado (possível vazamento/replay), o sistema apenas rejeita aquele token; não revoga **toda a família** de tokens do usuário. Boa prática OWASP: ao detectar reuso de refresh revogado, invalidar todas as sessões do usuário.

---

## 3. O que está CORRETO (pontos positivos)

- **CAv4 (fluxo principal) está bem construído:** Authorization Code + PKCE, `state` e `nonce` validados, `code_challenge_method=S256`.
- **Validação de `id_token`** com JWKS (`RS256`), verificação de `issuer`, `audience` e `exp`, com `leeway` configurável — correto e completo.
- **JWKS com cache** (`PyJWKClient(cache_jwk_set=True, lifespan=3600)`) — evita buscar as chaves a cada login.
- **Discovery OIDC cacheado** em memória — reduz round-trips.
- **Refresh tokens armazenados como hash SHA-256** (nunca em texto puro) — correto.
- **`get_current_user`** valida presença do token, `issuer` (`secure-share`), expiração explícita e status ativo do usuário — sólido.
- **`/docs` desabilitado quando `debug=False`** — bom para produção.
- **CORS** trata corretamente o caso proibido `allow_origins=["*"]` + `allow_credentials=True` e exige configuração explícita em produção.
- **Enriquecimento via Graph/CAv4 é *fail-open*** (não bloqueia o login se a fonte de dados estiver indisponível) — decisão adequada para disponibilidade.
- **Auditoria** (`log_event`) presente em todos os eventos sensíveis (login, refresh, logout, bloqueios).

---

## 4. Plano de Correção Priorizado

| Prioridade | Item | Ação |
|---|---|---|
| P0 | 1.1 / 1.2 | Decidir destino do Entra ID: **remover** o código morto **ou** corrigir imports + adicionar configs e registrar router. |
| P0 | 2.1 | Impedir boot em produção com `jwt_secret` default. |
| P1 | 2.2 | Mover pending-auth CAv4 para store compartilhado ou cookie assinado. |
| P1 | 2.4 | Corrigir scope do `client_credentials` (`.default`). |
| P2 | 2.3 / 2.7 | Trocar `print` por `logging`; tratar expirado vs inválido. |
| P2 | 2.5 | Externalizar foto de perfil (S3/Blob + URL). |
| P3 | 1.3 / 1.4 / 1.5 | Limpezas de indentação, `lifespan`, `Literal`. |
| P3 | 2.8 | Revogar família de tokens em reuso de refresh. |

---

## 5. Resumo executivo

O fluxo **CAv4 é o caminho de produção e está tecnicamente correto e seguro** nos pontos centrais (PKCE, validação de JWT, hashing de refresh, auditoria). Os problemas mais graves são:

1. **Código Entra ID morto e quebrado** (imports inexistentes + configs ausentes) que precisa ser **removido ou consertado** para não gerar confusão e risco.
2. **`jwt_secret` default inseguro** — deve falhar em produção.
3. **State CAv4 em memória** — não escala horizontalmente e causa falhas intermitentes de login.

Resolvendo esses três, o back-end de autenticação fica consistente, escalável e seguro.
