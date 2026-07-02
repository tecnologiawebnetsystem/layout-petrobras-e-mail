# Análise do Front-end — Autenticação CAv4 e Entra ID (Performance e Correções)

> Documento de análise técnica do front-end (Next.js App Router) focado nos fluxos
> **CAv4** e **Entra ID (MSAL)**. Objetivo: apontar **erros**, **riscos de segurança**
> e o que pode ser **melhorado para performance** e adotado como boa prática.

## Arquivos analisados

| Arquivo | Responsabilidade |
|---|---|
| `components/auth/login-form.tsx` | Tela de login (externo OTP, local, corporativo) |
| `components/auth/entra-provider.tsx` | Processa redirect MSAL e valida sessão |
| `lib/auth/msal-config.ts` | Configuração do MSAL |
| `lib/auth/cav4-config.ts` | Helpers do modo CAv4 |
| `lib/auth/entra-security.ts` | Timeout de sessão, logout multi-aba |
| `lib/stores/auth-store.ts` | Estado de auth (Zustand + persist) |
| `lib/services/api-fetch.ts` | Wrapper de fetch + auto-refresh |
| `lib/api/route-handler-utils.ts` | Proxy BFF para o backend FastAPI |
| `lib/env.ts` | Leitura de env pública em runtime |
| `app/auth/cav4-callback/page.tsx` | Callback do CAv4 |
| `app/api/auth/**` | Route handlers (proxy) |

---

## 1. Erros / Bugs

### 1.1 [CRÍTICO] Login Entra ID nunca dispara o `loginRedirect`
Em `login-form.tsx`, `handleEntraIdLogin()` apenas checa se o backend está no ar e liga o loader:

```ts
const handleEntraIdLogin = async () => {
  setIsRedirectingToMicrosoft(true)
  const backendOk = await isBackendAvailable()
  // ... "O browser sera redirecionado" — MAS NADA REDIRECIONA
}
```

Uma busca global confirma: **`loginRedirect`, `loginPopup`, `acquireTokenRedirect` e `ssoSilent` não são chamados em lugar nenhum**. O `EntraProvider` só chama `handleRedirectPromise()`, que processa o **retorno** de um redirect — mas nada **inicia** o redirect.

**Consequência:** no modo `entra`, clicar em "Login corporativo" deixa o usuário num **loader infinito**; o login nunca acontece.

**Correção:** o clique deve iniciar o fluxo MSAL:
```ts
const { getMsalInstance, loginRequest } = await import("@/lib/auth/msal-config")
const msal = await getMsalInstance()
await msal.loginRedirect(loginRequest)
```
(O modo CAv4, por outro lado, está correto: redireciona para `/api/auth/cav4/login`.)

### 1.2 [CRÍTICO] Violação das *Rules of Hooks* em `EntraProvider`
O componente tem um `return` condicional **antes** de um `useEffect`:

```tsx
if (isMsalProcessing) {
  return <FullPageLoader ... />   // early return
}

// ⚠️ useEffect declarado DEPOIS de um return condicional
useEffect(() => { /* validateSession */ }, [...])
```

Isso quebra a regra de ordem estável dos Hooks — o React lançará *"Rendered fewer hooks than expected"* quando `isMsalProcessing` alternar entre `true`/`false`.

**Correção:** mover **todos** os `useEffect` para antes de qualquer `return` condicional; usar o loader dentro do JSX final (ex.: `return isMsalProcessing ? <Loader/> : <>{children}</>`).

### 1.3 [MÉDIO] Auto-refresh do `api-fetch.ts` incompatível com CAv4/Entra
`api-fetch.ts` (ao receber 401) chama:
```ts
fetch(`${API_BASE}/auth/refresh`, { method: "POST", body: JSON.stringify({ refresh_token }) })
```
Mas o `auth-store.refreshSession()` usa o endpoint **específico do modo** com **header** `X-Refresh-Token`:
```ts
"/api/auth/cav4/refresh"  // header X-Refresh-Token
```
Há **duas estratégias de refresh divergentes**. O `/api/auth/refresh` genérico funciona (o backend tem essa rota e a tabela `SessionToken` é compartilhada), mas o formato (body vs header) e o shape de resposta divergem do fluxo do modo, o que gera comportamento inconsistente e difícil de depurar.

**Correção:** unificar em um único mecanismo de refresh (idealmente o do `auth-store`, ciente do modo) e fazer o `api-fetch` delegar para `useAuthStore.getState().refreshSession()` em vez de chamar `/auth/refresh` diretamente.

---

## 2. Riscos de Segurança

### 2.1 [ALTO] Access token e refresh token no `localStorage`
`auth-store.ts` persiste via Zustand `persist` (localStorage) `accessToken` **e** `refreshToken`:
```ts
partialize: (state) => ({ user, accessToken, refreshToken, isAuthenticated, isLoading })
```
`localStorage` é **legível por qualquer JavaScript da página** → em caso de XSS, os tokens (inclusive o refresh, de longa duração) são exfiltráveis.

**Correção recomendada (aproveitando o BFF que já existe):**
- Guardar o **refresh token em cookie `httponly` + `secure` + `sameSite`** setado pelos route handlers do Next (o browser nunca o expõe ao JS).
- Manter o **access token apenas em memória** (state do Zustand **sem** persist), renovando via refresh no carregamento.
- Persistir no localStorage no máximo dados **não sensíveis** de UI (nome, foto, role) — nunca tokens.

