"""
GET /api/v1/diagnostico/parameters

Retorna o status de leitura das variáveis de ambiente do backend.
Valores sensíveis são mascarados — apenas indica se estão definidos ou não.
Útil para verificar se o SSM/Secrets Manager foi carregado corretamente no ECS.
"""

import os
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
