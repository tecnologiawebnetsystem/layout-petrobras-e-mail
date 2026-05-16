"""
Servico de sincronizacao de usuarios por grupo Microsoft Entra ID.

Responsavel por:
- Verificar se um usuario pertence ao grupo obrigatorio via Microsoft Graph API
- Criar/atualizar/desativar usuarios baseado em membership no grupo
- Sincronizar em massa todos os membros do grupo (bulk sync para cron/admin)

O grupo e 100% parametrizado via variaveis de ambiente:
  ENTRA_REQUIRED_GROUP_ID    — Object ID (UUID) do grupo no Entra ID
  ENTRA_REQUIRED_GROUP_NAME  — nome human-readable (para logs/UI)
  ENTRA_GROUP_SYNC_STRATEGY  — "deactivate" | "block_login"
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

# ---------------------------------------------------------------------------
# Microsoft Graph API base
# ---------------------------------------------------------------------------

_GRAPH_BASE = "https://graph.microsoft.com/v1.0"


# ---------------------------------------------------------------------------
# 1. Verificar membership no grupo
# ---------------------------------------------------------------------------

def check_user_in_group(ms_access_token: str) -> bool:
    """
    Verifica se o usuario autenticado pertence ao grupo obrigatorio.

    Usa a endpoint Graph /me/memberOf que retorna todos os grupos/roles
    do usuario. Compara o Object ID de cada grupo com o configurado em
    ENTRA_REQUIRED_GROUP_ID.

    Retorna True se o usuario pertence ao grupo, False caso contrario.
    Se ENTRA_REQUIRED_GROUP_ID nao esta configurado, retorna True (sem filtro).
    """
    group_id = settings.entra_required_group_id
    if not group_id:
        # Nenhum grupo configurado — todos passam
        logger.warning("ENTRA_REQUIRED_GROUP_ID nao configurado. Permitindo todos os usuarios.")
        return True

    groups = get_user_groups(ms_access_token)
    return group_id in groups


def get_user_groups(ms_access_token: str) -> list[str]:
    """
    Retorna a lista de Object IDs dos grupos/roles do usuario autenticado.
    Usa paginacao automatica do Graph (@odata.nextLink).
    """
    group_ids: list[str] = []
    url = f"{_GRAPH_BASE}/me/memberOf?$select=id,displayName,@odata.type"
    headers = {"Authorization": f"Bearer {ms_access_token}"}

    try:
        with httpx.Client(timeout=15.0) as client:
            while url:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.error(
                        f"Graph /me/memberOf retornou {resp.status_code}: {resp.text[:200]}"
                    )
                    break
                data = resp.json()
                for member in data.get("value", []):
                    member_id = member.get("id")
                    if member_id:
                        group_ids.append(member_id)
                url = data.get("@odata.nextLink")
    except httpx.TimeoutException:
        logger.error("Timeout ao consultar Graph /me/memberOf")
    except Exception as e:
        logger.error(f"Erro ao consultar Graph /me/memberOf: {e}")

    return group_ids


def check_user_in_group_by_id(ms_access_token: str, group_id: str) -> bool:
    """
    Verifica membership usando o endpoint direto /me/checkMemberGroups.
    Mais eficiente que listar todos os grupos para verificar um unico.
    """
    url = f"{_GRAPH_BASE}/me/checkMemberGroups"
    headers = {
        "Authorization": f"Bearer {ms_access_token}",
        "Content-Type": "application/json",
    }
    payload = {"groupIds": [group_id]}

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                result = resp.json()
                return group_id in result.get("value", [])
            else:
                logger.error(
                    f"Graph checkMemberGroups retornou {resp.status_code}: {resp.text[:200]}"
                )
    except Exception as e:
        logger.error(f"Erro ao verificar membership via checkMemberGroups: {e}")

    # Fallback: tentar via /me/memberOf
    return check_user_in_group(ms_access_token)


# ---------------------------------------------------------------------------
# 2. Sync usuario baseado em membership
# ---------------------------------------------------------------------------

def sync_user_from_group(
    session: Session,
    email: str,
    name: str,
    claims: dict,
    graph_info: dict,
    is_in_group: bool,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> User:
    """
    Cria, atualiza ou desativa um usuario baseado em membership no grupo.

    Regras:
    - Se is_in_group=True:
        - Cria usuario se nao existe (tipo INTERNAL, status=True)
        - Atualiza dados se ja existe
        - Garante status=True (reativa se estava desativado)
    - Se is_in_group=False:
        - strategy="deactivate": desativa usuario (status=False)
        - strategy="block_login": nao altera status, apenas bloqueia a operacao
    """
    strategy = settings.entra_group_sync_strategy
    group_name = settings.entra_required_group_name

    user = session.exec(select(User).where(User.email == email)).first()

    if is_in_group:
        # --- Usuario pertence ao grupo ---
        if not user:
            # Criar usuario novo
            user = User(
                email=email,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=_resolve_supervisor(claims, graph_info),
                department=graph_info.get("department"),
                job_title=graph_info.get("job_title"),
                employee_id=graph_info.get("employee_id"),
                photo_url=(graph_info.get("photo_url") or "")[:500] or None,
                status=True,
                last_login=datetime.now(UTC),
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            log_event(
                session=session,
                action="USER_CREATED_BY_GROUP_SYNC",
                user_id=user.id,
                detail=f"email={email}, group={group_name}",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Usuario criado via group sync: {email}")
        else:
            # Atualizar dados
            was_inactive = not user.status
            user.name = name
            user.type = TypeUser.INTERNAL
            user.status = True  # Garante ativo
            user.last_login = datetime.now(UTC)
            user.is_supervisor = _resolve_supervisor(claims, graph_info)

            if graph_info.get("job_title") is not None:
                user.job_title = graph_info["job_title"]
            if graph_info.get("department") is not None:
                user.department = graph_info["department"]
            if graph_info.get("employee_id") is not None:
                user.employee_id = graph_info["employee_id"]
            if graph_info.get("photo_url"):
                user.photo_url = graph_info["photo_url"][:500]

            session.add(user)
            session.commit()
            session.refresh(user)

            if was_inactive:
                log_event(
                    session=session,
                    action="USER_REACTIVATED_BY_GROUP_SYNC",
                    user_id=user.id,
                    detail=f"email={email}, group={group_name}",
                    ip=request_ip,
                    user_agent=request_ua,
                )
                logger.info(f"Usuario reativado via group sync: {email}")

        # Vincular gestor
        if graph_info.get("manager_email") and user.manager_id is None:
            manager = session.exec(
                select(User).where(User.email == graph_info["manager_email"])
            ).first()
            if manager:
                user.manager_id = manager.id
                session.add(user)
                session.commit()

        return user

    else:
        # --- Usuario NAO pertence ao grupo ---
        if strategy == "deactivate":
            if user:
                if user.status:
                    user.status = False
                    session.add(user)
                    session.commit()
                    session.refresh(user)

                    log_event(
                        session=session,
                        action="USER_DEACTIVATED_BY_GROUP_SYNC",
                        user_id=user.id,
                        detail=f"email={email}, group={group_name}, strategy=deactivate",
                        ip=request_ip,
                        user_agent=request_ua,
                    )
                    logger.info(f"Usuario desativado (nao pertence ao grupo): {email}")
                return user

        # strategy="block_login" — nao desativa, retorna o usuario como esta
        if user:
            return user

        # Usuario nao existe E nao esta no grupo → nao criar
        raise ValueError(
            f"Usuario {email} nao pertence ao grupo {group_name} e nao sera criado."
        )


# ---------------------------------------------------------------------------
# 3. Bulk sync — lista membros do grupo e sincroniza no banco
# ---------------------------------------------------------------------------

def bulk_sync_group_members(
    session: Session,
    admin_access_token: str,
    request_ip: Optional[str] = None,
    request_ua: Optional[str] = None,
) -> dict:
    """
    Sincroniza todos os membros do grupo no banco de dados.

    Fluxo:
    1. Lista todos os membros do grupo via Graph API
    2. Para cada membro: cria se nao existe, atualiza se ja existe, garante status=True
    3. Para cada usuario INTERNAL no banco que NAO esta no grupo: desativa (status=False)

    Requer token com permissao GroupMember.Read.All ou Directory.Read.All.
    """
    group_id = settings.entra_required_group_id
    group_name = settings.entra_required_group_name

    if not group_id:
        return {"error": "ENTRA_REQUIRED_GROUP_ID nao configurado."}

    # 1. Listar membros do grupo
    members = _list_group_members(admin_access_token, group_id)

    if members is None:
        return {"error": "Falha ao listar membros do grupo via Graph API."}

    # 2. Processar cada membro
    created = 0
    updated = 0
    reactivated = 0
    member_emails: set[str] = set()

    for member in members:
        email = member.get("mail") or member.get("userPrincipalName")
        if not email:
            continue

        email = email.lower()
        member_emails.add(email)
        name = member.get("displayName") or email.split("@")[0]

        user = session.exec(select(User).where(User.email == email)).first()

        if not user:
            # Criar
            user = User(
                email=email,
                name=name,
                type=TypeUser.INTERNAL,
                is_supervisor=False,
                department=member.get("department"),
                job_title=member.get("jobTitle"),
                employee_id=member.get("employeeId"),
                status=True,
                last_login=None,
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            created += 1

            log_event(
                session=session,
                action="USER_CREATED_BY_BULK_SYNC",
                user_id=user.id,
                detail=f"email={email}, group={group_name}",
                ip=request_ip,
                user_agent=request_ua,
            )
        else:
            # Atualizar
            was_inactive = not user.status
            user.name = name
            user.status = True
            if member.get("department"):
                user.department = member["department"]
            if member.get("jobTitle"):
                user.job_title = member["jobTitle"]
            if member.get("employeeId"):
                user.employee_id = member["employeeId"]
            session.add(user)
            session.commit()

            if was_inactive:
                reactivated += 1
                log_event(
                    session=session,
                    action="USER_REACTIVATED_BY_BULK_SYNC",
                    user_id=user.id,
                    detail=f"email={email}, group={group_name}",
                    ip=request_ip,
                    user_agent=request_ua,
                )
            else:
                updated += 1

    # 3. Desativar usuarios internos que NAO estao no grupo
    deactivated = 0
    all_internal = session.exec(
        select(User).where(
            User.type == TypeUser.INTERNAL,
            User.status == True,
        )
    ).all()

    for user in all_internal:
        if user.email.lower() not in member_emails:
            user.status = False
            session.add(user)
            deactivated += 1

            log_event(
                session=session,
                action="USER_DEACTIVATED_BY_BULK_SYNC",
                user_id=user.id,
                detail=f"email={user.email}, group={group_name}, reason=not_in_group",
                ip=request_ip,
                user_agent=request_ua,
            )
            logger.info(f"Usuario desativado por bulk sync (nao no grupo): {user.email}")

    session.commit()

    return {
        "group_id": group_id,
        "group_name": group_name,
        "total_members_in_group": len(members),
        "created": created,
        "updated": updated,
        "reactivated": reactivated,
        "deactivated": deactivated,
    }


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

# Cargos que concedem is_supervisor=True
_SUPERVISOR_TITLES = [
    "gerente", "coordenador", "diretor", "superintendente",
    "chefe", "lider", "líder", "supervisor",
]


def _resolve_supervisor(claims: dict, graph_info: dict) -> bool:
    """Determina se o usuario deve ser marcado como supervisor."""
    # 1. Verificar por grupo
    groups = set(claims.get("groups", []))
    sup_groups = set(settings.entra_supervisor_group_ids or [])
    if groups.intersection(sup_groups):
        return True

    # 2. Verificar por cargo
    job_title = graph_info.get("job_title", "")
    if job_title and any(t in job_title.lower() for t in _SUPERVISOR_TITLES):
        return True

    return False


def _list_group_members(admin_token: str, group_id: str) -> Optional[list[dict]]:
    """
    Lista todos os membros de um grupo via Graph API.
    Suporta paginacao automatica (@odata.nextLink).
    """
    members: list[dict] = []
    url = (
        f"{_GRAPH_BASE}/groups/{group_id}/members"
        f"?$select=id,displayName,mail,userPrincipalName,jobTitle,department,employeeId"
        f"&$top=999"
    )
    headers = {"Authorization": f"Bearer {admin_token}"}

    try:
        with httpx.Client(timeout=30.0) as client:
            while url:
                resp = client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.error(
                        f"Graph /groups/{group_id}/members retornou "
                        f"{resp.status_code}: {resp.text[:300]}"
                    )
                    return None
                data = resp.json()
                members.extend(data.get("value", []))
                url = data.get("@odata.nextLink")
    except httpx.TimeoutException:
        logger.error(f"Timeout ao listar membros do grupo {group_id}")
        return None
    except Exception as e:
        logger.error(f"Erro ao listar membros do grupo {group_id}: {e}")
        return None

    return members
