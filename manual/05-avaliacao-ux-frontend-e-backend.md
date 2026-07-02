# 05 — Avaliação de UX/Front-end e Reavaliação do Back-end

> Documento **somente informativo**. Nenhum código foi alterado.
> Objetivo: (1) o que melhorar de UX/front-end em toda a jornada dos 4 papéis;
> (2) reavaliar o back-end — o que já existe e o que de fato vamos aproveitar.

---

## Parte A — Como o sistema está montado (arquitetura real)

Ao ler todo o código, encontrei **três camadas** — e é isso que precisa ficar claro
antes de qualquer melhoria:

| Camada | Onde | Papel real hoje |
|--------|------|-----------------|
| **1. Back-end FastAPI (Python)** | `backend/app/**` | **Fonte da verdade** do domínio (shares, supervisor, download, OTP, auditoria, admin). Robusto e quase completo. |
| **2. BFF / Proxy (Next.js route handlers)** | `app/api/**` + `lib/api/route-handler-utils.ts` | Repassa as chamadas do browser para o FastAPI. Camada fina e correta. |
| **3. Estado do front (Zustand)** | `lib/stores/workflow-store.ts`, `audit-log-store.ts` | Chama a API real **mas** persiste em `localStorage` e faz merge de dados locais. |

**Conclusão-chave:** o front-end **já está ligado** ao FastAPI (via `apiFetch` → proxy → FastAPI).
O problema não é "falta conectar" — é que existe **código paralelo/morto e persistência local**
que competem com o back-end e geram inconsistência.

---

## Parte B — Reavaliação do Back-end: o que usamos do que temos

### B1. O que É a fonte da verdade e DEVE ser mantido (FastAPI)

Estes serviços estão bem feitos e são o que o sistema realmente usa:

- `share_service.py` — ciclo de vida do compartilhamento (criar, aprovar, rejeitar, expirar).
- `token_service.py` — OTP real, hash, expiração, tentativas. **Este é o OTP verdadeiro.**
- `audit_service.py` — trilha de auditoria (o que o admin deve ver).
- `routes_supervisor.py`, `routes_download.py`, `routes_shares.py`, `routes_admin.py` — as rotas dos 4 papéis.
- Autenticação CAv4 (`cav4_auth_service.py`) — fluxo OIDC/PKCE correto (ver manual 01).

### B2. O que é DUPLICADO / MORTO no lado Next.js e deve ser descartado

Existe uma "segunda cozinha" dentro de `lib/` que **reimplementa** o que o FastAPI já faz.
Isso confunde e é fonte de bug. Recomendo **remover ou congelar**:

| Arquivo Next.js | Duplica no FastAPI | Situação | Recomendação |
|-----------------|--------------------|----------|--------------|
| `lib/auth/otp-service.ts` | `token_service.py` | OTP mock em `Map()` na memória do browser; **ninguém importa** (grep = 0). | Excluir — é código morto e passa ideia errada de que o OTP é client-side. |
| `lib/auth/rate-limiter.ts` | rate-limit deve ser no FastAPI | Rate limit em memória do Node (não sobrevive a múltiplas instâncias). | Congelar; mover a regra para o back-end. |
| `lib/auth/user-verification.ts`, `session-binding.ts` | fluxo CAv4/Entra do FastAPI | Lógica de sessão paralela. | Revisar; consolidar no fluxo do FastAPI. |
| `lib/auth/graph-api.ts`, `lib/services/microsoft-graph-mail.tsx`, `lib/email/**` | `graph_service.py` / envio de e-mail no back-end | Envio de e-mail/Graph pelo Node. | Decidir **um** lugar para e-mail (recomendo back-end) e remover o outro. |
| `lib/utils/create-mock-zip.ts` + `mockZipUrl`/`upload-3` no `workflow-store` | — | Artefatos de protótipo (ZIP falso). | Remover antes de produção. |

### B3. Feature ENXERTADA e não relacionada: Roadmap (Neon)

- `lib/db/neon.ts` acessa um banco **Neon** com tabelas `roadmap_fases`, `roadmap_entregas`,
  `roadmap_marcos`, `roadmap_burndown` — é um **gerenciador de roadmap de projeto**, nada a ver
  com compartilhamento de arquivos.
- Isso significa que há **dois bancos e dois domínios** no mesmo repositório.
- **Decisão a tomar:** manter o Roadmap como página interna separada (documentar como tal) ou
  movê-lo para outro projeto. Hoje ele só adiciona superfície de código e confusão ao CSAC.

### B4. Inconsistências de back-end já mapeadas (ver manuais 01 e 04)

Não repito aqui, mas continuam valendo e afetam o front:
- `POST /shares/create` sem autenticação + `created_by_id` do corpo + bug `payload.obj` (P0).
- `GET /admin/mip-diagnostico` sem `require_admin` (P0).
- `routes_entra_auth.py` quebrado/morto (P0).
- Divergência de status/validade de OTP entre `verify_email` e `issue_otp` (P1).

---

## Parte C — Avaliação de UX / Front-end (por onde melhorar)

### C1. Navegação e Arquitetura de Informação (o ponto mais fraco)

- **Não há navegação global/estrutural.** Tudo depende de um `AppHeader` com um *dropdown* de avatar
  e alguns botões. Um supervisor que quer alternar entre "Aprovações", "Compartilhamentos", "Logs"
  precisa caçar links. Falta uma **navegação por papel** clara (sidebar ou navbar com seções).
- **`GlobalSearch` está comentado** (`app-header.tsx`) — feature pela metade. Ou entrega ou remove.
- Cada papel deveria ter um **destino inicial óbvio** pós-login (ver manual 03 sobre redirecionamento
  por papel). Hoje o header é genérico para todos.
