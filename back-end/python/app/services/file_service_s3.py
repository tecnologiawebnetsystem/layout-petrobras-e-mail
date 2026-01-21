"""
Servico de Arquivos com AWS S3
==============================
Gerencia upload, download e preview de arquivos no S3.

Corresponde ao frontend:
- DragDropZone (upload de arquivos)
- Download page (download de arquivos)
- Preview de arquivos
"""

import boto3
import uuid
import mimetypes
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.dynamodb_client import get_dynamodb_client
from app.services.audit_service_dynamodb import AuditService


class FileServiceS3:
    """Servico para gerenciar arquivos no S3"""
    
    # Extensoes bloqueadas por seguranca (mesmo do frontend)
    BLOCKED_EXTENSIONS = [
        ".exe", ".dll", ".bat", ".cmd", ".com", 
        ".msi", ".scr", ".vbs", ".ps1", ".sh"
    ]
    
    # Tamanho maximo por arquivo (500MB)
    MAX_FILE_SIZE = 500 * 1024 * 1024
    
    # Tipos MIME permitidos para preview
    PREVIEWABLE_TYPES = [
        "application/pdf",
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "text/plain", "text/csv",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ]
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self.dynamodb = get_dynamodb_client()
        self.audit_service = AuditService()
    
    def validate_file(self, filename: str, file_size: int) -> Dict[str, Any]:
        """
        Valida arquivo antes do upload
        
        Corresponde a: DragDropZone validacao de extensoes
        """
        # Verificar extensao
        extension = "." + filename.split(".")[-1].lower() if "." in filename else ""
        
        if extension in self.BLOCKED_EXTENSIONS:
            return {
                "valid": False,
                "error": f"Extensao {extension} bloqueada por motivos de seguranca"
            }
        
        # Verificar tamanho
        if file_size > self.MAX_FILE_SIZE:
            return {
                "valid": False,
                "error": f"Arquivo excede o tamanho maximo de 500MB"
            }
        
        return {"valid": True}
    
    def generate_upload_url(
        self,
        share_id: str,
        filename: str,
        content_type: str,
        file_size: int,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Gera URL pre-assinada para upload direto ao S3
        
        O frontend faz upload direto ao S3 sem passar pelo servidor.
        """
        # Validar arquivo
        validation = self.validate_file(filename, file_size)
        if not validation["valid"]:
            return {"success": False, "error": validation["error"]}
        
        # Gerar ID unico e path no S3
        file_id = str(uuid.uuid4())
        s3_key = f"shares/{share_id}/{file_id}/{filename}"
        
        try:
            # Gerar URL pre-assinada para PUT
            presigned_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key,
                    'ContentType': content_type,
                    'ContentLength': file_size
                },
                ExpiresIn=3600  # 1 hora para fazer upload
            )
            
            # Salvar metadados do arquivo no DynamoDB
            file_record = {
                "PK": f"FILE#{file_id}",
                "SK": f"SHARE#{share_id}",
                "GSI1PK": f"SHARE#{share_id}",
                "GSI1SK": f"FILE#{file_id}",
                "file_id": file_id,
                "share_id": share_id,
                "filename": filename,
                "original_filename": filename,
                "content_type": content_type,
                "size_bytes": file_size,
                "size_formatted": self._format_file_size(file_size),
                "extension": filename.split(".")[-1].upper() if "." in filename else "FILE",
                "s3_key": s3_key,
                "s3_bucket": self.bucket_name,
                "upload_status": "pending",  # pending, completed, failed
                "uploaded_by": user_id,
                "created_at": datetime.utcnow().isoformat(),
                "entity_type": "file"
            }
            
            self.dynamodb.put_item(
                TableName=settings.DYNAMODB_TABLE_FILES,
                Item=self._serialize_item(file_record)
            )
            
            return {
                "success": True,
                "file_id": file_id,
                "upload_url": presigned_url,
                "s3_key": s3_key,
                "expires_in": 3600
            }
            
        except ClientError as e:
            return {"success": False, "error": str(e)}
    
    def confirm_upload(self, file_id: str, share_id: str) -> Dict[str, Any]:
        """
        Confirma que o upload foi concluido com sucesso
        
        Chamado pelo frontend apos upload direto ao S3.
        """
        try:
            # Buscar arquivo
            response = self.dynamodb.get_item(
                TableName=settings.DYNAMODB_TABLE_FILES,
                Key={
                    "PK": {"S": f"FILE#{file_id}"},
                    "SK": {"S": f"SHARE#{share_id}"}
                }
            )
            
            if "Item" not in response:
                return {"success": False, "error": "Arquivo nao encontrado"}
            
            file_data = self._deserialize_item(response["Item"])
            
            # Verificar se arquivo existe no S3
            try:
                self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=file_data["s3_key"]
                )
            except ClientError:
                # Arquivo nao existe no S3
                self.dynamodb.update_item(
                    TableName=settings.DYNAMODB_TABLE_FILES,
                    Key={
                        "PK": {"S": f"FILE#{file_id}"},
                        "SK": {"S": f"SHARE#{share_id}"}
                    },
                    UpdateExpression="SET upload_status = :status",
                    ExpressionAttributeValues={":status": {"S": "failed"}}
                )
                return {"success": False, "error": "Arquivo nao encontrado no S3"}
            
            # Atualizar status para completed
            self.dynamodb.update_item(
                TableName=settings.DYNAMODB_TABLE_FILES,
                Key={
                    "PK": {"S": f"FILE#{file_id}"},
                    "SK": {"S": f"SHARE#{share_id}"}
                },
                UpdateExpression="SET upload_status = :status, completed_at = :completed",
                ExpressionAttributeValues={
                    ":status": {"S": "completed"},
                    ":completed": {"S": datetime.utcnow().isoformat()}
                }
            )
            
            return {"success": True, "file_id": file_id}
            
        except ClientError as e:
            return {"success": False, "error": str(e)}
    
    def generate_download_url(
        self,
        file_id: str,
        share_id: str,
        user_email: str,
        user_type: str,
        expires_in: int = 3600
    ) -> Dict[str, Any]:
        """
        Gera URL pre-assinada para download
        
        Corresponde a: Pagina /download, botao de download
        """
        try:
            # Buscar arquivo
            response = self.dynamodb.get_item(
                TableName=settings.DYNAMODB_TABLE_FILES,
                Key={
                    "PK": {"S": f"FILE#{file_id}"},
                    "SK": {"S": f"SHARE#{share_id}"}
                }
            )
            
            if "Item" not in response:
                return {"success": False, "error": "Arquivo nao encontrado"}
            
            file_data = self._deserialize_item(response["Item"])
            
            # Verificar se upload foi concluido
            if file_data.get("upload_status") != "completed":
                return {"success": False, "error": "Upload do arquivo nao foi concluido"}
            
            # Gerar URL pre-assinada para GET
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_data["s3_key"],
                    'ResponseContentDisposition': f'attachment; filename="{file_data["filename"]}"'
                },
                ExpiresIn=expires_in
            )
            
            # Registrar auditoria
            self.audit_service.log_action(
                action="file_download_url_generated",
                level="info",
                user_id=user_email,
                user_type=user_type,
                details={
                    "file_id": file_id,
                    "share_id": share_id,
                    "filename": file_data["filename"]
                }
            )
            
            return {
                "success": True,
                "download_url": presigned_url,
                "filename": file_data["filename"],
                "size": file_data["size_formatted"],
                "content_type": file_data["content_type"],
                "expires_in": expires_in
            }
            
        except ClientError as e:
            return {"success": False, "error": str(e)}
    
    def generate_preview_url(
        self,
        file_id: str,
        share_id: str,
        expires_in: int = 1800
    ) -> Dict[str, Any]:
        """
        Gera URL para preview do arquivo
        
        Corresponde a: Preview de arquivos na pagina de download
        """
        try:
            # Buscar arquivo
            response = self.dynamodb.get_item(
                TableName=settings.DYNAMODB_TABLE_FILES,
                Key={
                    "PK": {"S": f"FILE#{file_id}"},
                    "SK": {"S": f"SHARE#{share_id}"}
                }
            )
            
            if "Item" not in response:
                return {"success": False, "error": "Arquivo nao encontrado"}
            
            file_data = self._deserialize_item(response["Item"])
            
            # Verificar se tipo permite preview
            content_type = file_data.get("content_type", "")
            can_preview = content_type in self.PREVIEWABLE_TYPES
            
            if not can_preview:
                return {
                    "success": True,
                    "can_preview": False,
                    "reason": "Tipo de arquivo nao suporta preview"
                }
            
            # Gerar URL pre-assinada para preview (inline)
            presigned_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_data["s3_key"],
                    'ResponseContentDisposition': 'inline'
                },
                ExpiresIn=expires_in
            )
            
            return {
                "success": True,
                "can_preview": True,
                "preview_url": presigned_url,
                "content_type": content_type,
                "filename": file_data["filename"],
                "expires_in": expires_in
            }
            
        except ClientError as e:
            return {"success": False, "error": str(e)}
    
    def get_files_by_share(self, share_id: str) -> List[Dict[str, Any]]:
        """
        Lista todos os arquivos de um compartilhamento
        
        Corresponde a: Lista de arquivos no card de compartilhamento
        """
        try:
            response = self.dynamodb.query(
                TableName=settings.DYNAMODB_TABLE_FILES,
                IndexName="GSI1",
                KeyConditionExpression="GSI1PK = :pk",
                ExpressionAttributeValues={
                    ":pk": {"S": f"SHARE#{share_id}"}
                }
            )
            
            files = []
            for item in response.get("Items", []):
                file_data = self._deserialize_item(item)
                if file_data.get("upload_status") == "completed":
                    files.append({
                        "id": file_data["file_id"],
                        "name": file_data["filename"],
                        "size": file_data["size_formatted"],
                        "type": file_data["extension"],
                        "content_type": file_data["content_type"]
                    })
            
            return files
            
        except ClientError:
            return []
    
    def delete_share_files(self, share_id: str) -> Dict[str, Any]:
        """
        Remove todos os arquivos de um compartilhamento
        
        Usado quando share e cancelado ou expirado.
        """
        try:
            # Buscar arquivos do share
            response = self.dynamodb.query(
                TableName=settings.DYNAMODB_TABLE_FILES,
                IndexName="GSI1",
                KeyConditionExpression="GSI1PK = :pk",
                ExpressionAttributeValues={
                    ":pk": {"S": f"SHARE#{share_id}"}
                }
            )
            
            deleted_count = 0
            for item in response.get("Items", []):
                file_data = self._deserialize_item(item)
                
                # Deletar do S3
                try:
                    self.s3_client.delete_object(
                        Bucket=self.bucket_name,
                        Key=file_data["s3_key"]
                    )
                except ClientError:
                    pass  # Continua mesmo se falhar
                
                # Deletar do DynamoDB
                self.dynamodb.delete_item(
                    TableName=settings.DYNAMODB_TABLE_FILES,
                    Key={
                        "PK": {"S": f"FILE#{file_data['file_id']}"},
                        "SK": {"S": f"SHARE#{share_id}"}
                    }
                )
                deleted_count += 1
            
            return {"success": True, "deleted_count": deleted_count}
            
        except ClientError as e:
            return {"success": False, "error": str(e)}
    
    def _format_file_size(self, size_bytes: int) -> str:
        """Formata tamanho do arquivo para exibicao"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.2f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
    
    def _serialize_item(self, item: Dict) -> Dict:
        """Serializa item para formato DynamoDB"""
        result = {}
        for key, value in item.items():
            if isinstance(value, str):
                result[key] = {"S": value}
            elif isinstance(value, int):
                result[key] = {"N": str(value)}
            elif isinstance(value, bool):
                result[key] = {"BOOL": value}
            elif isinstance(value, dict):
                result[key] = {"M": self._serialize_item(value)}
            elif isinstance(value, list):
                result[key] = {"L": [self._serialize_item({"v": v})["v"] for v in value]}
            elif value is None:
                result[key] = {"NULL": True}
        return result
    
    def _deserialize_item(self, item: Dict) -> Dict:
        """Deserializa item do formato DynamoDB"""
        result = {}
        for key, value in item.items():
            if "S" in value:
                result[key] = value["S"]
            elif "N" in value:
                result[key] = int(value["N"]) if "." not in value["N"] else float(value["N"])
            elif "BOOL" in value:
                result[key] = value["BOOL"]
            elif "M" in value:
                result[key] = self._deserialize_item(value["M"])
            elif "L" in value:
                result[key] = [self._deserialize_item({"v": v})["v"] for v in value["L"]]
            elif "NULL" in value:
                result[key] = None
        return result


# Instancia singleton
file_service = FileServiceS3()
