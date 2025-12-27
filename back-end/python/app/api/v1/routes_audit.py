
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.db.session import get_session
from app.models.audit import Audit

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/")
def list_audit(
    session: Session = Depends(get_session),
    user_id: int | None = Query(None),
    share_id: int | None = Query(None),
    file_id: int | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
):
    q = select(Audit)
    if user_id:
        q = q.where(Audit.user_id == user_id)
    if share_id:
        q = q.where(Audit.share_id == share_id)
    if file_id:
        q = q.where(Audit.file_id == file_id)
    q = q.order_by(Audit.id.desc())
    return session.exec(q).all()[:limit]
