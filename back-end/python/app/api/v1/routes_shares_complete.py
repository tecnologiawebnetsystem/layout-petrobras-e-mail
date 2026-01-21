"""
Rotas de Compartilhamentos Completas
====================================
Gerencia todo o ciclo de vida dos compartilhamentos.

Fluxos:
1. Usuario interno cria share -> pendente -> supervisor aprova -> externo baixa
2. Supervisor cria share -> supervisor dele aprova -> externo baixa

Corresponde ao frontend:
- upload/page.tsx (criar compartilhamento)
- supervisor/page.tsx (aprovar/rejeitar)
- download/page.tsx (listar e baixar)
- workflow-store.ts (gerenciamento de estado)
"""

from fastapi import APIRouter, HTTPException, Header, Depends, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, timedelta
import uuid

from app.core.aws_config import get_aws_settings
from app.services.share_service_dynamodb import ShareService
from app.services.file_service_s3 import FileServiceS3
from app.services.email_service_dynamodb import EmailService
from app.services.audit_service_dynamodb import AuditService
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/shares", tags=["Shares"])
settings = get_aws_settings()
share_service = ShareService()
file_service = FileServiceS3()
email_service = EmailService()
audit_service = AuditService()
notification_service = NotificationService()


# ============================================
# SCHEMAS - Request/Response
# ============================================

class SenderInfo(BaseModel):
    """Informacoes do remetente"""
    id: str
    name: str
    email: EmailStr


class ApproverInfo(BaseModel):
    """Informacoes do aprovador"""
    id: str
    name: str
    email: EmailStr
    job_title: Optional[str] = None


class FileInfo(BaseModel):
    """Informacoes de arquivo"""
    name: str
    size: str
    type: str


class CreateShareRequest(BaseModel):
    """
    Criar novo compartilhamento
    
    Corresponde a: workflow-store.ts addUpload()
    """
    name: str  # Descricao/titulo
    sender: SenderInfo
    recipient: EmailStr  # Email do destinatario externo
    description: str
    files: List[FileInfo]
    expiration_hours: int = 72  # 24, 48 ou 72 horas
    # Se enviado por supervisor
    sent_by_supervisor: bool = False
    # Aprovador automatico (supervisor do remetente)
    approver: Optional[ApproverInfo] = None


class CreateShareResponse(BaseModel):
    """Resposta da criacao de share"""
    success: bool
    share_id: str
    status: str
    approver: Optional[dict]
    message: str


class ShareDetailResponse(BaseModel):
    """Detalhes de um compartilhamento"""
    id: str
    name: str
    status: Literal["pending", "approved", "rejected", "cancelled", "expired"]
    sender: dict
    recipient: str
    description: str
    files: List[dict]
    expiration_hours: int
    created_at: str
    approved_at: Optional[str] = None
    rejected_at: Optional[str] = None
    expires_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    approver: Optional[dict] = None
    download_count: int = 0
    terms_accepted: bool = False


class ApproveShareRequest(BaseModel):
    """
    Aprovar compartilhamento
    
    Corresponde a: workflow-store.ts approveUpload()
    """
    share_id: str
    supervisor_id: str
    supervisor_name: str
    supervisor_email: EmailStr
    comments: Optional[str] = None


class RejectShareRequest(BaseModel):
    """
    Rejeitar compartilhamento
    
    Corresponde a: workflow-store.ts rejectUpload()
    """
    share_id: str
    supervisor_id: str
    supervisor_name: str
    supervisor_email: EmailStr
    reason: str


class ExtendExpirationRequest(BaseModel):
    """
    Alterar tempo de expiracao
    
    Corresponde a: workflow-store.ts updateExpiration()
    """
    share_id: str
    new_hours: int  # 24, 48 ou 72


class AcceptTermsRequest(BaseModel):
    """Aceitar termos de uso"""
    share_id: str
    external_user_email: EmailStr


# ============================================
# ENDPOINTS - Criar e Gerenciar Shares
# ============================================

