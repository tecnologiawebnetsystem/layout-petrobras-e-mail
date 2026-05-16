"""
test_db_secrets.py – Testes de integração: AWS Secrets Manager + conexão RDS Aurora.

Marcados com @pytest.mark.integration. Executados automaticamente no pipeline CDK
Petrobras quando as credenciais AWS reais estão disponíveis no ambiente.

Variáveis necessárias (injetadas pelo pipeline ou presentes no .env local):
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    AWS_SESSION_TOKEN   (opcional — apenas para credenciais temporárias STS)
    AWS_REGION          (padrão: sa-east-1)

Quando as credenciais forem as fake do conftest ("testing"), todos os testes
deste módulo são automaticamente ignorados (skip).

Execução manual (requer credenciais reais no .env ou no ambiente):
    pytest tests/test_db_secrets.py -v -m integration
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from urllib.parse import quote_plus

import pytest

# ── Carregar .env — credenciais reais têm prioridade sobre fake values do conftest ──
# O conftest usa setdefault("AWS_ACCESS_KEY_ID", "testing"), portanto é importado
# antes deste módulo e já definiu os valores fake. Para sobrescrever apenas as
# chaves AWS reais, fazemos assign direto para elas (não setdefault).
_AWS_KEYS = {
    "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN", "AWS_REGION",
}
_env_path = Path(__file__).resolve().parents[1] / ".env"
if _env_path.exists():
    for _line in _env_path.read_text(encoding="utf-8").splitlines():
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _, _v = _line.partition("=")
        _k = _k.strip()
        _v = _v.strip().strip('"').strip("'")
        if _k in _AWS_KEYS:
            # Override direto: .env local tem precedência sobre fake values do conftest
            if _v:
                os.environ[_k] = _v
        else:
            os.environ.setdefault(_k, _v)

# ── Skip automático quando as credenciais são as fake do conftest ─────────────
pytestmark = pytest.mark.integration

_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY", "")

if _KEY_ID in ("", "testing") or _SECRET in ("", "testing"):
    pytest.skip(
        "Credenciais AWS reais não encontradas — testes de integração "
        "com Secrets Manager/RDS ignorados. "
        "Preencha AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env.",
        allow_module_level=True,
    )

# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────

_REGION = os.getenv("AWS_REGION", "sa-east-1")
_TOKEN  = os.getenv("AWS_SESSION_TOKEN") or None

SECRETS_TO_TEST = [
    "db_aplicacao_psql_dsv_a12022_secret",
    "db_owner_psql_dsv_a12022_secret",
]

DB_PARAMS = [
    "rds_aurora_postgres_username",
    "rds_aurora_postgres_password",
    "rds_aurora_postgres_host",
    "rds_aurora_postgres_dbname",
    "rds_aurora_postgres_url",
]

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def sm_client():
    """Cliente boto3 Secrets Manager autenticado com credenciais reais do .env."""
    import boto3

    kwargs: dict = dict(
        aws_access_key_id=_KEY_ID,
        aws_secret_access_key=_SECRET,
        region_name=_REGION,
    )
    if _TOKEN:
        kwargs["aws_session_token"] = _TOKEN

    return boto3.client("secretsmanager", **kwargs)


@pytest.fixture(scope="module")
def all_secrets(sm_client) -> dict[str, dict]:
    """Busca e retorna todas as secrets como dicionário {nome: {param: valor}}."""
    from botocore.exceptions import ClientError

    result: dict[str, dict] = {}
    for secret_name in SECRETS_TO_TEST:
        try:
            resp = sm_client.get_secret_value(SecretId=secret_name)
            data: dict = json.loads(resp.get("SecretString", "{}"))
            result[secret_name] = {
                k: data.get(k) or data.get(k.upper()) or data.get(k.lower())
                for k in DB_PARAMS
            }
        except ClientError as exc:
            code = exc.response["Error"]["Code"]
            pytest.fail(
                f"Falha ao buscar secret '{secret_name}': {code} — "
                f"{exc.response['Error']['Message']}"
            )
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Testes — Secrets Manager
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("secret_name", SECRETS_TO_TEST)
def test_secret_acessivel(sm_client, secret_name: str) -> None:
    """Verifica que a secret existe e é acessível via Secrets Manager."""
    from botocore.exceptions import ClientError

    try:
        resp = sm_client.get_secret_value(SecretId=secret_name)
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        pytest.fail(f"Secret '{secret_name}' inacessível: {code}")

    assert "SecretString" in resp, f"Secret '{secret_name}' não contém SecretString."


@pytest.mark.parametrize("secret_name", SECRETS_TO_TEST)
def test_secret_contem_todos_os_parametros(all_secrets: dict, secret_name: str) -> None:
    """Verifica que todos os parâmetros de BD esperados estão presentes na secret."""
    params = all_secrets.get(secret_name, {})
    ausentes = [p for p in DB_PARAMS if not params.get(p)]
    assert not ausentes, (
        f"Parâmetros ausentes na secret '{secret_name}': {ausentes}"
    )


@pytest.mark.parametrize("secret_name", SECRETS_TO_TEST)
def test_secret_host_e_dbname_nao_vazios(all_secrets: dict, secret_name: str) -> None:
    """Valida que host e dbname não são strings vazias."""
    params = all_secrets.get(secret_name, {})
    assert params.get("rds_aurora_postgres_host"), (
        f"rds_aurora_postgres_host vazio em '{secret_name}'"
    )
    assert params.get("rds_aurora_postgres_dbname"), (
        f"rds_aurora_postgres_dbname vazio em '{secret_name}'"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Testes — Conexão PostgreSQL
# ─────────────────────────────────────────────────────────────────────────────

def _build_connection_url(params: dict) -> str | None:
    """Monta a URL de conexão PostgreSQL a partir dos parâmetros da secret."""
    raw_url = params.get("rds_aurora_postgres_url") or ""
    user    = params.get("rds_aurora_postgres_username", "")
    pwd     = params.get("rds_aurora_postgres_password", "")
    host    = params.get("rds_aurora_postgres_host", "")
    dbname  = params.get("rds_aurora_postgres_dbname", "")

    # URL completa válida tem precedência
    if raw_url.startswith(("postgresql://", "postgres://")) and user in raw_url:
        url = raw_url
    elif user and pwd and host and dbname:
        url = f"postgresql://{quote_plus(user)}:{quote_plus(pwd)}@{host}/{dbname}"
    else:
        return None

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def _psycopg_available() -> bool:
    try:
        import psycopg  # psycopg3  # noqa: F401
        return True
    except ImportError:
        pass
    try:
        import psycopg2  # noqa: F401
        return True
    except ImportError:
        return False


@pytest.mark.parametrize("secret_name", SECRETS_TO_TEST)
def test_conexao_postgresql(all_secrets: dict, secret_name: str) -> None:
    """
    Tenta estabelecer conexão TCP com o cluster RDS Aurora.

    Requer conectividade de rede com a VPC AWS (VPN, SSM tunnel ou Bastion SSH).
    Sem essa conectividade, o teste falha com ConnectionTimeout — o que indica
    que as credenciais estão corretas mas a rota de rede ainda não foi liberada.
    """
    if not _psycopg_available():
        pytest.skip("psycopg / psycopg2 não instalado. Execute: pip install psycopg[binary]")

    params = all_secrets.get(secret_name, {})
    url = _build_connection_url(params)

    assert url is not None, (
        f"Não foi possível montar a URL de conexão para '{secret_name}'. "
        "Verifique se os parâmetros de host, usuário e senha estão presentes."
    )

    try:
        import psycopg  # psycopg3
    except ImportError:
        import psycopg2 as psycopg  # type: ignore[no-redef]

    try:
        conn = psycopg.connect(url, connect_timeout=10)
    except Exception as exc:
        pytest.fail(
            f"Falha ao conectar ao RDS via secret '{secret_name}': "
            f"{type(exc).__name__}: {exc}\n"
            "Se o erro for ConnectionTimeout, verifique a conectividade de rede "
            "(VPN, SSM Port Forwarding ou Bastion SSH — veja docs/solicitacao_acesso_rds.html)."
        )

    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            row = cur.fetchone()
            assert row is not None, "SELECT version() não retornou resultado."
            assert "PostgreSQL" in row[0], f"Versão inesperada: {row[0]}"
