# SSO Silencioso CAv4 — O que falta para auto-login e redirecionamento por perfil

> **Objetivo desejado:** ao acessar a URL do sistema, ele deve verificar automaticamente
> se já existe sessão válida (na aplicação e/ou na Petrobras via CAv4). Se houver, ler os
> papéis/roles e **redirecionar direto** para a página do perfil (admin/supervisor/interno).
> A tela de login corporativo só deve aparecer **quando não houver sessão**.
>
> Este documento **apenas explica o que está errado e o que precisa ser feito**. Não contém
> implementação. A correção será adotada em uma etapa posterior.

---

## 1. Como o fluxo funciona hoje (as-is)

1. **Rota raiz `/`** (`app/page.tsx`) renderiza **diretamente** o `<LoginForm />`.
   Não existe nenhuma verificação de sessão antes de mostrar a tela. Ou seja: **sempre**
   cai no login, mesmo que o usuário já esteja autenticado na Petrobras.

2. **Middleware `proxy.ts`** só injeta cabeçalhos de segurança (CSP, HSTS, etc.).
   **Não faz nenhum controle de sessão nem redirecionamento.**

3. **`LoginForm`** tem um `useEffect` (guard) que redireciona por perfil:
   - `admin → /admin`, `supervisor → /supervisor`, `external → /download`, senão `→ /upload`.
   - **PORÉM** ele só dispara se `isAuthenticated && user` **vierem do `localStorage`** (store Zustand).
   - Isso é estado 100% client-side: não valida com o servidor e **não tenta SSO**.
   - Numa visita nova (sem `localStorage`), ele nunca tenta autenticar — apenas mostra o login.

4. **Login CAv4 é manual:** o usuário precisa clicar em "Login corporativo" →
   `/api/auth/cav4/login` → backend `/api/v1/auth/cav4/login` → gera state/nonce/PKCE →
   redireciona para o Authorization Endpoint com `response_type=code`.
   **Não há `prompt=none`** (autenticação silenciosa).

5. **Callback** troca code por token, resolve roles no CAv4, emite JWT interno e devolve
   `user + tokens`. O frontend guarda no `localStorage` e só então redireciona.

**Conclusão:** o redirecionamento por perfil já existe, mas depende de o usuário já ter feito
login manual antes (dado no `localStorage`). Não existe verificação automática de sessão ao
acessar a URL, nem tentativa de SSO silencioso.

---

## 2. Conceito: os dois níveis de "já estar logado"

Para atingir o objetivo, é preciso entender que existem **duas sessões diferentes**:

- **(A) Sessão da aplicação** — o JWT/refresh interno emitido pelo nosso backend.
  Se estiver válido, dá pra redirecionar **na hora**, sem nem falar com o CAv4.

- **(B) Sessão corporativa (CAv4 / Petrobras)** — mesmo sem sessão local, o usuário pode
  já ter uma sessão ativa no provedor de identidade. O OIDC resolve isso com
  **`prompt=none`** (autorização silenciosa):
  - Se o IdP tem sessão → devolve o `code` **sem mostrar tela de login**.
  - Se não tem → devolve `error=login_required` e aí sim mostramos nosso login.

O fluxo alvo é: **primeiro tenta (A); se falhar, tenta (B) silencioso; se falhar, mostra login.**

---

## 3. O bloqueador central de arquitetura

> **Os tokens hoje ficam no `localStorage`, não em cookie `httpOnly`.**

Isso é o principal impedimento para o auto-redirect ao digitar a URL, porque:

- O `localStorage` **só existe no navegador**. Nem o middleware (`proxy.ts`) nem um
  Server Component conseguem ler `localStorage`.
- Logo, **é impossível decidir no servidor** ("antes de pintar a tela") se o usuário está
  logado e para onde mandá-lo. Qualquer verificação fica presa no client, depois que a
  página de login já foi renderizada (causando "piscada" do login).

**O que precisa mudar:** a sessão (pelo menos o refresh/serverside) precisa estar em um
**cookie `httpOnly` + `Secure` + `SameSite`**, que o servidor/middleware consiga ler.

---

## 4. O que falta no BACK-END

