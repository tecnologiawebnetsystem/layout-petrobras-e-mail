from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.usuario import Usuario, TipoUsuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioRead, UsuarioUpdate
from app.services.audit_service import log_event



router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.post("/", response_model=UsuarioRead, status_code=status.HTTP_201_CREATED)
def create_usuario(payload: UsuarioCreate, session: Session = Depends(get_session), request: Request = None):
    # Verifica email único
    existente = session.exec(select(Usuario).where(Usuario.email == payload.email)).first()
    if existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    usuario = Usuario(
        nome_completo=payload.nome_completo,
        email=payload.email,
        tipo=payload.tipo,
        ativo=True
    )

    session.add(usuario)
    session.commit()
    session.refresh(usuario)
    
    log_event(
        session=session,
        evento="CRIAR_USUARIO",
        usuario_id=usuario.id,
        detalhe=f"tipo={usuario.tipo}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return usuario


@router.get("/", response_model=list[UsuarioRead])
def list_usuarios(session: Session = Depends(get_session)):
    return session.exec(select(Usuario)).all()


@router.get("/{usuario_id}", response_model=UsuarioRead)
def get_usuario(usuario_id: int, session: Session = Depends(get_session)):
    usuario = session.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return usuario


@router.patch("/{usuario_id}", response_model=UsuarioRead)
def update_usuario(usuario_id: int, payload: UsuarioUpdate, session: Session = Depends(get_session), request: Request = None):
    usuario = session.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

   
    if payload.email and session.exec(select(Usuario).where(Usuario.email == payload.email, Usuario.id != usuario_id)).first():
        raise HTTPException(status_code=400, detail="Email em uso por outro usuário.")

    usuario.nome_completo = payload.nome_completo or usuario.nome_completo
    usuario.email = payload.email or usuario.email
    usuario.tipo = payload.tipo or usuario.tipo
    usuario.ativo = usuario.ativo if payload.ativo is None else payload.ativo

    session.add(usuario)
    session.commit()
    session.refresh(usuario)

    log_event(
        session=session,
        evento="ATUALIZAR_USUARIO",
        usuario_id=usuario.id,
        detalhe=f"ativo={usuario.ativo}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return usuario
