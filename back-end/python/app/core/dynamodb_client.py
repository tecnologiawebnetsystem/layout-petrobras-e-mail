"""
Cliente DynamoDB para o Sistema de Compartilhamento Seguro de Arquivos
Implementa todas as operacoes de CRUD para as tabelas do sistema
"""

import os
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURACAO
# =============================================================================

AWS_REGION = os.getenv("AWS_REGION", "sa-east-1")
DYNAMODB_ENDPOINT = os.getenv("DYNAMODB_ENDPOINT", None)  # Para DynamoDB Local

# Nomes das tabelas
TABLES = {
    "users": os.getenv("DYNAMODB_TABLE_USERS", "petrobras_users"),
    "shares": os.getenv("DYNAMODB_TABLE_SHARES", "petrobras_shares"),
    "files": os.getenv("DYNAMODB_TABLE_FILES", "petrobras_files"),
    "otp": os.getenv("DYNAMODB_TABLE_OTP", "petrobras_otp"),
    "sessions": os.getenv("DYNAMODB_TABLE_SESSIONS", "petrobras_sessions"),
    "audit_logs": os.getenv("DYNAMODB_TABLE_AUDIT_LOGS", "petrobras_audit_logs"),
    "notifications": os.getenv("DYNAMODB_TABLE_NOTIFICATIONS", "petrobras_notifications"),
    "expiration_logs": os.getenv("DYNAMODB_TABLE_EXPIRATION_LOGS", "petrobras_expiration_logs"),
    "emails": os.getenv("DYNAMODB_TABLE_EMAILS", "petrobras_emails"),
}


