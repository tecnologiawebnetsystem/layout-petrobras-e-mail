"""
aws_loader.py – Carrega variáveis do AWS Parameter Store e Secrets Manager
para os.environ ANTES da instanciação de Settings().

─────────────────────────────────────────────────────────────────────────────
IMPORTANTE – ECS Task (pipeline CDK Petrobras)
─────────────────────────────────────────────────────────────────────────────
Em deploys via pipeline CDK Petrobras, os parâmetros do Parameter Store são
injetados AUTOMATICAMENTE como variáveis de ambiente na task definition
durante o deploy. A aplicação lê os.environ normalmente via Settings() — sem
precisar chamar boto3 em runtime.

Este módulo é útil apenas em dois cenários fora do pipeline padrão:
  1. Execução LOCAL simulando o ambiente AWS (teste/depuração)
  2. Funções Lambda (sem injeção automática de variáveis)

Para ativar: USE_AWS_CONFIG=true (setar na ECS Task Definition ou docker run)

─────────────────────────────────────────────────────────────────────────────
Convenção de nomes – Petrobras (App Space 2)
─────────────────────────────────────────────────────────────────────────────
Parameter Store (type String – um parâmetro por variável de ambiente):

  /APP/<CdkAppServiceName>-<AMBIENTE>/<NOME_VARIAVEL>   ← não-PRD
  /APP/<CdkAppServiceName>/<NOME_VARIAVEL>              ← PRD (sem sufixo)

  Exemplos (CdkAppServiceName=backend, AMBIENTE=dsv):
    /APP/backend-dsv/DATABASE_URL
    /APP/backend-dsv/STORAGE_PROVIDER
    /APP/backend-dsv/AUTH_MODE
    /APP/backend-dsv/EMAIL_PROVIDER
    /APP/backend-dsv/AWS_REGION
    /APP/backend-dsv/AWS_S3_BUCKET
    /APP/backend-dsv/FRONTEND_EXTERNAL_PORTAL_URL
    /APP/backend-dsv/FRONTEND_SHARE_DETAILS_URL

Parameter Store "ponteiro" para Secrets Manager (necessário para ECS/Lambda
acessar secrets – o valor do parâmetro é o NOME da secret):

  /APP/<CdkAppServiceName>-<AMBIENTE>/SECRETS_MANAGER/<NOME_SECRET>

  Exemplos:
    /APP/backend-dsv/SECRETS_MANAGER/backend_dsv_secret

Secrets Manager (SecretString JSON – sem hífens no nome, usar underscore):

  backend_dsv_secret → {
      "ENTRA_TENANT_ID": ...,
      "ENTRA_CLIENT_ID": ...,
      "ENTRA_CLIENT_SECRET": ...,
      "ENTRA_APP_NAME": ...,
      "ENTRA_REDIRECT_URI": ...,
      "SMTP_PASS": ...
  }

  Nota: apenas dados realmente sensíveis ficam na secret.
  SMTP_SERVER, SMTP_PORT, SMTP_USER, MAIL_FROM ficam no SSM Parameter Store
  (não são sensíveis — podem ser auditados sem risco).
  Credenciais AWS (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) NÃO devem
  estar na secret quando a task usa IAM Role — usar a Role diretamente.

  ENTRA_SUPERVISOR_GROUP_IDS: NÃO precisa estar na secret nem no SSM.
  Default é [] — adicione apenas quando houver grupos AD reais a configurar.

  Mapeamento frontend (window.__ENV__ via layout.tsx – runtime server-side):
    ENTRA_CLIENT_ID    →  NEXT_PUBLIC_ENTRA_CLIENT_ID
    ENTRA_TENANT_ID    →  NEXT_PUBLIC_ENTRA_TENANT_ID
    ENTRA_REDIRECT_URI →  NEXT_PUBLIC_ENTRA_REDIRECT_URI (fallback: derivado de NEXT_PUBLIC_APP_URL)

  Para o frontend ler esses valores via CDK, criar SSM pointer:
    /APP/frontend-dsv/SECRETS_MANAGER/backend_dsv_secret = "backend_dsv_secret"
  O CDK injeta as chaves da secret no ECS Task Definition do frontend (nomes originais: ENTRA_*).
  O layout.tsx (Server Component) mapeia para NEXT_PUBLIC_* e injeta em window.__ENV__.
  NÃO criar params SSM individuais NEXT_PUBLIC_ENTRA_* – são redundantes com o secret.

─────────────────────────────────────────────────────────────────────────────
Variáveis de controle (definir na ECS Task Definition / docker run -e)
─────────────────────────────────────────────────────────────────────────────
  USE_AWS_CONFIG=true       – ativa este módulo
  CDK_APP_SERVICE_NAME      – nome do módulo CDK (padrão: "backend")
  APP_ENV                   – dsv | tst | trn | hmg | prd  (padrão: dsv)
                              Em prd, o sufixo de ambiente NÃO é adicionado.
  AWS_REGION                – região AWS (padrão: sa-east-1)

─────────────────────────────────────────────────────────────────────────────
Precedência das variáveis (maior → menor)
─────────────────────────────────────────────────────────────────────────────
  1. Env var já presente em os.environ (task definition / docker run -e)
  2. Secrets Manager (via ponteiro no Parameter Store)
  3. Parameter Store
  4. Defaults do Settings()
"""