### 2.2 [BAIXO] Default de `NEXT_PUBLIC_AUTH_MODE` divergente do backend
Em vários pontos o default é `"entra"` (`getClientEnv("NEXT_PUBLIC_AUTH_MODE") || "entra"`), mas o backend opera em **CAv4**. Se a env não for injetada, o front cai no fluxo Entra (quebrado, ver 1.1). Alinhar o default para `"cav4"` ou tornar a variável obrigatória.

---

## 3. Melhorias de Performance

### 3.1 Remover o `isBackendAvailable()` antes de cada login
`login-form.tsx` faz um `OPTIONS /api/auth/login` extra antes de redirecionar (tanto no Entra quanto no CAv4). Isso adiciona **um round-trip de latência** na ação mais crítica (o clique de login) e, no CAv4, atrasa o `window.location.href`. O próprio redirect/endpoint já retorna erro tratável se o backend estiver fora.

**Ação:** remover a checagem prévia e tratar a falha diretamente no fluxo de login.

### 3.2 Não persistir a foto (data URI base64) no store
A `photoUrl` chega como `data:image/jpeg;base64,...` (dezenas de KB) e é gravada no `localStorage` a cada `setAuth`. Isso:
- infla toda leitura/escrita do store (serialização JSON grande);
- pode estourar a cota do `localStorage` com múltiplos usuários/abas.

**Ação:** servir a foto por URL (S3/Blob/endpoint com cache) e **excluir `photoUrl` do `partialize`**; ou manter só em memória.

### 3.3 Cachear a validação de sessão (evitar chamadas repetidas)
`validateSession()` é chamado a cada navegação protegida. Em navegação intensa isso gera vários `GET /session-check`.

**Ação:** usar **SWR** com `dedupingInterval` para `session-check`, ou revalidar apenas quando `expires_in` estiver próximo do fim (o back já retorna `expires_in`). Isso reduz chamadas e melhora a percepção de velocidade.

### 3.4 Garantir *lazy-load* consistente do MSAL
`getMsalInstance()` já usa `import()` dinâmico (bom — mantém `@azure/msal-browser` fora do bundle inicial). Ao corrigir 1.1, **manter** o `import()` dinâmico no handler do clique, para não trazer o MSAL para o *first load* de quem usa CAv4.

### 3.5 Verificar se `openapi-spec.ts` (~44 KB) entra no bundle do cliente
`lib/openapi-spec.ts` é grande. Se for importado por um Client Component (ex.: `/docs`), infla o JS enviado ao browser.

**Ação:** garantir que só seja importado em **Server Component**/rota isolada, ou carregá-lo via `import()` dinâmico apenas na página de documentação.

### 3.6 Memoizar handlers e reduzir re-render no `login-form.tsx`
O componente é grande e recria vários handlers a cada render. Não é crítico, mas extrair o **fluxo OTP** e o **fluxo corporativo** em subcomponentes reduz re-renders e melhora manutenção.

---

## 4. O que está CORRETO (pontos positivos)

- **BFF bem estruturado:** `route-handler-utils.ts` centraliza o proxy (`proxyGET/JSON/DELETE/FormData`), com `BACKEND_URL` **privado** (sem `NEXT_PUBLIC_`) — o backend não é exposto ao browser.
- **`lib/env.ts`** resolve corretamente o problema de env pública *build-time vs runtime* injetando `window.__ENV__` — solução adequada para ECS.
- **CAv4 callback** com guarda de idempotência (`processed.current`) evita troca dupla do code.
- **Logout multi-aba** via evento `storage` — boa UX de segurança.
- **`sessionStorage` no MSAL** (não `localStorage`) — escolha mais segura para os artefatos do MSAL.
- **Tratamento de erro padronizado** no `handleProxyResponse` (shape `{ success, error }`).

---

## 5. Plano de Correção Priorizado

| Prioridade | Item | Ação |
|---|---|---|
| P0 | 1.1 | Implementar `msal.loginRedirect(loginRequest)` no clique (modo entra) — ou remover o modo entra do front se for descontinuado. |
| P0 | 1.2 | Corrigir ordem dos Hooks no `EntraProvider`. |
| P1 | 2.1 | Migrar tokens para cookie `httponly` (refresh) + memória (access). |
| P1 | 1.3 | Unificar o mecanismo de refresh (delegar ao `auth-store`). |
| P2 | 3.1 / 3.2 | Remover `isBackendAvailable` do login; tirar foto base64 do persist. |
| P2 | 3.3 | Cachear `session-check` com SWR. |
| P3 | 2.2 / 3.4 / 3.5 / 3.6 | Alinhar default de `AUTH_MODE`; manter MSAL lazy; isolar `openapi-spec`; refatorar `login-form`. |

---

## 6. Resumo executivo

O front-end tem uma **arquitetura BFF sólida** e boas práticas de env em runtime, mas o **fluxo Entra ID está quebrado** em dois pontos que impedem o login (não dispara `loginRedirect` e viola as Rules of Hooks). Do lado de **segurança**, o maior risco é a **persistência de tokens no `localStorage`** — recomenda-se migrar para cookie `httponly` aproveitando o BFF existente. Em **performance**, os ganhos mais fáceis são: remover a checagem `isBackendAvailable` antes do login, não persistir a foto base64 e cachear a validação de sessão com SWR.

> Observação: como o backend opera em **CAv4** (o modo Entra está desativado/descontinuado lá — ver `manual/01-analise-backend-cav4-entra.md`), a decisão sobre corrigir vs. remover o fluxo Entra ID deve ser **a mesma nos dois lados** (back e front) para manter a coerência.