class DynamoDBClient:
    """Cliente singleton para operacoes DynamoDB"""
    
    _instance = None
    _dynamodb = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Inicializa conexao com DynamoDB"""
        if DYNAMODB_ENDPOINT:
            # DynamoDB Local para desenvolvimento
            self._dynamodb = boto3.resource(
                'dynamodb',
                region_name=AWS_REGION,
                endpoint_url=DYNAMODB_ENDPOINT
            )
        else:
            # DynamoDB na AWS
            self._dynamodb = boto3.resource(
                'dynamodb',
                region_name=AWS_REGION
            )
        logger.info(f"DynamoDB client inicializado - Region: {AWS_REGION}")
    
    def get_table(self, table_key: str):
        """Retorna referencia para uma tabela"""
        table_name = TABLES.get(table_key)
        if not table_name:
            raise ValueError(f"Tabela desconhecida: {table_key}")
        return self._dynamodb.Table(table_name)
    
    # =========================================================================
    # USUARIOS
    # =========================================================================
    
    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo usuario"""
        table = self.get_table("users")
        try:
            table.put_item(Item=user_data)
            logger.info(f"Usuario criado: {user_data.get('email')}")
            return user_data
        except ClientError as e:
            logger.error(f"Erro ao criar usuario: {e}")
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca usuario por ID"""
        table = self.get_table("users")
        try:
            response = table.get_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": "PROFILE"
                }
            )
            return response.get("Item")
        except ClientError as e:
            logger.error(f"Erro ao buscar usuario: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Busca usuario por email (GSI)"""
        table = self.get_table("users")
        try:
            response = table.query(
                IndexName="GSI1-email",
                KeyConditionExpression=Key("email").eq(email)
            )
            items = response.get("Items", [])
            return items[0] if items else None
        except ClientError as e:
            logger.error(f"Erro ao buscar usuario por email: {e}")
            return None
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Atualiza dados do usuario"""
        table = self.get_table("users")
        
        # Monta expressao de update
        update_expr = "SET updated_at = :updated_at"
        expr_values = {":updated_at": datetime.utcnow().isoformat()}
        
        for key, value in updates.items():
            if key not in ["PK", "SK", "user_id"]:
                update_expr += f", {key} = :{key}"
                expr_values[f":{key}"] = value
        
        try:
            table.update_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": "PROFILE"
                },
                UpdateExpression=update_expr,
                ExpressionAttributeValues=expr_values
            )
            logger.info(f"Usuario atualizado: {user_id}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao atualizar usuario: {e}")
            return False
    
    def get_users_by_manager(self, manager_id: str) -> List[Dict[str, Any]]:
        """Busca subordinados de um supervisor (GSI)"""
        table = self.get_table("users")
        try:
            response = table.query(
                IndexName="GSI3-manager",
                KeyConditionExpression=Key("manager_id").eq(manager_id)
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar subordinados: {e}")
            return []
    
    # =========================================================================
    # COMPARTILHAMENTOS (SHARES)
    # =========================================================================
    
    def create_share(self, share_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo compartilhamento"""
        table = self.get_table("shares")
        try:
            table.put_item(Item=share_data)
            logger.info(f"Share criado: {share_data.get('share_id')}")
            return share_data
        except ClientError as e:
            logger.error(f"Erro ao criar share: {e}")
            raise
    
    def get_share_by_id(self, share_id: str) -> Optional[Dict[str, Any]]:
        """Busca compartilhamento por ID"""
        table = self.get_table("shares")
        try:
            response = table.get_item(
                Key={
                    "PK": f"SHARE#{share_id}",
                    "SK": "METADATA"
                }
            )
            return response.get("Item")
        except ClientError as e:
            logger.error(f"Erro ao buscar share: {e}")
            return None
    
    def get_shares_by_sender(self, sender_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca compartilhamentos por remetente (GSI)"""
        table = self.get_table("shares")
        try:
            response = table.query(
                IndexName="GSI1-sender",
                KeyConditionExpression=Key("sender_id").eq(sender_id),
                ScanIndexForward=False,  # Mais recentes primeiro
                Limit=limit
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar shares do remetente: {e}")
            return []
    
    def get_shares_by_recipient(self, recipient_email: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Busca compartilhamentos por destinatario (GSI)"""
        table = self.get_table("shares")
        try:
            if status:
                response = table.query(
                    IndexName="GSI2-recipient",
                    KeyConditionExpression=Key("recipient_email").eq(recipient_email) & Key("status").eq(status)
                )
            else:
                response = table.query(
                    IndexName="GSI2-recipient",
                    KeyConditionExpression=Key("recipient_email").eq(recipient_email)
                )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar shares do destinatario: {e}")
            return []
    
    def get_shares_by_approver(self, approver_email: str, status: str = "pending") -> List[Dict[str, Any]]:
        """Busca compartilhamentos pendentes de aprovacao (GSI)"""
        table = self.get_table("shares")
        try:
            response = table.query(
                IndexName="GSI3-approver",
                KeyConditionExpression=Key("approver_email").eq(approver_email) & Key("status").eq(status)
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar shares pendentes: {e}")
            return []
    
    def get_shares_by_status(self, status: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Busca compartilhamentos por status (GSI)"""
        table = self.get_table("shares")
        try:
            response = table.query(
                IndexName="GSI4-status",
                KeyConditionExpression=Key("status").eq(status),
                ScanIndexForward=False,
                Limit=limit
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar shares por status: {e}")
            return []
    
    def update_share(self, share_id: str, updates: Dict[str, Any]) -> bool:
        """Atualiza compartilhamento"""
        table = self.get_table("shares")
        
        update_expr = "SET "
        expr_values = {}
        expr_names = {}
        
        parts = []
        for key, value in updates.items():
            if key not in ["PK", "SK", "share_id"]:
                # Usa nomes de atributos para evitar palavras reservadas
                parts.append(f"#{key} = :{key}")
                expr_names[f"#{key}"] = key
                expr_values[f":{key}"] = value
        
        update_expr += ", ".join(parts)
        
        try:
            table.update_item(
                Key={
                    "PK": f"SHARE#{share_id}",
                    "SK": "METADATA"
                },
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            logger.info(f"Share atualizado: {share_id}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao atualizar share: {e}")
            return False
    
    def approve_share(self, share_id: str, approver_name: str, expires_at: str) -> bool:
        """Aprova compartilhamento"""
        return self.update_share(share_id, {
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approver_name": approver_name,
            "expires_at": expires_at
        })
    
    def reject_share(self, share_id: str, rejected_by: str, reason: str) -> bool:
        """Rejeita compartilhamento"""
        return self.update_share(share_id, {
            "status": "rejected",
            "rejected_at": datetime.utcnow().isoformat(),
            "rejection_reason": reason,
            "approver_name": rejected_by
        })
    
    def cancel_share(self, share_id: str, cancelled_by: str, reason: str) -> bool:
        """Cancela compartilhamento"""
        return self.update_share(share_id, {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow().isoformat(),
            "cancelled_by": cancelled_by,
            "cancellation_reason": reason
        })
    
    def increment_download_count(self, share_id: str) -> bool:
        """Incrementa contador de downloads"""
        table = self.get_table("shares")
        try:
            table.update_item(
                Key={
                    "PK": f"SHARE#{share_id}",
                    "SK": "METADATA"
                },
                UpdateExpression="SET download_count = download_count + :inc, last_download_at = :now",
                ExpressionAttributeValues={
                    ":inc": 1,
                    ":now": datetime.utcnow().isoformat()
                }
            )
            return True
        except ClientError as e:
            logger.error(f"Erro ao incrementar download: {e}")
            return False
    
    # =========================================================================
    # ARQUIVOS
    # =========================================================================
    
    def create_file(self, file_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria registro de arquivo"""
        table = self.get_table("files")
        try:
            table.put_item(Item=file_data)
            logger.info(f"Arquivo registrado: {file_data.get('file_name')}")
            return file_data
        except ClientError as e:
            logger.error(f"Erro ao criar arquivo: {e}")
            raise
    
    def get_files_by_share(self, share_id: str) -> List[Dict[str, Any]]:
        """Busca arquivos de um compartilhamento"""
        table = self.get_table("files")
        try:
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"SHARE#{share_id}") & Key("SK").begins_with("FILE#")
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar arquivos: {e}")
            return []
    
    def get_file_by_id(self, share_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Busca arquivo especifico"""
        table = self.get_table("files")
        try:
            response = table.get_item(
                Key={
                    "PK": f"SHARE#{share_id}",
                    "SK": f"FILE#{file_id}"
                }
            )
            return response.get("Item")
        except ClientError as e:
            logger.error(f"Erro ao buscar arquivo: {e}")
            return None
    
    # =========================================================================
    # OTP
    # =========================================================================
    
    def create_otp(self, otp_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo codigo OTP"""
        table = self.get_table("otp")
        try:
            table.put_item(Item=otp_data)
            logger.info(f"OTP criado para: {otp_data.get('email')}")
            return otp_data
        except ClientError as e:
            logger.error(f"Erro ao criar OTP: {e}")
            raise
    
    def get_active_otp(self, email: str) -> Optional[Dict[str, Any]]:
        """Busca OTP ativo para email"""
        table = self.get_table("otp")
        try:
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"OTP#{email}"),
                ScanIndexForward=False,  # Mais recente primeiro
                Limit=1,
                FilterExpression=Attr("is_valid").eq(True)
            )
            items = response.get("Items", [])
            return items[0] if items else None
        except ClientError as e:
            logger.error(f"Erro ao buscar OTP: {e}")
            return None
    
    def invalidate_otp(self, email: str, created_at: str) -> bool:
        """Invalida codigo OTP"""
        table = self.get_table("otp")
        try:
            table.update_item(
                Key={
                    "PK": f"OTP#{email}",
                    "SK": f"CODE#{created_at}"
                },
                UpdateExpression="SET is_valid = :false, validated_at = :now",
                ExpressionAttributeValues={
                    ":false": False,
                    ":now": datetime.utcnow().isoformat()
                }
            )
            return True
        except ClientError as e:
            logger.error(f"Erro ao invalidar OTP: {e}")
            return False
    
    def increment_otp_attempts(self, email: str, created_at: str) -> int:
        """Incrementa tentativas de OTP e retorna novo valor"""
        table = self.get_table("otp")
        try:
            response = table.update_item(
                Key={
                    "PK": f"OTP#{email}",
                    "SK": f"CODE#{created_at}"
                },
                UpdateExpression="SET attempts = attempts + :inc",
                ExpressionAttributeValues={":inc": 1},
                ReturnValues="UPDATED_NEW"
            )
            return response.get("Attributes", {}).get("attempts", 0)
        except ClientError as e:
            logger.error(f"Erro ao incrementar tentativas: {e}")
            return -1
    
    # =========================================================================
    # SESSOES
    # =========================================================================
    
    def create_session(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria nova sessao"""
        table = self.get_table("sessions")
        try:
            table.put_item(Item=session_data)
            logger.info(f"Sessao criada: {session_data.get('session_id')}")
            return session_data
        except ClientError as e:
            logger.error(f"Erro ao criar sessao: {e}")
            raise
    
    def get_session(self, session_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca sessao"""
        table = self.get_table("sessions")
        try:
            response = table.get_item(
                Key={
                    "PK": f"SESSION#{session_id}",
                    "SK": f"USER#{user_id}"
                }
            )
            return response.get("Item")
        except ClientError as e:
            logger.error(f"Erro ao buscar sessao: {e}")
            return None
    
    def invalidate_session(self, session_id: str, user_id: str) -> bool:
        """Invalida sessao (logout)"""
        table = self.get_table("sessions")
        try:
            table.update_item(
                Key={
                    "PK": f"SESSION#{session_id}",
                    "SK": f"USER#{user_id}"
                },
                UpdateExpression="SET is_active = :false",
                ExpressionAttributeValues={":false": False}
            )
            logger.info(f"Sessao invalidada: {session_id}")
            return True
        except ClientError as e:
            logger.error(f"Erro ao invalidar sessao: {e}")
            return False
    
    def update_session_activity(self, session_id: str, user_id: str) -> bool:
        """Atualiza ultima atividade da sessao"""
        table = self.get_table("sessions")
        try:
            table.update_item(
                Key={
                    "PK": f"SESSION#{session_id}",
                    "SK": f"USER#{user_id}"
                },
                UpdateExpression="SET last_activity_at = :now",
                ExpressionAttributeValues={":now": datetime.utcnow().isoformat()}
            )
            return True
        except ClientError as e:
            logger.error(f"Erro ao atualizar atividade: {e}")
            return False
    
    # =========================================================================
    # AUDIT LOGS
    # =========================================================================
    
    def create_audit_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria log de auditoria"""
        table = self.get_table("audit_logs")
        try:
            table.put_item(Item=log_data)
            return log_data
        except ClientError as e:
            logger.error(f"Erro ao criar log: {e}")
            raise
    
    def get_logs_by_date(self, date: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Busca logs por data (YYYY-MM-DD)"""
        table = self.get_table("audit_logs")
        try:
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"LOG#{date}"),
                ScanIndexForward=False,
                Limit=limit
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar logs: {e}")
            return []
    
    def get_logs_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca logs por usuario (GSI)"""
        table = self.get_table("audit_logs")
        try:
            response = table.query(
                IndexName="GSI1-user",
                KeyConditionExpression=Key("user_id").eq(user_id),
                ScanIndexForward=False,
                Limit=limit
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar logs do usuario: {e}")
            return []
    
    def get_logs_by_action(self, action: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca logs por tipo de acao (GSI)"""
        table = self.get_table("audit_logs")
        try:
            response = table.query(
                IndexName="GSI2-action",
                KeyConditionExpression=Key("action").eq(action),
                ScanIndexForward=False,
                Limit=limit
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar logs por acao: {e}")
            return []
    
    # =========================================================================
    # NOTIFICACOES
    # =========================================================================
    
    def create_notification(self, notif_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria notificacao"""
        table = self.get_table("notifications")
        try:
            table.put_item(Item=notif_data)
            return notif_data
        except ClientError as e:
            logger.error(f"Erro ao criar notificacao: {e}")
            raise
    
    def get_notifications_by_user(self, user_id: str, unread_only: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca notificacoes do usuario"""
        table = self.get_table("notifications")
        try:
            params = {
                "KeyConditionExpression": Key("PK").eq(f"USER#{user_id}") & Key("SK").begins_with("NOTIF#"),
                "ScanIndexForward": False,
                "Limit": limit
            }
            
            if unread_only:
                params["FilterExpression"] = Attr("read").eq(False)
            
            response = table.query(**params)
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar notificacoes: {e}")
            return []
    
    def mark_notification_read(self, user_id: str, notification_sk: str) -> bool:
        """Marca notificacao como lida"""
        table = self.get_table("notifications")
        try:
            table.update_item(
                Key={
                    "PK": f"USER#{user_id}",
                    "SK": notification_sk
                },
                UpdateExpression="SET #read = :true, read_at = :now",
                ExpressionAttributeNames={"#read": "read"},
                ExpressionAttributeValues={
                    ":true": True,
                    ":now": datetime.utcnow().isoformat()
                }
            )
            return True
        except ClientError as e:
            logger.error(f"Erro ao marcar notificacao: {e}")
            return False
    
    # =========================================================================
    # EXPIRATION LOGS
    # =========================================================================
    
    def create_expiration_log(self, log_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria log de alteracao de expiracao"""
        table = self.get_table("expiration_logs")
        try:
            table.put_item(Item=log_data)
            return log_data
        except ClientError as e:
            logger.error(f"Erro ao criar log de expiracao: {e}")
            raise
    
    def get_expiration_logs(self, share_id: str) -> List[Dict[str, Any]]:
        """Busca historico de alteracoes de expiracao"""
        table = self.get_table("expiration_logs")
        try:
            response = table.query(
                KeyConditionExpression=Key("PK").eq(f"SHARE#{share_id}") & Key("SK").begins_with("EXPLOG#"),
                ScanIndexForward=True  # Ordem cronologica
            )
            return response.get("Items", [])
        except ClientError as e:
            logger.error(f"Erro ao buscar logs de expiracao: {e}")
            return []
    
    # =========================================================================
    # EMAILS
    # =========================================================================
    
    def create_email_record(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra email enviado"""
        table = self.get_table("emails")
        try:
            table.put_item(Item=email_data)
            return email_data
        except ClientError as e:
            logger.error(f"Erro ao registrar email: {e}")
            raise
    
    def update_email_status(self, pk: str, sk: str, status: str, message_id: Optional[str] = None) -> bool:
        """Atualiza status de email"""
        table = self.get_table("emails")
        
        update_expr = "SET #status = :status"
        expr_names = {"#status": "status"}
        expr_values = {":status": status}
        
        if status == "sent":
            update_expr += ", sent_at = :sent_at"
            expr_values[":sent_at"] = datetime.utcnow().isoformat()
        elif status == "delivered":
            update_expr += ", delivered_at = :delivered_at"
            expr_values[":delivered_at"] = datetime.utcnow().isoformat()
            
        if message_id:
            update_expr += ", message_id = :message_id"
            expr_values[":message_id"] = message_id
        
        try:
            table.update_item(
                Key={"PK": pk, "SK": sk},
                UpdateExpression=update_expr,
                ExpressionAttributeNames=expr_names,
                ExpressionAttributeValues=expr_values
            )
            return True
        except ClientError as e:
            logger.error(f"Erro ao atualizar status de email: {e}")
            return False


# Instancia singleton
db = DynamoDBClient()
