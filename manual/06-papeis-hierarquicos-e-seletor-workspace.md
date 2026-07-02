# 06 — Papéis Hierárquicos e Seletor de Workspace (Troca de Persona)

> **Objetivo:** ao logar via CAv4, o usuário vê um *loading* que apresenta seus acessos e,
> em seguida, uma tela para **escolher com qual perfil quer entrar** (Admin, Supervisor ou
> Remetente). A persona escolhida pode ser **trocada a qualquer momento, sem novo login**.
>
> **Escopo deste documento:** apenas explicação (o quê e onde mexer). Nenhum código foi alterado.
> **Externo** fica de fora — ele nunca escolhe persona, tem jornada própria via OTP.

---

## 1. A hierarquia que você quer

| Papel CAv4 | Personas que pode assumir |
|------------|---------------------------|
| **admin** | Admin, Supervisor, Remetente |
| **supervisor** | Supervisor, Remetente |
| **remetente (internal)** | Remetente |

Regra: **cada nível inclui os de baixo**. Isso se chama *papéis hierárquicos* (ou "role inheritance").
A ideia central: separar dois conceitos que hoje estão misturados no código:

- **`role` (papel máximo)** — o que o CAv4 diz que a pessoa É. Vem do back-end, imutável na sessão.
- **`workspace` / persona ativa** — o "chapéu" que a pessoa ESCOLHE usar agora. Muda sem logout.

---

## 2. O que existe hoje (e por que precisa mudar)

Arquivo: `backend/app/services/cav4_auth_service.py` → `resolve_access_from_cav4_roles()` (linha 446).

Hoje a função retorna **um único papel**, o mais alto:

\`\`\`python
if role_set & admin_names:      return {"role": "admin", "is_admin": True, ...}
if role_set & supervisor_names: return {"role": "supervisor", "is_supervisor": True, ...}
if role_set & internal_names:   return {"role": "internal", ...}
\`\`\`

**Problema:** um admin recebe só `role: "admin"`. O front não sabe que ele *também* pode agir
como supervisor e remetente. Não há como montar o seletor de personas a partir disso.

**A correção conceitual (1 campo novo):** além do `role` máximo, devolver a **lista de
workspaces disponíveis**, já expandida pela hierarquia.

---

## 3. Back-end — o que fazer

### 3.1. Derivar a lista de workspaces (a peça-chave)

Defina a hierarquia num único lugar e derive os workspaces a partir do papel máximo:

\`\`\`python
# hierarquia: cada papel "contém" os anteriores
WORKSPACE_HIERARCHY = {
    "admin":      ["admin", "supervisor", "remetente"],
    "supervisor": ["supervisor", "remetente"],
    "internal":   ["remetente"],   # "internal" = remetente
}
\`\`\`

No `resolve_access_from_cav4_roles()`, depois de descobrir o papel máximo, acrescente ao
retorno o campo `available_workspaces = WORKSPACE_HIERARCHY[role]`.
Assim um admin passa a devolver:

\`\`\`json
{
  "authorized": true,
  "role": "admin",
  "available_workspaces": ["admin", "supervisor", "remetente"],
  "is_admin": true,
  "is_supervisor": true
}
\`\`\`

> **Ponto de atenção de segurança:** a lista de workspaces é **derivada no back-end** a partir
> das roles reais do CAv4. Nunca confie num "workspace" que o front mandar sem checar se ele
> pertence a `available_workspaces` do usuário (ver 3.3).

### 3.2. Guardar a persona ativa na sessão

O JWT/sessão (`app/utils/session_jwt.py`) deve carregar **dois campos**:

- `role` → papel máximo (imutável).
- `available_workspaces` → lista derivada (imutável na sessão).

A **persona ativa** NÃO precisa ir no JWT. Como a troca é sem novo login, o mais simples é o
front mandar a persona escolhida em cada request (header `X-Active-Workspace`) e o back-end
apenas **validar** se ela está dentro de `available_workspaces`. Vantagem: trocar de persona
é instantâneo, sem reemitir token.

### 3.3. Validar a persona nas rotas (não quebrar a segurança)

Hoje as guardas (`app/utils/authz.py`) checam o papel real (`require_admin`, `require_supervisor`).
Isso **continua valendo** — a persona é só uma "visão", nunca amplia poder.

A regra de ouro: **o efetivo é `min(papel_real, persona_escolhida)`**.
- Um admin com persona "remetente" só pode fazer o que um remetente faz.
- Um remetente NUNCA consegue escolher persona "admin" (não está em `available_workspaces`).

Implementação sugerida: um dependency `require_workspace("supervisor")` que verifica
**duas coisas** — (a) o header `X-Active-Workspace` é `supervisor`, e (b) `supervisor` está em
`available_workspaces` da sessão. Se qualquer uma falhar → 403.

### 3.4. Refletir no endpoint de sessão

O `/auth/cav4/session-check` (e o `me`) deve devolver `role` + `available_workspaces` para o
front conseguir montar o seletor e as telas.

---

## 4. Front-end — o que fazer

### 4.1. Guardar a persona no estado global

No `lib/stores/auth-store.ts`, adicionar:

- `availableWorkspaces: string[]` (vem do back-end, read-only).
- `activeWorkspace: string` (persona atual; começa na escolhida na tela de seleção).
- ação `setActiveWorkspace(ws)` que valida contra `availableWorkspaces` antes de aplicar.

> Como a troca é sem novo login, `setActiveWorkspace` só troca esse campo e redireciona.
> **Não** refaz login nem recarrega a sessão.

### 4.2. A sequência visual pós-login (o que você descreveu)

**Passo 1 — Loading com "check de acessos":** depois do callback CAv4, uma tela curta que
lista os acessos sendo verificados, com um "check" animado:

\`\`\`
Verificando sua identidade corporativa... ✓
Consultando seus papéis no CAv4...        ✓
  → Acesso de Administrador       ✓
  → Acesso de Supervisor          ✓
  → Acesso de Remetente           ✓
Preparando seus ambientes...              ✓
\`\`\`

Isso é **UI**: os itens vêm de `available_workspaces`. É só animar a lista item a item
(um `setInterval`/stagger) enquanto a sessão já está pronta. Dá a sensação de "sistema
inteligente" sem custo real de rede.

**Passo 2 — Seletor de persona (cards):** se `available_workspaces.length > 1`, mostrar uma
tela com um card por persona:

| Card | Título | Descrição | Quem vê |
|------|--------|-----------|---------|
| Admin | "Entrar como Administrador" | Ver todos os logs, gestão total | só admin |
| Supervisor | "Entrar como Supervisor" | Aprovar compartilhamentos | admin + supervisor |
| Remetente | "Entrar como Remetente" | Compartilhar arquivos | todos |

Se `available_workspaces.length === 1` (remetente puro), **pular a tela** e ir direto para o
ambiente dele — não faz sentido escolher entre uma opção só.

**Passo 3 — Redirecionar** para a home daquela persona (ex.: admin→`/auditoria`,
supervisor→`/compartilhamentos`, remetente→`/upload`), gravando `activeWorkspace`.

### 4.3. Troca de persona a qualquer momento (sem logout)

No `components/shared/app-header.tsx`, adicionar um **switcher** (dropdown) ao lado do avatar,
visível só quando `availableWorkspaces.length > 1`:

\`\`\`
[ Supervisor ▾ ]   ← clica e troca para Remetente/Admin
\`\`\`

Ao trocar: chama `setActiveWorkspace(ws)` e `router.push(homeDaPersona)`. Instantâneo.
O header envia `X-Active-Workspace` em toda chamada via `apiFetch` (um único ponto:
`lib/services/api-fetch.ts` lê `activeWorkspace` do store e injeta o header).

### 4.4. Menu/navegação dependente da persona

O menu deve refletir a **persona ativa**, não o papel máximo:

- Persona **Admin** → Logs/Auditoria, Gestão, + tudo de supervisor e remetente.
- Persona **Supervisor** → Fila de aprovações, Meus compartilhamentos, + tudo de remetente.
- Persona **Remetente** → Compartilhar arquivo, Meus envios.

Fonte única: um objeto `NAV_BY_WORKSPACE = { admin: [...], supervisor: [...], remetente: [...] }`
e o header renderiza `NAV_BY_WORKSPACE[activeWorkspace]`.

### 4.5. Proteção de rota por persona

O `components/auth/protected-route.tsx` deve aceitar `requiredWorkspace` e checar
`activeWorkspace` **além** de `availableWorkspaces`. Se um admin está com persona "remetente"
e tenta abrir `/auditoria` pela URL, ele é redirecionado (ou um aviso "troque para Admin para
acessar"). Isso mantém a experiência coerente — mas lembre: a segurança real é no back-end (3.3).

---

## 5. Por que essa abordagem é "fácil e dinâmica"

1. **Uma só fonte de verdade da hierarquia** — o dict `WORKSPACE_HIERARCHY` no back-end.
   Mudou a regra? Muda num lugar só.
2. **Sem reemitir token na troca** — persona vai por header, validada contra a lista fixa da
   sessão. Trocar de chapéu é instantâneo.
3. **Segurança preservada** — persona nunca amplia poder; o back-end sempre valida
   `persona ∈ available_workspaces` e mantém os `require_*` existentes.
4. **Front data-driven** — telas (loading, cards, menu) são geradas a partir de
   `available_workspaces`. Adicionar/remover persona não exige reescrever telas.

---

## 6. Resumo do que precisa ser feito

### Back-end
| # | Onde | O quê |
|---|------|-------|
| B1 | `cav4_auth_service.py` → `resolve_access_from_cav4_roles` | Adicionar `WORKSPACE_HIERARCHY` e retornar `available_workspaces` |
| B2 | `session_jwt.py` | Incluir `role` + `available_workspaces` na sessão |
| B3 | `utils/authz.py` | Novo dependency `require_workspace(ws)` = valida header `X-Active-Workspace` ∈ available |
| B4 | rotas `/auth/cav4/session-check` e `me` | Devolver `role` + `available_workspaces` |

### Front-end
| # | Onde | O quê |
|---|------|-------|
| F1 | `lib/stores/auth-store.ts` | Campos `availableWorkspaces`, `activeWorkspace` + `setActiveWorkspace` |
| F2 | tela pós-callback | Loading "check de acessos" (stagger sobre available_workspaces) |
| F3 | nova tela | Seletor de persona em cards (pula se só 1 workspace) |
| F4 | `components/shared/app-header.tsx` | Switcher de persona (visível se >1) |
| F5 | `lib/services/api-fetch.ts` | Injetar header `X-Active-Workspace` |
| F6 | `components/shared/app-header.tsx` | Menu via `NAV_BY_WORKSPACE[activeWorkspace]` |
| F7 | `components/auth/protected-route.tsx` | Prop `requiredWorkspace` |

---

## 7. Resumo executivo

Você não precisa de um sistema de permissões complexo. Basta **um conceito novo** — a diferença
entre *papel máximo* (o que o CAv4 diz que você é) e *persona ativa* (o chapéu que você escolhe
usar). O back-end deriva a lista de personas pela hierarquia (`admin ⊃ supervisor ⊃ remetente`)
e a devolve na sessão; o front usa essa lista para montar o loading de acessos, os cards de
escolha e o switcher no topo. A troca é instantânea (persona via header, sem novo login) e
**segura** (o back-end nunca deixa a persona ultrapassar o papel real). O usuário externo fica
totalmente fora desse fluxo. Nada foi implementado neste documento — apenas o desenho da solução.
