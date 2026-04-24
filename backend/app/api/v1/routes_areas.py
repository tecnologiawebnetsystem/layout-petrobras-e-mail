
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.area import SharedArea
from app.schemas.area_schema import AreaCreate, AreaRead
from app.services.audit_service import log_event

router = APIRouter(prefix="/areas", tags=["Areas"])

@router.post("/", response_model=AreaRead, status_code=status.HTTP_201_CREATED)
def create_area(payload: AreaCreate, session: Session = Depends(get_session), request: Request = None):
    """
    Cria uma nova área compartilhada no sistema.

    Persiste a área no banco, define seu status como ativo (True) e registra
    o evento de auditoria CRIAR_AREA com o IP e User-Agent do solicitante.
    """
    # Poderíamos validar se solicitante existe/é INTERNO aqui
    area = SharedArea(
        name=payload.name,
        description=payload.description,
        prefix_s3=payload.prefix_s3,
        applicant_id=payload.applicant_id,
        expires_at=payload.expires_at,
        status=True
        
    )
    session.add(area)
    session.commit()
    session.refresh(area)

    log_event(
        session=session,
        action="CRIAR_AREA",
        user_id=payload.applicant_id,
        detail=f"name={payload.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return area

@router.get("/", response_model=list[AreaRead])
def list_areas(session: Session = Depends(get_session)):
    """Retorna todas as áreas compartilhadas cadastradas, sem filtro ou paginação."""
    return session.exec(select(SharedArea)).all()

@router.get("/{area_id}", response_model=AreaRead)
def get_area(area_id: int, session: Session = Depends(get_session)):
    """Busca uma área específica pelo seu ID. Retorna 404 se não encontrada."""
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")
    return area

@router.post("/{area_id}/close", response_model=AreaRead)
def close_area(area_id: int, session: Session = Depends(get_session), request: Request = None):
    """
    Encerra uma área compartilhada definindo seu status como inativo (False).

    Registra o evento de auditoria ENCERRAR_AREA. Retorna 404 se a área não existir.
    """
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    area.status = False
    session.add(area)
    session.commit()
    session.refresh(area)

    log_event(
        session=session,
        action="ENCERRAR_AREA",
        user_id=area.applicant_id,
        detail=f"area_id={area_id}, area_name={area.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return area
