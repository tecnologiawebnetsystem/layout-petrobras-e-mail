
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.session import get_session
from app.utils.authz import require_supervisor
from app.models.area import SharedArea, AreaSupervisor
from app.models.share import Share, ShareStatus
from app.models.user import User
from app.models.share_file import ShareFile

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])

@router.post("/shares/{share_id}/approve")
async def approve_share(
    share_id: int,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    # user = Depends(require_supervisor)  # ativar quando Entra/local session estiver valendo
):
    share = session.get(Share, share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share não encontrado.")

    if share.status == ShareStatus.ACTIVE:
        # já aprovado/ativo
        pass
    else:
        share.status = ShareStatus.ACTIVE
        session.add(share)
        session.commit()
        session.refresh(share)

    applicant = session.get(User, share.created_by_id)
    if not applicant:
        raise HTTPException(status_code=400, detail="Solicitante não encontrado.")

    itens = session.exec(select(ShareFile).where(ShareFile.share_id == share.id)).all()
    files_quantyti = len(itens)

    # Envia dois e-mails em background
    background_tasks.add_task(
        send_share_approved_external_email,
        share.external_email,
        applicant.name or "Usuário Interno",
        files_quantyti,
        share.expires_at
    )
    background_tasks.add_task(
        send_share_approved_requester_email,
        applicant.email,
        applicant.name or "Usuário Interno",
        share.externo_email,
        share.id
    )

    return {"status": "ok", "share_id": share.id, "status_atual": share.status}


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
            "expires_at": share.expires_at,
            "status": share.status,
            "tot_arquivos": total,
            "baixados": downloadeds,
            "pendentes": pending
        })

    return {"area_id": area_id, "nome_area": area.name, "shares": data}
