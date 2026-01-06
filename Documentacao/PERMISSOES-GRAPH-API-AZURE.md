# Configurar Permissões do Microsoft Graph API

## Problema Identificado

O login com Microsoft está funcionando, mas os dados do perfil (foto, cargo, supervisor) não estão sendo carregados porque a aplicação não tem permissões para acessar o Microsoft Graph API.

## Solução: Adicionar Permissões no Azure AD

### Passo 1: Acessar o Portal Azure
1. Acesse: https://portal.azure.com
2. Entre com credenciais de administrador

### Passo 2: Navegar até o App Registration
1. No menu lateral, clique em **Azure Active Directory**
2. Clique em **App registrations**
3. Procure e clique na aplicação: **AAD-DEV-A12022**
4. ID da Aplicação: `da3aaaad-619f-4bee-a434-51efd11faf7c`

### Passo 3: Adicionar Permissões de API
1. No menu lateral do app, clique em **API permissions**
2. Clique no botão **+ Add a permission**
3. Selecione **Microsoft Graph**
4. Selecione **Delegated permissions**

### Passo 4: Adicionar as Permissões Específicas

Marque as seguintes permissões:

#### Permissões Obrigatórias:
- ✅ **User.Read** (Básico - Sign in and read user profile)
  - Permite: Ler perfil básico do usuário logado
  - Status: Não requer admin consent

- ✅ **User.ReadBasic.All** (Read all users' basic profiles)
  - Permite: Ler cargo, departamento, localização
  - Status: Não requer admin consent

#### Permissões que Requerem Admin Consent:
- ✅ **User.Read.All** (Read all users' full profiles)
  - Permite: Ler informações completas incluindo supervisor
  - Status: **REQUER ADMIN CONSENT**

Clique em **Add permissions**

### Passo 5: Conceder Admin Consent (IMPORTANTE!)

Após adicionar as permissões:

1. Na tela de **API permissions**, você verá uma lista com status
2. Clique no botão: **Grant admin consent for Petrobras**
3. Confirme clicando em **Yes**
4. Aguarde alguns segundos
5. As permissões devem mostrar um ícone verde ✓ na coluna "Status"

### Passo 6: Verificar Permissões Configuradas

A lista final deve estar assim:

| API / Permissions name | Type | Status |
|------------------------|------|--------|
| Microsoft Graph / User.Read | Delegated | ✓ Granted for Petrobras |
| Microsoft Graph / User.ReadBasic.All | Delegated | ✓ Granted for Petrobras |
| Microsoft Graph / User.Read.All | Delegated | ✓ Granted for Petrobras |

---

## Após Configurar

1. **Não é necessário reiniciar nada** - As permissões são aplicadas imediatamente
2. Peça aos usuários para fazer **logout e login novamente**
3. Os dados do perfil (foto, cargo, supervisor) devem aparecer automaticamente

---

## Testes Após Configuração

Após configurar as permissões, o sistema deve:

1. ✅ Mostrar foto do perfil corporativo no header
2. ✅ Exibir cargo e departamento do usuário
3. ✅ Mostrar informações do supervisor direto
4. ✅ Preencher automaticamente o campo "Aprovador" na página de upload

---

## Troubleshooting

### Problema: "Admin consent required"
**Solução:** Execute o Passo 5 (Grant admin consent)

### Problema: Permissões não aparecem após adicionar
**Solução:** 
1. Limpe o cache do navegador
2. Faça logout completo da conta Microsoft
3. Faça login novamente

### Problema: "Insufficient privileges"
**Solução:** Certifique-se que o usuário que está concedendo consent é:
- Global Administrator, ou
- Application Administrator, ou  
- Cloud Application Administrator

---

## Segurança

Estas permissões são seguras e seguem as melhores práticas:

- ✅ Permissões **delegated** (não application) - Só funcionam quando usuário está logado
- ✅ Acesso somente leitura - Não permite modificar dados
- ✅ Limitado ao contexto do usuário - Cada usuário vê apenas suas próprias informações

---

## Link Direto para Consentimento

Alternativamente, o administrador pode usar este link direto:

```
https://login.microsoftonline.com/5b6f6241-9a57-4be4-8e50-1dfa72e79a57/adminconsent?client_id=da3aaaad-619f-4bee-a434-51efd11faf7c
```

Isso abrirá diretamente a tela de consentimento de administrador.

---

## Contato

Se tiver dúvidas sobre essas permissões, consulte:
- Documentação oficial: https://learn.microsoft.com/en-us/graph/permissions-reference
- Suporte Microsoft: https://aka.ms/graphsupport
