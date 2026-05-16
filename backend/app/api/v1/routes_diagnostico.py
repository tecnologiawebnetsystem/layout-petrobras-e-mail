"""
GET /api/v1/diagnostico/parameters
GET /api/v1/diagnostico/db-secrets

Endpoints de diagnóstico do backend.
Valores sensíveis são mascarados — apenas indica se estão definidos ou não.
Útil para verificar se o SSM/Secrets Manager foi carregado corretamente no ECS.
"""

import json
import os
from urllib.parse import quote_plus

from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/diagnostico", tags=["Diagnóstico"])


def _present(value) -> str:
    """Retorna '***definido***' para valores sensíveis ou o valor real para não-sensíveis."""
    if value is None or value == "":
        return "(ausente)"
    return "***definido***"


def _safe(value) -> str:
    """Retorna o valor real (para vars não-sensíveis)."""
    if value is None or value == "":
        return "(ausente)"
    return str(value)


@router.get("/parameters")
def get_parameters():
    """
    Retorna o status das variáveis de ambiente carregadas pelo backend.

    - Variáveis sensíveis (secrets, passwords, tokens) são mascaradas como '***definido***'
    - Variáveis operacionais são exibidas com o valor real
    - '(ausente)' indica que a variável não foi carregada
    """
    return {
        "ambiente": {
            "APP_ENV":              _safe(os.environ.get("APP_ENV")),
            "NODE_ENV":             _safe(os.environ.get("NODE_ENV")),
            "USE_AWS_CONFIG":       _safe(os.environ.get("USE_AWS_CONFIG")),
            "CDK_APP_SERVICE_NAME": _safe(os.environ.get("CDK_APP_SERVICE_NAME")),
        },
        "banco_de_dados": {
            "DATABASE_URL":         _present(settings.database_url),
            "driver":               _safe(settings.database_url.split(":")[0] if settings.database_url else None),
        },
        "armazenamento": {
            "STORAGE_PROVIDER":     _safe(settings.storage_provider),
            "AWS_S3_BUCKET":        _safe(settings.aws_s3_bucket),
            "AWS_REGION":           _safe(settings.aws_region),
        },
        "autenticacao": {
            "AUTH_MODE":            _safe(settings.auth_mode),
            "ENTRA_TENANT_ID":      _present(settings.entra_tenant_id),
            "ENTRA_CLIENT_ID":      _present(settings.entra_client_id),
            "ENTRA_CLIENT_SECRET":  _present(settings.entra_client_secret),
            "ENTRA_APP_NAME":       _safe(settings.entra_app_name),
            "ENTRA_REDIRECT_URI":   _safe(settings.entra_redirect_uri),
        },
        "email": {
            "EMAIL_PROVIDER":       _safe(settings.email_provider),
            "SMTP_SERVER":          _safe(settings.smtp_server),
            "SMTP_PORT":            _safe(str(settings.smtp_port) if settings.smtp_port else None),
            "SMTP_USER":            _present(settings.smtp_user),
            "SMTP_PASS":            _present(settings.smtp_pass),
            "MAIL_FROM":            _safe(settings.mail_from),
        },
        "variaveis_brutas": {
            key: ("***mascarado***" if any(s in key.upper() for s in ["SECRET", "PASSWORD", "PASS", "TOKEN", "KEY"]) else val)
            for key, val in os.environ.items()
            if key.startswith(("APP_", "NEXT_", "BACKEND_", "AUTH_", "ENTRA_", "STORAGE_", "EMAIL_", "SMTP_", "DATABASE_", "USE_AWS", "CDK_"))
        },
    }


# ---------------------------------------------------------------------------
# Diagnóstico de conexão com banco via Secrets Manager
# ---------------------------------------------------------------------------

_SECRETS_TO_TEST: list[tuple[str, str]] = [
    ("db_aplicacao_psql_dsv_a12022_secret", "Usuário aplicação (DML)"),
    ("db_owner_psql_dsv_a12022_secret",     "Usuário owner (DDL/migrations)"),
]

_DB_PARAMS = [
    "rds_aurora_postgres_username",
    "rds_aurora_postgres_password",
    "rds_aurora_postgres_host",
    "rds_aurora_postgres_dbname",
    "rds_aurora_postgres_url",
]


def _fetch_secret(sm_client, secret_name: str) -> tuple[dict, list[str]]:
    """Busca uma secret e retorna (parâmetros de BD mapeados, chaves brutas da secret)."""
    from botocore.exceptions import ClientError

    try:
        # Acesso direto à chave — igual ao snippet oficial da AWS
        resp = sm_client.get_secret_value(SecretId=secret_name)
        secret_string: str = resp["SecretString"]  # KeyError se vier vazio/binário
        data: dict = json.loads(secret_string)
        params = {
            k: data.get(k) or data.get(k.upper()) or data.get(k.lower())
            for k in _DB_PARAMS
        }
        return params, sorted(data.keys())
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        raise RuntimeError(f"{code}: {exc.response['Error']['Message']}") from exc
    except KeyError:
        raise RuntimeError("SecretString ausente na resposta — secret pode ser binária ou vazia")


