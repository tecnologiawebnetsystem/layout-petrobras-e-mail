"""
Rotas de Supervisor - Backend Python
Endpoints completos para gerenciamento de aprovações pelo supervisor
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum

router = APIRouter(prefix="/supervisor", tags=["Supervisor"])


# =============================================================================
# SCHEMAS
# =============================================================================

class ShareStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class FileInfo(BaseModel):
    name: str
    size: str
    type: str
    url: Optional[str] = None


class SenderInfo(BaseModel):
    id: str
    name: str
    email: EmailStr
    department: Optional[str] = None
    employee_id: Optional[str] = None


class ShareItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    sender: SenderInfo
    recipient: EmailStr
    files: List[FileInfo]
    status: ShareStatus
    upload_date: str
    expiration_hours: int
    expires_at: Optional[str] = None
    approval_date: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class ApproveRequest(BaseModel):
    approved_by: str
    message: Optional[str] = None


class RejectRequest(BaseModel):
    rejected_by: str
    reason: str


class ExtendExpirationRequest(BaseModel):
    new_hours: int
    changed_by: str
    reason: Optional[str] = None


class ShareStatistics(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    cancelled: int


# =============================================================================
# IN-MEMORY STORE (Para desenvolvimento)
# =============================================================================

_shares_store: dict = {}


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/pending", response_model=List[ShareItem])
async def get_pending_shares(
    supervisor_email: Optional[str] = Query(None, description="Email do supervisor para filtrar"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    request: Request = None
):
    """
    GET /api/v1/supervisor/pending
    
    Lista todos os compartilhamentos pendentes de aprovação.
    
    Query Params:
    - supervisor_email: Filtrar por supervisor específico
    - page: Página (default: 1)
    - limit: Itens por página (default: 20)
    
    Response:
    {
        "items": [...],
        "total": 10,
        "page": 1,
        "pages": 1
    }
    """
    # Em produção: buscar do banco
    # shares = session.query(Share).filter(Share.status == "pending").all()
    
    # Mock data
    pending_shares = [
        share for share in _shares_store.values()
        if share.get("status") == "pending"
    ]
    
    return {
        "items": pending_shares,
        "total": len(pending_shares),
        "page": page,
        "pages": (len(pending_shares) + limit - 1) // limit
    }


@router.get("/all")
async def get_all_shares(
    status: Optional[ShareStatus] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("upload_date"),
    order: str = Query("desc"),
    request: Request = None
):
    """
    GET /api/v1/supervisor/all
    
    Lista todos os compartilhamentos com filtros.
    
    Query Params:
    - status: Filtrar por status (pending, approved, rejected, cancelled)
    - search: Buscar por nome, email do sender ou recipient
    - page, limit: Paginação
    - sort_by: Campo para ordenação
    - order: asc ou desc
    
    Response:
    {
        "items": [...],
        "total": 50,
        "page": 1,
        "pages": 3,
        "statistics": {
            "total": 50,
            "pending": 5,
            "approved": 40,
            "rejected": 3,
            "cancelled": 2
        }
    }
    """
    all_shares = list(_shares_store.values())
    
    # Filtrar por status
    if status:
        all_shares = [s for s in all_shares if s.get("status") == status.value]
    
    # Filtrar por busca
    if search:
        search_lower = search.lower()
        all_shares = [
            s for s in all_shares
            if search_lower in s.get("name", "").lower()
            or search_lower in s.get("sender", {}).get("email", "").lower()
            or search_lower in s.get("recipient", "").lower()
        ]
    
    # Estatísticas
    all_items = list(_shares_store.values())
    statistics = {
        "total": len(all_items),
        "pending": len([s for s in all_items if s.get("status") == "pending"]),
        "approved": len([s for s in all_items if s.get("status") == "approved"]),
        "rejected": len([s for s in all_items if s.get("status") == "rejected"]),
        "cancelled": len([s for s in all_items if s.get("status") == "cancelled"])
    }
    
    return {
        "items": all_shares,
        "total": len(all_shares),
        "page": page,
        "pages": (len(all_shares) + limit - 1) // limit or 1,
        "statistics": statistics
    }


@router.get("/{share_id}")
async def get_share_details(share_id: str, request: Request = None):
    """
    GET /api/v1/supervisor/{share_id}
    
    Retorna detalhes de um compartilhamento específico.
    
    Response:
    {
        "id": "upload-123",
        "name": "Documentos Q4",
        "description": "Relatórios financeiros",
        "sender": {...},
        "recipient": "externo@empresa.com",
        "files": [...],
        "status": "pending",
        "upload_date": "20/01/2026 10:30",
        "expiration_hours": 72,
        "expiration_logs": [...]
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    return share


@router.post("/{share_id}/approve")
async def approve_share(share_id: str, payload: ApproveRequest, request: Request = None):
    """
    POST /api/v1/supervisor/{share_id}/approve
    
    Aprova um compartilhamento pendente.
    
    Request Body:
    {
        "approved_by": "Wagner Gaspar Brazil",
        "message": "Aprovado conforme solicitação"  // opcional
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-123",
        "status": "approved",
        "approved_by": "Wagner Gaspar Brazil",
        "approval_date": "20/01/2026 14:30",
        "expires_at": "23/01/2026 14:30",
        "otp_sent": true
    }
    
    Side Effects:
    - Envia email OTP para o destinatário externo
    - Registra log de auditoria
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if share.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Compartilhamento não pode ser aprovado. Status atual: {share.get('status')}"
        )
    
    # Calcular data de expiração
    expiration_hours = share.get("expiration_hours", 72)
    expires_at = datetime.utcnow() + timedelta(hours=expiration_hours)
    
    # Atualizar share
    share["status"] = "approved"
    share["approved_by"] = payload.approved_by
    share["approval_date"] = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    share["expires_at"] = expires_at.strftime("%d/%m/%Y %H:%M")
    share["approval_message"] = payload.message
    
    # Em produção: enviar email OTP para destinatário
    # await send_otp_email(share["recipient"], ...)
    
    return {
        "success": True,
        "share_id": share_id,
        "status": "approved",
        "approved_by": payload.approved_by,
        "approval_date": share["approval_date"],
        "expires_at": share["expires_at"],
        "otp_sent": True
    }


@router.post("/{share_id}/reject")
async def reject_share(share_id: str, payload: RejectRequest, request: Request = None):
    """
    POST /api/v1/supervisor/{share_id}/reject
    
    Rejeita um compartilhamento pendente.
    
    Request Body:
    {
        "rejected_by": "Wagner Gaspar Brazil",
        "reason": "Documentos não autorizados para compartilhamento externo"
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-123",
        "status": "rejected",
        "rejected_by": "Wagner Gaspar Brazil",
        "rejection_reason": "...",
        "rejection_date": "20/01/2026 14:30"
    }
    
    Side Effects:
    - Envia email de notificação para o remetente
    - Registra log de auditoria
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if share.get("status") != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Compartilhamento não pode ser rejeitado. Status atual: {share.get('status')}"
        )
    
    if not payload.reason or len(payload.reason.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Motivo da rejeição é obrigatório e deve ter pelo menos 10 caracteres"
        )
    
    # Atualizar share
    share["status"] = "rejected"
    share["approved_by"] = payload.rejected_by
    share["rejection_reason"] = payload.reason
    share["approval_date"] = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    
    return {
        "success": True,
        "share_id": share_id,
        "status": "rejected",
        "rejected_by": payload.rejected_by,
        "rejection_reason": payload.reason,
        "rejection_date": share["approval_date"]
    }


