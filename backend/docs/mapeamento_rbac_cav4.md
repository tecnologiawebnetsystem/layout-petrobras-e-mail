@ -0,0 +1,131 @@
# RELATÓRIO TÉCNICO DE MAPEAMENTO DE RECURSOS E PERMISSÕES
## Solução de Compartilhamento de Arquivos Confidenciais

**Documento:** Mapeamento RBAC para Cadastro de Recursos no CAv4

**Objetivo:** Consolidar o levantamento de grupos de recursos, recursos e permissões identificados por análise de código-fonte para suporte ao cadastro e governança de acessos no CAv4.

## 1. Introdução
Este documento apresenta o mapeamento técnico realizado a partir da análise das telas da aplicação Solução de Compartilhamento de Arquivos Confidenciais. O objetivo é identificar os recursos efetivamente utilizados e associá-los às permissões cadastradas no CAv4, seguindo o modelo RBAC.

## 2. Recursos Cadastrados no CAv4
- audit (audit:read)
- dashboard (dashboard:read)
- emails (emails:read)
- file (file:download, file:upload)
- notifications (notifications:read)
- report (report:read)
- shares (shares:approve, shares:cancel, shares:create, shares:delete, shares:read, shares:reject, shares:resend)

## 3. Metodologia
O levantamento foi realizado por inspeção técnica do código das páginas frontend. Foram consideradas apenas permissões evidenciadas por controles de acesso, chamadas de API, navegação funcional e operações executadas pelo usuário.

## 4. Mapeamento Final

### 4.1 Grupo Auditoria
Descrição: Página do usuário de Auditoria/Administrador.

Permissões:
- dashboard:read
- audit:read
- shares:read
- emails:read

Justificativa:
- Consulta de métricas globais.
- Consulta de compartilhamentos.
- Consulta de logs e rastreamento.
- Consulta de métricas de e-mails.

### 4.2 Grupo Compartilhamentos
Descrição: Gestão dos compartilhamentos realizados pelo usuário.

Permissões:
- shares:create
- shares:read
- shares:cancel
- shares:resend

Justificativa:
- Criação de compartilhamentos.
- Consulta de compartilhamentos.
- Cancelamento de solicitações pendentes.
- Reenvio de notificações.

### 4.3 Grupo Download
Descrição: Download de arquivos disponibilizados ao destinatário.

Permissões:
- file:download

Justificativa:
- Download individual.
- Download em lote (ZIP).
- Consulta de arquivos disponíveis.

### 4.4 Grupo Histórico
Descrição: Acervo de compartilhamentos concluídos.

Permissões:
- shares:read

Justificativa:
- Consulta de registros aprovados, rejeitados e cancelados.
- Visualização de detalhes históricos.

### 4.5 Grupo Logs
Descrição: Consulta de registros de atividades do sistema.

Permissões:
- report:read

Justificativa:
- Página protegida por verificação explícita da permissão report:read.
- Filtros, pesquisas e paginação dos registros.

### 4.6 Grupo Supervisor
Descrição: Painel do Gestor.

Permissões:
- dashboard:read
- shares:read
- shares:create
- shares:approve
- shares:reject
- shares:resend
- file:upload
- file:download

Justificativa:
- Aprovação e rejeição de compartilhamentos.
- Download de arquivos para análise.
- Compartilhamento de documentos.
- Reenvio de notificações.
- Consulta dos compartilhamentos sob responsabilidade do gestor.

### 4.7 Grupo Upload
Descrição: Módulo de carregamento de arquivos.

Permissões:
- file:upload
- shares:create

Justificativa:
- Seleção e envio de arquivos.
- Criação de compartilhamentos.
- Fluxo protegido por verificações explícitas destas permissões.

## 5. Matriz Consolidada

| Grupo | Permissões |
|---------|---------|
| auditoria | dashboard:read, audit:read, shares:read, emails:read |
| compartilhamentos | shares:create, shares:read, shares:cancel, shares:resend |
| download | file:download |
| historico | shares:read |
| logs | report:read |
| supervisor | dashboard:read, shares:read, shares:create, shares:approve, shares:reject, shares:resend, file:upload, file:download |
| upload | file:upload, shares:create |

## 6. Conclusão
O mapeamento foi realizado com base em evidências encontradas no código-fonte analisado. Não foram consideradas permissões sem evidência funcional. O resultado obtido apresenta aderência ao modelo RBAC atualmente implementado e pode ser utilizado como referência para cadastro e governança dos grupos de recursos no CAv4.