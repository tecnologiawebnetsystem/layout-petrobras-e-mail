from typing import Optional
from sqlmodel import Session
from app.models.audit import Audit
from app.utils.logger import logger


def log_event(
    session: Session,
    action: str,
    user_id: Optional[int] = None,
    share_id: Optional[int] = None,
    file_id: Optional[int] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
    detail: Optional[str] = None
) -> None:
    # Persistência DB
    audit = Audit(
        action=action,
        user_id=user_id,
        share_id=share_id,
        file_id=file_id,
        ip_address=ip,
        user_agent=user_agent,
        detail=detail
    )
    session.add(audit)
    session.commit()

    # Log estruturado
    logger.info(
        "audit_event",
        action=action,
        user_id=user_id,
        share_id=share_id,
        file_id=file_id,
        ip=ip,
        user_agent=user_agent,
        detail=detail
    )