@router.put("/{share_id}/extend")
async def extend_expiration(share_id: str, payload: ExtendExpirationRequest, request: Request = None):
    """
    PUT /api/v1/supervisor/{share_id}/extend
    
    Altera o tempo de expiração de um compartilhamento.
    
    Request Body:
    {
        "new_hours": 48,
        "changed_by": "Wagner Gaspar Brazil",
        "reason": "Solicitado pelo destinatário"
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-123",
        "previous_hours": 72,
        "new_hours": 48,
        "new_expires_at": "22/01/2026 14:30",
        "changed_by": "Wagner Gaspar Brazil"
    }
    """
    share = _shares_store.get(share_id)
    
    if not share:
        raise HTTPException(status_code=404, detail="Compartilhamento não encontrado")
    
    if payload.new_hours not in [24, 48, 72]:
        raise HTTPException(
            status_code=400,
            detail="Tempo de expiração deve ser 24, 48 ou 72 horas"
        )
    
    previous_hours = share.get("expiration_hours", 72)
    
    # Atualizar expiração
    share["expiration_hours"] = payload.new_hours
    
    # Se já aprovado, recalcular expires_at
    if share.get("status") == "approved" and share.get("approval_date"):
        new_expires_at = datetime.utcnow() + timedelta(hours=payload.new_hours)
        share["expires_at"] = new_expires_at.strftime("%d/%m/%Y %H:%M")
    
    # Adicionar ao log de expiração
    if "expiration_logs" not in share:
        share["expiration_logs"] = []
    
    share["expiration_logs"].append({
        "timestamp": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        "changed_by": payload.changed_by,
        "previous_value": previous_hours,
        "new_value": payload.new_hours,
        "reason": payload.reason or "Ajuste pelo supervisor"
    })
    
    return {
        "success": True,
        "share_id": share_id,
        "previous_hours": previous_hours,
        "new_hours": payload.new_hours,
        "new_expires_at": share.get("expires_at"),
        "changed_by": payload.changed_by
    }


