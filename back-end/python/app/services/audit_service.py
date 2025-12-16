# logs de auditoria

from typing import Optional
from sqlmodel import Session
from app.models.auditoria import Auditoria
from app.utils.logger import logger


def log_event(
    session: Session,
    evento: str,
    usuario_id: Optional[int] = None,
    share_id: Optional[int] = None,
    arquivo_id: Optional[int] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    detalhe: Optional[str] = None
) -> None:
    # Persistência DB
    audit = Auditoria(
        evento=evento,
        usuario_id=usuario_id,
        share_id=share_id,
        arquivo_id=arquivo_id,
        ip=ip,
        user_agent=user_agent,
        detalhe=detalhe
    )
    session.add(audit)
    session.commit()

    # Log estruturado
    logger.info(
        "audit_event",
        evento=evento,
        usuario_id=usuario_id,
        share_id=share_id,
        arquivo_id=arquivo_id,
        ip=ip,
        user_agent=user_agent,
        detalhe=detalhe
    )
