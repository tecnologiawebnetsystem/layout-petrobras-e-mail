"""
Servico de Usuarios
Gerencia usuarios internos, supervisores e externos
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import uuid4
import logging

from app.core.dynamodb_client import db
from app.models.dynamodb_models import User, ManagerInfo, UserType

logger = logging.getLogger(__name__)


# Cargos que identificam supervisores
SUPERVISOR_TITLES = [
    "gerente",
    "coordenador",
    "diretor",
    "superintendente",
    "chefe",
    "lider",
    "head",
    "manager",
    "coordinator",
    "director"
]


def is_supervisor_role(job_title: Optional[str]) -> bool:
    """Verifica se o cargo eh de supervisor"""
    if not job_title:
        return False
    job_title_lower = job_title.lower()
    return any(title in job_title_lower for title in SUPERVISOR_TITLES)


def determine_user_type(job_title: Optional[str], is_external: bool = False) -> UserType:
    """Determina o tipo de usuario baseado no cargo"""
    if is_external:
        return "external"
    if is_supervisor_role(job_title):
        return "supervisor"
    return "internal"


class UserService:
    """Servico para gerenciamento de usuarios"""
    
    @staticmethod
    def create_internal_user(
        email: str,
        name: str,
        entra_id: str,
        job_title: Optional[str] = None,
        department: Optional[str] = None,
        office_location: Optional[str] = None,
        mobile_phone: Optional[str] = None,
        employee_id: Optional[str] = None,
        photo_url: Optional[str] = None,
        manager_data: Optional[Dict[str, Any]] = None
    ) -> User:
        """
        Cria ou atualiza usuario interno (via Entra ID)
        
        Args:
            email: Email do usuario
            name: Nome completo
            entra_id: ID do Microsoft Entra
            job_title: Cargo
            department: Departamento
            office_location: Localizacao
            mobile_phone: Telefone
            employee_id: Matricula
            photo_url: URL da foto
            manager_data: Dados do supervisor direto
        
        Returns:
            Usuario criado/atualizado
        """
        # Verifica se usuario ja existe
        existing = db.get_user_by_email(email)
        
        # Monta dados do manager
        manager = None
        if manager_data:
            manager = ManagerInfo(
                id=manager_data.get("id", ""),
                name=manager_data.get("displayName", manager_data.get("name", "")),
                email=manager_data.get("mail", manager_data.get("email", "")),
                job_title=manager_data.get("jobTitle"),
                department=manager_data.get("department"),
            )
        
        # Determina tipo de usuario
        user_type = determine_user_type(job_title, is_external=False)
        
        if existing:
            # Atualiza usuario existente
            user_id = existing["user_id"]
            updates = {
                "name": name,
                "user_type": user_type,
                "entra_id": entra_id,
                "last_login_at": datetime.utcnow().isoformat(),
            }
            
            if job_title:
                updates["job_title"] = job_title
            if department:
                updates["department"] = department
            if office_location:
                updates["office_location"] = office_location
            if mobile_phone:
                updates["mobile_phone"] = mobile_phone
            if employee_id:
                updates["employee_id"] = employee_id
            if photo_url:
                updates["photo_url"] = photo_url
            if manager:
                updates["manager_id"] = manager.id
                updates["manager_name"] = manager.name
                updates["manager_email"] = manager.email
                if manager.job_title:
                    updates["manager_job_title"] = manager.job_title
            
            db.update_user(user_id, updates)
            logger.info(f"Usuario interno atualizado: {email} (tipo: {user_type})")
            
            # Retorna usuario atualizado
            return User.from_dynamodb_item(db.get_user_by_id(user_id))
        
        else:
            # Cria novo usuario
            user = User(
                user_id=str(uuid4()),
                email=email,
                name=name,
                user_type=user_type,
                entra_id=entra_id,
                job_title=job_title,
                department=department,
                office_location=office_location,
                mobile_phone=mobile_phone,
                employee_id=employee_id,
                photo_url=photo_url,
                manager=manager,
                is_active=True,
                last_login_at=datetime.utcnow().isoformat(),
            )
            
            db.create_user(user.to_dynamodb_item())
            logger.info(f"Usuario interno criado: {email} (tipo: {user_type})")
            
            return user
    
    @staticmethod
    def create_external_user(email: str) -> User:
        """
        Cria usuario externo (destinatario de arquivos)
        
        Args:
            email: Email do usuario externo
        
        Returns:
            Usuario externo criado
        """
        # Verifica se ja existe
        existing = db.get_user_by_email(email)
        
        if existing:
            # Atualiza ultimo acesso
            db.update_user(existing["user_id"], {
                "last_login_at": datetime.utcnow().isoformat()
            })
            return User.from_dynamodb_item(existing)
        
        # Cria novo usuario externo
        user = User(
            user_id=str(uuid4()),
            email=email,
            name=email.split("@")[0],  # Nome baseado no email
            user_type="external",
            is_active=True,
            last_login_at=datetime.utcnow().isoformat(),
        )
        
        db.create_user(user.to_dynamodb_item())
        logger.info(f"Usuario externo criado: {email}")
        
        return user
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        """Busca usuario por ID"""
        item = db.get_user_by_id(user_id)
        return User.from_dynamodb_item(item) if item else None
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Busca usuario por email"""
        item = db.get_user_by_email(email)
        return User.from_dynamodb_item(item) if item else None
    
    @staticmethod
    def get_subordinates(manager_id: str) -> List[User]:
        """Busca subordinados de um supervisor"""
        items = db.get_users_by_manager(manager_id)
        return [User.from_dynamodb_item(item) for item in items]
    
    @staticmethod
    def update_user_profile(user_id: str, updates: Dict[str, Any]) -> bool:
        """Atualiza perfil do usuario"""
        # Recalcula tipo se cargo mudou
        if "job_title" in updates:
            updates["user_type"] = determine_user_type(updates["job_title"])
        
        return db.update_user(user_id, updates)
    
    @staticmethod
    def deactivate_user(user_id: str) -> bool:
        """Desativa usuario"""
        return db.update_user(user_id, {"is_active": False})
    
    @staticmethod
    def get_approver_for_user(user: User) -> Optional[ManagerInfo]:
        """
        Retorna o aprovador para um usuario
        
        - Se for interno: retorna o manager direto
        - Se for supervisor: retorna o manager do manager (gerente do gerente)
        """
        if user.user_type == "external":
            return None
        
        if user.user_type == "internal":
            return user.manager
        
        # Supervisor - precisa buscar o manager do manager
        if user.manager and user.manager.id:
            manager_user = UserService.get_user_by_id(user.manager.id)
            if manager_user and manager_user.manager:
                return manager_user.manager
        
        # Se nao encontrar, retorna o manager direto
        return user.manager


# Instancia singleton
user_service = UserService()
