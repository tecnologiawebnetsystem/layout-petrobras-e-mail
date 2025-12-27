from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.utils.authz import require_supervisor
from app.models.area import SharedArea, AreaSupervisor
from app.models.share import Share
from app.models.share_file import ShareFile

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])

@router.get("/areas/{area_id}/report")
def relatorio_area(area_id: int, session: Session = Depends(get_session), user = Depends(require_supervisor)):
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Área não encontrada.")

    # valida que o supervisor está vinculado a esta área
    link = session.exec(select(AreaSupervisor).where(
        AreaSupervisor.area_id == area_id,
        AreaSupervisor.supervisor_id == user.id
    )).first()
    if not link:
        raise HTTPException(status_code=403, detail="Supervisor não vinculado a esta área.")

    # shares da área
    shares = session.exec(select(Share).where(Share.area_id == area_id)).all()
    data = []
    for share in shares:
        items = session.exec(select(ShareFile).where(ShareFile.share_id == share.id)).all()
        total = len(items)
        downloadeds = sum(1 for i in items if i.downloaded)
        pending = total - downloadeds
        data.append({
            "share_id": share.id,
            "externo_email": share.external_email,
            "criado_em": share.created_at,
            "expira_em": share.expira_at,
            "status": share.status,
            "tot_arquivos": total,
            "baixados": downloadeds,
            "pendentes": pending
        })

    return {"area_id": area_id, "nome_area": area.name, "shares": data}
