"""
Rotas de suporte para cadastro de usuarios externos.
Acesso restrito a usuarios com role 'support' ou supervisores.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, UTC
from pydantic import BaseModel, EmailStr
from typing import Optional, List

from app.db.session import get_session
from app.models.user import User, TypeUser
from app.models.audit import Audit
from app.models.support_registration import SupportRegistration, SupportRegistrationStatus
from app.models.support_audit import SupportAudit, SupportAction
from app.core.security import get_current_user_from_token
from app.services.audit_service import log_action

router = APIRouter(prefix="/support", tags=["support"])


class CadastroUsuarioRequest(BaseModel):
    """Schema para cadastro de usuario externo"""
    numero_solicitacao: str
    email_solicitante: EmailStr
    email_usuario_externo: EmailStr


class CadastroUsuarioResponse(BaseModel):
    """Schema de resposta do cadastro"""
    id: int
    numero_solicitacao: str
    email_solicitante: str
    email_usuario_externo: str
    status: str
    created_at: datetime
    cadastrado_por: str


class UsuarioListItem(BaseModel):
    """Schema para item da lista de usuarios"""
    id: int
    email: str
    name: str
    status: str
    created_at: datetime
    numero_solicitacao: Optional[str] = None


@router.post("/users", response_model=CadastroUsuarioResponse)
async def cadastrar_usuario_externo(
    data: CadastroUsuarioRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token),
):
    """
    Cadastra um novo usuario externo no sistema.
    
    Apenas usuarios com role 'support' ou supervisores podem acessar.
    """
    # Verifica permissao
    if current_user.type != TypeUser.SUPPORT and not current_user.is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas suporte ou supervisores podem cadastrar usuarios.",
        )

    # Verifica duplicidade
    existing_user = session.exec(
        select(User).where(
            User.email == data.email_usuario_externo,
            User.status == True,
        )
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe um usuario ativo com este e-mail.",
        )

    # Verifica se usuario existe mas esta inativo (reativacao)
    inactive_user = session.exec(
        select(User).where(
            User.email == data.email_usuario_externo,
            User.status == False,
        )
    ).first()

    if inactive_user:
        # Reativa usuario existente
        inactive_user.status = True
        inactive_user.last_login = None
        session.add(inactive_user)
        session.commit()
        session.refresh(inactive_user)

        # Registra na tabela support_registration
        registration = SupportRegistration(
            request_number=data.numero_solicitacao,
            requester_email=data.email_solicitante,
            external_user_email=inactive_user.email,
            external_user_id=inactive_user.id,
            registered_by_id=current_user.id,
            registered_by_name=current_user.name,
            status=SupportRegistrationStatus.ATIVO,
            is_reactivation=True,
        )
        session.add(registration)
        session.commit()
        session.refresh(registration)

        # Registra auditoria de suporte
        audit = SupportAudit(
            action=SupportAction.REATIVACAO,
            description=f"Usuario {inactive_user.email} reativado",
            details=f'{{"numero_solicitacao": "{data.numero_solicitacao}", "email_solicitante": "{data.email_solicitante}"}}',
            support_user_id=current_user.id,
            registration_id=registration.id,
            affected_user_id=inactive_user.id,
        )
        session.add(audit)
        session.commit()

        # Registra auditoria geral
        log_action(
            session=session,
            actor_id=current_user.id,
            action="user_reactivated",
            resource_type="user",
            resource_id=inactive_user.id,
            details={
                "numero_solicitacao": data.numero_solicitacao,
                "email_solicitante": data.email_solicitante,
                "reactivated": True,
            },
        )

        return CadastroUsuarioResponse(
            id=inactive_user.id,
            numero_solicitacao=data.numero_solicitacao,
            email_solicitante=data.email_solicitante,
            email_usuario_externo=inactive_user.email,
            status="ativo",
            created_at=inactive_user.created_at,
            cadastrado_por=current_user.name,
        )

    # Cria novo usuario externo
    new_user = User(
        type=TypeUser.EXTERNAL,
        name=data.email_usuario_externo.split("@")[0].replace(".", " ").title(),
        email=data.email_usuario_externo,
        status=True,
        created_at=datetime.now(UTC),
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    # Registra na tabela support_registration
    registration = SupportRegistration(
        request_number=data.numero_solicitacao,
        requester_email=data.email_solicitante,
        external_user_email=new_user.email,
        external_user_id=new_user.id,
        registered_by_id=current_user.id,
        registered_by_name=current_user.name,
        status=SupportRegistrationStatus.ATIVO,
        is_reactivation=False,
    )
    session.add(registration)
    session.commit()
    session.refresh(registration)

    # Registra auditoria de suporte
    audit = SupportAudit(
        action=SupportAction.CADASTRO,
        description=f"Novo usuario {new_user.email} cadastrado",
        details=f'{{"numero_solicitacao": "{data.numero_solicitacao}", "email_solicitante": "{data.email_solicitante}"}}',
        support_user_id=current_user.id,
        registration_id=registration.id,
        affected_user_id=new_user.id,
    )
    session.add(audit)
    session.commit()

    # Registra auditoria geral
    log_action(
        session=session,
        actor_id=current_user.id,
        action="user_created",
        resource_type="user",
        resource_id=new_user.id,
        details={
            "numero_solicitacao": data.numero_solicitacao,
            "email_solicitante": data.email_solicitante,
            "created_by_support": True,
        },
    )

    return CadastroUsuarioResponse(
        id=new_user.id,
        numero_solicitacao=data.numero_solicitacao,
        email_solicitante=data.email_solicitante,
        email_usuario_externo=new_user.email,
        status="ativo",
        created_at=new_user.created_at,
        cadastrado_por=current_user.name,
    )


@router.get("/users")
async def listar_usuarios_cadastrados(
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token),
):
    """
    Lista usuarios externos cadastrados pelo suporte.
    """
    # Verifica permissao
    if current_user.type != TypeUser.SUPPORT and not current_user.is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas suporte ou supervisores podem listar usuarios.",
        )

    # Query base
    query = select(User).where(User.type == TypeUser.EXTERNAL)

    # Filtro de busca
    if search:
        search_term = f"%{search}%"
        query = query.where(
            User.email.ilike(search_term) | User.name.ilike(search_term)
        )

    # Ordenacao e paginacao
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)

    users = session.exec(query).all()

    # Conta total
    count_query = select(User).where(User.type == TypeUser.EXTERNAL)
    if search:
        search_term = f"%{search}%"
        count_query = count_query.where(
            User.email.ilike(search_term) | User.name.ilike(search_term)
        )
    total = len(session.exec(count_query).all())

    return {
        "success": True,
        "data": [
            {
                "id": u.id,
                "email": u.email,
                "name": u.name,
                "status": "ativo" if u.status else "inativo",
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }
