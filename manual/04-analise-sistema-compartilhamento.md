# Análise do Sistema de Compartilhamento de Arquivos — CAV4 / Entra ID

> Documento de análise (diagnóstico). **Nenhum código foi alterado.** O objetivo
> é mapear o que existe, o que falta, o que está errado e o que pode ser refeito
> no fluxo de compartilhamento de arquivos da Petrobras, cobrindo back-end e
> front-end e os quatro papéis do sistema.

---

## 1. Visão geral do sistema

Sistema de **compartilhamento seguro de arquivos** com destinatários externos,
com fluxo de aprovação hierárquica e trilha de auditoria. Quatro papéis:

| Papel | Descrição | Ação principal |
|-------|-----------|----------------|
| **Remetente (interno)** | Colaborador Petrobras autenticado (CAv4/Entra) | Cria o compartilhamento e envia arquivos |
| **Supervisor** | Gestor do remetente (`manager_id`) | Aprova / rejeita / estende o compartilhamento |
| **Usuário externo** | Destinatário fora da Petrobras | Autentica por OTP e faz download |
| **Admin** | Administrador do sistema | Vê todos os logs, usuários e compartilhamentos |

### Ciclo de vida do compartilhamento (Share)

```
PENDING ──(supervisor aprova)──> ACTIVE ──(downloads)──> [expira] ──> EXPIRED
   │                                  
   └──(supervisor rejeita)──> REJECTED
   │
   └──(remetente cancela)──> CANCELED

Se o remetente for supervisor OU tiver cargo em AUTO_APPROVE_JOB_TITLES:
PENDING ──(auto-aprovação)──> ACTIVE  (sem passar por aprovação de terceiros)
```

O fluxo do externo: `verify (e-mail)` → recebe **OTP por e-mail** → `authenticate (OTP)`
→ recebe **token de acesso (1h)** → `lista arquivos` → `gera URL pré-assinada S3` (5 min) → download.

**Observação positiva:** a arquitetura geral é sólida — separação de camadas
(models / services / routes), auditoria em cada ação, transação atômica no upload
(MIP → S3 → banco com rollback e limpeza de objetos órfãos), OTP com hash +
bloqueio por tentativas, URLs S3 pré-assinadas de curta duração, e desativação
automática de usuários quando não há mais shares vivos. O diagnóstico abaixo é
sobre os pontos a corrigir, não uma condenação do conjunto.

---

## 2. Achados por severidade

### P0 — Críticos (segurança / quebra de fluxo). Corrigir imediatamente.

| # | Arquivo | Problema |
|---|---------|----------|
| P0-1 | `backend/app/api/v1/routes_shares.py` (`create_with_upload`, ~linha 184) | **Endpoint SEM autenticação.** `POST /shares/create` — a rota que a tela de upload realmente usa — não tem `Depends(require_internal)` nem `get_current_user`. Qualquer pessoa sem login pode criar compartilhamentos e disparar e-mails/uploads. |
| P0-2 | `backend/app/api/v1/routes_shares.py` (`create_with_upload`) | **`created_by_id` vem do corpo enviado pelo cliente** (`created_by_id=payload_obj.created_by_id`). Mesmo com login, um usuário pode criar shares *em nome de outro* (falsificação de identidade / IDOR). O correto é derivar do usuário autenticado (`user.id`), como já é feito no `create_share_endpoint` (POST `/`). |
| P0-3 | `backend/app/api/v1/routes_shares.py` (linhas ~217-311) | **Bug de runtime:** várias linhas usam `payload.obj.*` em vez de `payload_obj.*`. Como `payload` é uma `str` (campo `Form`), isso lança `AttributeError` → **HTTP 500 em todo upload** que passe da primeira linha. Afeta `expiration_hours`, `name`, `description`, `consumption_policy`, `file_ids`, `external_email` etc. |
| P0-4 | `backend/app/api/v1/routes_admin.py` (`admin_mip_diagnostico`, ~linha 624) | **Endpoint `/admin/mip-diagnostico` sem `require_admin`.** Em FastAPI o prefixo `/admin` **não** aplica autenticação; cada rota precisa da dependência. Expõe config do MIP SDK (base URL, se há token, TLS) a qualquer um. |

> **Nota importante sobre P0-1/P0-2/P0-3:** eles se contradizem — se P0-3 realmente
> lança 500, o upload "não funciona" hoje pela via `/shares/create`. Vale confirmar
> em execução qual endpoint a tela usa de fato e se há algum tratamento genérico
> mascarando o erro. De todo modo, os três precisam ser corrigidos juntos:
> adicionar `require_internal`, usar `user.id` e trocar `payload.obj` por `payload_obj`.

### P1 — Bugs funcionais / inconsistências de regra de negócio

