"""
Configuracao AWS
================
Todas as configuracoes e clientes AWS centralizados.

Servicos utilizados:
- DynamoDB: Banco de dados NoSQL
- S3: Armazenamento de arquivos
- SES: Envio de emails
- Cognito: (Opcional) Autenticacao
- CloudWatch: Logs e metricas
- KMS: Criptografia de dados sensiveis
"""

import boto3
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class AWSSettings(BaseSettings):
    """Configuracoes AWS carregadas de variaveis de ambiente"""
    
    # Credenciais AWS
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    
    # DynamoDB
    DYNAMODB_ENDPOINT_URL: Optional[str] = None  # Para DynamoDB Local
    DYNAMODB_TABLE_PREFIX: str = "petrobras_transfer_"
    
    # Nomes das tabelas (com prefixo)
    @property
    def DYNAMODB_TABLE_USERS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}users"
    
    @property
    def DYNAMODB_TABLE_SHARES(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}shares"
    
    @property
    def DYNAMODB_TABLE_FILES(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}files"
    
    @property
    def DYNAMODB_TABLE_OTP(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}otp_codes"
    
    @property
    def DYNAMODB_TABLE_SESSIONS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}sessions"
    
    @property
    def DYNAMODB_TABLE_AUDIT(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}audit_logs"
    
    @property
    def DYNAMODB_TABLE_NOTIFICATIONS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}notifications"
    
    @property
    def DYNAMODB_TABLE_EMAILS(self) -> str:
        return f"{self.DYNAMODB_TABLE_PREFIX}email_logs"
    
    # S3
    S3_BUCKET_NAME: str = "petrobras-file-transfer"
    S3_BUCKET_REGION: str = "us-east-1"
    S3_PRESIGNED_URL_EXPIRATION: int = 3600  # 1 hora
    
    # SES (Simple Email Service)
    SES_SENDER_EMAIL: str = "noreply@petrobras.com.br"
    SES_SENDER_NAME: str = "Petrobras File Transfer"
    SES_CONFIGURATION_SET: Optional[str] = None
    
    # KMS (Key Management Service)
    KMS_KEY_ID: Optional[str] = None  # Para criptografia de dados sensiveis
    
    # CloudWatch
    CLOUDWATCH_LOG_GROUP: str = "/petrobras/file-transfer"
    CLOUDWATCH_METRICS_NAMESPACE: str = "Petrobras/FileTransfer"
    
    # Ambiente
    ENVIRONMENT: str = "development"  # development, staging, production
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache()
def get_aws_settings() -> AWSSettings:
    """Retorna configuracoes AWS (cached)"""
    return AWSSettings()


class AWSClients:
    """Gerenciador de clientes AWS"""
    
    _dynamodb_client = None
    _dynamodb_resource = None
    _s3_client = None
    _ses_client = None
    _kms_client = None
    _cloudwatch_client = None
    _cloudwatch_logs_client = None
    
    @classmethod
    def _get_session(cls):
        """Cria sessao AWS com credenciais"""
        settings = get_aws_settings()
        
        session_kwargs = {
            "region_name": settings.AWS_REGION
        }
        
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
            session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        
        return boto3.Session(**session_kwargs)
    
    @classmethod
    def get_dynamodb_client(cls):
        """Cliente DynamoDB low-level"""
        if cls._dynamodb_client is None:
            settings = get_aws_settings()
            session = cls._get_session()
            
            client_kwargs = {}
            if settings.DYNAMODB_ENDPOINT_URL:
                client_kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT_URL
            
            cls._dynamodb_client = session.client("dynamodb", **client_kwargs)
        
        return cls._dynamodb_client
    
    @classmethod
    def get_dynamodb_resource(cls):
        """Resource DynamoDB high-level"""
        if cls._dynamodb_resource is None:
            settings = get_aws_settings()
            session = cls._get_session()
            
            resource_kwargs = {}
            if settings.DYNAMODB_ENDPOINT_URL:
                resource_kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT_URL
            
            cls._dynamodb_resource = session.resource("dynamodb", **resource_kwargs)
        
        return cls._dynamodb_resource
    
    @classmethod
    def get_s3_client(cls):
        """Cliente S3"""
        if cls._s3_client is None:
            session = cls._get_session()
            cls._s3_client = session.client("s3")
        
        return cls._s3_client
    
    @classmethod
    def get_ses_client(cls):
        """Cliente SES para envio de emails"""
        if cls._ses_client is None:
            session = cls._get_session()
            cls._ses_client = session.client("ses")
        
        return cls._ses_client
    
    @classmethod
    def get_kms_client(cls):
        """Cliente KMS para criptografia"""
        if cls._kms_client is None:
            session = cls._get_session()
            cls._kms_client = session.client("kms")
        
        return cls._kms_client
    
    @classmethod
    def get_cloudwatch_client(cls):
        """Cliente CloudWatch para metricas"""
        if cls._cloudwatch_client is None:
            session = cls._get_session()
            cls._cloudwatch_client = session.client("cloudwatch")
        
        return cls._cloudwatch_client
    
    @classmethod
    def get_cloudwatch_logs_client(cls):
        """Cliente CloudWatch Logs"""
        if cls._cloudwatch_logs_client is None:
            session = cls._get_session()
            cls._cloudwatch_logs_client = session.client("logs")
        
        return cls._cloudwatch_logs_client


