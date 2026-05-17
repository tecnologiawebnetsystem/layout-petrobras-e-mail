"""
Serviço de Hierarquia de Aprovação

Implementa regras de aprovação hierárquica:
1. O requisitante NÃO pode aprovar a si mesmo
2. O aprovador deve ser o gestor direto do requisitante (manager_id)
3. Se o gestor direto não estiver disponível, escala para o gestor superior
4. Validação de cargo/hierarquia organizacional
"""

from sqlmodel import Session, select
from typing import Optional, Tuple
from app.models.user import User
from app.models.share import Share
import logging

logger = logging.getLogger(__name__)


class ApprovalHierarchyError(Exception):
    """Erro de hierarquia de aprovação."""
    pass


def validate_approval_authority(
    session: Session,
    share: Share,
    approver: User,
    max_escalation_levels: int = 3,
) -> Tuple[bool, str]:
    """
    Valida se o aprovador tem autoridade para aprovar o compartilhamento.
    
    Regras:
    1. O requisitante NÃO pode aprovar a si mesmo
    2. O aprovador deve estar na cadeia hierárquica do requisitante
    3. Suporta escalação até max_escalation_levels níveis
    
    Args:
        session: Sessão do banco de dados
        share: Compartilhamento a ser aprovado
        approver: Usuário tentando aprovar
        max_escalation_levels: Número máximo de níveis de escalação
        
    Returns:
        Tuple[bool, str]: (autorizado, mensagem)
    """
    # Regra 1: O requisitante NÃO pode aprovar a si mesmo
    if share.created_by_id == approver.id:
        return False, "Voce nao pode aprovar seu proprio compartilhamento. A aprovacao deve ser realizada por seu gestor."
    
    # Busca o criador do share
    creator = session.get(User, share.created_by_id)
    if not creator:
        return False, "Requisitante nao encontrado."
    
    # Regra 2: Verifica se o aprovador está na cadeia hierárquica
    current_user = creator
    level = 0
    
    while current_user and level < max_escalation_levels:
        if current_user.manager_id == approver.id:
            # Aprovador é gestor direto ou na cadeia hierárquica
            logger.info(
                f"Aprovacao autorizada: approver={approver.email}, "
                f"creator={creator.email}, nivel_hierarquico={level + 1}"
            )
            return True, f"Aprovador autorizado (nivel {level + 1} da hierarquia)."
        
        # Escala para o próximo nível
        if current_user.manager_id:
            current_user = session.get(User, current_user.manager_id)
            level += 1
        else:
            break
    
    return False, "Acesso negado: voce nao tem autoridade para aprovar este compartilhamento."


def find_next_approver(
    session: Session,
    user: User,
    max_levels: int = 3,
) -> Optional[User]:
    """
    Encontra o próximo aprovador disponível na hierarquia.
    
    Se o gestor direto não estiver disponível (inativo ou sem is_supervisor),
    escala para o gestor do gestor.
    
    Args:
        session: Sessão do banco de dados
        user: Usuário que precisa de aprovação
        max_levels: Número máximo de níveis para escalar
        
    Returns:
        Optional[User]: Próximo aprovador disponível ou None
    """
    current_user = user
    level = 0
    
    while current_user and level < max_levels:
        if not current_user.manager_id:
            logger.warning(f"Usuario {current_user.email} nao possui gestor definido.")
            return None
        
        manager = session.get(User, current_user.manager_id)
        if not manager:
            logger.warning(f"Gestor ID {current_user.manager_id} nao encontrado.")
            return None
        
        # Verifica se o gestor está ativo e é supervisor
        if manager.status and manager.is_supervisor:
            logger.info(
                f"Aprovador encontrado: {manager.email} "
                f"(nivel {level + 1} da hierarquia de {user.email})"
            )
            return manager
        
        # Gestor não disponível, escala para o próximo nível
        logger.info(
            f"Gestor {manager.email} nao disponivel "
            f"(status={manager.status}, is_supervisor={manager.is_supervisor}), "
            f"escalando para nivel {level + 2}..."
        )
        current_user = manager
        level += 1
    
    logger.warning(
        f"Nenhum aprovador encontrado para {user.email} "
        f"apos {max_levels} niveis de escalacao."
    )
    return None


def get_approval_chain(
    session: Session,
    user: User,
    max_levels: int = 5,
) -> list[dict]:
    """
    Retorna a cadeia completa de aprovação para um usuário.
    
    Args:
        session: Sessão do banco de dados
        user: Usuário para verificar cadeia
        max_levels: Número máximo de níveis
        
    Returns:
        list[dict]: Lista de aprovadores na cadeia
    """
    chain = []
    current_user = user
    level = 0
    
    while current_user and level < max_levels:
        if not current_user.manager_id:
            break
        
        manager = session.get(User, current_user.manager_id)
        if not manager:
            break
        
        chain.append({
            "level": level + 1,
            "user_id": manager.id,
            "name": manager.name,
            "email": manager.email,
            "job_title": manager.job_title,
            "department": manager.department,
            "is_supervisor": manager.is_supervisor,
            "is_active": manager.status,
            "can_approve": manager.status and manager.is_supervisor,
        })
        
        current_user = manager
        level += 1
    
    return chain
