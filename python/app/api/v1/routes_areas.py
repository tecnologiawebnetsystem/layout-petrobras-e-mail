
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.area import AreaCompartilhamento
from app.schemas.area_schema import AreaCreate, AreaRead
from app.services.audit_service import log_event

router = APIRouter(prefix="/areas", tags=["Areas"])

@router.post("/", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, session: Session = Depends(get_session), request: Request = None):
    # Poderíamos validar se solicitante existe/é INTERNO aqui
    area = AreaCompartilhamento(
        nome_area=payload.nome_area,
        descricao=payload.descricao,
        prefixo_s3=payload.prefixo_s3,
        solicitante_id=payload.solicitante_id,
        expira_em=payload.expira_em,
        ativo=True
        
    )
    session.add(area)
    session.commit()
    session.refresh(area)

    log_event(
        session=session,
        evento="CRIAR_AREA",
        usuario_id=payload.solicitante_id,
        detalhe=f"nome_area={payload.nome_area}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return area

@router.get("/", response_model=list[AreaRead])
def list_areas(session: Session = Depends(get_session)):
    return session.exec(select(AreaCompartilhamento)).all()

@router.get("/{area_id}", response_model=AreaRead)
def get_area(area_id: int, session: Session = Depends(get_session)):
    area = session.get(AreaCompartilhamento, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")
    return area

@router.post("/{area_id}/encerrar", response_model=AreaRead)
def close_area(area_id: int, session: Session = Depends(get_session), request: Request = None):
    area = session.get(AreaCompartilhamento, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    area.ativo = False
    session.add(area)
    session.commit()
    session.refresh(area)

    log_event(
        session=session,
        evento="ENCERRAR_AREA",
        detalhe=f"area_id={area_id}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return area