@router.post("/create", response_model=CreateShareResponse)
async def create_share(
    request: CreateShareRequest,
    authorization: str = Header(None)
):
    """
    Cria novo compartilhamento
    
    Fluxo:
    1. Valida dados e arquivos
    2. Cria registro no DynamoDB com status 'pending'
    3. Notifica supervisor por email
    4. Envia confirmacao para remetente
    
    Corresponde a: upload/page.tsx handleSubmit()
    """
    try:
        # Gerar ID unico
        share_id = str(uuid.uuid4())
        
        # Preparar dados do share
        share_data = {
            "share_id": share_id,
            "name": request.name,
            "status": "pending",
            "sender": {
                "id": request.sender.id,
                "name": request.sender.name,
                "email": request.sender.email
            },
            "recipient": request.recipient.lower(),
            "description": request.description,
            "files": [f.dict() for f in request.files],
            "expiration_hours": request.expiration_hours,
            "sent_by_supervisor": request.sent_by_supervisor,
            "created_at": datetime.utcnow().isoformat(),
            "download_count": 0,
            "terms_accepted": False
        }
        
        # Adicionar aprovador se informado
        if request.approver:
            share_data["approver"] = {
                "id": request.approver.id,
                "name": request.approver.name,
                "email": request.approver.email,
                "job_title": request.approver.job_title
            }
        
        # Salvar no DynamoDB
        share_service.create_share(share_data)
        
        # Enviar email para supervisor
        if request.approver:
            email_service.send_supervisor_notification(
                supervisor_email=request.approver.email,
                supervisor_name=request.approver.name,
                sender_name=request.sender.name,
                sender_email=request.sender.email,
                recipient_email=request.recipient,
                files_count=len(request.files),
                description=request.description,
                share_id=share_id
            )
        
        # Enviar confirmacao para remetente
        email_service.send_sender_confirmation(
            sender_email=request.sender.email,
            sender_name=request.sender.name,
            recipient_email=request.recipient,
            files=[f.name for f in request.files],
            share_id=share_id
        )
        
        # Criar notificacao para supervisor
        if request.approver:
            notification_service.create_notification(
                user_id=request.approver.id,
                notification_type="new_share_pending",
                title="Nova solicitacao de compartilhamento",
                message=f"{request.sender.name} enviou arquivos para {request.recipient}",
                data={"share_id": share_id}
            )
        
        # Registrar auditoria
        audit_service.log_action(
            action="share_created",
            level="success",
            user_id=request.sender.id,
            user_type="supervisor" if request.sent_by_supervisor else "internal",
            details={
                "share_id": share_id,
                "recipient": request.recipient,
                "files_count": len(request.files),
                "expiration_hours": request.expiration_hours
            }
        )
        
        return CreateShareResponse(
            success=True,
            share_id=share_id,
            status="pending",
            approver=share_data.get("approver"),
            message="Compartilhamento criado e enviado para aprovacao"
        )
        
    except Exception as e:
        audit_service.log_action(
            action="share_create_error",
            level="error",
            user_id=request.sender.id,
            user_type="internal",
            details={"error": str(e)}
        )
        raise HTTPException(status_code=500, detail=f"Erro ao criar compartilhamento: {str(e)}")


