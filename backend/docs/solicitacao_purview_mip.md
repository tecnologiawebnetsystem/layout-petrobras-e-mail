# Solicitação de Autorização — Microsoft Purview Information Protection

**Projeto:** Solução de Compartilhamento de Arquivos Confidenciais
**Código do Projeto:** A12022
**Data:** 08 de maio de 2026
**Destinatário:** Gestão de Segurança da Informação / TI Corporativa

---

## 1. Sobre o Projeto

O projeto **A12022 — Solução de Compartilhamento de Arquivos Confidenciais** é uma aplicação corporativa desenvolvida para atender a uma necessidade recorrente no dia a dia da Petrobras: **a entrega segura e rastreável de arquivos a destinatários externos à instituição**.

Hoje, quando um colaborador precisa enviar um documento confidencial a um parceiro, fornecedor ou prestador de serviço externo, o caminho mais comum é o e-mail. Esse método **não oferece controle, não registra quem acessou o arquivo, não permite cancelar o acesso após o envio e não exige aprovação de nenhum gestor**.

A Solução de Compartilhamento de Arquivos Confidenciais substitui esse processo por um fluxo **formal, auditado e controlado**, onde:

- Apenas colaboradores com acesso corporativo autenticado podem enviar arquivos;
- Todo envio passa pela **aprovação de um supervisor**;
- O destinatário externo precisa confirmar sua identidade para acessar os arquivos;
- O acesso expira automaticamente em um prazo definido;
- Cada ação é registrada em um log de auditoria completo.

---

## 2. O Problema que Precisamos Resolver

### 2.1 Rótulos de Proteção nos Documentos

A Petrobras utiliza o **Microsoft Purview Information Protection** para classificar e proteger seus documentos. Arquivos criados internamente — como planilhas, apresentações e relatórios — frequentemente recebem automaticamente um **rótulo de sensibilidade**, como por exemplo:

- *Confidencial — Petrobras*
- *Interno — Distribuição Restrita*

Esses rótulos são uma camada de segurança excelente para o ambiente interno. No entanto, eles **bloqueiam o acesso de qualquer pessoa que não seja colaboradora da Petrobras**, pois o próprio arquivo verifica, no momento em que é aberto, se o usuário tem permissão corporativa para lê-lo.

### 2.2 O que Acontece com o Destinatário Externo

Quando um parceiro ou fornecedor recebe um arquivo com esse tipo de rótulo, a situação é a seguinte:

1. O arquivo chega corretamente ao computador do destinatário;
2. Ao tentar abrir, o Office ou o Adobe Acrobat consulta os servidores da Petrobras para verificar a permissão;
3. Como o destinatário **não possui conta corporativa Petrobras**, o acesso é negado;
4. O destinatário vê uma mensagem de erro ou o arquivo simplesmente não abre.

Ou seja: **o arquivo é enviado com segurança, mas o destinatário não consegue lê-lo**. Isso gera retrabalho, reenvio por e-mail sem controle e perda da finalidade do compartilhamento seguro.

---

## 3. A Solução Proposta

### 3.1 Remoção do Rótulo Restritivo no Ato do Envio

A solução é técnica e ocorre de forma transparente para o colaborador que envia o arquivo. **No momento em que o arquivo é carregado na plataforma**, a aplicação:

1. Verifica se o arquivo possui um rótulo de proteção que impeça o acesso externo;
2. Caso positivo, **remove ou substitui esse rótulo** por uma classificação compatível com o compartilhamento externo controlado;
3. O arquivo sem restrição de acesso é então armazenado com segurança;
4. O destinatário externo consegue abrir o arquivo normalmente após autenticar sua identidade.

### 3.2 Por que Agir no Momento do Upload?

Este é o momento ideal por três razões:

| Razão | Explicação |
|---|---|
| **Identidade confirmada** | Somente colaboradores autenticados com conta corporativa Petrobras conseguem fazer o upload. A ação é rastreável. |
| **Autorização prévia** | O envio só ocorre após aprovação formal de um supervisor. |
| **Controle total** | O arquivo ainda está dentro da plataforma. Qualquer modificação é registrada antes de chegar ao destinatário. |

---

## 4. O que Estamos Solicitando

Para que a plataforma consiga inspecionar e modificar o rótulo dos arquivos de forma automática, a aplicação (identificada como um sistema interno registrado no Azure da Petrobras) precisa de **autorização formal** para utilizar os recursos do Microsoft Purview Information Protection.

