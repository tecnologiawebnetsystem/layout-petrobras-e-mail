# Como Testar a Integração com Microsoft Entra ID

## Status Atual: PRONTO PARA TESTAR

Toda a integração com Microsoft Entra ID está implementada e aguardando apenas as credenciais do time de infra.

---

## O que JÁ está funcionando:

### 1. Código Completo
- ✅ Configuração MSAL (`lib/auth/entra-config.ts`)
- ✅ Provider React (`components/auth/entra-provider.tsx`)
- ✅ Botão de Login Microsoft na tela de login
- ✅ Detecção automática de tipo de usuário (interno/supervisor/externo)
- ✅ Integração com audit logs
- ✅ Tratamento de erros
- ✅ Logout completo

### 2. Layout Preparado
- ✅ EntraProvider envolve toda aplicação
- ✅ Sessão persistente no sessionStorage
- ✅ Redirecionamento automático após login

### 3. Documentação
- ✅ Wiki completa sobre Entra ID
- ✅ Documento de solicitação para time de infra
- ✅ Guia de configuração passo a passo

---

## Como testar ASSIM QUE receber as credenciais:

### Passo 1: Receber do Time de Infra

Você vai receber 3 valores:

```
TENANT_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_ID: yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
CLIENT_SECRET: z~zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz
```

### Passo 2: Configurar Variáveis de Ambiente

**No v0 (sidebar "Vars"):**
Adicione estas 3 variáveis:

```
NEXT_PUBLIC_ENTRA_TENANT_ID = (cole o TENANT_ID aqui)
NEXT_PUBLIC_ENTRA_CLIENT_ID = (cole o CLIENT_ID aqui)
NEXT_PUBLIC_REDIRECT_URI = https://seu-projeto.vercel.app
```

**Localmente (.env.local):**
```bash
NEXT_PUBLIC_ENTRA_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_ENTRA_CLIENT_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

### Passo 3: Testar o Login

1. **Abra a aplicação**
   - Acesse: `http://localhost:3000` (local) ou sua URL Vercel

2. **Procure o botão "Login com Microsoft"**
   - Ele aparece abaixo do formulário de login
   - Tem o ícone azul da Microsoft

3. **Clique no botão**
   - Uma janela popup vai abrir
   - É a tela oficial de login da Microsoft/Petrobras

4. **Digite suas credenciais**
   - Use seu email: `seu.nome@petrobras.com.br`
   - Digite sua senha corporativa da Petrobras

5. **Autorize a aplicação**
   - Primeira vez: Microsoft vai pedir para autorizar
   - Clique em "Aceitar" ou "Permitir"

6. **Pronto!**
   - Você será redirecionado automaticamente
   - O sistema detecta automaticamente se você é:
     - **Interno** (email @petrobras) → vai para `/upload`
     - **Supervisor** (wagner.brazil@petrobras.com.br) → vai para `/supervisor`
     - **Externo** (outros domínios) → vai para `/download`

---

## O que acontece nos bastidores:

```
┌─────────────────┐
│ 1. Usuário      │
│ clica em        │
│ "Login Microsoft"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Popup abre   │
│ login.microsoft │
│ online.com      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Usuário      │
│ digita email    │
│ e senha         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Microsoft    │
│ valida e retorna│
│ token de acesso │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Sistema pega │
│ dados: nome,    │
│ email, etc      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 6. Detecta tipo │
│ de usuário      │
│ pelo email      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 7. Salva sessão │
│ e redireciona   │
│ para dashboard  │
└─────────────────┘
```

---

## Checklist de Teste

Use esta lista para garantir que tudo funciona:

### Teste 1: Login Básico
- [ ] Botão "Login com Microsoft" aparece
- [ ] Popup abre ao clicar
- [ ] Consigo fazer login com minhas credenciais
- [ ] Sou redirecionado para a página correta
- [ ] Meu nome aparece no header

### Teste 2: Detecção de Tipo de Usuário
- [ ] Usuário com @petrobras → vai para `/upload`
- [ ] Usuário `wagner.brazil@petrobras.com.br` → vai para `/supervisor`
- [ ] Outros emails → vai para `/download`