| # | Item | Situação atual | O que precisa ser feito |
|---|------|----------------|--------------------------|
| B1 | **Suporte a `prompt=none`** | `get_authorization_url()` monta a URL sem `prompt`. | Aceitar um parâmetro opcional `prompt` e permitir iniciar o login em modo silencioso (`/login?silent=1` → adiciona `prompt=none`). |
| B2 | **Callback tolerante a erro do IdP** | `cav4_callback` exige `code` e `state` como query obrigatórios. Se o IdP responder `error=login_required` (silencioso sem sessão), **não vem `code`** → FastAPI retorna 422. | O callback precisa aceitar `error`/`error_description` e, nesse caso, **redirecionar de volta para `/`** (mostrar login) em vez de quebrar. |
| B3 | **Sessão em cookie httpOnly** | `_complete_cav4_exchange` retorna tokens em JSON (o front guarda no `localStorage`). | Definir a sessão (ao menos o refresh) como **cookie `httpOnly`/`Secure`/`SameSite`** para que servidor e middleware consigam validar. |
| B4 | **Endpoint de "resolução de destino"** | `session-check` valida o JWT via header `Authorization: Bearer`. Funciona, mas depende do token que hoje está só no client. | Garantir que o `session-check` (ou equivalente) consiga validar pela **cookie** e devolver o `role`, para o servidor saber o destino do redirect. |
| B5 | **`_PENDING_AUTH` em memória** | state/nonce/PKCE guardados num `dict` em RAM do processo. | Com SSO silencioso há mais idas e vindas; com múltiplos workers isso falha de forma intermitente. Mover para store compartilhado (Redis/cookie assinado). *(Já apontado no manual 01.)* |
| B6 | **Mapa role→destino no servidor** | O mapeamento admin/supervisor/interno→rota só existe no `LoginForm` (client). | Para redirecionar server-side, esse mapa precisa existir também no backend/servidor Next. |

---

## 5. O que falta no FRONT-END

| # | Item | Situação atual | O que precisa ser feito |
|---|------|----------------|--------------------------|
| F1 | **Verificação antes de renderizar `/`** | `app/page.tsx` renderiza o `LoginForm` de imediato, sem checar sessão. | Transformar `/` num **Server Component** (ou usar o middleware) que lê a cookie de sessão, valida no backend e faz `redirect()` por perfil **antes** de mostrar qualquer UI. |
| F2 | **Guard depende de `localStorage`** | O `useEffect` só redireciona com base no store persistido; não valida no servidor nem tenta SSO. | O "já autenticado" precisa ser confirmado no servidor (via cookie), não confiar só no `localStorage`. |
| F3 | **Não há tentativa de SSO silencioso** | Visita nova (sem `localStorage`) sempre mostra login. | Numa primeira carga sem sessão local, disparar o fluxo silencioso (`/api/auth/cav4/login?silent=1` com `prompt=none`) e só renderizar o login se o silencioso falhar (`login_required`). |
| F4 | **Tokens em `localStorage`** | `auth-store` persiste access+refresh no `localStorage`. | Migrar a sessão para cookie `httpOnly` (par com B3). É o que destrava o redirect server-side e ainda reduz risco de XSS. |
| F5 | **Middleware não protege rotas** | `proxy.ts` não checa nada; o matcher exclui `/api`. | O middleware deve ler a cookie de sessão e: (a) redirecionar `/` para o destino do perfil quando logado; (b) proteger `/upload`, `/admin`, `/supervisor` quando não logado. |
| F6 | **Página de callback** | `app/auth/cav4-callback` conclui o exchange e salva no store. | Ajustar para o novo modelo de cookie e para tratar o retorno do fluxo silencioso (sucesso → destino por perfil; `login_required` → `/`). |

---

## 6. Fluxo alvo (to-be) — passo a passo

1. Usuário digita a URL → cai em `/`.
2. **Servidor** (Server Component `/` ou middleware) lê a **cookie de sessão** (`httpOnly`).
3. **Se a sessão da app é válida (A):** resolve o `role` e faz `redirect()` para
   `/admin` | `/supervisor` | `/upload` — **sem mostrar login**.
4. **Se não há sessão local:** dispara o **SSO silencioso** (`prompt=none`) no CAv4.
   - IdP tem sessão → volta com `code` → back-end conclui, cria cookie, redireciona por perfil.
   - IdP não tem sessão (`login_required`) → back-end redireciona para `/` **em modo login visível**.
5. Só nesse último caso o usuário vê a tela de "Login corporativo".

---

## 7. Ordem sugerida de correção (quando formos adotar)

1. **F4 + B3** — mover a sessão para cookie `httpOnly` *(fundação; sem isso o resto não funciona)*.
2. **B1 + B2** — suporte a `prompt=none` e callback tolerante a `login_required`.
3. **F1 + F5** — verificação/redirect server-side em `/` e no middleware.
4. **F3 + F6** — tentativa de SSO silencioso e ajuste do callback.
5. **B4 + B6** — resolução de destino por perfil no servidor.
6. **B5** — mover `_PENDING_AUTH` para store compartilhado.

---

## 8. Resumo executivo

- **Onde está errado:** hoje `/` sempre mostra o login; o "auto-redirect" existente confia
  só no `localStorage`; não há verificação de sessão no servidor nem tentativa de SSO
  silencioso; e os tokens no `localStorage` impedem qualquer decisão server-side.
- **O que precisa:** (1) sessão em **cookie httpOnly**, (2) **`prompt=none`** no CAv4 com
  callback tolerante a `login_required`, (3) **verificação/redirect por perfil no servidor**
  (Server Component em `/` + middleware).
- **A boa notícia:** o mapeamento de papéis→rotas e a resolução de roles do CAv4 **já existem** —
  falta principalmente mover a decisão para o servidor e adicionar o fluxo silencioso.
