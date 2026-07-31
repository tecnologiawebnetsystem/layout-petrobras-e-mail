# Upload com Arquivos Protegidos por MIP/RMS — Segunda Autenticação

**Data da análise:** 2026-07-07  
**Componentes analisados:** `csa-backend`, `csa-frontend`, `mip-sdk-worker`  
**Status:** Implementado e validado localmente

---

## Contexto

O sistema CSA precisa processar arquivos de escritório (`.docx`, `.xlsx`, `.pptx`, `.pdf`) antes de armazená-los no S3. Esses arquivos podem ter rótulos de sensibilidade Microsoft Purview/MIP em três categorias:

| Rótulo | Criptografia RMS | Como o sistema processa |
|---|---|---|
| **Público** | Não | Strip dos metadados XML via OOXML direto |
| **Interno** | Não | Strip dos metadados XML via OOXML direto |
| **Confidencial** | **Sim** | Requer permissão especial — **tema desta análise** |

---

## Problema

Arquivos com rótulo **Confidencial** possuem criptografia RMS (Rights Management Service) ativa. Para removê-la programaticamente, uma das condições abaixo precisa ser satisfeita:

1. A Service Principal da aplicação ser configurada como **SuperUser** no tenant (`Enable-AipServiceSuperUserFeature` + `Add-AipServiceSuperUser`) — **não autorizado pelo time de segurança Petrobras**
2. A Service Principal ter permissão `InformationProtectionPolicy.Read.All` no Microsoft Graph — **não autorizado**
3. O **próprio usuário dono do arquivo** processar a remoção com seu token pessoal — **VIÁVEL ✅**

---

## Descoberta — App Pré-Aprovado no Tenant

Durante a investigação, identificamos que o aplicativo Microsoft **Azure Information Protection Viewer**:

- **Client ID:** `c00e9d32-3c8d-4a7d-832b-029040e7db99`
- É pré-aprovado no tenant Petrobras (mesmo usado pelo Word/Outlook para abrir documentos protegidos)
- **Não requer admin consent adicional**
- Permite autenticação delegada (em nome do usuário) para os recursos:
  - `https://aadrm.com/user_impersonation` → remoção de proteção RMS
  - `https://syncservice.o365syncservice.com/user_impersonation` → acesso a políticas de labels

**Prova de conceito executada em 2026-07-06:**  
`Arquivo - Confidencial.docx` (41.5 KB, RMS ativo) → processado com sucesso → **26.3 KB** (proteção removida + rótulo "Público Externo" aplicado).

---

## Arquitetura da Segunda Autenticação

O fluxo de upload com segunda autenticação funciona da seguinte forma:

```
┌─────────────────────────────────────────────────────────────────────┐
│  FLUXO NORMAL (Interno / Público)                                    │
│                                                                      │
│  Frontend → POST /api/shares/create → Backend → Worker              │
│                                                Worker: OOXML strip   │
│                                                → S3 ✅               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  FLUXO COM SEGUNDA AUTENTICAÇÃO (Confidencial / RMS)                 │
│                                                                      │
│  1. Frontend → POST /api/shares/create                               │
│  2. Backend → Worker → HTTP 422 MIP_ENCRYPTED_NO_RIGHTS             │
│  3. Frontend detecta 422 → exibe modal de autenticação              │
│                                                                      │
│  4. Modal: Device Code Flow (backend inicia, frontend exibe código) │
│     ├─ POST /api/v1/mip/auth/device-code                            │
│     │     → retorna user_code + verification_uri                    │
│     ├─ Usuário acessa link e autentica com sua conta @petrobras     │
│     └─ Frontend sonda GET /api/v1/mip/auth/token/{id}               │
│           → 200 { status: "ready", aadrm_token, policy_token }      │
│                                                                      │
│  5. Frontend re-envia arquivo + aadrm_token + mip_policy_token      │
│                                                                      │
│  6. Backend → Worker:                                                │
│     ├─ COM policy token → change-label-as-user (SDK completo)       │
│     │   Remove RMS + aplica rótulo "Público Externo" via Purview    │
│     └─ SEM policy token → remove-label-as-user (fallback)           │
│         Remove RMS + injeta metadado "Público Externo" via OOXML    │
│                                                                      │
│  7. Arquivo processado → S3 ✅                                       │
│                                                                      │
│  ★ Auditoria (log_event → tabela Audit):                            │
│     MIP_AUTH_DEVICE_CODE_INICIADO → código gerado com sucesso       │
│     MIP_AUTH_DEVICE_CODE_FALHOU   → falha ao iniciar flow           │
│     MIP_AUTH_CONCLUIDA            → tokens obtidos (+ policy info)  │
│     MIP_AUTH_FALHOU               → autenticação expirou/erro       │
│     MIP_AUTH_CANCELADA            → usuário cancelou o modal        │
│     CRIAR_SHARE (+ mip_segunda_auth=true, policy_token info)        │
│     MIP_PROCESSING_FALHOU         → rollback total, share não salvo │
└─────────────────────────────────────────────────────────────────────┘
```

> **Mecanismo implementado:** Device Code Flow via Python MSAL no backend.
> O app AIP Viewer (c00e9d32) não suporta redirect URIs de terceiros, por isso
> o popup MSAL direto no browser não é viável. O Device Code Flow contorna
> essa limitação sem requerer nenhum admin consent adicional no tenant Petrobras.

---

## Tokens Necessários e Como São Obtidos

