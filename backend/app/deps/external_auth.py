from __future__ import annotations
 
from dataclasses import dataclass
from datetime import datetime, UTC
 
from fastapi import Depends, HTTPException, Request
from sqlmodel import Session
 
from app.db.session import get_session
from app.models.share import Share, ShareStatus
from app.models.token_access import TokenAccess
from app.services.token_service import get_token_access, validate_token_access, TokenError
 
 
@dataclass(frozen=True)
class ExternalAccessContext:
    token: TokenAccess
    share: Share
    now: datetime
 
 
def _extract_bearer_token(request: Request) -> str:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token nao fornecido.")
 
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token nao fornecido.")
    return token
 
 
def get_external_access_context(
    request: Request,
    session: Session = Depends(get_session),
) -> ExternalAccessContext:
    token_str = _extract_bearer_token(request)
 
    token_obj = get_token_access(session, token_str)
    if not token_obj:
        raise HTTPException(status_code=401, detail="Token invalido.")
 
    try:
        validate_token_access(token_obj)
    except TokenError as e:
        raise HTTPException(status_code=401, detail=str(e))
 
    share = token_obj.share
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado.")
 
    now = datetime.now(UTC)
 
    if share.status not in (ShareStatus.APPROVED, ShareStatus.ACTIVE):
        raise HTTPException(status_code=403, detail="Compartilhamento nao esta mais disponivel.")
 
    expires_at = share.expires_at
    if expires_at:
        exp = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=UTC)
        if exp <= now:
            raise HTTPException(status_code=403, detail="Compartilhamento expirado.")
 
    return ExternalAccessContext(token=token_obj, share=share, now=now)