# Manual de Implementação CAv4 — Petrobras

Este manual tem como objetivo guiar desenvolvedores Python na integração de suas aplicações com o CAv4 (Controle de Acesso Corporativo v4) da Petrobras. O CAv4 oferece autenticação SSO via OIDC/OAuth2 e APIs REST para consulta de grupos, permissões e dados cadastrais de usuários.

## 1. Visão Geral

### Pré-condições
Para utilizar este manual, o desenvolvedor deve possuir:
- Registro da aplicação no CAv4 com `CLIENT_ID` e `CLIENT_SECRET`.
- URL base da API (`CA_API_BASE_URL`).
- `OIDC_DISCOVERY_URL` do provedor.
- Acesso à rede interna da Petrobras.

### Fluxo de Integração
A integração com o CAv4 ocorre em duas fases principais, com uma fase opcional:

1.  **FASE 1 — Autenticação OIDC**: Realiza o login SSO via CAv4 para obter o `access_token` e o `userLogin` (matrícula).
2.  **FASE 2 — Consultas às APIs**: Utiliza o `access_token` como `Bearer` para chamar a User API e a Admin API do CAv4.
3.  **FASE 3 (opcional) — Microsoft Graph**: Usa o e-mail obtido do CAv4 para consultar o Entra ID.

### Identidade do Usuário: `userLogin` vs. E-mail
É crucial notar que o CAv4 identifica o usuário pela **MATRÍCULA** (ex: "GFZ3"), disponível na claim `user_login` do token. O e-mail é retornado nos Detalhes do Usuário (Admin API) e serve como ponte para o Microsoft Graph.

## 2. Passo 1 — Configurar o Ambiente

### Instalar Dependências
Utilize `pip` ou `uv` para instalar as bibliotecas necessárias:

```bash
# Com pip:
pip install httpx python-jose[cryptography] python-dotenv

# Com uv (recomendado):
uv add httpx "python-jose[cryptography]" python-dotenv

# Para SSL com truststore do SO (recomendado na rede Petrobras):
pip install truststore
```

### Arquivo `.env`
Crie um arquivo `.env` na raiz do backend da sua aplicação com as seguintes variáveis. **Nunca commite o `CLIENT_SECRET`**.

```ini
# === IDENTIDADE DA APLICAÇÃO ===
CA_CLIENT_ID=<seu_client_id>
CA_CLIENT_SECRET=<seu_client_secret>
CA_REDIRECT_URI=http://localhost:8000/auth/callback
CA_SCOPES=openid profile

# === ENDPOINTS OIDC ===
OIDC_DISCOVERY_URL=https://<ca-host>/.well-known/openid-configuration
# Alternativa (se não houver discovery):
# OIDC_AUTHORIZATION_ENDPOINT=https://<ca-host>/auth
# OIDC_TOKEN_ENDPOINT=https://<ca-host>/token
# OIDC_JWKS_URI=https://<ca-host>/jwks

# === USER/ADMIN API DO CAv4 ===
CA_API_BASE_URL=https://ca-dsv.petrobras.com.br

# === SSL (rede corporativa) ===
CA_SSL_USE_TRUSTSTORE=true
# CA_SSL_CERT_FILE=C:/certs/petrobras-ca.pem  # alternativa
# CA_SSL_VERIFY=false  # SOMENTE EM DSV, nunca em HOM/PROD

# === MICROSOFT GRAPH (opcional) ===
ENTRA_TENANT_ID=<tenant_id>
ENTRA_CLIENT_ID=<client_id>
ENTRA_CLIENT_SECRET=<client_secret>
```

## 3. Passo 2 — Implementar o Fluxo OIDC

O CAv4 utiliza OpenID Connect (OIDC) com PKCE (Proof Key for Code Exchange). A aplicação gera um `code_verifier` e `code_challenge` localmente, redireciona o usuário para o CAv4, recebe o `code` de retorno e o troca pelo `access_token`.

### Gerar PKCE e Construir URL de Autorização

Crie um arquivo `oidc.py` com as seguintes funções:

