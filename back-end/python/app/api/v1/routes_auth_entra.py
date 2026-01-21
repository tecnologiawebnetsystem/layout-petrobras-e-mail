"""
Rotas de Autenticação Microsoft Entra ID - Backend Python
Endpoints para validação de tokens e sincronização com Entra ID
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import jwt
import os

router = APIRouter(prefix="/auth/entra", tags=["Auth - Entra ID"])


# =============================================================================
# SCHEMAS
# =============================================================================

class ValidateTokenRequest(BaseModel):
    access_token: str
    id_token: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    office_location: Optional[str] = None
    mobile_phone: Optional[str] = None
    photo_url: Optional[str] = None


class ManagerInfo(BaseModel):
    id: str
    name: str
    email: EmailStr
    job_title: Optional[str] = None
    department: Optional[str] = None


class SyncUserRequest(BaseModel):
    entra_id: str
    email: EmailStr
    name: str
    job_title: Optional[str] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    manager: Optional[ManagerInfo] = None


class CreateSessionRequest(BaseModel):
    user_id: str
    email: EmailStr
    user_type: str  # 'internal', 'supervisor', 'external'
    user_agent: str
    ip_address: str
    fingerprint: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/validate-token")
async def validate_entra_token(payload: ValidateTokenRequest, request: Request):
    """
    POST /api/v1/auth/entra/validate-token
    
    Valida um token de acesso do Microsoft Entra ID.
    
    Request Body:
    {
        "access_token": "eyJ...",
        "id_token": "eyJ..."  // opcional
    }
    
    Response:
    {
        "valid": true,
        "user": {
            "id": "uuid",
            "email": "user@petrobras.com.br",
            "name": "Nome Completo",
            "job_title": "Analista",
            "department": "TI"
        },
        "expires_at": "2026-01-20T12:00:00Z"
    }
    """
    try:
        # Em produção: validar token com Microsoft usando JWKS
        # from msal import ConfidentialClientApplication
        # result = app.acquire_token_on_behalf_of(...)
        
        # Para desenvolvimento: decodificar sem validar (APENAS DEV!)
        # Em produção DEVE validar assinatura com JWKS
        
        # Decodificar header para ver claims (sem validar)
        try:
            unverified = jwt.decode(
                payload.access_token,
                options={"verify_signature": False}
            )
        except jwt.DecodeError:
            raise HTTPException(status_code=401, detail="Token inválido")
        
        # Extrair informações do token
        user_id = unverified.get("oid") or unverified.get("sub")
        email = unverified.get("preferred_username") or unverified.get("email") or unverified.get("upn")
        name = unverified.get("name", "Usuário")
        
        # Verificar expiração
        exp = unverified.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise HTTPException(status_code=401, detail="Token expirado")
        
        return {
            "valid": True,
            "user": {
                "id": user_id,
                "email": email,
                "name": name
            },
            "expires_at": datetime.fromtimestamp(exp).isoformat() if exp else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Erro ao validar token: {str(e)}")


@router.post("/sync-user")
async def sync_user_from_entra(payload: SyncUserRequest, request: Request):
    """
    POST /api/v1/auth/entra/sync-user
    
    Sincroniza/atualiza dados do usuário do Entra ID com o banco local.
    
    Request Body:
    {
        "entra_id": "uuid-do-entra",
        "email": "user@petrobras.com.br",
        "name": "Nome Completo",
        "job_title": "Gerente",
        "department": "Financeiro",
        "employee_id": "12345",
        "manager": {
            "id": "uuid-manager",
            "name": "Manager Name",
            "email": "manager@petrobras.com.br",
            "job_title": "Diretor"
        }
    }
    
    Response:
    {
        "success": true,
        "user_id": "local-user-id",
        "user_type": "supervisor",
        "created": false,
        "updated": true
    }
    """
    # Determinar tipo de usuário baseado no cargo
    user_type = "internal"
    
    if payload.job_title:
        job_lower = payload.job_title.lower()
        supervisor_titles = ["gerente", "coordenador", "diretor", "superintendente", "chefe", "líder", "supervisor"]
        if any(title in job_lower for title in supervisor_titles):
            user_type = "supervisor"
    
    # Em produção: criar/atualizar usuário no banco
    # user = session.query(User).filter(User.entra_id == payload.entra_id).first()
    # if not user:
    #     user = User(...)
    #     session.add(user)
    # else:
    #     user.name = payload.name
    #     ...
    # session.commit()
    
    return {
        "success": True,
        "user_id": payload.entra_id,
        "user_type": user_type,
        "created": False,
        "updated": True
    }


@router.post("/create-session")
async def create_session(payload: CreateSessionRequest, request: Request):
    """
    POST /api/v1/auth/entra/create-session
    
    Cria uma sessão para o usuário autenticado.
    
    Request Body:
    {
        "user_id": "uuid",
        "email": "user@petrobras.com.br",
        "user_type": "internal",
        "user_agent": "Mozilla/5.0...",
        "ip_address": "192.168.1.1",
        "fingerprint": "abc123"
    }
    
    Response:
    {
        "session_id": "session-uuid",
        "expires_at": "2026-01-20T20:00:00Z",
        "refresh_token": "refresh_xxx"
    }
    """
    # Criar sessão com validade de 8 horas
    session_id = f"session_{payload.user_id}_{datetime.utcnow().timestamp()}"
    expires_at = datetime.utcnow() + timedelta(hours=8)
    
    # Em produção: salvar sessão no banco com contexto
    # session_context = SessionContext(
    #     user_id=payload.user_id,
    #     session_token=session_id,
    #     user_agent=payload.user_agent,
    #     ip_address=payload.ip_address,
    #     fingerprint=payload.fingerprint,
    #     expires_at=expires_at
    # )
    # db_session.add(session_context)
    # db_session.commit()
    
    return {
        "session_id": session_id,
        "expires_at": expires_at.isoformat(),
        "refresh_token": f"refresh_{session_id}"
    }


@router.post("/validate-session")
async def validate_session(
    session_id: str,
    user_agent: str,
    request: Request
):
    """
    POST /api/v1/auth/entra/validate-session
    
    Valida se a sessão ainda é válida e detecta session hijacking.
    
    Query Params:
    - session_id: ID da sessão
    - user_agent: User-Agent atual do navegador
    
    Response:
    {
        "valid": true,
        "remaining_seconds": 3600,
        "hijack_detected": false
    }
    """
    # Em produção: buscar sessão do banco e validar contexto
    # stored_session = db_session.query(SessionContext).filter(
    #     SessionContext.session_token == session_id,
    #     SessionContext.is_valid == True
    # ).first()
    
    # Mock response
    return {
        "valid": True,
        "remaining_seconds": 3600,
        "hijack_detected": False
    }


@router.post("/logout")
async def logout(
    authorization: str = Header(...),
    request: Request = None
):
    """
    POST /api/v1/auth/entra/logout
    
    Encerra a sessão do usuário.
    
    Headers:
    - Authorization: Bearer {session_id}
    
    Response:
    {
        "success": true,
        "message": "Sessão encerrada com sucesso"
    }
    """
    # Extrair session_id do header
    session_id = authorization.replace("Bearer ", "") if authorization else None
    
    if not session_id:
        raise HTTPException(status_code=401, detail="Sessão não fornecida")
    
    # Em produção: invalidar sessão no banco
    # stored_session = db_session.query(SessionContext).filter(
    #     SessionContext.session_token == session_id
    # ).first()
    # if stored_session:
    #     stored_session.is_valid = False
    #     db_session.commit()
    
    return {
        "success": True,
        "message": "Sessão encerrada com sucesso"
    }


@router.get("/user-type/{email}")
async def get_user_type(email: str, job_title: Optional[str] = None):
    """
    GET /api/v1/auth/entra/user-type/{email}?job_title=Gerente
    
    Determina o tipo de usuário baseado no email e cargo.
    
    Response:
    {
        "email": "user@petrobras.com.br",
        "user_type": "supervisor",
        "is_petrobras_domain": true
    }
    """
    email_lower = email.lower()
    
    # Verificar domínio Petrobras
    is_petrobras = "@petrobras" in email_lower
    
    if not is_petrobras:
        return {
            "email": email,
            "user_type": "external",
            "is_petrobras_domain": False
        }
    
    # Lista de supervisores conhecidos
    supervisor_emails = [
        "wagner.brazil@petrobras.com.br",
        "sabrina.araujo@petrobras.com.br"
    ]
    
    if email_lower in supervisor_emails:
        return {
            "email": email,
            "user_type": "supervisor",
            "is_petrobras_domain": True
        }
    
    # Verificar cargo se fornecido
    if job_title:
        job_lower = job_title.lower()
        supervisor_titles = ["gerente", "coordenador", "diretor", "superintendente", "chefe", "líder", "supervisor"]
        if any(title in job_lower for title in supervisor_titles):
            return {
                "email": email,
                "user_type": "supervisor",
                "is_petrobras_domain": True
            }
    
    return {
        "email": email,
        "user_type": "internal",
        "is_petrobras_domain": True
    }
