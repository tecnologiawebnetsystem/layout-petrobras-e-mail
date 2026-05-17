"""
Servico de auto-criacao e vinculacao de supervisores.

Responsavel por:
- Buscar o gestor (manager) do usuario via Microsoft Graph API (/me/manager)
- Verificar se o gestor ja existe na base de dados local (por e-mail)
- Criar automaticamente o gestor como supervisor (is_supervisor=True, status=True)
  caso nao exista
- Vincular o gestor ao usuario autenticado via manager_id
- Enriquecer dados do gestor via Graph API (/users/{email}) se access_token disponivel

O fluxo e chamado automaticamente durante o callback de autenticacao Entra ID.
"""

import httpx
import logging
from datetime import datetime, UTC
from sqlmodel import Session, select
from typing import Optional

from app.core.config import settings
from app.models.user import User, TypeUser
from app.services.audit_service import log_event

logger = logging.getLogger(__name__)

_GRAPH_BASE = "https://graph.microsoft.com/v1.0"


# ---------------------------------------------------------------------------
# 1. Funcao principal: resolver e vincular supervisor
# ---------------------------------------------------------------------------

def resolve_and_link_supervisor(
    session: Session,
    user: User,
    graph_info: dict,
    ms_access_token: Optional[str] = None,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> Optional[User]:
    """
    Resolve o supervisor do usuario e vincula via manager_id.

    Fluxo:
    1. Obtem manager_email e manager_name de graph_info
    2. Busca supervisor na base por e-mail
    3. Se NAO existe: cria automaticamente com is_supervisor=True, status=True
    4. Se ms_access_token disponivel e supervisor recem-criado: enriquece dados via Graph
    5. Vincula user.manager_id ao supervisor
    6. Registra log de auditoria

    Args:
        session: Sessao do banco de dados
        user: Usuario autenticado (subordinado)
        graph_info: Dados coletados do Graph (/me, /me/manager)
        ms_access_token: Token Microsoft para consulta adicional (opcional)
        request_ip: IP da requisicao (para log)
        request_ua: User-Agent da requisicao (para log)

    Returns:
        User supervisor encontrado/criado, ou None se nao ha manager_email
    """
    manager_email = graph_info.get("manager_email")
    manager_name = graph_info.get("manager_name")

    if not manager_email:
        logger.debug(f"Usuario {user.email} nao possui manager no Graph.")
        return None

    manager_email = manager_email.lower().strip()

    # Buscar supervisor existente na base
    supervisor = session.exec(
        select(User).where(User.email == manager_email)
    ).first()

    if supervisor:
        # Supervisor ja existe — garantir que esta marcado como supervisor e ativo
        changed = False
        if not supervisor.is_supervisor:
            supervisor.is_supervisor = True
            changed = True
            log_event(
                session=session,
                action="SUPERVISOR_PROMOTED",
                user_id=supervisor.id,
                detail=f"Promovido a supervisor (detectado como manager de {user.email})",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Supervisor promovido: {manager_email} (manager de {user.email})")

        if not supervisor.status:
            supervisor.status = True
            changed = True
            log_event(
                session=session,
                action="SUPERVISOR_REACTIVATED",
                user_id=supervisor.id,
                detail=f"Reativado (detectado como manager de {user.email})",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Supervisor reativado: {manager_email}")

        if changed:
            session.add(supervisor)
            session.commit()
            session.refresh(supervisor)
    else:
        # Supervisor NAO existe — criar automaticamente
        supervisor = _auto_create_supervisor(
            session=session,
            manager_email=manager_email,
            manager_name=manager_name,
            ms_access_token=ms_access_token,
            subordinate_email=user.email,
            request_ip=request_ip,
            request_ua=request_ua,
        )

    # Vincular manager_id (se ainda nao vinculado ou se mudou)
    if user.manager_id != supervisor.id:
        old_manager_id = user.manager_id
        user.manager_id = supervisor.id
        session.add(user)
        session.commit()
        session.refresh(user)

        log_event(
            session=session,
            action="SUPERVISOR_LINKED",
            user_id=user.id,
            detail=(
                f"supervisor_id={supervisor.id}, "
                f"supervisor_email={supervisor.email}, "
                f"previous_manager_id={old_manager_id}"
            ),
            ip=request_ip,
            user_agent=request_ua,
        )
        logger.info(
            f"Usuario {user.email} vinculado ao supervisor {supervisor.email} "
            f"(id={supervisor.id})"
        )

    return supervisor


# ---------------------------------------------------------------------------
# 2. Auto-criacao de supervisor
# ---------------------------------------------------------------------------

def _auto_create_supervisor(
    session: Session,
    manager_email: str,
    manager_name: Optional[str],
    ms_access_token: Optional[str] = None,
    subordinate_email: str = "",
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> User:
    """
    Cria automaticamente um usuario supervisor na base de dados.

    Dados obrigatorios: email
    Dados opcionais (enriquecidos via Graph se token disponivel):
      name, department, job_title, employee_id

    O supervisor criado tera:
    - type = INTERNAL
    - is_supervisor = True
    - status = True
    """
    # Tentar enriquecer dados via Graph API se token disponivel
    enriched = {}
    if ms_access_token:
        enriched = _enrich_manager_from_graph(ms_access_token, manager_email)

    supervisor = User(
        email=manager_email,
        name=enriched.get("name") or manager_name or manager_email.split("@")[0],
        type=TypeUser.INTERNAL,
        is_supervisor=True,
        status=True,
        department=enriched.get("department"),
        job_title=enriched.get("job_title"),
        employee_id=enriched.get("employee_id"),
        photo_url=(enriched.get("photo_url") or "")[:500] or None,
        last_login=None,  # Nunca logou diretamente
    )
    session.add(supervisor)
    session.commit()
    session.refresh(supervisor)

    log_event(
        session=session,
        action="SUPERVISOR_AUTO_CREATED",
        user_id=supervisor.id,
        detail=(
            f"email={manager_email}, "
            f"name={supervisor.name}, "
            f"department={supervisor.department}, "
            f"job_title={supervisor.job_title}, "
            f"detected_from_subordinate={subordinate_email}"
        ),
        ip=request_ip,
        user_agent=request_ua,
    )
    logger.info(
        f"Supervisor auto-criado: {manager_email} "
        f"(detectado como manager de {subordinate_email})"
    )

    return supervisor


# ---------------------------------------------------------------------------
# 3. Enriquecer dados do manager via Graph API
# ---------------------------------------------------------------------------

def _enrich_manager_from_graph(access_token: str, manager_email: str) -> dict:
    """
    Busca dados do manager via Microsoft Graph API /users/{email}.

    Retorna dicionario com:
    - name, department, job_title, employee_id, photo_url

    Se o Graph retornar erro ou timeout, retorna dicionario vazio.
    O enriquecimento NAO e obrigatorio — se falhar, o supervisor
    sera criado apenas com email e nome basico.
    """
    info: dict = {}
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        with httpx.Client(timeout=10.0) as client:
            # Buscar perfil do manager
            resp = client.get(
                f"{_GRAPH_BASE}/users/{manager_email}"
                f"?$select=displayName,jobTitle,department,employeeId,mail",
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                info["name"] = data.get("displayName")
                info["department"] = data.get("department")
                info["job_title"] = data.get("jobTitle")
                info["employee_id"] = data.get("employeeId")
            else:
                logger.warning(
                    f"Graph /users/{manager_email} retornou {resp.status_code}: "
                    f"{resp.text[:200]}"
                )

            # Buscar foto do manager
            photo_resp = client.get(
                f"{_GRAPH_BASE}/users/{manager_email}/photo/$value",
                headers=headers,
            )
            if photo_resp.status_code == 200:
                import base64 as _b64
                ct = photo_resp.headers.get("Content-Type", "image/jpeg")
                info["photo_url"] = (
                    f"data:{ct};base64,{_b64.b64encode(photo_resp.content).decode()}"
                )

    except httpx.TimeoutException:
        logger.warning(f"Timeout ao enriquecer dados do manager {manager_email}")
    except Exception as e:
        logger.warning(f"Erro ao enriquecer dados do manager {manager_email}: {e}")

    return info


# ---------------------------------------------------------------------------
# 4. Buscar manager info diretamente (utilitario para diagnostico)
# ---------------------------------------------------------------------------

def get_manager_info_from_graph(access_token: str) -> Optional[dict]:
    """
    Busca dados do manager do usuario autenticado via Graph /me/manager.

    Util para diagnostico e para garantir que o Graph retorna dados
    corretamente antes de tentar auto-criar.

    Returns:
        Dict com mail, displayName, jobTitle, department, employeeId
        ou None se nao disponivel.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                f"{_GRAPH_BASE}/me/manager"
                f"?$select=displayName,mail,jobTitle,department,employeeId",
                headers=headers,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "email": data.get("mail"),
                    "name": data.get("displayName"),
                    "job_title": data.get("jobTitle"),
                    "department": data.get("department"),
                    "employee_id": data.get("employeeId"),
                }
            elif resp.status_code == 404:
                logger.info("Usuario nao tem manager definido no Entra ID.")
                return None
            else:
                logger.warning(
                    f"Graph /me/manager retornou {resp.status_code}: {resp.text[:200]}"
                )
    except Exception as e:
        logger.warning(f"Erro ao buscar manager via Graph: {e}")

    return None