| # | Local | Problema |
|---|-------|----------|
| P1-1 | `token_service.issue_otp` vs `routes_download.verify_email` | Inconsistência de status: `verify_email` procura shares `APPROVED`+`ACTIVE`, mas `issue_otp` só aceita `ACTIVE`. Um share `APPROVED` (mas não `ACTIVE`) faz o `verify` dizer "OTP enviado" e o `issue_otp` recusar — usuário fica sem código. Padronizar a lista de status em um único lugar. |
| P1-2 | `token_service.issue_otp` | Divergência de validade: `verify_email` chama com `validity_minutes=5` e responde `expires_in: 300`, mas o default do `issue_otp` é 10 min e o texto de outras telas fala 5/10 min. Centralizar num setting. |
| P1-3 | `models/share.py` (`ShareStatus`) | Há **7 status** (`PENDING/ACTIVE/APPROVED/REJECTED/COMPLETED/EXPIRED/CANCELED`) mas o fluxo usa efetivamente `PENDING→ACTIVE`. `APPROVED`, `COMPLETED` e `EXPIRED` são referenciados de forma inconsistente (ex.: aprovação seta `ACTIVE`, não `APPROVED`; nada seta `COMPLETED`/`EXPIRED` automaticamente). Definir a máquina de estados real e remover/normalizar o resto. |
| P1-4 | `routes_download.py` | Não há um job que marque shares vencidos como `EXPIRED` nem que gere `COMPLETED` quando todos os arquivos foram baixados — a expiração só é observada via `expires_at > now` nas queries. Falta o `run-cleanup` cobrir isso de forma agendada (existe `POST /admin/run-cleanup` manual). |
| P1-5 | `supervisor.extend` | Limita extensão a 72h por chamada, mas não limita o total acumulado nem revalida contra política de retenção. Um supervisor pode estender repetidamente. |
| P1-6 | `routes_shares.py` (`create_with_upload`) | A auto-aprovação por supervisor é decidida por `creator.is_supervisor`, enquanto o `create_share` usa `has_auto_approve_job_title` + `is_admin`. Duas regras de auto-aprovação diferentes no mesmo fluxo. Unificar. |

### P2 — Melhorias de robustez e segurança (defesa em profundidade)

| # | Tema | Recomendação |
|---|------|--------------|
| P2-1 | Antivírus / conteúdo | O bloqueio de extensões perigosas está **só no front-end** (`upload/page.tsx`). Precisa ser reforçado no back-end (o MIP trata rótulo/classificação, não necessariamente malware). Validar extensão/MIME e, idealmente, varredura AV no servidor. |
| P2-2 | Rate limiting | `download/verify` e `download/authenticate` são endpoints públicos. Há bloqueio por tentativas no OTP, mas não há rate-limit por IP no envio de OTP (risco de flood de e-mails / enumeração por timing). |
| P2-3 | Limite de upload | Não há limite explícito de tamanho/quantidade de arquivos no back-end. O ZIP limita a 50, mas o upload não. Definir limites e devolver 413. |
| P2-4 | Autorização do supervisor | A autoridade é `creator.manager_id == user.id`. Se o `manager_id` estiver desatualizado (sincronização AD/Graph), a aprovação pode ficar presa ou ir para o gestor errado. Falta fallback/裁 auditável quando o supervisor não existe mais. |
| P2-5 | Auditoria | `log_event` faz `session.commit()` internamente — isso pode **commitar parcialmente** uma transação de negócio em andamento (ex.: dentro de `create_share`). Auditoria deveria usar sessão/transação separada ou `flush` controlado para não interferir no rollback. |
| P2-6 | Idempotência | Criar share não tem chave de idempotência; um duplo clique/retry de rede pode gerar shares e e-mails duplicados. |

### P3 — Qualidade / manutenção

- Endpoints legados em `routes_supervisor.py` (`/shares/{id}/approve`) convivem com os novos (`/approve/{id}`) — documentar depreciação e remover.
- Muitos blocos repetem "contar pendentes → desativar externo" (em `get_download_files`, `get_download_url`, `download_files_zip`). Extrair para um único helper no `token_service`.
- `send_id_email` é um mock (`print`) ainda presente no `token_service`; remover para evitar uso acidental.
- Tipos de status em português (`"pendente"`, `"ativo"`) misturam idioma com o resto do código — ok manter, mas documentar o dicionário.

---

## 3. Análise por papel

### 3.1 Remetente (interno)
- **Front:** `app/upload/page.tsx` + `ProtectedRoute(["internal","supervisor"])`. Envia via `XHR` para `/api/shares/create` com progresso real (bom UX).
- **Problemas:** envia `created_by_id` no payload (P0-2); validação de extensão só no cliente (P2-1); guarda de rota é client-side apenas (ver seção 4).
- **Falta:** feedback de "aguardando aprovação" com status real via polling/SWR; reenvio de notificação já existe no back (`/{id}/resend-notification`) — confirmar se exposto na UI.