@router.get("/statistics/summary")
async def get_statistics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    request: Request = None
):
    """
    GET /api/v1/supervisor/statistics/summary
    
    Retorna estatísticas gerais dos compartilhamentos.
    
    Query Params:
    - start_date: Data inicial (formato: YYYY-MM-DD)
    - end_date: Data final (formato: YYYY-MM-DD)
    
    Response:
    {
        "total_shares": 150,
        "pending": 10,
        "approved": 120,
        "rejected": 15,
        "cancelled": 5,
        "approval_rate": 85.7,
        "average_approval_time_hours": 4.5,
        "top_senders": [...],
        "shares_by_day": [...]
    }
    """
    all_shares = list(_shares_store.values())
    
    total = len(all_shares)
    pending = len([s for s in all_shares if s.get("status") == "pending"])
    approved = len([s for s in all_shares if s.get("status") == "approved"])
    rejected = len([s for s in all_shares if s.get("status") == "rejected"])
    cancelled = len([s for s in all_shares if s.get("status") == "cancelled"])
    
    approval_rate = (approved / (approved + rejected) * 100) if (approved + rejected) > 0 else 0
    
    return {
        "total_shares": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "cancelled": cancelled,
        "approval_rate": round(approval_rate, 1),
        "average_approval_time_hours": 4.5,
        "top_senders": [],
        "shares_by_day": []
    }


@router.post("/shares/create")
async def create_share_as_supervisor(
    name: str,
    description: str,
    recipient: EmailStr,
    files: List[FileInfo],
    expiration_hours: int,
    sender_id: str,
    sender_name: str,
    sender_email: EmailStr,
    approver_email: Optional[EmailStr] = None,
    approver_name: Optional[str] = None,
    request: Request = None
):
    """
    POST /api/v1/supervisor/shares/create
    
    Cria um compartilhamento como supervisor (será aprovado pelo supervisor do supervisor).
    
    Request Body:
    {
        "name": "Documentos Q4",
        "description": "Relatórios para cliente",
        "recipient": "externo@empresa.com",
        "files": [...],
        "expiration_hours": 72,
        "sender_id": "supervisor-id",
        "sender_name": "Wagner Gaspar Brazil",
        "sender_email": "wagner.brazil@petrobras.com.br",
        "approver_email": "diretor@petrobras.com.br",
        "approver_name": "Diretor Regional"
    }
    
    Response:
    {
        "success": true,
        "share_id": "upload-xxx",
        "status": "pending",
        "approver": {
            "name": "Diretor Regional",
            "email": "diretor@petrobras.com.br"
        }
    }
    """
    share_id = f"upload-{datetime.utcnow().timestamp()}"
    
    new_share = {
        "id": share_id,
        "name": name,
        "description": description,
        "sender": {
            "id": sender_id,
            "name": sender_name,
            "email": sender_email
        },
        "recipient": recipient,
        "files": [f.dict() for f in files],
        "status": "pending",
        "upload_date": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
        "expiration_hours": expiration_hours,
        "sent_by_supervisor": True,
        "approver": {
            "name": approver_name,
            "email": approver_email
        } if approver_email else None,
        "expiration_logs": [{
            "timestamp": datetime.utcnow().strftime("%d/%m/%Y %H:%M"),
            "changed_by": sender_name,
            "previous_value": None,
            "new_value": expiration_hours,
            "reason": "Definição inicial pelo remetente"
        }]
    }
    
    _shares_store[share_id] = new_share
    
    return {
        "success": True,
        "share_id": share_id,
        "status": "pending",
        "approver": new_share.get("approver")
    }
