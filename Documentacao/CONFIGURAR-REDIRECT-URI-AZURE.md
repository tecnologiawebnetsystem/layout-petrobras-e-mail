# Configuração do Redirect URI no Azure AD

## Problema Atual

O aplicativo de Compartilhamento de Arquivos da Petrobras está configurado corretamente no código, mas precisa de uma configuração adicional no Portal Azure para permitir autenticação.

**Erro atual:**
\`\`\`
AADSTS50011: The redirect URI 'https://layout-petro-e-mail.vercel.app' specified in the request does not match the redirect URIs configured for the application 'da3aaaad-619f-4bee-a434-51efd11faf7c'.
\`\`\`

---

## Informações da Aplicação

- **Application (client) ID:** `da3aaaad-619f-4bee-a434-51efd11faf7c`
- **Tenant ID:** `5b6f6241-9a57-4be4-8e50-1dfa72e79a57`
- **Nome da Aplicação:** `AAD-DEV-A12022`

---

## Passo a Passo para Configurar

### 1. Acessar o Portal Azure

1. Acesse: https://portal.azure.com
2. Faça login com credenciais de **Administrador do Azure AD**
3. Navegue para: **Azure Active Directory**

### 2. Localizar a Aplicação

1. No menu lateral, clique em **App registrations**
2. Na lista, procure por: **AAD-DEV-A12022**
   - Ou pesquise pelo Client ID: `da3aaaad-619f-4bee-a434-51efd11faf7c`
3. Clique na aplicação para abrir

### 3. Configurar Redirect URIs

1. No menu lateral da aplicação, clique em **Authentication**
2. Na seção **Platform configurations**, clique em **Add a platform**
3. Selecione **Single-page application (SPA)**
4. Adicione as seguintes Redirect URIs:

\`\`\`
https://layout-petro-e-mail.vercel.app
https://layout-petro-e-mail.vercel.app/
\`\`\`

> ⚠️ **Importante:** Adicione AMBAS as URLs (com e sem barra final) para garantir compatibilidade

5. Se já existir uma plataforma SPA configurada, apenas adicione essas URLs à lista existente

### 4. Configurar Logout URL (Opcional mas Recomendado)

1. Ainda na seção **Authentication**
2. Em **Front-channel logout URL**, adicione:

\`\`\`
https://layout-petro-e-mail.vercel.app
\`\`\`

### 5. Salvar as Configurações

1. Clique no botão **Save** no topo da página
2. Aguarde a confirmação de que as configurações foram salvas

---

## Para Ambiente de Desenvolvimento Local (Opcional)

Se precisar testar localmente, adicione também:

\`\`\`
http://localhost:3000
http://localhost:3000/
\`\`\`

---

## Verificação

Após configurar, teste o login:

1. Acesse: https://layout-petro-e-mail.vercel.app
2. Clique em **"Login com Microsoft"**
3. Faça login com credenciais @petrobras.com.br
4. O login deve completar com sucesso e redirecionar para a página inicial do sistema

---

## Troubleshooting

### Se ainda aparecer erro de redirect URI:

1. Verifique se salvou as configurações no Azure
2. Aguarde 1-2 minutos (pode haver delay de propagação)
3. Limpe o cache do navegador ou teste em aba anônima
4. Verifique se adicionou em **Single-page application** (não Web ou Mobile)

### Se aparecer erro de consentimento de administrador:

Use o link de admin consent (já fornecido anteriormente):
\`\`\`
https://login.microsoftonline.com/5b6f6241-9a57-4be4-8e50-1dfa72e79a57/adminconsent?client_id=da3aaaad-619f-4bee-a434-51efd11faf7c
\`\`\`