def _build_url(params: dict) -> str | None:
    raw = params.get("rds_aurora_postgres_url") or ""
    user   = params.get("rds_aurora_postgres_username", "")
    pwd    = params.get("rds_aurora_postgres_password", "")
    host   = params.get("rds_aurora_postgres_host", "")
    dbname = params.get("rds_aurora_postgres_dbname", "")

    if raw.startswith(("postgresql://", "postgres://")) and user in raw:
        url = raw
    elif user and pwd and host and dbname:
        url = f"postgresql://{quote_plus(user)}:{quote_plus(pwd)}@{host}/{dbname}"
    else:
        return None

    return url.replace("postgres://", "postgresql://", 1) if url.startswith("postgres://") else url


def _test_connection(url: str) -> tuple[bool, str]:
    """Tenta conectar e retorna (sucesso, mensagem)."""
    try:
        import psycopg
    except ImportError:
        try:
            import psycopg2 as psycopg  # type: ignore[no-redef]
        except ImportError:
            return False, "psycopg não instalado no servidor"

    try:
        conn = psycopg.connect(url, connect_timeout=8)
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                row = cur.fetchone()
                version = row[0][:80] if row else "?"
        return True, version
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


@router.get("/db-secrets")
def diagnostico_db_secrets():
    """
    Busca as secrets de banco de dados no AWS Secrets Manager e testa a conexão
    com o cluster RDS Aurora PostgreSQL.

    Dentro da AWS (ECS/EC2) usa a IAM Role da task automaticamente.
    Localmente usa as credenciais do ambiente (.env / ~/.aws / SSO).
    Passwords são mascarados na resposta.
    """
    region = os.environ.get("AWS_REGION", "sa-east-1")

    try:
        import boto3
    except ImportError:
        return {"status": "erro", "motivo": "boto3 não instalado no servidor."}

    # Usa Session explícita — padrão recomendado pela AWS para resolução correta
    # da IAM Role no ECS. Credenciais pelo chain padrão:
    # 1. Variáveis de ambiente  2. IAM Role (ECS/EC2)  3. ~/.aws/credentials
    session = boto3.session.Session()
    sm = session.client(service_name="secretsmanager", region_name=region)

    resultado: dict = {"regiao": region, "resumo": {}, "secrets": {}}

    for secret_name, label in _SECRETS_TO_TEST:
        entry: dict = {"label": label}

        # 1. Buscar secret
        try:
            params, raw_keys = _fetch_secret(sm, secret_name)
            entry["secret_manager"] = "ok"
            entry["chaves_na_secret"]         = raw_keys
            entry["chaves_esperadas"]         = _DB_PARAMS
            entry["parametros_encontrados"]   = [k for k in _DB_PARAMS if params.get(k)]
            entry["parametros_ausentes"]      = [k for k in _DB_PARAMS if not params.get(k)]
            entry["host"]    = params.get("rds_aurora_postgres_host", "(ausente)")
            entry["dbname"]  = params.get("rds_aurora_postgres_dbname", "(ausente)")
            entry["usuario"] = params.get("rds_aurora_postgres_username", "(ausente)")
            # Mascarar senha
            pwd = params.get("rds_aurora_postgres_password") or ""
            entry["password"] = (pwd[:4] + "***" + pwd[-4:]) if len(pwd) > 8 else "***"
        except RuntimeError as exc:
            entry["secret_manager"] = f"erro: {exc}"
            entry["conexao"] = "não testada (falha ao ler secret)"
            resultado["secrets"][secret_name] = entry
            resultado["resumo"][secret_name] = f"[{label}] ERRO secret: {exc}"
            continue

        # 2. Testar conexão
        url = _build_url(params)
        if not url:
            entry["conexao"] = "erro: parâmetros insuficientes para montar a URL"
            resultado["resumo"][secret_name] = f"[{label}] ERRO: parâmetros insuficientes"
        else:
            ok, msg = _test_connection(url)
            if ok:
                entry["conexao"] = "ok"
                entry["postgresql_version"] = msg
                resultado["resumo"][secret_name] = f"[{label}] CONECTADO — {msg[:60]}"
            else:
                entry["conexao"] = f"falha: {msg}"
                resultado["resumo"][secret_name] = f"[{label}] FALHA — {msg}"

        resultado["secrets"][secret_name] = entry

    return resultado
