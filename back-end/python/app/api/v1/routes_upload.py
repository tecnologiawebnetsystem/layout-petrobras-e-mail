"""
Rotas de Upload/Compartilhamento - Backend Python
Endpoints para criar, gerenciar e cancelar compartilhamentos
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import uuid

router = APIRouter(prefix="/shares", tags=["Upload/Shares"])


# =============================================================================
# SCHEMAS
# =============================================================================

class FileInfo(BaseModel):
    name: str
    size: str
    type: str


class SenderInfo(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    department: Optional[str] = None
    employee_id: Optional[str] = None
    avatar: Optional[str] = None
    manager: Optional[dict] = None  # { name, email }


class CreateShareRequest(BaseModel):
    name: str
    description: Optional[str] = None
    recipient: EmailStr
    sender: SenderInfo
    files: List[FileInfo]
    expiration_hours: int = 72


class CancelShareRequest(BaseModel):
    cancelled_by: str
    reason: Optional[str] = None


class UpdateShareRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    expiration_hours: Optional[int] = None


# =============================================================================
# IN-MEMORY STORE (Para desenvolvimento)
# =============================================================================

_shares_store: dict = {}
_files_store: dict = {}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/create")
async def create_share(payload: CreateShareRequest, request: Request):
    """
    POST /api/v1/shares/create
    
    Cria um novo compartilhamento (upload) para aprovação do supervisor.
    
    Request Body:
    {
        "name": "Documentos Q4 2025",
        "description": "Relatórios financeiros trimestrais",
        "recipient": "externo@empresa.com",
        "sender": {
            "id": "user-123",
            "name": "João Silva",
            "email": "joao@petrobras.com.br",
            "role": "internal",
            "department": "Financeiro",
            "employee_id": "12345",
            "manager": {
                "name": "Maria Santos",
                "email": "maria.santos@petrobras.com.br"
            }
        },
        "files": [
            { "name": "relatorio.pdf", "size": "2.5 MB", "type": "application/pdf" }
        ],
        "expiration_hours": 72
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-xxx",
        "status": "pending",
        "message": "Compartilhamento criado. Aguardando aprovação do supervisor.",
        "supervisor": {
            "name": "Maria Santos",
            "email": "maria.santos@petrobras.com.br"
        }
    }
    
    Side Effects:
    - Envia email para o supervisor solicitando aprovação
    - Envia email de confirmação para o remetente
    - Registra log de auditoria
    """
    share_id = f"upload-{uuid.uuid4().hex[:8]}"
    
    supervisor = payload.sender.manager or {
        "name": "Supervisor",
        "email": "supervisor@petrobras.com.br"
    }
    
    new_share = {
        "id": share_id,
        "name": payload.name,
        "description": payload.description,
        "recipient": payload.recipient,
        "sender": payload.sender.dict(),
        "files": [f.dict() for f in payload.files],
        "status": "pending",
        "upload_date": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        "expiration_hours": payload.expiration_hours,
        "supervisor": supervisor,
        "current_step": 1,
        "total_steps": 3,
        "steps": [
            {"title": "Análise Inicial", "status": "in_progress"},
            {"title": "Revisão Técnica", "status": "pending"},
            {"title": "Aprovação Final", "status": "pending"}
        ],
        "expiration_logs": [{
            "timestamp": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
            "changed_by": payload.sender.name,
            "previous_value": None,
            "new_value": payload.expiration_hours,
            "reason": "Definição inicial pelo remetente"
        }]
    }
    
    _shares_store[share_id] = new_share
    
    # Em produção: enviar emails
    # await send_supervisor_notification(supervisor["email"], new_share)
    # await send_sender_confirmation(payload.sender.email, new_share)
    
    return {
        "success": True,
        "share_id": share_id,
        "status": "pending",
        "message": "Compartilhamento criado. Aguardando aprovação do supervisor.",
        "supervisor": supervisor
    }


@router.post("/upload-files")
async def upload_files(
    files: List[UploadFile] = File(...),
    share_id: Optional[str] = Form(None),
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/shares/upload-files
    
    Faz upload dos arquivos para o servidor/S3.
    
    Form Data:
    - files: Arquivos a serem enviados
    - share_id: ID do compartilhamento (opcional, para associar arquivos)
    
    Headers:
    - Authorization: Bearer {token}
    
    Response:
    {
        "success": true,
        "uploaded_files": [
            {
                "file_id": "file-xxx",
                "name": "relatorio.pdf",
                "size": "2.5 MB",
                "type": "application/pdf",
                "url": "https://s3.../relatorio.pdf"
            }
        ]
    }
    """
    uploaded = []
    
    for file in files:
        file_id = f"file-{uuid.uuid4().hex[:8]}"
        content = await file.read()
        
        # Em produção: fazer upload para S3
        # s3_key = f"uploads/{share_id or 'temp'}/{file_id}/{file.filename}"
        # s3_client.upload_fileobj(...)
        
        file_info = {
            "file_id": file_id,
            "name": file.filename,
            "size": f"{len(content) / 1024 / 1024:.2f} MB",
            "type": file.content_type or "application/octet-stream",
            "url": f"https://storage.example.com/files/{file_id}"
        }
        
        _files_store[file_id] = {
            **file_info,
            "content": content,  # Em dev apenas
            "share_id": share_id
        }
        
        uploaded.append(file_info)
    
    return {
        "success": True,
        "uploaded_files": uploaded
    }


