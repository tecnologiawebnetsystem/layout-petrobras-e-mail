"""
Rotas para gerenciamento de arquivos.
Compativel com as chamadas do frontend Next.js.

Endpoints:
- GET /v1/files - Lista arquivos com paginacao
- GET /v1/files/{file_id} - Detalhes de um arquivo
- POST /v1/files - Criar metadados de arquivo
- POST /v1/files/upload - Upload de arquivos via FormData
- DELETE /v1/files/{file_id} - Cancelar arquivo
- GET /v1/files/{file_id}/presigned-upload - URL para upload
- GET /v1/files/{file_id}/presigned-download - URL para download
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request, Query
from sqlmodel import Session, select, func
from pathlib import Path
from datetime import datetime, UTC
from typing import Optional, List
import json

from app.db.session import get_session
from app.models.restricted_file import RestrictedFile
from app.models.area import SharedArea
from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.user import User
from app.schemas.file_schema import FileCreate, FileRead
from app.core.aws_utils import generate_presigned_upload, generate_presigned_download
from app.services.audit_service import log_event
from app.utils.authz import get_current_user

router = APIRouter(prefix="/files", tags=["Files"])

STORAGE_ROOT = Path("./storage")
STORAGE_ROOT.mkdir(exist_ok=True)


# =====================================================
# GET /v1/files - Lista arquivos com paginacao
# =====================================================

@router.get("/")
def list_files(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
    area_id: Optional[int] = Query(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Lista compartilhamentos/arquivos do usuario com paginacao.
    """
    # Query base - shares do usuario
    query = select(Share).where(Share.created_by_id == current_user.id)
    
    # Filtro por status
    if status_filter:
        status_map = {
            "pending": ShareStatus.PENDING,
            "approved": ShareStatus.APPROVED,
            "rejected": ShareStatus.REJECTED,
            "cancelled": ShareStatus.CANCELED,
            "expired": ShareStatus.EXPIRED,
            "active": ShareStatus.ACTIVE,
        }
        if status_filter.lower() in status_map:
            query = query.where(Share.status == status_map[status_filter.lower()])
    
    # Contagem total
    count_query = select(func.count()).select_from(Share).where(Share.created_by_id == current_user.id)
    if status_filter and status_filter.lower() in status_map:
        count_query = count_query.where(Share.status == status_map[status_filter.lower()])
    
    total_items = session.exec(count_query).one()
    total_pages = (total_items + limit - 1) // limit if total_items > 0 else 1
    
    # Ordenacao
    if order.lower() == "asc":
        query = query.order_by(getattr(Share, sort_by).asc())
    else:
        query = query.order_by(getattr(Share, sort_by).desc())
    
    # Paginacao
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    shares = session.exec(query).all()
    
    # Formata resultado
    result = []
    for share in shares:
        # Busca arquivos do share
        share_files = session.exec(
            select(ShareFile).where(ShareFile.share_id == share.id)
        ).all()
        
        files_data = []
        for sf in share_files:
            rfile = session.get(RestrictedFile, sf.file_id)
            if rfile:
                size_mb = rfile.size_bytes / (1024 * 1024) if rfile.size_bytes else 0
                files_data.append({
                    "name": rfile.name,
                    "size": f"{size_mb:.2f} MB",
                    "type": rfile.mime_type or "application/octet-stream",
                })
        
        # Busca aprovador se existir
        approved_by = None
        if share.approver_id:
            approver = session.get(User, share.approver_id)
            if approver:
                approved_by = approver.name
        
        result.append({
            "id": share.id,
            "name": share.name or f"Compartilhamento #{share.id}",
            "recipient_email": share.external_email,
            "description": share.description,
            "files": files_data,
            "status": share.status,
            "expiration_hours": share.expiration_hours,
            "expires_at": share.expires_at.isoformat() if share.expires_at else None,
            "created_at": share.created_at.isoformat(),
            "approved_at": share.approved_at.isoformat() if share.approved_at else None,
            "approved_by": approved_by,
            "rejection_reason": share.rejection_reason,
        })
    
    log_event(
        session=session,
        action="LISTAR_ARQUIVOS",
        user_id=current_user.id,
        detail=f"page={page}, limit={limit}, status={status_filter or 'all'}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    
    return {
        "files": result,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_items": total_items,
            "items_per_page": limit,
        }
    }


# =====================================================
# GET /v1/files/{file_id} - Detalhes de um arquivo
# =====================================================

