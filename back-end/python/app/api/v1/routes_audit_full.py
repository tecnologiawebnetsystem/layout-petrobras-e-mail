"""
Rotas de Auditoria - Backend Python
Endpoints para logs de auditoria, métricas e relatórios
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Query, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
from enum import Enum

router = APIRouter(prefix="/audit", tags=["Audit"])


# =============================================================================
# SCHEMAS
# =============================================================================

class AuditAction(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    UPLOAD = "upload"
    APPROVE = "approve"
    REJECT = "reject"
    CANCEL = "cancel"
    DOWNLOAD = "download"
    OTP_REQUEST = "otp_request"
    OTP_VERIFY = "otp_verify"
    EXPIRATION_CHANGE = "expiration_change"
    VIEW = "view"
    SETTINGS_CHANGE = "settings_change"


class SecurityLevel(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    SUCCESS = "success"


class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    action: AuditAction
    level: SecurityLevel
    user_id: str
    user_name: str
    user_email: EmailStr
    user_type: str  # 'internal', 'supervisor', 'external'
    target_id: Optional[str] = None
    target_name: Optional[str] = None
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[dict] = None


class MetricsResponse(BaseModel):
    total_uploads: int
    pending_approvals: int
    approved_files: int
    rejected_files: int
    total_downloads: int
    active_users: int
    storage_used: str


# =============================================================================
# IN-MEMORY STORE (Para desenvolvimento)
# =============================================================================

_audit_logs: List[dict] = []
_log_counter = 0


def _add_log(log_data: dict):
    global _log_counter
    _log_counter += 1
    log_data["id"] = f"log-{_log_counter}"
    log_data["timestamp"] = datetime.utcnow().strftime("%d/%m/%Y %H:%M:%S")
    _audit_logs.insert(0, log_data)  # Mais recente primeiro


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/logs")
async def get_audit_logs(
    authorization: str = Header(...),
    action: Optional[AuditAction] = Query(None),
    level: Optional[SecurityLevel] = Query(None),
    user_id: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None, description="Formato: YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Formato: YYYY-MM-DD"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    request: Request = None
):
    """
    GET /api/v1/audit/logs
    
    Lista logs de auditoria com filtros.
    
    Headers:
    - Authorization: Bearer {token}
    
    Query Params:
    - action: Filtrar por tipo de ação
    - level: Filtrar por nível de segurança
    - user_id: Filtrar por usuário
    - user_type: Filtrar por tipo de usuário (internal, supervisor, external)
    - target_id: Filtrar por ID do compartilhamento
    - start_date: Data inicial (YYYY-MM-DD)
    - end_date: Data final (YYYY-MM-DD)
    - search: Busca textual
    - page, limit: Paginação
    
    Response:
    {
        "logs": [...],
        "total": 500,
        "page": 1,
        "pages": 10,
        "filters_applied": ["action", "level"]
    }
    """
    logs = _audit_logs.copy()
    filters_applied = []
    
    # Aplicar filtros
    if action:
        logs = [l for l in logs if l.get("action") == action.value]
        filters_applied.append("action")
    
    if level:
        logs = [l for l in logs if l.get("level") == level.value]
        filters_applied.append("level")
    
    if user_id:
        logs = [l for l in logs if l.get("user_id") == user_id]
        filters_applied.append("user_id")
    
    if user_type:
        logs = [l for l in logs if l.get("user_type") == user_type]
        filters_applied.append("user_type")
    
    if target_id:
        logs = [l for l in logs if l.get("target_id") == target_id]
        filters_applied.append("target_id")
    
    if search:
        search_lower = search.lower()
        logs = [
            l for l in logs
            if search_lower in l.get("description", "").lower()
            or search_lower in l.get("user_name", "").lower()
            or search_lower in l.get("target_name", "").lower()
        ]
        filters_applied.append("search")
    
    # Paginação
    total = len(logs)
    start = (page - 1) * limit
    end = start + limit
    paginated_logs = logs[start:end]
    
    return {
        "logs": paginated_logs,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit or 1,
        "filters_applied": filters_applied
    }


@router.post("/logs")
async def create_audit_log(
    action: AuditAction,
    level: SecurityLevel,
    user_id: str,
    user_name: str,
    user_email: EmailStr,
    user_type: str,
    description: str,
    target_id: Optional[str] = None,
    target_name: Optional[str] = None,
    metadata: Optional[dict] = None,
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/audit/logs
    
    Cria um novo log de auditoria.
    
    Request Body:
    {
        "action": "upload",
        "level": "info",
        "user_id": "user-123",
        "user_name": "João Silva",
        "user_email": "joao@petrobras.com.br",
        "user_type": "internal",
        "description": "Arquivo enviado para aprovação",
        "target_id": "upload-123",
        "target_name": "Documentos Q4",
        "metadata": { "fileCount": 3, "totalSize": "5.2 MB" }
    }
    
    Response:
    {
        "success": true,
        "log_id": "log-xxx"
    }
    """
    ip = request.client.host if request and request.client else None
    user_agent = request.headers.get("User-Agent") if request else None
    
    log_data = {
        "action": action.value,
        "level": level.value,
        "user_id": user_id,
        "user_name": user_name,
        "user_email": user_email,
        "user_type": user_type,
        "description": description,
        "target_id": target_id,
        "target_name": target_name,
        "ip_address": ip,
        "user_agent": user_agent,
        "metadata": metadata or {}
    }
    
    _add_log(log_data)
    
    return {
        "success": True,
        "log_id": log_data["id"]
    }