### Teste 3: Sessão Persistente
- [ ] Após login, posso navegar pelas páginas
- [ ] Se recarregar a página (F5), continuo logado
- [ ] Se fechar aba e abrir de novo, continuo logado

### Teste 4: Logout
- [ ] Clico em "Sair" no menu do usuário
- [ ] Sou deslogado completamente
- [ ] Volto para tela de login
- [ ] Não consigo mais acessar páginas protegidas

### Teste 5: Audit Logs
- [ ] Login é registrado no audit log
- [ ] Logout é registrado no audit log
- [ ] Posso ver logs em `/auditoria`

### Teste 6: Erros
- [ ] Se credenciais erradas → mensagem de erro aparece
- [ ] Se cancelar login → mensagem apropriada
- [ ] Se sem internet → erro tratado corretamente

---

## Comandos Úteis para Debug

### Ver logs no console do navegador:
```
F12 → Console → Filtrar por "Entra ID"
```

### Limpar sessão manualmente:
```javascript
// Cole no console do navegador:
sessionStorage.clear()
location.reload()
```

### Ver token de acesso:
```javascript
// Cole no console do navegador:
sessionStorage.getItem('msal.token.keys')
```

---

## Troubleshooting Rápido

### Problema: Botão não aparece
**Causa:** Variáveis de ambiente não configuradas
**Solução:** Confira se as 3 variáveis estão no "Vars" (sidebar)

### Problema: Erro "AADSTS50011"
**Causa:** URL de redirect não cadastrada no Entra ID
**Solução:** Peça ao time de infra para adicionar sua URL

### Problema: Erro "invalid_client"
**Causa:** CLIENT_ID ou CLIENT_SECRET incorretos
**Solução:** Confira se copiou corretamente do time de infra

### Problema: Login funciona mas redireciona errado
**Causa:** Lógica de detecção de tipo de usuário
**Solução:** Verifique seu email em `lib/auth/entra-config.ts` linha 108

### Problema: Sessão expira rápido
**Causa:** Token de acesso tem validade curta (geralmente 1 hora)
**Solução:** Isso é normal. Faça login novamente.

---

## Exemplo de Teste Completo (5 minutos)

```bash
# 1. Configure as variáveis (copie do time de infra)
# Vá em Vars (sidebar) e adicione as 3 variáveis

# 2. Reinicie o projeto
# Clique em "Restart" no v0

# 3. Abra no navegador
# Acesse sua URL

# 4. Teste login
# Clique em "Login com Microsoft"
# Use seu email: kleber.goncalves.prestserv@petrobras.com.br
# Digite sua senha da Petrobras

# 5. Verifique
# ✓ Redirecionou para /upload?
# ✓ Seu nome aparece no header?
# ✓ Consegue fazer upload?

# 6. Teste logout
# Clique no seu nome → Sair
# ✓ Voltou para login?

# 7. Verifique logs
# Acesse /auditoria
# ✓ Login registrado?
# ✓ Logout registrado?
```

---

## Próximos Passos Após Teste Bem-Sucedido

1. **Remover login por senha** (opcional)
   - Se quiser APENAS Entra ID, podemos remover o formulário de email/senha

2. **Adicionar mais supervisores**
   - Edite `lib/auth/entra-config.ts` linha 108
   - Adicione emails na lista `supervisorEmails`

3. **Integrar com ServiceNow**
   - Entra ID + ServiceNow podem trabalhar juntos
   - ServiceNow para dados, Entra ID para autenticação

4. **Produção**
   - Peça ao time de infra para usar CLIENT_SECRET de produção
   - Atualize REDIRECT_URI para URL de produção

---

## Suporte

Se tiver problemas durante o teste:

1. Confira os logs no console (F12)
2. Verifique se as 3 variáveis estão corretas
3. Confirme com time de infra se URL de redirect está cadastrada
4. Consulte a Wiki: `/wiki-dev/entra-id`

**Tudo pronto para testar!** 🚀

Assim que receber as credenciais do time de infra, é só seguir este guia e em 5 minutos está funcionando.
