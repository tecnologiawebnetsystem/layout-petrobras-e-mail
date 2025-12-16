# Precisando mexer para dash/historico
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.auditoria import Auditoria

router = APIRouter(prefix="/auditoria", tags=["Auditoria"])

@router.get("/")
def listar_auditoria(
    session: Session = Depends(get_session),
    usuario_id: int | None = Query(None),
    share_id: int | None = Query(None),
    arquivo_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    q = select(Auditoria)
    if usuario_id:
        from sqlalchemy import and_
        q = q.where(Auditoria.usuario_id == usuario_id)
    if share_id:
        q = q.where(Auditoria.share_id == share_id)
    if arquivo_id:
        q = q.where(Auditoria.arquivo_id == arquivo_id)
    q = q.order_by(Auditoria.id.desc())
    return session.exec(q).all()[:limit]
