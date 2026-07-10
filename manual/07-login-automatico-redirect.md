# 07 — Login automático e redirecionamento por papel

> Objetivo: ao acessar a URL do sistema, **não** mostrar a tela com o botão
> "Login corporativo". Se o usuário já estiver autenticado, redirecionar
> direto para a área do papel dele (admin / supervisor / remetente).
> A tela de login só aparece **se não houver sessão**.
>
> Escopo desta análise: **somente esta regra**. Nenhuma outra regra do
> sistema é alterada.

---

## 1. Como está hoje (diagnóstico)

| Arquivo | Comportamento atual | Problema |
|---|---|---|
| `app/page.tsx` | Renderiza `<LoginForm />` **imediatamente**, sem checar sessão. | A tela de login sempre aparece primeiro. |
| `components/auth/login-form.tsx` (linhas 61-72) | Tem um `useEffect` que redireciona **se** `isAuthenticated && user` já existirem no store (Zustand/localStorage). | Só funciona para quem já tem sessão salva no navegador; e como a página já renderizou o form, há um "flash" da tela de login antes do redirect. |
| `app/api/auth/cav4/login` → backend `/auth/cav4/login` | Redireciona para o CAv4 **sempre com interação** (login normal). | Não existe tentativa de login silencioso (`prompt=none`). |
| `GET /auth/cav4/session-check` (backend) | **Já existe** e valida o JWT interno, devolvendo `valid` + `role`. | Exige o token no header `Authorization: Bearer` — e o token vive no `localStorage`. |

### A restrição central (precisa entender isto)
Os tokens ficam no **`localStorage`**. Nem o `proxy.ts` (middleware) nem um
Server Component conseguem ler `localStorage` — só o navegador. Por isso a
decisão "está logado? para onde mando?" **não pode** ser feita no servidor
sem antes migrar a sessão para cookie. Portanto, mantendo o desenho atual,
a verificação precisa acontecer no **cliente**, trocando o `LoginForm` por um
**loader** enquanto decide.

---

## 2. Há dois cenários diferentes de "já estar logado"

É crucial separar, porque a resposta sobre **endpoints** muda entre eles.

### Cenário A — já tem sessão no sistema (retorno / aba reaberta)
O usuário já logou antes e ainda há token no `localStorage`.
➡️ **Não altera nenhum endpoint.** É correção 100% de front-end.

### Cenário B — SSO silencioso de rede (nunca logou no sistema, mas já está logado na Petrobras)
"Estou logado na rede da Petrobras, quero entrar sem clicar em nada."
Isso é **autenticação silenciosa** (`prompt=none`) contra o CAv4.
➡️ **Exige alterar 2 endpoints** (detalhado na seção 4).

---

## 3. O que fazer no FRONT-END (vale para os dois cenários)

| # | Onde | O que fazer |
|---|---|---|
| F1 | `app/page.tsx` | Deixar de renderizar o `LoginForm` direto. Renderizar um **gate** client-side: enquanto verifica a sessão, mostra `FullPageLoader`; decide depois. |
| F2 | Novo componente (ex.: `components/auth/auth-gate.tsx`) | No `mount`: (a) se há token no store, chamar `GET /api/auth/cav4/session-check`; (b) se `valid`, `router.replace` para a rota do papel; (c) se inválido/ausente, **aí sim** mostrar o `LoginForm`. |
| F3 | Mapa de papel → rota | Reaproveitar o que **já existe** em `lib/auth/cav4-config.ts` → `resolvePostLoginRoute()` (admin `/admin`, supervisor `/supervisor`, externo `/download`, interno `/upload`). Não recriar. |
| F4 | `login-form.tsx` (linhas 61-72) | O `useEffect` de redirect pode ser **removido/movido** para o gate (F2), para eliminar o "flash" da tela de login. |

Resultado: quem já tem sessão nunca vê a tela de login — vê só o loader e cai
direto no painel do papel. Quem não tem, vê o login normalmente.

> Observação: para o **Cenário A**, só isso já resolve — sem tocar em back-end.

---

## 4. O que fazer no BACK-END (somente se quiser o Cenário B — SSO silencioso)

Se a intenção é "entrar sem clicar mesmo nunca tendo logado no sistema"
(porque já está autenticado na rede/CAv4), então **sim, precisa mexer no
back-end**. São exatamente **2 endpoints** — e digo quais:

| # | Endpoint | Arquivo / linha | Alteração necessária |
|---|---|---|---|
| B1 | `GET /auth/cav4/login` | `backend/app/api/v1/routes_cav4_auth.py` (linha ~220) | Aceitar um parâmetro opcional (ex.: `?silent=1`) e, quando presente, montar a authorization URL com **`prompt=none`** (via `get_authorization_url(...)` em `cav4_auth_service.py`). |
| B2 | `GET /auth/cav4/callback` | `backend/app/api/v1/routes_cav4_auth.py` (linha ~241) | Hoje `code: str = Query(...)` e `state: str = Query(...)` são **obrigatórios**. No login silencioso o CAv4 pode voltar **sem `code`**, com `error=login_required` / `interaction_required`. Tornar `code`/`error` opcionais e, se vier erro, **redirecionar para `/` mostrando o login normal** (fallback) em vez de estourar HTTP 422. |

**Nada mais muda.** `session-check`, `refresh`, `logout`, `token` e todo o
resto permanecem iguais. O fluxo de troca de código (`_complete_cav4_exchange`)
é reutilizado como está.

### Fluxo silencioso (Cenário B), passo a passo
1. Front (gate F2) não tem sessão → chama `/api/auth/cav4/login?silent=1`.
2. Backend redireciona ao CAv4 com `prompt=none`.
3a. **Se logado na rede:** CAv4 devolve `code` → callback conclui → cria sessão → redireciona ao papel. Usuário nunca clicou.
3b. **Se não logado:** CAv4 devolve `error=login_required` → callback (B2) manda de volta para `/` → aí o `LoginForm` aparece com o botão corporativo.

> Para evitar loop infinito, o gate deve tentar o silencioso **uma única vez**
> (ex.: marcar `?silent_tried=1` na URL de retorno) antes de exibir o login.

---

## 5. Resumo executivo (resposta direta)

- **"Preciso alterar endpoint?"**
  - Para redirecionar quem **já tem sessão salva** (Cenário A): **NÃO** — só front-end (`app/page.tsx` + novo gate). O `session-check` já existe.
  - Para entrar **sem clicar** aproveitando o login de rede (Cenário B): **SIM**, exatamente **2 endpoints**: `GET /auth/cav4/login` (add `prompt=none`) e `GET /auth/cav4/callback` (tolerar `error` em vez de exigir `code`).
- **Reaproveitamento:** o mapa papel→rota (`resolvePostLoginRoute`) e o `session-check` já existem — não recriar.
- **Bloqueio de fundo:** tokens no `localStorage` impedem decisão no servidor; por isso o gate é client-side com loader (não um Server Component / middleware), a menos que a sessão seja migrada para cookie `httpOnly` (fora do escopo desta regra — ver manual 03).
- **Nenhuma outra regra do sistema é tocada.**
