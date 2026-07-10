# 🔐 Mapeamento de Roles e Permissions

## 📌 Visão Geral
Este documento descreve o modelo de **controle de acesso (RBAC)** identificado no sistema, incluindo:
- Perfis de usuário (_Roles_)
- Permissões associadas (_Permissions_)
- Mecanismos de autenticação e autorização

---

# 🎭 Roles (Perfis de Usuário)

## 1. 🛡️ Admin (Super Administrador Global)
- **Identificador:** `is_admin = True` (model `user.py`)
- **Rota:** `routes_admin.py`
- **Tag:** `Admin`

### 🧾 Descrição
Usuário com acesso **irrestrito** ao sistema, incluindo administração global.

---

## 2. 👨‍💼 Supervisor
- **Identificador:** Tabela `AreaSupervisors` (`models/areasupervisors.py`)
- **Relacionamento:** N:N entre usuários e áreas
- **Rota:** `routes_supervisor.py`
- **Tag:** `Supervisor`

### 🧾 Descrição
Usuário responsável por:
- Aprovar ou rejeitar compartilhamentos
- Atuar sobre áreas específicas

---

## 3. 🧑‍💻 Internal User (Usuário Interno)
- **Autenticação:**
  - CAv4 (OIDC/PKCE)
  - Credenciais locais (modo dev)
- **Token:** JWT Bearer
- **Rotas:**
  - `routes_users`
  - `routes_files`
  - `routes_shares`
  - `routes_notifications`
  - `routes_audit`
  - `routes_emails`
  - `routes_areas`

### 🧾 Descrição
Colaborador autenticado com acesso às funcionalidades principais do sistema.

---

## 4. 🌐 External User (Usuário Externo via OTP)
- **Autenticação:** OTP via e-mail
- **Escopo:** Acesso restrito a um compartilhamento específico
- **Rotas:**
  - `routes_external`
  - `routes_external_auth`
  - `routes_download`

### 🧾 Descrição
Usuário externo sem vínculo interno, com acesso limitado ao download de arquivos.

---

# 🔐 Permissions (Permissões por Role)

| Permissão / Ação                         | Admin | Supervisor | Internal User | External User |
|----------------------------------------|:-----:|:----------:|:-------------:|:-------------:|
| Acesso ao painel administrativo global | ✅    | ❌         | ❌            | ❌            |
| Gerenciar usuários (CRUD)              | ✅    | ❌         | ❌            | ❌            |
| Gerenciar áreas/departamentos          | ✅    | ❌         | ❌            | ❌            |
| Aprovar / rejeitar compartilhamentos   | ✅    | ✅         | ❌            | ❌            |
| Criar compartilhamentos (shares)       | ✅    | ✅         | ✅            | ❌            |
| Upload de arquivos                     | ✅    | ✅         | ✅            | ❌            |
| Visualizar notificações                | ✅    | ✅         | ✅            | ❌            |
| Consultar logs de auditoria            | ✅    | ✅         | ✅            | ❌            |
| Visualizar histórico de e-mails        | ✅    | ✅         | ✅            | ❌            |
| Autenticar via CAv4 (OIDC)             | ✅    | ✅         | ✅            | ❌            |
| Autenticar via credenciais locais      | ✅    | ✅         | ✅            | ❌            |
| Validar OTP                           | ❌    | ❌         | ❌            | ✅            |
| Download de arquivos                  | ❌    | ❌         | ❌            | ✅            |

---

# 🏗️ Arquitetura de Autorização

## 🔍 Camadas de Controle
A verificação de permissões está centralizada em:

- `utils/authz.py`
- `services/authorization_service.py`

### ✅ Responsabilidades
- Avaliação de roles
- Validação de permissões
- Aplicação de regras de negócio

---

## 🧩 Modelo de Privilégios

### 🔹 Elevação de Privilégio
- Baseada exclusivamente no campo:
🔸 Supervisores

Gerenciados via tabela AreaSupervisors
Permite:

Multi-área
Flexibilidade de domínio




🌐 Autenticação de Usuários Externos

Implementação: deps/external_auth.py
Método:

OTP (One-Time Password)
Token de sessão temporário



🔐 Características

Escopo restrito
Sem acesso ao sistema interno
Sessão efêmera


🔗 Integração com Microsoft

Serviço: graph_service.py
Integração opcional com:

Microsoft Graph
Entra ID



🎯 Objetivo

Enriquecimento de dados do usuário interno
Sincronização de identidade


⚠️ Observações Importantes

O sistema segue modelo RBAC (Role-Based Access Control)
Não há granularidade por permission claim (ex: scopes dinâmicos)
A distinção de privilégio ocorre via:

Flag (is_admin)
Relacionamento (AreaSupervisors)


Usuários externos possuem fluxo separado (zero trust simplificado)