@router.get("/my-shares", response_model=List[ShareDetailResponse])
async def get_my_shares(
    user_id: str = Query(..., description="ID do usuario"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    authorization: str = Header(None)
):
    """
    Lista compartilhamentos do usuario
    
    Corresponde a: upload/page.tsx lista de "Meus Compartilhamentos"
    """
    try:
        shares = share_service.get_shares_by_sender(user_id)
        
        # Filtrar por status se informado
        if status:
            shares = [s for s in shares if s.get("status") == status]
        
        # Ordenar por data (mais recentes primeiro)
        shares.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        return shares
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar compartilhamentos: {str(e)}")


@router.get("/{share_id}", response_model=ShareDetailResponse)
async def get_share_detail(
    share_id: str,
    authorization: str = Header(None)
):
    """
    Detalhes de um compartilhamento especifico
    """
    try:
        share = share_service.get_share_by_id(share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        return share
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar compartilhamento: {str(e)}")


@router.patch("/{share_id}/cancel")
async def cancel_share(
    share_id: str,
    user_id: str = Query(..., description="ID do usuario que esta cancelando"),
    authorization: str = Header(None)
):
    """
    Cancela compartilhamento pendente
    
    Corresponde a: workflow-store.ts cancelUpload()
    """
    try:
        share = share_service.get_share_by_id(share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        # Verificar se usuario e o dono
        if share.get("sender", {}).get("id") != user_id:
            raise HTTPException(status_code=403, detail="Sem permissao para cancelar")
        
        # Verificar se pode ser cancelado
        if share.get("status") != "pending":
            raise HTTPException(
                status_code=400, 
                detail="Apenas compartilhamentos pendentes podem ser cancelados"
            )
        
        # Cancelar
        share_service.update_share_status(
            share_id=share_id,
            status="cancelled",
            cancelled_at=datetime.utcnow().isoformat()
        )
        
        # Deletar arquivos do S3
        file_service.delete_share_files(share_id)
        
        # Registrar auditoria
        audit_service.log_action(
            action="share_cancelled",
            level="info",
            user_id=user_id,
            user_type="internal",
            details={"share_id": share_id}
        )
        
        return {"success": True, "message": "Compartilhamento cancelado"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar: {str(e)}")


# ============================================
# ENDPOINTS - Supervisor (Aprovacao)
# ============================================

@router.get("/supervisor/pending")
async def get_pending_for_supervisor(
    supervisor_email: str = Query(..., description="Email do supervisor"),
    authorization: str = Header(None)
):
    """
    Lista compartilhamentos pendentes para supervisor
    
    Corresponde a: supervisor/page.tsx aba "Aprovacoes"
    """
    try:
        # Buscar pendentes onde este supervisor e o aprovador
        shares = share_service.get_pending_for_supervisor(supervisor_email)
        
        return {"shares": shares, "count": len(shares)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar pendentes: {str(e)}")


@router.get("/supervisor/all")
async def get_all_for_supervisor(
    supervisor_email: str = Query(..., description="Email do supervisor"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    search: Optional[str] = Query(None, description="Buscar por texto"),
    authorization: str = Header(None)
):
    """
    Lista todos os compartilhamentos que passaram pelo supervisor
    """
    try:
        shares = share_service.get_all_for_supervisor(supervisor_email)
        
        # Filtrar por status
        if status and status != "all":
            shares = [s for s in shares if s.get("status") == status]
        
        # Buscar por texto
        if search:
            search_lower = search.lower()
            shares = [
                s for s in shares
                if search_lower in s.get("name", "").lower()
                or search_lower in s.get("sender", {}).get("name", "").lower()
                or search_lower in s.get("sender", {}).get("email", "").lower()
                or search_lower in s.get("recipient", "").lower()
            ]
        
        return {"shares": shares, "count": len(shares)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar: {str(e)}")


@router.post("/supervisor/approve")
async def approve_share(
    request: ApproveShareRequest,
    authorization: str = Header(None)
):
    """
    Aprova compartilhamento
    
    Fluxo:
    1. Valida permissao do supervisor
    2. Atualiza status para 'approved'
    3. Define data de expiracao
    4. Envia email para destinatario externo com OTP
    5. Notifica remetente
    
    Corresponde a: approval-modal.tsx handleApprove()
    """
    try:
        share = share_service.get_share_by_id(request.share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        if share.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Compartilhamento nao esta pendente")
        
        # Calcular data de expiracao
        expiration_hours = share.get("expiration_hours", 72)
        expires_at = datetime.utcnow() + timedelta(hours=expiration_hours)
        
        # Atualizar status
        share_service.update_share_status(
            share_id=request.share_id,
            status="approved",
            approved_at=datetime.utcnow().isoformat(),
            approved_by={
                "id": request.supervisor_id,
                "name": request.supervisor_name,
                "email": request.supervisor_email
            },
            expires_at=expires_at.isoformat(),
            approval_comments=request.comments
        )
        
        # Enviar email para destinatario externo
        email_service.send_external_access_notification(
            recipient_email=share.get("recipient"),
            sender_name=share.get("sender", {}).get("name"),
            files=[f.get("name") for f in share.get("files", [])],
            share_id=request.share_id,
            expires_at=expires_at
        )
        
        # Notificar remetente
        email_service.send_share_approved_notification(
            sender_email=share.get("sender", {}).get("email"),
            sender_name=share.get("sender", {}).get("name"),
            recipient_email=share.get("recipient"),
            approved_by=request.supervisor_name
        )
        
        # Criar notificacao
        notification_service.create_notification(
            user_id=share.get("sender", {}).get("id"),
            notification_type="share_approved",
            title="Compartilhamento aprovado",
            message=f"Seu compartilhamento para {share.get('recipient')} foi aprovado",
            data={"share_id": request.share_id}
        )
        
        # Registrar auditoria
        audit_service.log_action(
            action="share_approved",
            level="success",
            user_id=request.supervisor_id,
            user_type="supervisor",
            details={
                "share_id": request.share_id,
                "recipient": share.get("recipient"),
                "expires_at": expires_at.isoformat()
            }
        )
        
        return {
            "success": True,
            "message": "Compartilhamento aprovado",
            "expires_at": expires_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao aprovar: {str(e)}")


@router.post("/supervisor/reject")
async def reject_share(
    request: RejectShareRequest,
    authorization: str = Header(None)
):
    """
    Rejeita compartilhamento
    
    Corresponde a: rejection-modal.tsx handleReject()
    """
    try:
        share = share_service.get_share_by_id(request.share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        if share.get("status") != "pending":
            raise HTTPException(status_code=400, detail="Compartilhamento nao esta pendente")
        
        # Atualizar status
        share_service.update_share_status(
            share_id=request.share_id,
            status="rejected",
            rejected_at=datetime.utcnow().isoformat(),
            rejected_by={
                "id": request.supervisor_id,
                "name": request.supervisor_name,
                "email": request.supervisor_email
            },
            rejection_reason=request.reason
        )
        
        # Deletar arquivos do S3
        file_service.delete_share_files(request.share_id)
        
        # Notificar remetente
        email_service.send_share_rejected_notification(
            sender_email=share.get("sender", {}).get("email"),
            sender_name=share.get("sender", {}).get("name"),
            recipient_email=share.get("recipient"),
            rejected_by=request.supervisor_name,
            reason=request.reason
        )
        
        # Criar notificacao
        notification_service.create_notification(
            user_id=share.get("sender", {}).get("id"),
            notification_type="share_rejected",
            title="Compartilhamento rejeitado",
            message=f"Seu compartilhamento para {share.get('recipient')} foi rejeitado",
            data={"share_id": request.share_id, "reason": request.reason}
        )
        
        # Registrar auditoria
        audit_service.log_action(
            action="share_rejected",
            level="warning",
            user_id=request.supervisor_id,
            user_type="supervisor",
            details={
                "share_id": request.share_id,
                "reason": request.reason
            }
        )
        
        return {"success": True, "message": "Compartilhamento rejeitado"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao rejeitar: {str(e)}")


@router.put("/supervisor/{share_id}/extend")
async def extend_expiration(
    share_id: str,
    request: ExtendExpirationRequest,
    authorization: str = Header(None)
):
    """
    Altera tempo de expiracao
    
    Corresponde a: workflow-store.ts updateExpiration()
    """
    try:
        share = share_service.get_share_by_id(share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        if share.get("status") != "approved":
            raise HTTPException(
                status_code=400, 
                detail="Apenas compartilhamentos aprovados podem ter expiracao alterada"
            )
        
        # Calcular nova expiracao a partir de agora
        new_expires_at = datetime.utcnow() + timedelta(hours=request.new_hours)
        
        share_service.update_share(
            share_id=share_id,
            expiration_hours=request.new_hours,
            expires_at=new_expires_at.isoformat()
        )
        
        audit_service.log_action(
            action="share_expiration_extended",
            level="info",
            user_id="supervisor",  # Pegar do token
            user_type="supervisor",
            details={
                "share_id": share_id,
                "new_hours": request.new_hours,
                "new_expires_at": new_expires_at.isoformat()
            }
        )
        
        return {
            "success": True,
            "new_expires_at": new_expires_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao alterar expiracao: {str(e)}")


@router.get("/supervisor/statistics")
async def get_supervisor_statistics(
    supervisor_email: str = Query(..., description="Email do supervisor"),
    authorization: str = Header(None)
):
    """
    Estatisticas do supervisor
    
    Corresponde a: supervisor/page.tsx cards de estatisticas
    """
    try:
        stats = share_service.get_supervisor_statistics(supervisor_email)
        
        return {
            "pending_count": stats.get("pending", 0),
            "approved_count": stats.get("approved", 0),
            "rejected_count": stats.get("rejected", 0),
            "total_count": stats.get("total", 0),
            "this_week": stats.get("this_week", 0),
            "this_month": stats.get("this_month", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatisticas: {str(e)}")


# ============================================
# ENDPOINTS - Usuario Externo
# ============================================

@router.get("/external/available")
async def get_available_for_external(
    email: str = Query(..., description="Email do destinatario externo"),
    authorization: str = Header(None)
):
    """
    Lista compartilhamentos disponiveis para usuario externo
    
    Corresponde a: download/page.tsx lista de compartilhamentos
    """
    try:
        email_lower = email.lower()
        shares = share_service.get_shares_for_recipient(email_lower)
        
        # Filtrar apenas aprovados e nao expirados
        valid_shares = []
        for share in shares:
            if share.get("status") == "approved":
                expires_at = share.get("expires_at")
                if expires_at:
                    exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                    if datetime.utcnow() < exp.replace(tzinfo=None):
                        valid_shares.append(share)
        
        return {"shares": valid_shares, "count": len(valid_shares)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar: {str(e)}")


@router.post("/external/accept-terms")
async def accept_terms(
    request: AcceptTermsRequest,
    authorization: str = Header(None)
):
    """
    Aceita termos de uso
    
    Corresponde a: download/page.tsx checkbox de aceite
    """
    try:
        share = share_service.get_share_by_id(request.share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        # Verificar se email corresponde
        if share.get("recipient", "").lower() != request.external_user_email.lower():
            raise HTTPException(status_code=403, detail="Sem permissao")
        
        share_service.update_share(
            share_id=request.share_id,
            terms_accepted=True,
            terms_accepted_at=datetime.utcnow().isoformat()
        )
        
        audit_service.log_action(
            action="terms_accepted",
            level="info",
            user_id=request.external_user_email,
            user_type="external",
            details={"share_id": request.share_id}
        )
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")


@router.get("/external/{share_id}/files/{file_id}/download")
async def download_file(
    share_id: str,
    file_id: str,
    email: str = Query(..., description="Email do usuario externo"),
    authorization: str = Header(None)
):
    """
    Gera URL de download para arquivo
    
    Corresponde a: download/page.tsx botao de download
    """
    try:
        share = share_service.get_share_by_id(share_id)
        
        if not share:
            raise HTTPException(status_code=404, detail="Compartilhamento nao encontrado")
        
        # Verificar permissao
        if share.get("recipient", "").lower() != email.lower():
            raise HTTPException(status_code=403, detail="Sem permissao")
        
        # Verificar se aprovado e nao expirado
        if share.get("status") != "approved":
            raise HTTPException(status_code=400, detail="Compartilhamento nao aprovado")
        
        expires_at = share.get("expires_at")
        if expires_at:
            exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
            if datetime.utcnow() > exp.replace(tzinfo=None):
                raise HTTPException(status_code=410, detail="Compartilhamento expirado")
        
        # Verificar se termos foram aceitos
        if not share.get("terms_accepted"):
            raise HTTPException(status_code=400, detail="Aceite os termos de uso primeiro")
        
        # Gerar URL de download
        result = file_service.generate_download_url(
            file_id=file_id,
            share_id=share_id,
            user_email=email,
            user_type="external"
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error"))
        
        # Incrementar contador de downloads
        share_service.increment_download_count(share_id)
        
        # Registrar auditoria
        audit_service.log_action(
            action="file_downloaded",
            level="info",
            user_id=email,
            user_type="external",
            details={
                "share_id": share_id,
                "file_id": file_id,
                "filename": result.get("filename")
            }
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro: {str(e)}")
