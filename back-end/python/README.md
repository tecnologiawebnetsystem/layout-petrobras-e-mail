# Aplicação A12022 - Backend

![Snapshot](https://github.com/petrobrasbr/a12022-backend/actions/workflows/snapshot.yml/badge.svg)
![Start Release](https://github.com/petrobrasbr/a12022-backend/actions/workflows/start-release.yml/badge.svg)
![Finish Release](https://github.com/petrobrasbr/a12022-backend/actions/workflows/finish-release.yml/badge.svg)

## 📋 Sobre o Projeto

Backend da aplicação A12022 desenvolvido com FastAPI. Sistema de compartilhamento seguro de arquivos que expõe uma API para geração de compartilhamentos temporários, autenticação via código OTP enviado por e-mail (mock), emissão de tokens de acesso e controle de downloads com ACK.

**Ambiente de desenvolvimento:** SQLite e URLs mock de download sem integração real com S3 (para testes).

## 🚀 Começando

### Pré-requisitos

- Python 3.13+

### Executando Localmente

## 1. **Criar ambiente virtual**
```bash
python -m venv venv
```
## 2. **Ativar ambiente virtual**
## Windows:
```bash
venv\Scripts\activate
```

## Linux/Mac:
```bash
source venv/bin/activate
```

## 3. **Instalar dependências**
```bash
pip install -r requirements.txt
```

## 4. **Executar aplicação**
```bash
uvicorn app.main:app --reload
```

# Executando com Docker
## 1. **Build da imagem**
```bash
docker-compose build
```

## 2. **Executar containers**
### Modo interativo
```bash
docker-compose up
```

### Modo background
```bash
docker-compose up -d
```

# Documentação da API
**Após executar a aplicação, acesse:**

- Swagger UI: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc
- Versão: http://localhost:8000/api/v1

# Executando o Seed Inicial
*O seed cria um ambiente inicial para desenvolvimento e testes:*
- *Um usuário interno*
- *Uma área*
- *Arquivos exemplo: relatorio.pdf, planilha.xlsx*
- *Um compartilhamento (Share)*
- *Um OTP mock (impresso no console)*

```bash
python -m scripts_data.seed_dev
```

# Checklist Completo de Testes
## 1. **Verificar status da API**
GET http://localhost:8000/api/v1

Esperado: 
```bash
{"version":"001","sytem":"active"}
```

## 2. **Listar áreas e arquivos criados pelo seed**
GET /areas

GET /arquivos?area_id=1

Esperado: Área criada + arquivos relatorio.pdf e planilha.xlsx

## 3. **Solicitar código OTP**
POST /auth/codigo/solicitar
Body:
```bash
{
  "email": "destinatario@example.com",
  "validade_minutos": 10
}
```
Esperado:
```bash
{
  "message": "Código enviado por e-mail.",
  "expira_em": "2025-12-06T18:20:00Z"
}
```

## 4. **Verificar OTP (gera ACCESS token)**
POST /auth/codigo/verificar
body:
```bash
{
  "email": "destinatario@example.com",
  "codigo": "832194",
  "max_tentativas": 5,
  "cooldown_minutes": 15,
  "validade_horas_access": 24
}
```

Esperado:
```bash
{
  "token": "<ACCESS_TOKEN>",
  "expira_em": "2025-12-06T12:40:00Z",
  "share_id": 1
}
```

## 5. **Listar arquivos usando ACCESS token**
form-data:
GET /externo/lista?token=<ACCESS_TOKEN>

Esperado:
```bash
{
  "arquivos": [
    {
      "share_arquivo_id": 1,
      "nome": "relatorio.pdf",
      "tamanho_bytes": 102400,
      "baixado": false,
      "url": "http://localhost:8000/mock/download/areas/PROJX/relatorio.pdf?expires_in=300",
      "url_expires_in_seconds": 300
    },
    {
      "share_arquivo_id": 2,
      "nome": "planilha.xlsx",
      "tamanho_bytes": 20480,
      "baixado": false,
      "url": "http://localhost:8000/mock/download/areas/PROJX/planilha.xlsx?expires_in=300",
      "url_expires_in_seconds": 300
    }
  ],
  "token_expira_em": "2025-12-06T12:40:00Z"
}
```

## 6. **ACK de download**
POST /externo/ack

form-data:
token=<ACCESS_TOKEN>
share_arquivo_id=1

Esperado: 
```bash
{"status": "ok"}
```

## 7. **Tentativas inválidas + cooldown**
- Solicite novo OTP
- Envie código errado 5 vezes:
POST /auth/codigo/verificar

body:
```bash
{
  "email": "destinatario@example.com",
  "codigo": "000000"
}
```
**Verificar Retorno no console -> Gera uma senha de acesso**

## 8. **Expiração do ACCESS token**
No .env:
ACCESS_VALID_HOURS=0

Ou envie no Body:
```bash
{
  "validade_horas_access": 0
}
```

*Verifique o OTP para gerar um token sem validade, espere alguns segundos, depois:*

GET /externo/lista?token=<ACCESS_TOKEN>

Esperado: 
```bash
{"detail": "Token expirado."}
```

# Arquitetura
**Fluxo principal: solicitar → verificar → lista?token → ack**

*Serviços internos organizam regras de negócio:*

- token_service
- share_service
- file_service
- audit_service