@router.get("/{file_id}")
def get_file_details(
    file_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retorna detalhes completos de um compartilhamento.
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    
    # Verifica permissao
    if share.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Busca remetente
    sender = session.get(User, share.created_by_id)
    sender_data = {
        "id": sender.id if sender else None,
        "name": sender.name if sender else "Desconhecido",
        "email": sender.email if sender else None,
        "department": sender.department if sender else None,
        "employee_id": sender.employee_id if sender else None,
        "manager": None,
    }
    
    if sender and sender.manager_id:
        manager = session.get(User, sender.manager_id)
        if manager:
            sender_data["manager"] = {
                "id": manager.id,
                "name": manager.name,
                "email": manager.email,
            }
    
    # Busca arquivos
    share_files = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id)
    ).all()
    
    files_data = []
    for sf in share_files:
        rfile = session.get(RestrictedFile, sf.file_id)
        if rfile:
            size_mb = rfile.size_bytes / (1024 * 1024) if rfile.size_bytes else 0
            files_data.append({
                "name": rfile.name,
                "size": f"{size_mb:.2f} MB",
                "type": rfile.mime_type or "application/octet-stream",
                "s3_key": rfile.key_s3,
            })
    
    # Workflow steps
    workflow = {
        "current_step": 1,
        "total_steps": 3,
        "steps": [
            {"name": "Criacao", "status": "completed"},
            {"name": "Aprovacao", "status": "pending"},
            {"name": "Disponibilizacao", "status": "pending"},
        ]
    }
    
    if share.status == ShareStatus.PENDING:
        workflow["current_step"] = 2
        workflow["steps"][1]["status"] = "current"
    elif share.status in [ShareStatus.APPROVED, ShareStatus.ACTIVE]:
        workflow["current_step"] = 3
        workflow["steps"][1]["status"] = "completed"
        workflow["steps"][2]["status"] = "completed"
    elif share.status == ShareStatus.REJECTED:
        workflow["current_step"] = 2
        workflow["steps"][1]["status"] = "failed"
    
    # Logs de extensao (placeholder)
    expiration_logs = []
    
    return {
        "id": share.id,
        "name": share.name or f"Compartilhamento #{share.id}",
        "recipient_email": share.external_email,
        "description": share.description,
        "sender": sender_data,
        "files": files_data,
        "status": share.status,
        "expiration_hours": share.expiration_hours,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "expiration_logs": expiration_logs,
        "created_at": share.created_at.isoformat(),
        "approved_at": share.approved_at.isoformat() if share.approved_at else None,
        "approved_by": None,
        "rejection_reason": share.rejection_reason,
        "workflow": workflow,
    }