- **Recomendação:** IA por papel:
  - Remetente → "Novo compartilhamento" + "Meus compartilhamentos".
  - Supervisor → "Aprovações pendentes" (com contador) + "Equipe" + "Logs".
  - Externo → tela única, linear, sem menu (só o download).
  - Admin → "Auditoria" + "Diagnóstico" + "Gestão".

### C2. Confiabilidade percebida (estado e feedback)

- **Persistência em `localStorage` (`workflow-store`, `audit-log-store` com `persist`)** é o maior
  risco de UX/segurança:
  - Em **máquina compartilhada** (típico do usuário externo), dados de compartilhamento e trilha
    ficam no navegador de terceiros.
  - Gera **dados-fantasma**: uploads locais que não existem mais no back-end continuam aparecendo
    (o próprio código faz merge de `localOnly`).
  - **Recomendação:** tratar o FastAPI como única fonte; usar **SWR** (recomendado pelas diretrizes)
    para buscar/cachear/revalidar, em vez de `persist` em localStorage.
- **Mutações "fire-and-forget"**: aprovar/rejeitar/estender chamam a API com `.catch()` silencioso e
  atualizam a tela na hora. Se o back-end recusar, o usuário **vê sucesso falso**.
  - **Recomendação:** aguardar a resposta, tratar erro com toast e reverter o estado otimista.
- **`addLog` client-side** cria uma sensação de auditoria que não é a real (a verdadeira está no
  `audit_service.py`). Isso pode enganar o admin. Consolidar na trilha do back-end.

### C3. Design visual (bom, mas excessivo)

O design system (`globals.css`) tem boa base: cores oficiais Petrobras (verde `#00A859`, azul,
amarelo), fonte Inter, dark mode. Mas **passa do ponto** e isso pesa em performance e foco:

- **Excesso de gradientes e animações** contínuas: `petrobras-gradient`, `orbit-1/2/3`, `float`,
  `gradient-pulse`, `progress-shine`, `confetti`. As diretrizes pedem **evitar gradientes** e usar
  cores sólidas; animações infinitas consomem CPU/bateria e distraem num sistema **corporativo/segurança**.
  - **Recomendação:** reservar animação para microfeedback (sucesso de envio) e remover as órbitas/
    partículas de fundo das telas de trabalho.
- **Muitas cores de gráfico** (`chart-1..5`) misturando verde/azul/amarelo — ok para dashboard, mas
  manter paleta contida (3–5 no total por tela).
- **Scrollbar com gradiente** e sombras coloridas fortes (`card-hover` com sombra verde) — reduzir
  para um visual mais sóbrio e institucional.

### C4. Jornada do Usuário Externo (a mais crítica de UX)

É o único papel **fora** da Petrobras, geralmente com pressa e em máquina desconhecida:

- Deve ser **100% linear e sem menu**: verificar e-mail → receber OTP → validar → baixar. Sem header
  cheio de opções, sem tema, sem "meus compartilhamentos".
- **Feedback de OTP** precisa ser explícito: tempo restante, tentativas restantes, botão "reenviar"
  com cooldown. Alinhar com a validade real do back-end (hoje há divergência 5 vs 10 min — manual 04).
- **Nada em localStorage** para este papel (privacidade). Ver C2.
- Mensagens de erro claras: link expirado, download já consumido, e-mail não autorizado — cada um com
  orientação do que fazer.

### C5. Acessibilidade e responsivo

- Pontos bons já presentes: `aria-label` nos botões do header, alvos de toque `min-h-[44px]` no mobile,
  `sr-only` disponível.
- **A revisar:** contraste do amarelo `#FDB913` sobre branco (texto), foco visível em todos os
  interativos, e navegação por teclado nos modais (aprovação, OTP, ZIP viewer).
- Confirmar `alt` significativo em ícones informativos e ordem de leitura nas timelines de workflow.

### C6. Consistência de componentes

- Há **componentes duplicados** entre `components/supervisor/*` e `components/workflow/*`
  (`approval-modal.tsx`, `expiration-editor-modal.tsx`, `workflow-timeline.tsx` existem nos dois lugares).
  - **Recomendação:** unificar num só conjunto para evitar divergência de comportamento/visual.

---

## Parte D — Resumo executivo (o que fazer, em ordem)

1. **Definir a fonte única da verdade = FastAPI.** Remover/congelar o código paralelo do Node
   (OTP mock, rate-limiter, graph/email duplicado) — ver B2.
2. **Tirar o `localStorage` do fluxo** (workflow/audit): migrar para SWR, acabar com dados-fantasma
   e com o risco de privacidade no usuário externo — ver C2.
3. **Corrigir mutações otimistas** para aguardar a API e tratar erro — ver C2.
4. **Reestruturar a navegação por papel** (IA clara + destino pós-login por papel) — ver C1/manual 03.
5. **Enxugar o visual** (menos gradientes/animações de fundo; foco institucional) — ver C3.
6. **Blindar a jornada do externo** (linear, sem menu, OTP com feedback e sem storage local) — ver C4.
7. **Decidir o destino do Roadmap/Neon** (separar ou documentar como módulo à parte) — ver B3.
8. **Unificar componentes duplicados** supervisor/workflow — ver C6.
9. Aplicar as correções de back-end P0/P1 dos manuais 01 e 04 (segurança e bugs) — pré-requisito de tudo.

---

### Referências cruzadas
- Manual 01 — segurança do back-end CAv4/Entra.
- Manual 02 — performance e correções do front-end de auth.
- Manual 03 — SSO silencioso e redirecionamento por papel.
- Manual 04 — análise do domínio de compartilhamento (4 papéis).
- **Manual 05 (este)** — UX/front-end + reavaliação de uso do back-end.