# Funcoes de conveniencia
def get_dynamodb_client():
    return AWSClients.get_dynamodb_client()

def get_dynamodb_resource():
    return AWSClients.get_dynamodb_resource()

def get_s3_client():
    return AWSClients.get_s3_client()

def get_ses_client():
    return AWSClients.get_ses_client()

def get_kms_client():
    return AWSClients.get_kms_client()

def get_cloudwatch_client():
    return AWSClients.get_cloudwatch_client()

def get_cloudwatch_logs_client():
    return AWSClients.get_cloudwatch_logs_client()


# ============================================
# CONFIGURACAO DE TABELAS DYNAMODB
# ============================================

DYNAMODB_TABLES_CONFIG = {
    "users": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_USERS,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    "shares": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_SHARES,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"},
            {"AttributeName": "GSI2PK", "AttributeType": "S"},
            {"AttributeName": "GSI2SK", "AttributeType": "S"},
            {"AttributeName": "GSI3PK", "AttributeType": "S"},
            {"AttributeName": "GSI3SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "GSI2",
                "KeySchema": [
                    {"AttributeName": "GSI2PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "GSI3",
                "KeySchema": [
                    {"AttributeName": "GSI3PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI3SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    "files": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_FILES,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    "otp_codes": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_OTP,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"}
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "TimeToLiveSpecification": {
            "AttributeName": "ttl",
            "Enabled": True
        }
    },
    "sessions": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_SESSIONS,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "TimeToLiveSpecification": {
            "AttributeName": "ttl",
            "Enabled": True
        }
    },
    "audit_logs": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_AUDIT,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"},
            {"AttributeName": "GSI2PK", "AttributeType": "S"},
            {"AttributeName": "GSI2SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "GSI2",
                "KeySchema": [
                    {"AttributeName": "GSI2PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI2SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    "notifications": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_NOTIFICATIONS,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "GSI1PK", "AttributeType": "S"},
            {"AttributeName": "GSI1SK", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "GSI1PK", "KeyType": "HASH"},
                    {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
                ],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    "email_logs": {
        "TableName": get_aws_settings().DYNAMODB_TABLE_EMAILS,
        "KeySchema": [
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"}
        ],
        "AttributeDefinitions": [
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"}
        ],
        "BillingMode": "PAY_PER_REQUEST"
    }
}


# ============================================
# CONFIGURACAO DO BUCKET S3
# ============================================

S3_BUCKET_CONFIG = {
    "BucketName": get_aws_settings().S3_BUCKET_NAME,
    "CORSConfiguration": {
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                "AllowedOrigins": [
                    "http://localhost:3000",
                    "https://*.vercel.app",
                    "https://transfer.petrobras.com.br"
                ],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3600
            }
        ]
    },
    "LifecycleConfiguration": {
        "Rules": [
            {
                "ID": "DeleteExpiredShares",
                "Status": "Enabled",
                "Filter": {"Prefix": "shares/"},
                "Expiration": {"Days": 30}  # Deleta arquivos apos 30 dias
            },
            {
                "ID": "DeleteIncompleteUploads",
                "Status": "Enabled",
                "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
            }
        ]
    },
    "ServerSideEncryptionConfiguration": {
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "aws:kms"
                },
                "BucketKeyEnabled": True
            }
        ]
    },
    "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": True,
        "IgnorePublicAcls": True,
        "BlockPublicPolicy": True,
        "RestrictPublicBuckets": True
    }
}