```python
# oidc.py
import secrets, hashlib, base64, httpx

def generate_pkce() -> tuple[str, str]:
    code_verifier = secrets.token_urlsafe(96)
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return code_verifier, code_challenge

async def get_authorization_url(
    discovery_url: str, client_id: str,
    redirect_uri: str, state: str,
    nonce: str, code_challenge: str
) -> str:
    async with httpx.AsyncClient() as c:
        cfg = (await c.get(discovery_url)).json()
    auth_ep = cfg["authorization_endpoint"]
    return (
        f"{auth_ep}?client_id={client_id}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code&scope=openid profile"
        f"&state={state}&nonce={nonce}"
        f"&code_challenge={code_challenge}"
        f"&code_challenge_method=S256"
    )
```

### Trocar o `code` pelo `access_token`

Adicione a seguinte função ao `oidc.py`:

```python
async def exchange_code(
    token_endpoint: str, code: str,
    code_verifier: str, client_id: str,
    client_secret: str, redirect_uri: str
) -> dict:
    async with httpx.AsyncClient() as c:
        resp = await c.post(token_endpoint, data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": client_id,
            "client_secret": client_secret,
            "code_verifier": code_verifier,
        })
    resp.raise_for_status()
    return resp.json()
    # Retorna: { "access_token": "...", "id_token": "...", "refresh_token": "..." }
```

### Extrair o `userLogin` das Claims

Adicione a seguinte função ao `oidc.py` para extrair a matrícula do usuário:

```python
def extract_user_login(claims: dict) -> str | None:
    # Tenta as claims que contêm a matrícula
    for key in ("user_login", "login", "samaccountname",
                "onpremisesamaccountname"):
        if v := claims.get(key):
            return str(v)
    # Fallback: parte local do e-mail (pode falhar)
    for key in ("preferred_username", "upn", "email", "sub"):
        if v := claims.get(key):
            return str(v).split("@")[0]
    return None
```

### Rota de Login (FastAPI)

Crie um arquivo `auth.py` para as rotas de autenticação:

```python
# auth.py
from fastapi import APIRouter
from fastapi.responses import RedirectResponse
import secrets, os
from .oidc import generate_pkce, get_authorization_url, exchange_code, extract_user_login # Assumindo que oidc.py está no mesmo pacote

router = APIRouter(prefix="/auth")

@router.get("/login")
async def login():
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    code_verifier, code_challenge = generate_pkce()
    # Salve state, nonce e code_verifier em store temporário (ex: sessão, cache)
    url = await get_authorization_url(
        discovery_url=os.getenv("OIDC_DISCOVERY_URL"),
        client_id=os.getenv("CA_CLIENT_ID"),
        redirect_uri=os.getenv("CA_REDIRECT_URI"),
        state=state, nonce=nonce,
        code_challenge=code_challenge
    )
    return RedirectResponse(url, status_code=302)

@router.get("/callback")
async def callback(code: str, state: str):
    # 1. Valide o state (anti-CSRF) - compare com o salvo no store temporário
    # 2. Recupere code_verifier do store temporário
    # 3. Troque o code pelo token
    # Exemplo de como obter token_endpoint (deve ser do discovery_url)
    # cfg = (await httpx.AsyncClient().get(os.getenv("OIDC_DISCOVERY_URL"))).json()
    # token_endpoint = cfg["token_endpoint"]
    # tokens = await exchange_code(
    #     token_endpoint=token_endpoint, code=code,
    #     code_verifier=code_verifier_recuperado,
    #     client_id=os.getenv("CA_CLIENT_ID"),
    #     client_secret=os.getenv("CA_CLIENT_SECRET"),
    #     redirect_uri=os.getenv("CA_REDIRECT_URI")
    # )
    # access_token = tokens["access_token"]
    # 4. Valide id_token via JWKS (necessita de implementação de validação JWT)
    # 5. Extraia userLogin
    # user_login = extract_user_login(claims_do_id_token)
    # return {"user_login": user_login, "access_token": access_token}
    return {"message": "Callback implementado parcialmente. Validação e extração de token pendentes."}
```

## 4. Passo 3 — Chamar as APIs do CAv4

Com o `access_token` em mãos, utilize-o como `Bearer` em todas as chamadas à User API e à Admin API. Todas as chamadas são `GET` e não exigem corpo.

### Cliente Python (`ca_client.py`)

Crie um arquivo `ca_client.py` com a classe `CAClient`:

