from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, UTC

from app.db.session import get_session
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services.audit_service import log_event
from app.utils.authz import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None


# =====================================================
# Endpoints /me - Usuario autenticado
# =====================================================

@router.get("/me")
def get_current_user_profile(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Retorna os dados do usuario autenticado.
    """
    # Busca dados do manager se existir
    manager_data = None
    if user.manager_id:
        manager = session.get(User, user.manager_id)
        if manager:
            manager_data = {
                "id": manager.id,
                "name": manager.name,
                "email": manager.email,
            }
    
    log_event(
        session=session,
        action="VER_PERFIL",
        user_id=user.id,
        detail=f"email={user.email}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.type,
        "department": user.department,
        "job_title": user.job_title,
        "phone": user.phone,
        "employee_id": user.employee_id,
        "photo_url": user.photo_url,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "manager": manager_data,
    }


@router.put("/me")
def update_current_user_profile(
    payload: UpdateProfileRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Atualiza os dados do perfil do usuario autenticado.
    """
    if payload.name:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.department is not None:
        user.department = payload.department
    if payload.job_title is not None:
        user.job_title = payload.job_title
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    log_event(
        session=session,
        action="ATUALIZAR_PERFIL",
        user_id=user.id,
        detail=f"name={user.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "department": user.department,
        "job_title": user.job_title,
    }


# =====================================================
# Endpoints administrativos
# =====================================================

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, session: Session = Depends(get_session), request: Request = None):
    # Verifica email unico
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ja cadastrado")
    
    user = User(
        name=payload.name,
        email=payload.email,
        type=payload.type,
        status=True
    )

    session.add(user)
    session.commit()
    session.refresh(user)
    
    log_event(
        session=session,
        action="CRIAR_USUARIO",
        user_id=user.id,
        detail=f"tipo={user.type}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return user


@router.get("/", response_model=list[UserRead])
def list_users(session: Session = Depends(get_session)):
    return session.exec(select(User)).all()


@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, session: Session = Depends(get_session), request: Request = None):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario nao encontrado.")

   
    if payload.email and session.exec(select(User).where(User.email == payload.email, User.id != user_id)).first():
        raise HTTPException(status_code=400, detail="Email em uso por outro usuario.")

    user.name = payload.name or user.name
    user.email = payload.email or user.email
    user.type = payload.type or user.type
    user.status = user.status if payload.status is None else payload.status

    session.add(user)
    session.commit()
    session.refresh(user)

    log_event(
        session=session,
        action="ATUALIZAR_USUARIO",
        user_id=user.id,
        detail=f"status={user.status}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return user
