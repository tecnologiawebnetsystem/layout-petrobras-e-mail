from typing import List
import logging

logger = logging.getLogger(__name__)

ROLE_PERMISSIONS = {
    "admin": ["*"],
    "auditor": ["*"],

    "supervisor": [        
        "shares:read",
        "shares:approve",
        "shares:reject",
        "shares:extend",
        "shares:resend",
        "shares:file:delete",
        "shares:download",
        "report:read",
    ],

    "internal": [
        "shares:create",
        "shares:read",
        "shares:cancel",
        "shares:delete",
        "shares:resend",
        "file:upload",
    ],

    "external_user": [
        "file:download",
    ],
}


def resolve_permissions(roles: List[str]) -> List:
    """
    Resolve permissões com base nas roles do usuário.

    ⚠️ IMPORTANTE:
    - Este método é usado como FALLBACK quando o CAV4 não retorna resources.
    - Em fluxo normal, as permissions devem vir diretamente do CAV4.
    """
    
    logger.warning(
        "FALLBACK_LOCAL_PERMISSIONS_USADO roles=%s",
        roles
    )


    if not roles:
        logger.warning("resolve_permissions chamado com roles vazias.")
        return []

    permissions = set()

    for role in roles:
        role_perms = ROLE_PERMISSIONS.get(role, [])

        if not role_perms:
            logger.warning("Role sem mapeamento local: %s", role)

        # Admin / auditor têm acesso total
        if "*" in role_perms:
            logger.debug("Role '%s' possui acesso total (*)", role)
            return ["*"]

        permissions.update(role_perms)

    result = sorted(list(permissions))

    logger.debug(
        "resolve_permissions (fallback): roles=%s → permissions=%s",
        roles,
        result
    )

    return result