```python
from urllib.parse import quote
import httpx

class CAClient:
    def __init__(self, access_token: str, base_url: str,
                 ssl_verify=True):
        self.token = access_token
        self.base = base_url.rstrip("/")
        self.ssl = ssl_verify

    def _h(self): # headers
        return {"Authorization": f"Bearer {self.token}",
                "Accept": "application/json"}

    def _e(self, v): # url-encode
        return quote(v, safe="")

    async def get(self, path):
        url = f"{self.base}{path}"
        async with httpx.AsyncClient(
            timeout=15, verify=self.ssl) as c:
            r = await c.get(url, headers=self._h())
        r.raise_for_status()
        return r.json() if r.content else None

    # ── User API ─────────────────────────────────────────
    async def user_groups(self, login):
        return await self.get(
            f"/api/users/{self._e(login)}/user-groups")

    async def information_values(self, login):
        return await self.get(
            f"/api/users/{self._e(login)}/information-values")

    # ── Admin API ────────────────────────────────────────
    async def admin_details(self, login):
        return await self.get(
            f"/api/admin/users/{self._e(login)}")

    async def admin_enterprise_groups(self, login):
        return await self.get(
            f"/api/admin/users/{self._e(login)}/enterprise-groups")

    async def admin_roles(self, login):
        return await self.get(
            f"/api/admin/users/{self._e(login)}/roles")
```

### Uso do Cliente

Exemplo de como utilizar o `CAClient` após a autenticação:

```python
import os
# ... (código de autenticação e obtenção de tokens)

ca = CAClient(
    access_token=tokens["access_token"],
    base_url=os.getenv("CA_API_BASE_URL"),
    ssl_verify=True  # ou caminho do .pem
)

# Consultas disponíveis:
groups      = await ca.user_groups(user_login)
info_vals   = await ca.information_values(user_login)
details     = await ca.admin_details(user_login)
ent_groups  = await ca.admin_enterprise_groups(user_login)
roles       = await ca.admin_roles(user_login)

# Extrair e-mail dos detalhes (para usar com Graph):
email = next(
    (details[k] for k in ("email","mail","userPrincipalName","upn")
     if k in details and "@" in str(details[k])),
    None
)
```

## 5. Referência Rápida dos Endpoints

A Tabela 1 resume os endpoints disponíveis no CAv4 e no Microsoft Graph:

| # | API        | Endpoint                                      | Retorna                               |
|---|------------|-----------------------------------------------|---------------------------------------|
| 1 | User API   | `GET /api/users/{login}/user-groups`          | Grupos do usuário na aplicação        |
| 2 | User API   | `GET /api/users/{login}/information-values`   | Valores de informação autorizados     |
| 3 | Admin API  | `GET /api/admin/users/{login}`                | Dados cadastrais, lotação, gerente    |
| 4 | Admin API  | `GET /api/admin/users/{login}/enterprise-groups` | Grupos corporativos (empresa)         |
| 5 | Admin API  | `GET /api/admin/users/{login}/roles`          | Papéis/perfis do usuário              |
| 6 | Graph      | `GET /v1.0/users/{upn}`                       | Perfil completo no Entra ID           |
| 7 | Graph      | `GET /v1.0/users/{upn}/manager`               | Gerente/supervisor direto             |
| 8 | Graph      | `GET /v1.0/users/{upn}/photo/$value`          | Foto (bytes binários)                 |
| 9 | Graph      | `GET /v1.0/users/{upn}/directReports`         | Subordinados diretos                  |
| 10| Graph      | `GET /v1.0/users/{upn}/memberOf`              | Grupos e equipes no Entra ID          |

**Base URLs:**
- User API e Admin API: `{CA_API_BASE_URL}` (ex: `https://ca-dsv.petrobras.com.br`)
- Microsoft Graph: `https://graph.microsoft.com/v1.0`

**Autenticação**: `Authorization: Bearer {access_token}` em todas as chamadas.

## 6. Passo 4 — Configurar SSL na Rede Corporativa

A rede Petrobras utiliza uma CA raiz interna que não está presente no bundle padrão do `certifi`. Existem três opções para configurar o SSL:

### Opção A — Truststore do SO (Recomendada)

```python
import ssl, truststore
import httpx

ctx = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)

# Use ctx no httpx:
async with httpx.AsyncClient(verify=ctx) as client:
    resp = await client.get(url, headers=headers)
```

