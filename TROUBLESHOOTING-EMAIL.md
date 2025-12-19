# Troubleshooting - Por que não estou recebendo e-mails?

## Checklist Rápido (faça na ordem)

### 1. Verificar se a API Key do Resend está configurada

**No v0:**
- Clique em **"Vars"** na sidebar esquerda
- Verifique se existe `RESEND_API_KEY`
- Se NÃO existir, adicione agora:
  1. Vá em https://resend.com/api-keys
  2. Copie sua API key
  3. Cole em "Vars" no v0

**Localmente:**
```bash
# Verifique se existe .env.local
cat .env.local | grep RESEND_API_KEY

# Se não existir, crie:
echo "RESEND_API_KEY=re_sua_chave_aqui" >> .env.local
```

### 2. Verificar logs do console

Após fazer upload, abra o Console do navegador (F12) e procure por:

```
=== INÍCIO DO ENVIO DE E-MAIL ===
✓ RESEND_API_KEY encontrada
Enviando e-mail tipo "supervisor" para: kleber.goncalves.prestserv@petrobras.com.br
✓ E-MAIL ENVIADO COM SUCESSO!
```

**Se ver erro:**
- `RESEND_API_KEY não configurada` → Adicione a variável
- `422 validation_error` → Subject tem caracteres inválidos
- `403 forbidden` → API key inválida
- `404 not found` → Conta Resend não verificada

### 3. Verificar conta Resend

1. Acesse https://resend.com/emails
2. Veja se os e-mails aparecem na lista "Sent"
3. Clique em um e-mail para ver detalhes

**Status possíveis:**
- `sent` ✓ - E-mail enviado com sucesso
- `delivered` ✓ - E-mail entregue ao destinatário
- `bounced` ✗ - E-mail rejeitado (endereço inválido)
- `failed` ✗ - Erro ao enviar

### 4. Verificar caixa de spam

E-mails de teste do Resend podem cair no spam:
- Gmail: Verifique pasta "Spam" ou "Promoções"
- Outlook: Verifique pasta "Lixo Eletrônico"
- Petrobras: Pode ter filtros corporativos bloqueando

### 5. Domínio verificado no Resend

**Plano GRATUITO do Resend:**
- Só envia de `onboarding@resend.dev`
- Só envia para e-mails que você confirmar

**Para enviar para qualquer e-mail:**
1. Upgrade para plano pago ($20/mês)
2. OU adicione `kleber.goncalves.prestserv@petrobras.com.br` como destinatário verificado:
   - Resend → Settings → Verified Emails
   - Add Email → Digite seu e-mail
   - Confirme o link que chegar

### 6. Teste manual da API

Execute este teste direto no console do navegador:

```javascript
fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'kleber.goncalves.prestserv@petrobras.com.br',
    subject: 'Teste Manual',
    type: 'supervisor',
    uploadData: {
      name: 'Teste',
      sender: { name: 'Teste', email: 'teste@test.com' },
      recipient: 'dest@test.com',
      description: 'Teste',
      files: [],
      expirationHours: 72,
      uploadDate: new Date().toLocaleString()
    }
  })
}).then(r => r.json()).then(console.log)
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": { "id": "re_xxxxx..." }
}
```

## Problemas Comuns

### Problema 1: "RESEND_API_KEY não configurada"
**Solução:** Adicione a variável de ambiente conforme passo 1

### Problema 2: E-mail aparece como "sent" mas não chega
**Causa:** Plano gratuito do Resend
**Solução:** Adicione seu e-mail como verificado no Resend

### Problema 3: "403 Forbidden"
**Causa:** API Key inválida ou expirada
**Solução:** Gere nova API Key no Resend

### Problema 4: E-mails vão para spam
**Solução:** 
- Configure SPF/DKIM no Resend (plano pago)
- Use domínio próprio verificado
- Adicione remetente aos contatos

## Comandos úteis de debug

### Ver todos os logs de e-mail:
```bash
# Procure por "INÍCIO DO ENVIO"
grep "ENVIO DE E-MAIL" logs/*.log
```

### Testar conectividade Resend:
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "seu-email@petrobras.com.br",
    "subject": "Teste",
    "html": "<p>Teste</p>"
  }'
```

## Suporte

Se nada funcionar:
1. Abra um chamado no ServiceNow da Petrobras
2. Verifique firewall corporativo (pode bloquear resend.com)
3. Entre em contato com suporte Resend: https://resend.com/support
