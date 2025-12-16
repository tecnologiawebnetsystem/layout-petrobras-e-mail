from sqlmodel import Session, select
from app.models.share import Share, ShareStatus, TokenConsumo
from app.models.share_arquivo import ShareArquivo
from app.models.arquivo import Arquivo
from app.services.audit_service import log_event


def create_share(
    session: Session,
    area_id: int,
    externo_email: str,
    criado_por_id: int,
    expira_em,
    consumo_policy: TokenConsumo,
    arquivo_ids: list[int],
    request_meta: dict | None = None
) -> Share:
    # Cria o share
    share = Share(
        area_id=area_id,
        externo_email=externo_email,
        criado_por_id=criado_por_id,
        expira_em=expira_em,
        consumo_policy=consumo_policy,
        status=ShareStatus.ATIVO
    )
    session.add(share)
    session.commit()
    session.refresh(share)

    # Vincula arquivos (valida que pertencem à área)
    arquivos = session.exec(
        select(Arquivo).where(Arquivo.id.in_(
            arquivo_ids), Arquivo.area_id == area_id)
    ).all()

    for arq in arquivos:
        sa = ShareArquivo(share_id=share.id, arquivo_id=arq.id)
        session.add(sa)

    session.commit()

    # Auditoria
    log_event(
        session=session,
        evento="CRIAR_SHARE",
        usuario_id=criado_por_id,
        share_id=share.id,
        detalhe=f"externo_email={externo_email}",
        ip=request_meta.get("ip") if request_meta else None,
        user_agent=request_meta.get("ua") if request_meta else None
    )
    return share


def list_share_arquivos(session: Session, share_id: int) -> list[ShareArquivo]:
    return session.exec(select(ShareArquivo).where(ShareArquivo.share_id == share_id)).all()