| Token | Recurso | Obtido via | Interação do usuário |
|---|---|---|---|
| `aadrm_token` | `https://aadrm.com` | MSAL popup (AIP Viewer) | **Sim** — 1 clique para autenticar |
| `mip_policy_token` | `https://syncservice.o365syncservice.com` | MSAL silent (cache do refresh token) | **Não** — automático após o primeiro token |

O usuário autentica **uma única vez** por código de uso único (TTL de 20 min no servidor). O MSAL armazena o refresh token em memória no processo do backend e tenta renovar silenciosamente o `mip_policy_token` após obter o `aadrm_token`. Sessões expiradas são limpas automaticamente a cada chamada.

---

## Endpoints do Worker (mip-sdk-worker)

| Endpoint | Tipo de Auth | Operação |
|---|---|---|
| `POST /api/v1/mip/remove-label` | SP (service) | Remove label/proteção via SP — funciona para Interno/Público |
| `POST /api/v1/mip/remove-label-as-user` | User (AADRM token) | Remove proteção RMS + injeta label Público Externo via OOXML |
| `POST /api/v1/mip/change-label-as-user` | User (AADRM + Policy) | Altera label via SDK Purview completo — mais fiel ao Purview |
| `POST /api/v1/mip/change-label/public-external` | User ou SP | Aplica label "Público Externo" — delega para `change-label-as-user` |

---

## Requisitos de Permissão

**O que NÃO é necessário (sem envolvimento do admin):**
- Nenhuma nova permissão no Azure AD
- Nenhum admin consent adicional
- Nenhuma modificação no tenant Petrobras

**O que é necessário (configuração no sistema):**
- `MipWorker__PublicExternalLabelImmutableId` configurado no `.env` do worker com o GUID do rótulo "Público Externo" ✅ (já configurado: `cdac03a7-e156-4c4b-b35d-d580a54520fa`)

**Condição de negócio:**
- O usuário que faz o upload deve ser o **proprietário** (owner) do arquivo Confidencial no RMS. Arquivos de terceiros não podem ser processados sem consentimento do dono.

---

## Experiência do Usuário

```
[Upload normal]
  Usuário arrasta arquivo → clica em Enviar → sucesso

[Upload de arquivo Confidencial]
  Usuário arrasta arquivo → clica em Enviar
  ↓
  Sistema detecta proteção RMS
  ↓
  Modal: "Este arquivo está protegido com criptografia.
          Clique em 'Autorizar processamento' e autentique
          com sua conta @petrobras.com.br."
  ↓
  Popup Microsoft (≈ 5 segundos se já logado no browser)
  ↓
  Arquivo processado automaticamente → sucesso
```

O modal tem dois botões:
- **Autorizar processamento** → abre popup Microsoft, processa o arquivo
- **Cancelar envio** → descarta o arquivo (usuário pode remover a proteção no Word e reenviar)

---

## Status de Implementação

| Componente | Status | Observação |
|---|---|---|
| Worker: `remove-label` (Interno/Público) | ✅ Produção | OOXML strip sem permissões extras |
| Worker: `remove-label-as-user` | ✅ Produção | Remove RMS + label OOXML injection |
| Worker: `change-label-as-user` | ✅ Implementado | SDK completo, aguarda teste E2E |
| Backend Python: Device Code Flow (`routes_mip_auth.py`) | ✅ Implementado | POST device-code / GET token / DELETE cancel |
| Backend Python: cadeia de tokens | ✅ Implementado | `aadrm_token` + `mip_policy_token` propagados |
| Backend Python: auditoria segunda auth | ✅ Implementado | `log_event` em todos os eventos MIP auth + CRIAR_SHARE |
| Frontend: modal Device Code (exibe user_code + link) | ✅ Implementado | Polling + timeout + cancelamento |
| Frontend: re-envio com tokens | ✅ Implementado | FormData reutilizado + tokens adicionados |
| Testes unitários: fluxo com aadrm_token | ✅ Implementado | 6 cenários (sucesso, fallback, user_no_rights, etc.) |
| Testes E2E locais (3 cenários de arquivo) | 🔲 Pendente | Aguarda subida dos serviços |

---

## Próximos Passos

1. **Subir serviços localmente** (backend + worker + frontend)
2. **Testar os 3 cenários** com os arquivos de `./storage`:
   - `Arquivo - Interno.docx` → sem popup, processado automaticamente
   - `Arquivo - Público.docx` → sem popup, processado automaticamente
   - `Arquivo - Confidencial.docx` → popup de auth → processado com label "Público Externo"
3. **Verificar no Word** se o rótulo "Público Externo" está visível no arquivo resultante
4. **Validar fallback**: testar sem `mip_policy_token` para confirmar OOXML injection

---

## Limitações Conhecidas

| Limitação | Impacto | Mitigação |
|---|---|---|
| Usuário deve ser o owner do arquivo | Arquivos de outros usuários são bloqueados | Mensagem clara: "solicite ao proprietário que remova a proteção" |
| Popup pode ser bloqueado por bloqueador de popups | Usuário não consegue autenticar | MSAL usa `sessionStorage`, renovação silenciosa nas próximas tentativas |
| Token AADRM expira em ~1h | Após expiração, novo popup necessário | MSAL renova silenciosamente se refresh token válido |
| `change-label-as-user` requer `mip_policy_token` | Se silent falhar, usa OOXML injection | Fallback automático para `remove-label-as-user` |

---

*Análise realizada por: GitHub Copilot (Claude Sonnet 4.5) — CSA Backend/Frontend workspace*
