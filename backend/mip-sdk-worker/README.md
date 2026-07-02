# MIP SDK Worker Service

Microservico ASP.NET Core 8 para operacoes de classificacao MIP em arquivos.

## Estado atual

- Estrutura de APIs pronta.
- Configuracao tipada pronta.
- Integracao real do SDK MIP ainda em implementacao.
- Provider atual e placeholder (retorna o arquivo sem alteracao).

## Arquitetura

- Framework: ASP.NET Core 8 Web API
- Linguagem: C# 12
- Autenticacao entre servicos: Bearer Token
- Pacote MIP: Microsoft.InformationProtection.File v1.17.181

## Endpoints

### GET /health
Sem autenticacao. Retorna status do servico.

### POST /api/v1/mip/remove-label
Remove rotulo/protecao de um arquivo.

Body multipart/form-data:
- file (obrigatorio)

### POST /api/v1/mip/change-label
Troca o rotulo de um arquivo.

Body multipart/form-data:
- file (obrigatorio)
- targetLabelImmutableId (obrigatorio)
- sourceLabelImmutableId (opcional)

### POST /api/v1/mip/change-label/public-external
Atalho para troca para o rotulo Publico Externo usando configuracao do worker.

Body multipart/form-data:
- file (obrigatorio)

## Configuracao

### Variaveis de ambiente

```bash
# Entra ID (Service Principal)
ENTRAID__TENANTID=<tenant-id>
ENTRAID__CLIENTID=<client-id>
ENTRAID__CLIENTSECRET=<client-secret>

# Worker
MIPWORKER__SERVICEAPITOKEN=<api-token-interno>
MIPWORKER__PROCESSINGTIMEOUTSECONDS=120
MIPWORKER__MAXFILESIZEBYTES=52428800
MIPWORKER__PLACEHOLDERMODEENABLED=true
MIPWORKER__CONFIDENTIALLABELIMMUTABLEID=<confidential-label-id>
MIPWORKER__PUBLICEXTERNALLABELIMMUTABLEID=<public-external-label-id>
```

### NuGet via JFrog

Arquivo: NuGet.config

Source configurado conforme padrao Petrobras:

- https://jfrog.petrobras.dev.br/artifactory/api/nuget/v3/nuget-group-all/index.json

## Build local (sem Docker)

Prerequisitos:
- .NET 8 SDK instalado na maquina.

Comandos:

```bash
cd mip-sdk-worker
dotnet restore --configfile NuGet.config
dotnet build
dotnet run
```

## Docker e CI/CD

Padrao deste projeto: usar somente Dockerfile.jenkins para o worker.

- Arquivo: mip-sdk-worker/Dockerfile.jenkins
- Build stage: restore/publish do projeto com NuGet.config
- Runtime stage: imagem petro-aspnet-8_0

Exemplo de build (contexto na raiz do csa-backend):

```bash
docker build -f mip-sdk-worker/Dockerfile.jenkins -t mip-sdk-worker:latest .
```

## Integracao com backend

O backend FastAPI chama o worker via HTTP interno:

1. Endpoint remove-label: /api/v1/mip/remove-label
2. Endpoint change-label: /api/v1/mip/change-label
3. Endpoint publico-externo: /api/v1/mip/change-label/public-external

Token de autenticacao deve corresponder entre:
- backend: MIP_SDK_API_TOKEN
- worker: MIPWORKER__SERVICEAPITOKEN

## Proximos passos

- [ ] Implementar provider real do Microsoft Information Protection SDK
- [ ] Implementar AuthDelegate e inicializacao de contexto/engine MIP
- [ ] Validar alteracao para rotulo Publico Externo com ImmutableId real
- [ ] Testes de integracao endpoint-to-endpoint (backend -> worker)
- [ ] Validacao completa em ambiente AWS