### 3.2 Supervisor
- **Back:** `routes_supervisor.py` — `pending`, `approve/{id}`, `reject/{id}`, `extend/{id}` com verificação de autoridade (`creator.manager_id == user.id`). Bem auditado.
- **Problemas:** duas regras de auto-aprovação (P1-6); extensão sem teto acumulado (P1-5); desativação do supervisor após aprovar (`deactivate_supervisor_if_no_pending`) pode revogar acesso de um supervisor legítimo que ainda vai receber novos pedidos — revisar se é o comportamento desejado.

### 3.3 Usuário externo
- **Back:** `routes_download.py` + `token_service.py`. Fluxo OTP → token → URL pré-assinada é sólido e anti-enumeração ("resposta genérica"). ZIP com nomes únicos e limite de 50.
- **Problemas:** inconsistência `APPROVED`/`ACTIVE` (P1-1); sem rate-limit no envio de OTP (P2-2); a marcação `downloaded=True` acontece ao **gerar a URL**, não ao baixar de fato — se o download falhar no S3, o arquivo consta como baixado (registrar como "URL emitida" e confirmar download é mais preciso).

### 3.4 Admin
- **Back:** `routes_admin.py` — dashboard, `users`, `shares`, `logs` (com filtros/paginação/busca), `tracking`, `toggle admin`, `actions`, `run-cleanup`. Cobertura boa.
- **Problemas:** `mip-diagnostico` sem auth (P0-4); `toggle_admin` — confirmar proteção contra o admin remover o próprio acesso e ficar sem nenhum admin no sistema; exportação de logs (CSV) não parece existir — comum para auditoria/compliance.

---

## 4. Back-end vs Front-end — pontos transversais

### Back-end
- **Autenticação inconsistente entre rotas do mesmo recurso:** `POST /shares/` exige `require_internal`; `POST /shares/create` não exige nada (P0-1). Padronizar: **toda** rota de escrita deve depender do usuário autenticado e derivar identidade do token, nunca do corpo.
- **`log_event` commitando dentro de transações** (P2-5) — risco de persistência parcial.
- **Máquina de estados do Share** precisa ser formalizada (P1-3/P1-4).

### Front-end
- **Guardas de rota são apenas client-side** (`ProtectedRoute`, `useEffect` + `router.push`). Isso protege a navegação, mas **não protege os dados** — a segurança real depende 100% do back-end validar o token e o papel em cada endpoint. Como P0-1 mostra que nem toda rota valida, o front dá uma falsa sensação de proteção.
- **Confiança em `user.id` do store** para montar payloads (o upload envia `created_by_id`). O ID nunca deveria sair do cliente para fins de autorização.
- **Sem revalidação de sessão no servidor ao entrar em página protegida** (ligado à análise de SSO do documento `03`).

---

## 5. O que falta / o que pode ser refeito

**Refazer (prioridade):**
1. Unificar a criação de share em **um único endpoint autenticado** que deriva `created_by_id` do token, com validação de arquivos no servidor, corrigindo P0-1/P0-2/P0-3 de uma vez.
2. Formalizar a **máquina de estados do Share** e um **job agendado** de expiração/conclusão (P1-3/P1-4).
3. Centralizar **status válidos e validade de OTP** em settings, eliminando as divergências `verify`↔`issue_otp` (P1-1/P1-2).
4. Extrair a lógica repetida de "desativar externo quando não há pendências" para um helper único (P3).

**Falta (implementar):**
- `require_admin` no `mip-diagnostico` (P0-4).
- Validação de extensão/MIME e limites de tamanho no back-end (P2-1/P2-3).
- Rate limiting nos endpoints públicos de download/OTP (P2-2).
- Exportação de logs (CSV/JSON) para o admin e proteção do "último admin".
- Idempotência na criação de share (P2-6).

---

## 6. Resumo executivo

O sistema tem uma **base arquitetural boa** (camadas, auditoria, transação atômica
no upload, OTP robusto, URLs S3 efêmeras). Os riscos concentram-se em **três pontos
críticos no mesmo endpoint de upload** (`/shares/create` sem autenticação, confiança
no `created_by_id` do cliente e o bug `payload.obj`), além de um **endpoint admin de
diagnóstico exposto**. No plano funcional, a **máquina de estados do Share** e a
**consistência de status entre verify/OTP** são as principais fontes de bugs. No
front-end, as guardas são apenas visuais — a segurança precisa morar no back-end,
que hoje não valida uniformemente. Corrigidos os P0 e P1, o sistema fica coerente e
seguro para o fluxo de quatro papéis descrito.

---

### Índice dos documentos do `manual/`
- `01-analise-backend-cav4-entra.md` — back-end de autenticação (CAv4/Entra).
- `02-analise-frontend-cav4-entra.md` — front-end de autenticação e performance.
- `03-sso-silencioso-cav4.md` — auto-login/SSO silencioso ao acessar a URL.
- `04-analise-sistema-compartilhamento.md` — **este documento** (domínio de compartilhamento).