import json
import logging
import os

logger = logging.getLogger(__name__)

_APP_ENV: str          = os.environ.get("APP_ENV", "dsv").lower()
_CDK_SERVICE_NAME: str = os.environ.get("CDK_APP_SERVICE_NAME", "backend")

# Em PRD não há sufixo de ambiente no path (padrão Petrobras)
_ENV_SUFFIX: str = f"-{_APP_ENV}" if _APP_ENV != "prd" else ""
_SSM_PATH: str   = f"/APP/{_CDK_SERVICE_NAME}{_ENV_SUFFIX}/"
_SECRETS_PREFIX: str = f"{_SSM_PATH}SECRETS_MANAGER/"


def _set_if_missing(key: str, value: str) -> None:
    """Define a variável somente se ela ainda não estiver em os.environ.
    Env vars injetadas diretamente na Task Definition têm precedência.
    """
    if key not in os.environ:
        os.environ[key] = str(value)
        logger.debug("[aws_loader] %s carregado da AWS", key)


def _load_parameter_store(ssm_client) -> None:
    """Carrega todos os params de /APP/<service>-<env>/ exceto ponteiros SECRETS_MANAGER/."""
    paginator = ssm_client.get_paginator("get_parameters_by_path")

    logger.info("[aws_loader] Buscando parâmetros SSM: %s", _SSM_PATH)
    for page in paginator.paginate(
        Path=_SSM_PATH,
        Recursive=False,
        WithDecryption=True,
    ):
        for param in page["Parameters"]:
            # /APP/backend-dsv/DATABASE_URL → DATABASE_URL
            key = param["Name"].removeprefix(_SSM_PATH).upper()
            # Ponteiros SECRETS_MANAGER/ são tratados separadamente
            if not key.startswith("SECRETS_MANAGER/"):
                _set_if_missing(key, param["Value"])


def _load_secrets_via_pointers(ssm_client, sm_client) -> None:
    """Lê ponteiros em .../SECRETS_MANAGER/ e carrega cada secret no Secrets Manager.

    Padrão Petrobras: o parâmetro ponteiro tem como valor o NOME da secret.
    Cada chave do JSON da secret vira uma variável de ambiente.
    """
    from botocore.exceptions import ClientError

    try:
        paginator = ssm_client.get_paginator("get_parameters_by_path")
        pointer_params = [
            p
            for page in paginator.paginate(Path=_SECRETS_PREFIX, Recursive=False, WithDecryption=False)
            for p in page["Parameters"]
        ]
    except Exception as exc:  # noqa: BLE001
        logger.warning("[aws_loader] Falha ao listar ponteiros de secrets: %s", exc)
        return

    for param in pointer_params:
        secret_name = param["Value"]
        try:
            resp = sm_client.get_secret_value(SecretId=secret_name)
        except ClientError as exc:
            code = exc.response["Error"]["Code"]
            if code == "ResourceNotFoundException":
                logger.warning("[aws_loader] Secret '%s' não encontrado – ignorando.", secret_name)
            else:
                logger.warning("[aws_loader] Falha ao buscar secret '%s': %s", secret_name, exc)
            continue

        raw = resp.get("SecretString", "{}")
        try:
            data: dict = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("[aws_loader] Secret '%s' não é JSON válido – ignorando.", secret_name)
            continue

        for k, v in data.items():
            _set_if_missing(k.upper(), str(v))


def load_aws_config() -> None:
    """Ponto de entrada – chamado no início de config.py.

    Só executa quando USE_AWS_CONFIG=true estiver definido,
    portanto é totalmente inofensivo no ambiente local/dev.
    """
    if os.environ.get("USE_AWS_CONFIG", "").lower() != "true":
        return

    region = os.environ.get("AWS_REGION", "sa-east-1")
    logger.info(
        "[aws_loader] USE_AWS_CONFIG=true | path SSM: %s | região: %s",
        _SSM_PATH,
        region,
    )

    import boto3

    ssm = boto3.client("ssm", region_name=region)
    sm  = boto3.client("secretsmanager", region_name=region)

    try:
        _load_parameter_store(ssm)
    except Exception as exc:  # noqa: BLE001
        logger.error("[aws_loader] Falha ao carregar Parameter Store: %s", exc)

    try:
        _load_secrets_via_pointers(ssm, sm)
    except Exception as exc:  # noqa: BLE001
        logger.error("[aws_loader] Falha ao carregar Secrets Manager: %s", exc)

    logger.info("[aws_loader] Configuração AWS concluída.")
