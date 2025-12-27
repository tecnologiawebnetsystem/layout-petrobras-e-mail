from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services.audit_service import log_event



router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, session: Session = Depends(get_session), request: Request = None):
    # Verifica email único
    existing = session.exec(select(User).where(User.email == payload.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
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
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


@router.patch("/{user_id}", response_model=UserRead)
def update_user(user_id: int, payload: UserUpdate, session: Session = Depends(get_session), request: Request = None):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

   
    if payload.email and session.exec(select(User).where(User.email == payload.email, User.id != user_id)).first():
        raise HTTPException(status_code=400, detail="Email em uso por outro usuário.")

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
        detail=f"ativo={user.ativo}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return user