@router.get("/my-shares")
async def get_my_shares(
    authorization: str = Header(...),
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    request: Request = None
):
    """
    GET /api/v1/shares/my-shares
    
    Lista compartilhamentos criados pelo usuário autenticado.
    
    Headers:
    - Authorization: Bearer {token}
    
    Query Params:
    - status: Filtrar por status (pending, approved, rejected, cancelled)
    - page: Página (default: 1)
    - limit: Itens por página (default: 20)
    
    Response:
    {
        "shares": [...],
        "total": 15,
        "page": 1,
        "pages": 1
    }
    """
    # Em produção: extrair user_id do token e filtrar
    shares = list(_shares_store.values())
    
    if status:
        shares = [s for s in shares if s.get("status") == status]
    
    return {
        "shares": shares,
        "total": len(shares),
        "page": page,
        "pages": (len(shares) + limit - 1) // limit or 1
    }


@router.get("/{share_id}")
async def get_share(
    share_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/shares/{share_id}
    
    Retorna detalhes de um compartilhamento específico.
    
    Headers:
    - Authorization: Bearer {token}
    
    Response:
    {
        "id": "upload-123",
        "name": "Documentos Q4",
        "description": "Relatórios financeiros",
        "recipient": "externo@empresa.com",
        "sender": {...},
        "files": [...],
        "status": "pending",
        "upload_date": "20/01/2026 10:30",
        "expiration_hours": 72,
        "steps": [...],
        "expiration_logs": [...]
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    return share


@router.patch("/{share_id}/cancel")
async def cancel_share(
    share_id: str,
    payload: CancelShareRequest,
    authorization: str = Header(...),
    request: Request = None
):
    """
    PATCH /api/v1/shares/{share_id}/cancel
    
    Cancela um compartilhamento pendente.
    
    Headers:
    - Authorization: Bearer {token}
    
    Request Body:
    {
        "cancelled_by": "João Silva",
        "reason": "Arquivos incorretos enviados"
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-123",
        "status": "cancelled",
        "cancelled_by": "João Silva",
        "cancellation_date": "20/01/2026 15:00",
        "reason": "Arquivos incorretos enviados"
    }
    
    Errors:
    - 400: Compartilhamento já aprovado/rejeitado não pode ser cancelado
    - 404: Compartilhamento não encontrado
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if share.get("status") == "approved":
        raise HTTPException(
            status_code=400,
            detail="Não é possível cancelar. Este compartilhamento já foi aprovado pelo supervisor."
        )
    
    if share.get("status") == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Não é possível cancelar. Este compartilhamento já foi rejeitado pelo supervisor."
        )
    
    if share.get("status") == "cancelled":
        raise HTTPException(
            status_code=400,
            detail="Este compartilhamento já foi cancelado anteriormente."
        )
    
    # Atualizar status
    share["status"] = "cancelled"
    share["cancelled_by"] = payload.cancelled_by
    share["cancellation_date"] = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    share["cancellation_reason"] = payload.reason or "Cancelado pelo usuário"
    
    return {
        "success": True,
        "share_id": share_id,
        "status": "cancelled",
        "cancelled_by": payload.cancelled_by,
        "cancellation_date": share["cancellation_date"],
        "reason": share["cancellation_reason"]
    }


@router.put("/{share_id}")
async def update_share(
    share_id: str,
    payload: UpdateShareRequest,
    authorization: str = Header(...),
    request: Request = None
):
    """
    PUT /api/v1/shares/{share_id}
    
    Atualiza informações de um compartilhamento pendente.
    
    Headers:
    - Authorization: Bearer {token}
    
    Request Body:
    {
        "name": "Novo Nome",
        "description": "Nova descrição",
        "expiration_hours": 48
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-123",
        "updated_fields": ["name", "description"]
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if share.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail="Apenas compartilhamentos pendentes podem ser editados"
        )
    
    updated_fields = []
    
    if payload.name is not None:
        share["name"] = payload.name
        updated_fields.append("name")
    
    if payload.description is not None:
        share["description"] = payload.description
        updated_fields.append("description")
    
    if payload.expiration_hours is not None:
        old_hours = share.get("expiration_hours")
        share["expiration_hours"] = payload.expiration_hours
        share["expiration_logs"].append({
            "timestamp": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
            "changed_by": "Usuário",
            "previous_value": old_hours,
            "new_value": payload.expiration_hours,
            "reason": "Ajuste pelo remetente"
        })
        updated_fields.append("expiration_hours")
    
    return {
        "success": True,
        "share_id": share_id,
        "updated_fields": updated_fields
    }


@router.delete("/{share_id}")
async def delete_share(
    share_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    DELETE /api/v1/shares/{share_id}
    
    Remove permanentemente um compartilhamento cancelado.
    
    Headers:
    - Authorization: Bearer {token}
    
    Response:
    {
        "success": true,
        "message": "Compartilhamento removido permanentemente"
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if share.get("status") not in ["cancelled", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Apenas compartilhamentos cancelados ou rejeitados podem ser removidos"
        )
    
    del _shares_store[share_id]
    
    return {
        "success": True,
        "message": "Compartilhamento removido permanentemente"
    }


@router.get("/{share_id}/history")
async def get_share_history(
    share_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/shares/{share_id}/history
    
    Retorna histórico completo de ações do compartilhamento.
    
    Headers:
    - Authorization: Bearer {token}
    
    Response:
    {
        "share_id": "upload-123",
        "history": [
            {
                "action": "created",
                "timestamp": "20/01/2026 10:00",
                "user": "João Silva",
                "details": "Compartilhamento criado"
            },
            {
                "action": "expiration_changed",
                "timestamp": "20/01/2026 11:00",
                "user": "Supervisor",
                "details": "Expiração alterada de 72h para 48h"
            }
        ]
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    # Construir histórico baseado nos logs de expiração e status
    history = []
    
    # Criação
    history.append({
        "action": "created",
        "timestamp": share.get("upload_date"),
        "user": share.get("sender", {}).get("name", "Usuário"),
        "details": f"Compartilhamento criado para {share.get('recipient')}"
    })
    
    # Logs de expiração
    for log in share.get("expiration_logs", [])[1:]:
        history.append({
            "action": "expiration_changed",
            "timestamp": log.get("timestamp"),
            "user": log.get("changed_by"),
            "details": f"Expiração alterada de {log.get('previous_value')}h para {log.get('new_value')}h. Motivo: {log.get('reason')}"
        })
    
    # Status final
    if share.get("status") == "approved":
        history.append({
            "action": "approved",
            "timestamp": share.get("approval_date"),
            "user": share.get("approved_by"),
            "details": "Compartilhamento aprovado"
        })
    elif share.get("status") == "rejected":
        history.append({
            "action": "rejected",
            "timestamp": share.get("approval_date"),
            "user": share.get("approved_by"),
            "details": f"Compartilhamento rejeitado. Motivo: {share.get('rejection_reason')}"
        })
    elif share.get("status") == "cancelled":
        history.append({
            "action": "cancelled",
            "timestamp": share.get("cancellation_date"),
            "user": share.get("cancelled_by"),
            "details": f"Compartilhamento cancelado. Motivo: {share.get('cancellation_reason')}"
        })
    
    return {
        "share_id": share_id,
        "history": history
    }
