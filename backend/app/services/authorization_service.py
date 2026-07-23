from typing import List
import logging

logger = logging.getLogger(__name__)

ROLE_PERMISSIONS = {
    # "admin" cobre o papel CAv4 "CD_PAPEL_AUDITOR", que é convertido para "admin"
    # internamente em resolve_access_from_cav4_roles (auditor → admin).
    # Não existe entrada separada "auditor" aqui — ambos têm acesso total (*).
    "admin": ["*"],

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

# Mapeamento de módulos da aplicação para as permissões que os desbloqueiam.
# Usado para calcular `allowed_modules` a partir da lista de permissões do usuário.
# Uma única permissão do módulo já é suficiente para habilitá-lo (lógica OR).
MODULE_PERMISSIONS: dict[str, list[str]] = {
    "upload":            ["file:upload", "shares:create"],
    "compartilhamentos": ["shares:read"],
    "supervisor":        ["shares:approve"],
    "historico":         ["shares:read"],
    "logs":              ["report:read"],
    "admin":             ["*"],
    "download":          ["file:download"],
}



MODULE_ACTIVATION_RULES: dict[str, list[str]] = {

    # Remetente
    "upload": ["file:upload", "shares:create"],
    "compartilhamentos": ["shares:read"],
    "historico": ["shares:read"],
    # Supervisor
    "supervisor": ["shares:approve"],
    # Logs
    "logs": ["report:read"],
    # Auditor
    "auditoria": ["audit:read"],
    # Usuário externo
    "download": ["file:download"],
    # Admin local / fallback (*)
    "admin": ["*"],
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


def get_allowed_modules(permissions: List[str]) -> List[str]:
    """
    Calcula quais módulos da aplicação o usuário pode acessar,
    com base na lista de permissões resolvida.

    - Se permissions contiver "*", todos os módulos são liberados.
    - Caso contrário, um módulo é liberado quando o usuário possui
      pelo menos UMA das permissões listadas em MODULE_PERMISSIONS[módulo].

    Esta função é usada para compor o campo `allowed_modules` na
    resposta de login, que o frontend armazena no auth-store.
    """
    if "*" in permissions:
        return sorted(MODULE_ACTIVATION_RULES.keys())

    allowed = []
    for module, required_perms in MODULE_ACTIVATION_RULES.items():
        if any(p in permissions for p in required_perms):
            allowed.append(module)

    return sorted(allowed)


def resolve_module_permissions(module: str) -> List[str]:
    """
    Retorna as permissões necessárias para acessar um módulo específico.
    Útil para geração de documentação e testes.

    Retorna lista vazia se o módulo não for reconhecido.
    """
    return MODULE_PERMISSIONS.get(module, [])