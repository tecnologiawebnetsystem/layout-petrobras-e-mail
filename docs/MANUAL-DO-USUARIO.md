# Manual do Usuario - Sistema de Transferencia Segura de Arquivos

## Petrobras - Solucao de Compartilhamento de Arquivos Confidenciais

---

## Sumario

1. [Visao Geral do Sistema](#1-visao-geral-do-sistema)
2. [Perfis de Usuario](#2-perfis-de-usuario)
   - [Usuario Interno](#21-usuario-interno)
   - [Usuario Supervisor](#22-usuario-supervisor)
   - [Usuario Externo](#23-usuario-externo)
   - [Admin Global](#24-admin-global)
3. [Fluxo de Compartilhamento](#3-fluxo-de-compartilhamento)
4. [Guia do Usuario Interno](#4-guia-do-usuario-interno)
5. [Guia do Supervisor](#5-guia-do-supervisor)
6. [Guia do Usuario Externo](#6-guia-do-usuario-externo)
7. [Guia do Admin Global](#7-guia-do-admin-global)
8. [Auditoria e Logs](#8-auditoria-e-logs)
9. [Perguntas Frequentes](#9-perguntas-frequentes)

---

## 1. Visao Geral do Sistema

O **Sistema de Transferencia Segura de Arquivos** da Petrobras e uma solucao corporativa desenvolvida para permitir o compartilhamento seguro de documentos confidenciais entre colaboradores internos e parceiros externos.

### Principais Caracteristicas

- **Seguranca**: Criptografia de ponta a ponta, armazenamento seguro na AWS S3
- **Rastreabilidade**: Todas as acoes sao registradas em logs de auditoria
- **Controle de Acesso**: Aprovacao obrigatoria por supervisores
- **Expiracao Automatica**: Links expiram automaticamente apos o prazo definido
- **Autenticacao Dupla**: SSO Microsoft Entra ID para internos, OTP por e-mail para externos

### Arquitetura de Seguranca

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE COMPARTILHAMENTO                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Usuario Interno]                                              │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│   │   Upload    │───▶│  Supervisor  │───▶│ Usuario Externo │   │
│   │  Arquivos   │    │   Aprova     │    │    Download     │   │
│   └─────────────┘    └──────────────┘    └─────────────────┘   │
│         │                   │                     │             │
│         ▼                   ▼                     ▼             │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              AWS S3 (Armazenamento Seguro)              │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Perfis de Usuario

O sistema possui 4 perfis de usuario, cada um com permissoes especificas:

### 2.1 Usuario Interno

| Atributo | Descricao |
|----------|-----------|
| **Quem e** | Colaborador Petrobras com conta no Microsoft Entra ID |
| **Autenticacao** | SSO (Single Sign-On) via Microsoft Entra ID |
| **Funcoes** | Upload de arquivos, criar compartilhamentos, acompanhar status |
| **Restricoes** | Compartilhamentos precisam de aprovacao do supervisor |

**Menus Disponiveis:**
- Upload de Arquivos
- Meus Compartilhamentos
- Historico
- Auditoria (somente visualizacao dos proprios registros)

---

### 2.2 Usuario Supervisor

| Atributo | Descricao |
|----------|-----------|
| **Quem e** | Gestor/Lider com subordinados diretos no Active Directory |
| **Autenticacao** | SSO (Single Sign-On) via Microsoft Entra ID |
| **Funcoes** | Todas do usuario interno + aprovar/rejeitar compartilhamentos |
| **Privilegios** | Compartilhamentos proprios sao auto-aprovados |

**Menus Disponiveis:**
- Painel do Supervisor (Aprovacoes)
- Compartilhar (Upload com auto-aprovacao)
- Meus Compartilhamentos
- Auditoria (visualizacao dos logs da equipe)
- Historico

---

### 2.3 Usuario Externo

| Atributo | Descricao |
|----------|-----------|
| **Quem e** | Parceiro, fornecedor ou terceiro que recebe arquivos |
| **Autenticacao** | OTP (One-Time Password) enviado por e-mail |
| **Funcoes** | Acessar e baixar arquivos compartilhados |
| **Restricoes** | Acesso temporario, somente aos arquivos destinados a ele |

**Menus Disponiveis:**
- Download de Arquivos

---

### 2.4 Admin Global

| Atributo | Descricao |
|----------|-----------|
| **Quem e** | Administrador do sistema com acesso total |
| **Autenticacao** | SSO via Microsoft Entra ID + flag de admin no banco |
| **Funcoes** | Acesso completo a todas as funcionalidades e dados |
| **Privilegios** | Visualizar todos os usuarios, compartilhamentos e logs |

**Menus Disponiveis:**
- Dashboard (Metricas gerais)
- Usuarios (Gestao completa de usuarios)
- Compartilhamentos (Todos os shares do sistema)
- Logs (Auditoria completa)
- Rastreamento (Tracking por usuario)

---

## 3. Fluxo de Compartilhamento

### Diagrama do Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE COMPARTILHAMENTO                         │
└─────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   INTERNO    │
    │   faz upload │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   Arquivos   │
    │  salvos S3   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐         ┌──────────────┐
    │    Share     │────────▶│    E-mail    │
    │   criado     │         │ p/ Supervisor│
    │  (PENDING)   │         └──────────────┘
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Supervisor  │
    │   analisa    │
    └──────┬───────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌─────────┐
│ APROVA  │ │ REJEITA │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────┐ ┌─────────┐
│ Status: │ │ Status: │
│APPROVED │ │REJECTED │
└────┬────┘ └─────────┘
     │
     ▼
┌──────────────┐
│    E-mail    │
│ p/ Externo   │
│  com link    │
└──────┬───────┘
     │
     ▼
┌──────────────┐
│   Externo    │
│ clica link   │
└──────┬───────┘
     │
     ▼
┌──────────────┐
│  Verificacao │
│     OTP      │
└──────┬───────┘
     │
     ▼
┌──────────────┐
│   Download   │
│   liberado   │
└──────────────┘
```

### Estados de um Compartilhamento

| Status | Descricao | Cor |
|--------|-----------|-----|
| `pending` | Aguardando aprovacao do supervisor | Amarelo |
| `approved` | Aprovado, link enviado ao externo | Verde |
| `rejected` | Rejeitado pelo supervisor | Vermelho |
| `cancelled` | Cancelado pelo criador | Cinza |
| `expired` | Prazo de download expirado | Cinza |

---

## 4. Guia do Usuario Interno

### 4.1 Acessando o Sistema

1. Acesse a URL do sistema
2. Clique em **"Entrar com Microsoft"**
3. Faca login com suas credenciais corporativas
4. Voce sera redirecionado para a tela de **Upload de Arquivos**

### 4.2 Tela de Upload de Arquivos

Esta e a tela principal do usuario interno. Aqui voce pode:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRANSFERENCIA SEGURA DE ARQUIVOS                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  METRICAS                                                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │ │
│  │  │  Total   │ │Aguardando│ │ Aprovados│ │Rejeitados│              │ │
│  │  │    12    │ │    3     │ │    8     │ │    1     │              │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  APROVADOR                                                         │ │
│  │  Nome: Joao Silva (seu supervisor direto)                          │ │
│  │  E-mail: joao.silva@petrobras.com.br                               │ │
│  │  Cargo: Gerente de Projetos                                        │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  DESTINATARIO EXTERNO                                              │ │
│  │  [                    cliente@empresa.com                        ] │ │
│  │  O destinatario recebera um email com link seguro para download    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ANEXAR ARQUIVOS                                                   │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │                                                            │   │ │
│  │  │     Arraste arquivos aqui ou clique para selecionar        │   │ │
│  │  │                                                            │   │ │
│  │  │     Formatos aceitos: PDF, DOC, XLS, PPT, ZIP, imagens     │   │ │
│  │  │     Tamanho maximo: 100MB por arquivo                      │   │ │
│  │  │                                                            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  TEMPO DE DISPONIBILIDADE                                          │ │
│  │  [ 168 horas (7 dias)                                         ▼ ] │ │
│  │  Os arquivos ficarao disponiveis por 168 horas apos aprovacao      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  DESCRICAO DO ENVIO (obrigatorio)                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │ Descreva o conteudo e a finalidade dos arquivos...         │   │ │
│  │  │                                                            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                        [    Enviar para Aprovacao    ]  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Criando um Compartilhamento

**Passo a Passo:**

1. **Informe o e-mail do destinatario externo**
   - Digite o e-mail completo (ex: `cliente@empresa.com`)
   - O sistema valida se o formato do e-mail esta correto

2. **Anexe os arquivos**
   - Arraste os arquivos para a area indicada OU
   - Clique na area para abrir o seletor de arquivos
   - **Arquivos bloqueados por seguranca:** `.exe`, `.dll`, `.bat`, `.cmd`, `.com`, `.msi`, `.scr`, `.vbs`, `.ps1`, `.sh`

3. **Selecione o tempo de disponibilidade**
   - Escolha entre 24h ate 168h (7 dias)
   - Apos esse prazo, o link expira automaticamente

4. **Descreva o envio**
   - Campo obrigatorio
   - Explique o conteudo e a finalidade dos arquivos
   - Esta descricao sera visivel para o supervisor e o destinatario

5. **Clique em "Enviar para Aprovacao"**
   - Os arquivos sao enviados para o S3
   - O supervisor recebe um e-mail de notificacao
   - O status inicial e **"Aguardando Aprovacao"**

### 4.4 Tela de Meus Compartilhamentos

Acesse pelo menu **"Meus Compartilhamentos"** para:

- Ver todos os seus envios
- Filtrar por status (Aguardando, Aprovados, Rejeitados, Cancelados)
- Buscar por nome ou destinatario
- Ver detalhes de cada compartilhamento
- Cancelar compartilhamentos pendentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MEUS COMPARTILHAMENTOS                                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Total   │ │Aguardando│ │ Aprovados│ │Rejeitados│ │Cancelados│      │
│  │    15    │ │    2     │ │    10    │ │    2     │ │    1     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                                          │
│  [Buscar por nome, destinatario...]        [Atualizar]                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ● Relatorio Financeiro Q3                         [Aguardando]     │ │
│  │   Destinatario: parceiro@empresa.com                               │ │
│  │   Data: 23/05/2025 14:30                                           │ │
│  │   Arquivos: 3                        [Ver Detalhes] [Cancelar]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ● Contrato de Servicos                              [Aprovado]     │ │
│  │   Destinatario: juridico@fornecedor.com                            │ │
│  │   Data: 22/05/2025 10:15                                           │ │
│  │   Arquivos: 1                                   [Ver Detalhes]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Guia do Supervisor

### 5.1 Painel do Supervisor

Ao fazer login, supervisores sao direcionados para o **Painel do Supervisor**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PAINEL DO SUPERVISOR                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Gerencie aprovacoes, compartilhamentos e visualize logs do sistema      │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  METRICAS                                                        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │   │
│  │  │   Total    │ │ Pendentes  │ │ Aprovados  │ │ Rejeitados │    │   │
│  │  │ p/ Analise │ │            │ │            │ │            │    │   │
│  │  │     25     │ │     5      │ │     18     │ │     2      │    │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐                 │
│  │     APROVACOES         │  │     COMPARTILHAR       │                 │
│  │        (5)             │  │                        │                 │
│  └────────────────────────┘  └────────────────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Menu do Supervisor

| Menu | Funcao |
|------|--------|
| **Aprovacoes** | Lista de compartilhamentos pendentes de aprovacao |
| **Compartilhar** | Upload de arquivos com auto-aprovacao |
| **Auditoria** | Visualizacao dos logs da sua equipe |

### 5.3 Tela de Aprovacoes

Nesta tela voce visualiza todos os compartilhamentos que precisam da sua aprovacao:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  APROVACOES PENDENTES                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Buscar por nome, remetente, destinatario...]   [Status ▼] [Atualizar] │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ● Documentos Tecnicos do Projeto                    [Pendente]     │ │
│  │                                                                     │ │
│  │   Remetente: Maria Santos (maria.santos@petrobras.com.br)          │ │
│  │   Destinatario: engenheiro@fornecedor.com                          │ │
│  │   Solicitado: 23/05/2025 09:45                                     │ │
│  │   Arquivos: 5                                                       │ │
│  │                                                                     │ │
│  │                                              [Ver Detalhes ▶]      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ ● Orcamento Revisado                                [Pendente]     │ │
│  │                                                                     │ │
│  │   Remetente: Carlos Oliveira (carlos.oliveira@petrobras.com.br)    │ │
│  │   Destinatario: financeiro@parceiro.com                            │ │
│  │   Solicitado: 23/05/2025 08:20                                     │ │
│  │   Arquivos: 2                                                       │ │
│  │                                                                     │ │
│  │                                              [Ver Detalhes ▶]      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Tela de Detalhes do Compartilhamento

Ao clicar em **"Ver Detalhes"**, voce acessa informacoes completas:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DETALHES DO COMPARTILHAMENTO                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Nome: Documentos Tecnicos do Projeto                                    │
│  Status: Pendente                                                        │
│                                                                          │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│  │  REMETENTE                      │  │  DESTINATARIO                   │
│  │  Maria Santos                   │  │  engenheiro@fornecedor.com      │
│  │  maria.santos@petrobras.com.br  │  │                                 │
│  │  Depto: Engenharia              │  │                                 │
│  └─────────────────────────────────┘  └─────────────────────────────────┘
│                                                                          │
│  DESCRICAO:                                                              │
│  "Documentos tecnicos do projeto de modernizacao da plataforma P-50,     │
│   incluindo especificacoes e diagramas para revisao do fornecedor."      │
│                                                                          │
│  ARQUIVOS ANEXADOS:                                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  📄 especificacao-tecnica.pdf                           2.5 MB     │ │
│  │  📄 diagrama-processo.pdf                               1.8 MB     │ │
│  │  📊 planilha-materiais.xlsx                             500 KB     │ │
│  │  🖼️ foto-equipamento.jpg                                 3.2 MB     │ │
│  │  📄 cronograma.pdf                                       800 KB     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Tempo de disponibilidade: 168 horas (7 dias)                            │
│  Data da solicitacao: 23/05/2025 09:45                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  MOTIVO DA REJEICAO (se rejeitar)                                  │ │
│  │  ┌────────────────────────────────────────────────────────────┐   │ │
│  │  │                                                            │   │ │
│  │  └────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│              [  ✓ Aprovar Compartilhamento  ]  [  ✗ Rejeitar  ]         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.5 Aprovando ou Rejeitando

**Para Aprovar:**
1. Revise os detalhes e arquivos
2. Clique em **"Aprovar Compartilhamento"**
3. O destinatario externo recebe um e-mail com o link de acesso

**Para Rejeitar:**
1. Revise os detalhes
2. Preencha o motivo da rejeicao (obrigatorio)
3. Clique em **"Rejeitar"**
4. O remetente e notificado da rejeicao

### 5.6 Compartilhamento do Supervisor (Auto-Aprovacao)

Supervisores podem criar compartilhamentos que sao **automaticamente aprovados**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  COMPARTILHAR (Auto-aprovacao)                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ✓ APROVACAO AUTOMATICA                                            │ │
│  │  Como supervisor, este compartilhamento sera aprovado               │ │
│  │  imediatamente e o destinatario recebera acesso aos arquivos        │ │
│  │  assim que o envio for concluido.                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [Formulario igual ao do usuario interno...]                             │
│                                                                          │
│                                        [    Enviar Compartilhamento   ] │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.7 Auditoria do Supervisor

O supervisor pode visualizar os logs de auditoria da sua equipe:

- **Uploads** realizados pelos subordinados
- **Downloads** feitos pelos externos
- **Aprovacoes/Rejeicoes** do proprio supervisor
- **Arquivos Expirados**

**Importante:** O supervisor visualiza apenas os logs relacionados a sua area/equipe, nao tem acesso a logs de outras areas.

---

## 6. Guia do Usuario Externo

### 6.1 Recebendo o E-mail de Notificacao

Quando um compartilhamento e aprovado, o usuario externo recebe um e-mail:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DE: noreply@petrobras.com.br                                            │
│  PARA: voce@empresa.com                                                  │
│  ASSUNTO: Arquivos compartilhados com voce - Petrobras                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Ola,                                                                    │
│                                                                          │
│  Maria Santos (maria.santos@petrobras.com.br) compartilhou               │
│  arquivos com voce atraves do sistema de transferencia segura            │
│  da Petrobras.                                                           │
│                                                                          │
│  Descricao: Documentos tecnicos do projeto de modernizacao               │
│                                                                          │
│  Para acessar os arquivos, clique no botao abaixo:                       │
│                                                                          │
│                    [ ACESSAR ARQUIVOS ]                                  │
│                                                                          │
│  Este link expira em: 7 dias                                             │
│                                                                          │
│  Se voce nao esperava receber este e-mail, por favor ignore-o.           │
│                                                                          │
│  Atenciosamente,                                                         │
│  Petrobras - Sistema de Transferencia Segura de Arquivos                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Acessando o Sistema

**Passo 1: Clique no link do e-mail**

Voce sera redirecionado para a pagina de verificacao.

### 6.3 Tela de Verificacao OTP

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                         [LOGO PETROBRAS]                                 │
│                                                                          │
│                    VERIFICACAO DE ACESSO                                 │
│           Solucao de Compartilhamento de Arquivos Confidenciais          │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                     │ │
│  │  ✓ Codigo enviado!                                                 │ │
│  │  Um codigo de verificacao foi enviado para voce@empresa.com        │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Codigo de Verificacao                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         [  0  0  0  0  0  0  ]                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  Insira o codigo de 6 digitos recebido no seu e-mail                     │
│                                                                          │
│                         ⏱️ 9:45 restantes                                │
│                                                                          │
│                    [     Verificar Codigo     ]                          │
│                    [     Voltar ao Inicio     ]                          │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Nao recebeu o codigo?                                                   │
│  [Solicitar novo codigo] (disponivel quando o timer expirar)             │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  Este e um acesso seguro e temporario                                    │
│  © 2025 Petrobras. Todos os direitos reservados.                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Passo 2: Verifique seu e-mail**

Voce recebera um e-mail com o codigo OTP:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DE: noreply@petrobras.com.br                                            │
│  ASSUNTO: Seu codigo de acesso - Petrobras                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Seu codigo de verificacao e:                                            │
│                                                                          │
│                           4 8 7 2 1 9                                    │
│                                                                          │
│  Este codigo expira em 10 minutos.                                       │
│                                                                          │
│  Se voce nao solicitou este codigo, ignore este e-mail.                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Passo 3: Digite o codigo**

- Digite os 6 digitos no campo indicado
- Clique em **"Verificar Codigo"**

**Passo 4: Acesso liberado**

Apos verificacao bem-sucedida, voce sera redirecionado para a tela de download.

### 6.4 Tela de Download

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DOCUMENTOS APROVADOS PARA DOWNLOAD                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Baixe seus arquivos compartilhados de forma segura                      │
│                                                                          │
│  ⚠️ AVISO DE CONFIDENCIALIDADE:                                          │
│  Os documentos listados abaixo sao confidenciais e destinados            │
│  exclusivamente ao destinatario. A reproducao ou distribuicao nao        │
│  autorizada e estritamente proibida. Todos os downloads sao registrados. │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  METRICAS                                                          │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                     │ │
│  │  │ Recebidos  │ │  Baixados  │ │ Pendentes  │                     │ │
│  │  │     5      │ │     2      │ │     3      │                     │ │
│  │  └────────────┘ └────────────┘ └────────────┘                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [Buscar...]  [Status ▼]  [Ordenar ▼]  [Tipo ▼]                         │
│                                                                          │
│  ☐ Selecionar todos                    [Baixar Selecionados em ZIP]     │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ☐ 📄 especificacao-tecnica.pdf                                    │ │
│  │     Remetente: Maria Santos                                         │ │
│  │     Tamanho: 2.5 MB                                                 │ │
│  │     Expira em: 6 dias e 12 horas                                    │ │
│  │                                              [     Baixar     ]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  ☑ 📄 diagrama-processo.pdf                         [Baixado ✓]    │ │
│  │     Remetente: Maria Santos                                         │ │
│  │     Tamanho: 1.8 MB                                                 │ │
│  │     Baixado em: 23/05/2025 10:30                                    │ │
│  │                                              [Baixar Novamente]     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.5 Baixando Arquivos

**Download Individual:**
1. Clique no botao **"Baixar"** do arquivo desejado
2. Aceite os termos de confidencialidade no modal
3. O download inicia automaticamente

**Download em Lote (ZIP):**
1. Selecione os arquivos desejados (checkbox)
2. Clique em **"Baixar Selecionados em ZIP"**
3. Um arquivo ZIP sera gerado e baixado

### 6.6 Expiracao do Acesso

- O link expira apos o prazo definido (maximo 7 dias)
- Apos expirar, os arquivos nao estarao mais disponiveis
- Se precisar de acesso novamente, solicite ao remetente um novo compartilhamento

---

## 7. Guia do Admin Global

### 7.1 Painel Administrativo

O Admin Global tem acesso completo ao sistema atraves do **Painel Administrativo**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PAINEL ADMINISTRATIVO                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Visao completa de todos os usuarios, compartilhamentos e logs           │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ ┌──────┐ ┌───────────┐ │
│  │Dashboard │ │ Usuarios │ │ Compartilhamentos│ │ Logs │ │Rastreamento│ │
│  └──────────┘ └──────────┘ └──────────────────┘ └──────┘ └───────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Abas do Painel Admin

#### Dashboard

Metricas gerais do sistema:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    [Atualizar]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USUARIOS                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ Total  │ │Internos│ │Externos│ │Superv. │ │ Admins │ │ Ativos │    │
│  │  150   │ │   80   │ │   60   │ │   8    │ │   2    │ │  145   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                                          │
│  COMPARTILHAMENTOS                                                       │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ Total  │ │Pendente│ │Aprovado│ │ Ativos │ │Rejeitad│ │Expirado│    │
│  │  500   │ │   15   │ │  420   │ │   85   │ │   25   │ │   40   │    │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘    │
│                                                                          │
│  ARQUIVOS E AUDITORIA                                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │Total Arquivos│ │ Armazenamento│ │  Total Logs  │ │Logs 7 dias   │  │
│  │    2.500     │ │   15.8 GB    │ │   25.000     │ │    3.500     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Usuarios

Gestao completa de usuarios:

- Listar todos os usuarios (internos, externos, supervisores, admins)
- Filtrar por tipo de usuario
- Buscar por nome ou e-mail
- Visualizar detalhes de cada usuario
- Ver ultimo login e status

#### Compartilhamentos

Todos os shares do sistema:

- Listar todos os compartilhamentos
- Filtrar por status
- Buscar por nome, criador ou destinatario
- Ver detalhes completos de cada share
- Visualizar arquivos anexados

#### Logs

Auditoria completa do sistema:

- Todos os logs de todas as acoes
- Filtrar por tipo de acao (login, upload, download, etc.)
- Buscar por usuario
- Exportar logs

#### Rastreamento

Tracking por usuario especifico:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RASTREAMENTO DE USUARIO                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Digite o e-mail do usuario para rastrear suas atividades:               │
│                                                                          │
│  [usuario@petrobras.com.br                              ] [Buscar]       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  INFORMACOES DO USUARIO                                            │ │
│  │  Nome: Joao Silva                                                  │ │
│  │  E-mail: joao.silva@petrobras.com.br                               │ │
│  │  Tipo: Interno                                                     │ │
│  │  Supervisor: Sim                                                   │ │
│  │  Departamento: TI                                                  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ESTATISTICAS                                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │Shares Criados│ │Shares Aprov. │ │Arq. Enviados │ │  Total Logs  │  │
│  │      25      │ │      40      │ │      120     │ │     350      │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                          │
│  COMPARTILHAMENTOS CRIADOS:                                              │
│  - Relatorio Q3 | externo@empresa.com | Aprovado | 20/05/2025           │
│  - Contrato XYZ | juridico@forn.com | Pendente | 23/05/2025             │
│                                                                          │
│  COMPARTILHAMENTOS APROVADOS:                                            │
│  - Projeto ABC | ext1@empresa.com | Aprovado em 19/05/2025              │
│  - Orcamento 2025 | ext2@empresa.com | Aprovado em 18/05/2025           │
│                                                                          │
│  LOGS RECENTES:                                                          │
│  - Login | 23/05/2025 08:00 | IP: 10.0.0.1                              │
│  - Upload | 23/05/2025 08:15 | Contrato XYZ                             │
│  - Approve | 23/05/2025 09:00 | Projeto ABC                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Auditoria e Logs

### 8.1 Tipos de Acoes Registradas

| Acao | Descricao | Quem pode visualizar |
|------|-----------|----------------------|
| `login` | Usuario fez login no sistema | Admin, Supervisor (equipe) |
| `logout` | Usuario fez logout | Admin, Supervisor (equipe) |
| `upload` | Arquivos foram enviados | Admin, Supervisor (equipe), Interno (proprio) |
| `approve` | Compartilhamento aprovado | Admin, Supervisor (equipe) |
| `reject` | Compartilhamento rejeitado | Admin, Supervisor (equipe) |
| `download` | Arquivo baixado | Admin, Supervisor (equipe) |
| `cancel` | Compartilhamento cancelado | Admin, Supervisor (equipe) |
| `file_expired` | Arquivo expirou | Admin |
| `generate_otp` | OTP gerado para externo | Admin |
| `otp_validated` | OTP validado com sucesso | Admin |
| `otp_expired` | OTP expirou | Admin |
| `otp_invalid` | Tentativa invalida de OTP | Admin |

### 8.2 Niveis de Log

| Nivel | Cor | Descricao |
|-------|-----|-----------|
| `info` | Azul | Informacao geral |
| `success` | Verde | Acao bem-sucedida |
| `warning` | Amarelo | Alerta/atencao |
| `error` | Vermelho | Erro/falha |

### 8.3 Exportando Logs

Supervisores e Admins podem exportar logs em formato JSON:

1. Acesse a tela de Auditoria
2. Aplique os filtros desejados (opcional)
3. Clique em **"Exportar Logs"**
4. Um arquivo JSON sera baixado

---

## 9. Perguntas Frequentes

### Para Usuarios Internos

**P: Meu supervisor nao esta aparecendo. O que faco?**
R: O sistema busca o supervisor no Active Directory. Entre em contato com o RH ou TI para verificar se sua hierarquia esta correta no AD.

**P: Posso cancelar um compartilhamento apos enviar?**
R: Sim, desde que o status ainda seja "Pendente". Apos aprovacao, nao e possivel cancelar.

**P: Quais tipos de arquivo posso enviar?**
R: A maioria dos formatos e aceita (PDF, DOC, XLS, PPT, imagens, ZIP). Arquivos executaveis (.exe, .bat, etc.) sao bloqueados por seguranca.

### Para Supervisores

**P: Posso aprovar compartilhamentos de qualquer pessoa?**
R: Nao. Voce so ve compartilhamentos de usuarios que sao seus subordinados diretos no Active Directory.

**P: O que acontece quando aprovo um compartilhamento?**
R: O destinatario externo recebe um e-mail com link de acesso. Ele precisara validar seu e-mail com OTP para baixar os arquivos.

### Para Usuarios Externos

**P: Nao recebi o e-mail com o link. O que faco?**
R: Verifique sua pasta de spam/lixo eletronico. Se nao encontrar, entre em contato com a pessoa da Petrobras que enviou os arquivos.

**P: O codigo OTP expirou. O que faco?**
R: Na tela de verificacao, clique em "Solicitar novo codigo" apos o timer zerar.

**P: Posso baixar os arquivos mais de uma vez?**
R: Sim, desde que o link ainda esteja valido (dentro do prazo de expiracao).

**P: O link expirou. Como consigo acesso novamente?**
R: Voce precisara solicitar ao remetente que crie um novo compartilhamento.

---

## Suporte

Em caso de duvidas ou problemas tecnicos, entre em contato com:

- **E-mail:** suporte-ti@petrobras.com.br
- **Ramal:** 0800-XXX-XXXX

---

*Documento atualizado em: Maio/2025*
*Versao: 1.0*