### Opção B — Bundle `.pem` Customizado

Exporte o certificado da CA interna e configure:

```python
import httpx

CA_SSL_CERT_FILE = "/caminho/petrobras-ca.pem"

async with httpx.AsyncClient(verify=CA_SSL_CERT_FILE) as client:
    resp = await client.get(url, headers=headers)
```

### Opção C — Desabilitar Verificação (APENAS EM DSV)

**⚠ NUNCA USE EM HOM/PROD.** Desabilitar a verificação TLS expõe a aplicação a ataques man-in-the-middle. Use esta opção **SOMENTE** em ambiente de desenvolvimento (DSV) quando não for possível configurar o certificado.

```python
import httpx

# SOMENTE DSV:
async with httpx.AsyncClient(verify=False) as client:
    resp = await client.get(url, headers=headers)
```

## 7. Passo 5 — Tratamento de Erros

A Tabela 2 detalha os códigos de erro comuns do CAv4 e suas soluções:

| HTTP | Código            | Causa                                   | Solução                                        |
|------|-------------------|-----------------------------------------|------------------------------------------------|
| 401  | `CA_TOKEN_INVALID`| Token expirado ou inválido              | Refaça o login; verifique os scopes            |
| 403  | `CA_ACCESS_DENIED`| Sem autorização para o recurso          | Verifique permissões no CA                     |
| 404  | `CA_NOT_FOUND`    | `UserLogin` ou recurso inexistente      | Confirme o `userLogin` extraído do token       |
| 5xx  | `CA_SERVER_ERROR` | Falha interna no CA                     | Tente novamente; acione o time do CA           |
| 503  | `CONFIG_ERROR`    | Variável de ambiente ausente            | Preencha as variáveis no `.env`                |

Exemplo de função para tratamento de respostas:

```python
import httpx

def handle_response(resp: httpx.Response):
    match resp.status_code:
        case 401:
            raise PermissionError("Token inválido (401). Refaça o login.")
        case 403:
            raise PermissionError("Acesso negado (403).")
        case 404:
            raise ValueError("Recurso não encontrado (404).")
        case s if s >= 500:
            raise RuntimeError(f"Erro interno do CA ({s}).")
    resp.raise_for_status()
    return resp.json() if resp.content else None
```

## 8. Passo 6 — Estrutura Recomendada do Projeto

Uma estrutura de projeto recomendada para a aplicação seria:

```
minha-app/
├── backend/
│   ├── main.py          # Entrypoint FastAPI
│   ├── auth.py          # Rotas /auth/login e /auth/callback
│   ├── oidc.py          # Fluxo OIDC (PKCE, exchange_code, JWKS)
│   ├── ca_client.py     # Classe CAClient (User + Admin API)
│   ├── graph_client.py  # Cliente Microsoft Graph (opcional)
│   ├── config.py        # Configurações via os.getenv()
│   └── .env             # Variáveis de ambiente (NÃO commitar)
├── .gitignore           # Inclua .env e *.pem
└── pyproject.toml
```

**⚠ Segurança — nunca commite segredos.** Adicione `.env`, `*.pem` e qualquer arquivo com `CLIENT_SECRET` ao `.gitignore`. Em ambientes de Homologação (HOM) e Produção (PROD), utilize um Secrets Manager (ex: Azure Key Vault) em vez de variáveis em arquivo.

## 9. Problemas Comuns

A Tabela 3 apresenta um diagnóstico rápido para problemas comuns:

| Sintoma               | Causa                                   | Solução                                                              |
|-----------------------|-----------------------------------------|----------------------------------------------------------------------|
| SSL Error no login    | CA interna não confiável no Python      | Use `truststore` ou `CA_SSL_CERT_FILE`                               |
| Callback nunca chega  | `CA_REDIRECT_URI` diverge do registrado | Ajuste a URI no CA e no `.env`                                       |
| 403 no Graph          | App sem permissão de aplicação          | Conceda `User.Read.All` com admin consent                            |
| 404 nos endpoints     | `userLogin` incorreto                   | Verifique claim `user_login` no `id_token`                           |
| Token expira rápido   | Vida curta do `access_token`            | Implemente renovação via `refresh_token`                             |
| `Import error (uv)`   | `uv` não instalado                      | Execute: `pip install uv`                                            |
