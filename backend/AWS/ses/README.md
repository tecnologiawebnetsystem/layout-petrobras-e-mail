# Amazon SES - Servico de Email

Configuracao do Amazon Simple Email Service para envio de emails transacionais.

## Visao Geral

O SES e utilizado para:
- Enviar codigos OTP para usuarios externos
- Notificar sobre compartilhamentos aprovados/rejeitados
- Alertas de expiracao de arquivos
- Notificacoes para supervisores

## Pre-requisitos

```bash
pip install boto3
```

## Uso

### 1. Verificar Dominio

```bash
python setup_ses.py verify-domain --domain petrobras.com.br
```

Isso retornara registros DNS que precisam ser adicionados:
- TXT para verificacao de dominio
- CNAME para DKIM
- MX e TXT para MAIL FROM customizado

### 2. Verificar Status do Dominio

```bash
python setup_ses.py check-domain --domain petrobras.com.br
```

### 3. Verificar Email (Sandbox)

Em modo sandbox, precisa verificar cada email destinatario:

```bash
python setup_ses.py verify-email --email usuario@exemplo.com
```

### 4. Verificar Cotas

```bash
python setup_ses.py check-quota
```

### 5. Criar Templates de Email

```bash
# Criar todos os templates
python setup_ses.py create-template --name all

# Criar template especifico
python setup_ses.py create-template --name otp_code
```

### 6. Solicitar Acesso de Producao

```bash
python setup_ses.py request-production
```

### 7. Criar Configuration Set

```bash
python setup_ses.py create-config-set --name prod
```

## Registros DNS Necessarios

### Verificacao de Dominio (TXT)
```
Nome: _amazonses.petrobras.com.br
Tipo: TXT
Valor: [token fornecido pelo script]
```

### DKIM (CNAME) - 3 registros
```
Nome: [token]._domainkey.petrobras.com.br
Tipo: CNAME
Valor: [token].dkim.amazonses.com
```

### MAIL FROM (MX + TXT)
```
Nome: mail.petrobras.com.br
Tipo: MX
Valor: 10 feedback-smtp.sa-east-1.amazonses.com

Nome: mail.petrobras.com.br
Tipo: TXT
Valor: "v=spf1 include:amazonses.com ~all"
```

## Templates de Email

| Template | Uso |
|----------|-----|
| `petrobras_otp_code` | Codigo OTP para autenticacao |
| `petrobras_share_approved_external` | Notificacao para destinatario externo |
| `petrobras_share_approved_requester` | Confirmacao para solicitante interno |
| `petrobras_share_rejected` | Notificacao de rejeicao |

## Variaveis de Ambiente

```env
# Email provider
EMAIL_PROVIDER=ses

# AWS SES
AWS_REGION=sa-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
MAIL_FROM=no-reply@petrobras.com.br
```

## Modo Sandbox vs Producao

### Sandbox (Padrao)
- Limite: 200 emails/24h
- Taxa: 1 email/segundo
- Destinatarios: Apenas emails verificados

### Producao
- Limite: 50.000+ emails/24h
- Taxa: 14+ emails/segundo
- Destinatarios: Qualquer email

## Monitoramento

### Metricas CloudWatch
- `Send`: Emails enviados
- `Delivery`: Emails entregues
- `Bounce`: Bounces (hard/soft)
- `Complaint`: Reclamacoes de spam
- `Reject`: Emails rejeitados pelo SES
- `Open`: Emails abertos (se tracking habilitado)
- `Click`: Links clicados (se tracking habilitado)

### Alertas Recomendados
- Bounce rate > 5%
- Complaint rate > 0.1%
- Reject rate > 1%

## Estimativa de Custos (sa-east-1)

| Item | Preco |
|------|-------|
| Emails enviados | $0.10/1000 emails |
| Attachments | $0.12/GB |
| Receiving | $0.10/1000 emails |
| Dedicated IPs | $24.95/mes/IP |

### Exemplo (5.000 emails/mes)
- Envio: ~$0.50/mes

## Troubleshooting

### Email nao chega
1. Verificar se dominio esta verificado
2. Verificar se email esta na lista de supressao
3. Verificar bounces no CloudWatch

### Bounce rate alto
1. Validar emails antes de enviar
2. Remover emails invalidos da lista
3. Implementar double opt-in

### Emails indo para spam
1. Configurar DKIM corretamente
2. Configurar SPF no MAIL FROM
3. Evitar palavras de spam no assunto
4. Incluir link de unsubscribe

## Boas Praticas

1. **Sempre use DKIM e SPF**
2. **Monitore bounce e complaint rates**
3. **Use Configuration Sets para tracking**
4. **Implemente retry com backoff exponencial**
5. **Valide emails antes de enviar**
6. **Mantenha lista de supressao atualizada**