Essa autorização é concedida pela área responsável pela Gestão de Identidade e Segurança da Informação, e permite que a aplicação:

- **Leia** a classificação de sensibilidade presente nos arquivos carregados;
- **Remova ou altere** o rótulo quando o arquivo for destinado ao compartilhamento externo controlado;
- **Aplique** uma nova classificação adequada ao contexto de entrega externa.

Não estamos solicitando acesso amplo ou irrestrito. A autorização é **limitada ao escopo da plataforma A12022** e opera exclusivamente sobre os arquivos que os próprios colaboradores decidiram compartilhar, com aprovação de supervisor.

---

## 5. Garantias de Segurança

A Solução de Compartilhamento de Arquivos Confidenciais foi projetada com segurança como prioridade. Os controles já existentes na plataforma incluem:

### Controle de Acesso

- **Apenas colaboradores da Petrobras** com conta corporativa ativa conseguem acessar a plataforma;
- O acesso é validado pelo próprio sistema de identidade corporativa (Microsoft Entra ID);
- Nenhum acesso externo à plataforma é possível sem autenticação prévia.

### Aprovação Obrigatória

- Todo compartilhamento precisa ser **aprovado por um supervisor** antes de ser disponibilizado;
- O supervisor pode cancelar o acesso a qualquer momento;
- É possível definir um prazo máximo de acesso para cada compartilhamento.

### Autenticação do Destinatário Externo

- O destinatário externo precisa confirmar o seu endereço de e-mail;
- Um código de verificação de uso único é enviado ao e-mail e deve ser validado;
- Somente após essa confirmação o download é liberado.

### Rastreabilidade Completa

- Cada ação realizada na plataforma — upload, aprovação, acesso, download — é registrada com data, hora, identificação do usuário e endereço de origem;
- Os registros são imutáveis e disponíveis para auditoria interna;
- É possível saber exatamente **quem acessou qual arquivo, quando e de onde**.

### Expiração Automática

- Links de acesso expiram automaticamente após o prazo definido;
- Após a expiração, o destinatário externo perde o acesso sem necessidade de ação manual.

---

## 6. Resumo Executivo

| Ponto | Situação Atual | Com a Plataforma A12022 |
|---|---|---|
| Forma de envio | E-mail sem controle | Plataforma com aprovação obrigatória |
| Controle de acesso | Nenhum após o envio | Acesso com prazo e cancelamento possível |
| Rastreabilidade | Inexistente | Log completo de cada ação |
| Autenticação do destinatário | Não existe | Confirmação de identidade obrigatória |
| Arquivos com rótulo MIP | Inacessíveis ao destinatário externo | Tratados de forma controlada no upload |

A autorização solicitada ao Microsoft Purview Information Protection é o **elo que falta** para que a plataforma entregue seu propósito: permitir que colaboradores da Petrobras compartilhem arquivos com parceiros externos de forma segura, auditada e em conformidade com as políticas internas de segurança da informação.

---

## 7. Referências

**Microsoft Information Protection SDK**

O Microsoft Information Protection (MIP) SDK é o conjunto oficial de ferramentas disponibilizado pela Microsoft para que aplicações corporativas possam interagir, de forma programática e controlada, com os rótulos de sensibilidade definidos no Microsoft Purview. Ele permite que sistemas autorizados leiam a classificação de um documento, modifiquem seu rótulo e apliquem ou removam proteções de acordo com a política vigente na organização.

A utilização do MIP SDK é a abordagem recomendada pela Microsoft para cenários como o descrito neste documento — em que uma aplicação corporativa precisa adaptar a proteção de um arquivo para viabilizar o compartilhamento externo controlado, sem expor o conteúdo de forma irrestrita.

Documentação oficial:
- Microsoft Information Protection SDK — Visão Geral: https://learn.microsoft.com/pt-br/information-protection/develop/overview
- Cenários de uso do MIP SDK: https://learn.microsoft.com/pt-br/information-protection/develop/concept-scenarios
- Referência de permissões necessárias: https://learn.microsoft.com/pt-br/azure/information-protection/rms-connector-registry-settings

---

*Documento elaborado pela equipe do Projeto A12022 — Solução de Compartilhamento de Arquivos Confidenciais.*
*Para dúvidas, entre em contato com o responsável técnico do projeto.*