# =====================================================
# POST /v1/files/upload - Upload via FormData
# =====================================================

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_files(
    files: List[UploadFile] = File(...),
    name: str = Form(...),
    recipientEmail: str = Form(...),
    description: Optional[str] = Form(None),
    expirationHours: int = Form(72),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Faz upload de arquivos e cria compartilhamento.
    Recebe FormData com arquivos e metadados.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Nenhum arquivo enviado")
    
    # Cria area temporaria se nao existir
    area = session.exec(
        select(SharedArea).where(SharedArea.prefix_s3 == "uploads")
    ).first()
    
    if not area:
        area = SharedArea(
            name="Uploads",
            prefix_s3="uploads",
            applicant_id=current_user.id,
        )
        session.add(area)
        session.commit()
        session.refresh(area)
    
    # Cria share
    share = Share(
        name=name,
        description=description,
        area_id=area.id,
        external_email=recipientEmail,
        status=ShareStatus.PENDING,
        expiration_hours=expirationHours,
        created_by_id=current_user.id,
    )
    session.add(share)
    session.commit()
    session.refresh(share)
    
    # Processa arquivos
    area_path = STORAGE_ROOT / area.prefix_s3
    area_path.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []
    for file in files:
        # Salva arquivo
        file_path = area_path / f"{share.id}_{file.filename}"
        content = await file.read()
        
        with file_path.open("wb") as f:
            f.write(content)
        
        # Cria registro do arquivo
        rfile = RestrictedFile(
            area_id=area.id,
            name=file.filename,
            key_s3=str(file_path),
            size_bytes=len(content),
            mime_type=file.content_type,
            upload_id=current_user.id,
            status=True,
        )
        session.add(rfile)
        session.commit()
        session.refresh(rfile)
        
        # Vincula ao share
        share_file = ShareFile(
            share_id=share.id,
            file_id=rfile.id,
        )
        session.add(share_file)
        
        size_mb = len(content) / (1024 * 1024)
        uploaded_files.append({
            "name": file.filename,
            "size": f"{size_mb:.2f} MB",
            "type": file.content_type or "application/octet-stream",
            "s3_key": str(file_path),
        })
    
    session.commit()
    
    log_event(
        session=session,
        action="UPLOAD_ARQUIVOS",
        user_id=current_user.id,
        share_id=share.id,
        detail=f"files={len(files)}, recipient={recipientEmail}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )
    
    return {
        "upload_id": share.id,
        "name": name,
        "recipient_email": recipientEmail,
        "files": uploaded_files,
        "status": share.status,
        "expiration_hours": expirationHours,
        "created_at": share.created_at.isoformat(),
    }


# =====================================================
# DELETE /v1/files/{file_id} - Cancelar arquivo
# =====================================================

@router.delete("/{file_id}")
def cancel_file(
    file_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    request: Request = None,
):
    """
    Cancela um compartilhamento (apenas se pendente).
    """
    share = session.get(Share, file_id)
    if not share:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado")
    
    # Verifica permissao
    if share.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Verifica se pode cancelar
    if share.status not in [ShareStatus.PENDING, ShareStatus.APPROVED]:
        raise HTTPException(
            status_code=400,
            detail="Somente compartilhamentos pendentes ou aprovados podem ser cancelados"
        )
    
    share.status = ShareStatus.CANCELED
    session.add(share)
    session.commit()
    
    log_event(
        session=session,
        action="CANCELAR_SHARE",
        user_id=current_user.id,
        share_id=share.id,
        detail=f"status=CANCELADO",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None,
    )
    
    return {"success": True, "message": "Arquivo cancelado com sucesso"}


# =====================================================
# Endpoints de metadados (compatibilidade)
# =====================================================

@router.post("/", response_model=FileRead, status_code=status.HTTP_201_CREATED)
def create_metadata(
    payload: FileCreate,
    session: Session = Depends(get_session),
    request: Request = None,
):
    """Cria metadados de arquivo."""
    area = session.get(SharedArea, payload.area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area nao encontrada.")

    rfile = RestrictedFile(
        area_id=payload.area_id,
        name=payload.name,
        key_s3=payload.key_s3,
        size_bytes=payload.size_bytes,
        mime_type=payload.mime_type,
        checksum=payload.checksum,
        upload_id=payload.upload_id,
        expires_at=payload.expires_at,
        status=True
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)

    log_event(
        session=session,
        action="CRIAR_METADATA_ARQUIVO",
        user_id=payload.upload_id,
        file_id=rfile.id,
        detail=f"area_id={payload.area_id} nome={payload.name}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return rfile


# Upload LOCAL (sem AWS)
@router.post("/upload-local", response_model=FileRead, status_code=status.HTTP_201_CREATED)
def upload_local(
    area_id: int,
    name: str,
    file: UploadFile = File(...),
    upload_id: int | None = None,
    session: Session = Depends(get_session),
    request: Request = None
):
    """Upload local para desenvolvimento."""
    area = session.get(SharedArea, area_id)
    if not area:
        raise HTTPException(status_code=404, detail="Area nao encontrada.")

    area_path = STORAGE_ROOT / area.prefix_s3
    area_path.mkdir(parents=True, exist_ok=True)
    dest = area_path / name

    with dest.open("wb") as f:
        f.write(file.file.read())

    rfile = RestrictedFile(
        area_id=area_id,
        name=name,
        key_s3=str(dest),
        size_bytes=dest.stat().st_size,
        mime_type=file.content_type,
        upload_id=upload_id,
        status=True
    )
    session.add(rfile)
    session.commit()
    session.refresh(rfile)

    log_event(
        session=session,
        action="UPLOAD_LOCAL",
        user_id=upload_id,
        file_id=rfile.id,
        detail=f"path={dest}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )

    return rfile


# Presigned URL para upload
@router.get("/{file_id}/presigned-upload")
def presigned_upload(
    file_id: int,
    expires_in: int = 600,
    session: Session = Depends(get_session),
    request: Request = None
):
    """Gera URL pre-assinada para upload."""
    rfile = session.get(RestrictedFile, file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    url = generate_presigned_upload(rfile.key_s3, expires_in)

    log_event(
        session=session,
        action="PRESIGNED_UPLOAD",
        user_id=rfile.upload_id,
        file_id=file_id,
        detail=f"expires_in={expires_in}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return {"url": url, "expires_in": expires_in}


# Presigned URL para download
@router.get("/{file_id}/presigned-download")
def presigned_download(
    file_id: int,
    expires_in: int = 300,
    session: Session = Depends(get_session),
    request: Request = None
):
    """Gera URL pre-assinada para download."""
    rfile = session.get(RestrictedFile, file_id)
    if not rfile:
        raise HTTPException(status_code=404, detail="Arquivo nao encontrado.")
    url = generate_presigned_download(rfile.key_s3, expires_in)

    log_event(
        session=session,
        action="PRESIGNED_DOWNLOAD",
        user_id=rfile.upload_id,
        file_id=file_id,
        detail=f"expires_in={expires_in}",
        ip=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    return {"url": url, "expires_in": expires_in}