@router.get("/metrics")
async def get_metrics(
    authorization: str = Header(...),
    period: str = Query("30d", description="Período: 7d, 30d, 90d, 1y"),
    request: Request = None
):
    """
    GET /api/v1/audit/metrics
    
    Retorna métricas gerais do sistema.
    
    Headers:
    - Authorization: Bearer {token}
    
    Query Params:
    - period: Período de análise (7d, 30d, 90d, 1y)
    
    Response:
    {
        "total_uploads": 150,
        "pending_approvals": 10,
        "approved_files": 120,
        "rejected_files": 15,
        "cancelled_files": 5,
        "total_downloads": 450,
        "active_users": 25,
        "storage_used": "2.5 GB",
        "period": "30d",
        "trends": {
            "uploads": "+12%",
            "approvals": "+5%",
            "downloads": "+20%"
        }
    }
    """
    # Em produção: calcular métricas reais do banco
    return {
        "total_uploads": 150,
        "pending_approvals": 10,
        "approved_files": 120,
        "rejected_files": 15,
        "cancelled_files": 5,
        "total_downloads": 450,
        "active_users": 25,
        "storage_used": "2.5 GB",
        "period": period,
        "trends": {
            "uploads": "+12%",
            "approvals": "+5%",
            "downloads": "+20%"
        }
    }


@router.get("/metrics/by-user")
async def get_metrics_by_user(
    authorization: str = Header(...),
    period: str = Query("30d"),
    limit: int = Query(10),
    request: Request = None
):
    """
    GET /api/v1/audit/metrics/by-user
    
    Retorna métricas agrupadas por usuário.
    
    Response:
    {
        "users": [
            {
                "user_id": "user-123",
                "user_name": "João Silva",
                "uploads": 25,
                "approved": 22,
                "rejected": 3,
                "downloads_generated": 150
            }
        ],
        "period": "30d"
    }
    """
    return {
        "users": [
            {
                "user_id": "user-1",
                "user_name": "João Silva",
                "uploads": 25,
                "approved": 22,
                "rejected": 3,
                "downloads_generated": 150
            },
            {
                "user_id": "user-2",
                "user_name": "Maria Santos",
                "uploads": 18,
                "approved": 17,
                "rejected": 1,
                "downloads_generated": 89
            }
        ],
        "period": period
    }


@router.get("/metrics/by-day")
async def get_metrics_by_day(
    authorization: str = Header(...),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    request: Request = None
):
    """
    GET /api/v1/audit/metrics/by-day
    
    Retorna métricas diárias para gráficos.
    
    Response:
    {
        "days": [
            {
                "date": "2026-01-15",
                "uploads": 5,
                "approvals": 4,
                "downloads": 20
            }
        ]
    }
    """
    # Gerar dados dos últimos 30 dias
    days = []
    for i in range(30, 0, -1):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        days.append({
            "date": date,
            "uploads": 3 + (i % 5),
            "approvals": 2 + (i % 4),
            "downloads": 10 + (i % 15)
        })
    
    return {"days": days}


@router.get("/logs/{log_id}")
async def get_log_details(
    log_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    GET /api/v1/audit/logs/{log_id}
    
    Retorna detalhes de um log específico.
    
    Response:
    {
        "id": "log-123",
        "timestamp": "20/01/2026 10:30:45",
        "action": "upload",
        "level": "info",
        "user": {...},
        "target": {...},
        "description": "...",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "metadata": {...}
    }
    """
    log = next((l for l in _audit_logs if l.get("id") == log_id), None)
    
    if not log:
        raise HTTPException(status_code=404, detail="Log não encontrado")
    
    return log


@router.get("/export")
async def export_logs(
    authorization: str = Header(...),
    format: str = Query("json", description="Formato: json, csv"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    request: Request = None
):
    """
    GET /api/v1/audit/export
    
    Exporta logs de auditoria.
    
    Query Params:
    - format: json ou csv
    - start_date: Data inicial
    - end_date: Data final
    
    Response:
    - JSON: { "logs": [...], "exported_at": "...", "count": 500 }
    - CSV: Retorna arquivo CSV para download
    """
    logs = _audit_logs.copy()
    
    # Filtrar por data se especificado
    # ...
    
    if format == "csv":
        # Em produção: gerar CSV real
        return {
            "download_url": "/api/v1/audit/export/download/xxx",
            "expires_in": 300,
            "count": len(logs)
        }
    
    return {
        "logs": logs,
        "exported_at": datetime.utcnow().isoformat(),
        "count": len(logs)
    }


@router.get("/security-alerts")
async def get_security_alerts(
    authorization: str = Header(...),
    acknowledged: Optional[bool] = Query(None),
    page: int = Query(1),
    limit: int = Query(20),
    request: Request = None
):
    """
    GET /api/v1/audit/security-alerts
    
    Lista alertas de segurança (rate limit, session hijacking, etc).
    
    Response:
    {
        "alerts": [
            {
                "id": "alert-123",
                "type": "rate_limit_exceeded",
                "severity": "warning",
                "timestamp": "20/01/2026 10:30",
                "ip_address": "192.168.1.1",
                "email": "teste@empresa.com",
                "description": "Múltiplas tentativas de login falhadas",
                "acknowledged": false
            }
        ],
        "total": 5,
        "unacknowledged": 3
    }
    """
    # Filtrar logs de segurança
    security_logs = [l for l in _audit_logs if l.get("level") in ["warning", "critical"]]
    
    return {
        "alerts": security_logs[:limit],
        "total": len(security_logs),
        "unacknowledged": len([l for l in security_logs if not l.get("acknowledged")])
    }


@router.post("/security-alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/audit/security-alerts/{alert_id}/acknowledge
    
    Marca um alerta de segurança como reconhecido.
    
    Response:
    {
        "success": true,
        "acknowledged_at": "20/01/2026 11:00"
    }
    """
    # Encontrar e marcar como reconhecido
    for log in _audit_logs:
        if log.get("id") == alert_id:
            log["acknowledged"] = True
            log["acknowledged_at"] = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
            break
    
    return {
        "success": True,
        "acknowledged_at": datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    }
