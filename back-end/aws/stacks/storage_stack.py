from aws_cdk import (
    Stack,
    aws_s3 as s3,
    RemovalPolicy,
    Duration,
    CfnOutput
)
from constructs import Construct

class StorageStack(Stack):
    """
    Stack para criar buckets S3 para armazenamento de arquivos.
    
    Cria 2 buckets:
    1. Bucket de arquivos compartilhados
    2. Bucket de logs e backups
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Bucket principal - Armazenamento de arquivos compartilhados
        self.files_bucket = s3.Bucket(
            self, "FilesBucket",
            bucket_name="petrobras-shared-files",
            encryption=s3.BucketEncryption.S3_MANAGED,  # Criptografia automática
            versioned=True,  # Mantém versões antigas dos arquivos
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Privado
            removal_policy=RemovalPolicy.RETAIN,  # Não deleta bucket se deletar stack
            
            # Regra de ciclo de vida - Arquivos antigos vão para Glacier (mais barato)
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="MoveToGlacierAfter90Days",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteExpiredFilesAfter180Days",
                    enabled=True,
                    expiration=Duration.days(180)  # Deleta após 6 meses
                )
            ],
            
            # CORS para permitir upload direto do front-end
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE
                    ],
                    allowed_origins=["*"],  # Em produção, colocar domínio específico
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

        # Bucket de logs e backups
        self.logs_bucket = s3.Bucket(
            self, "LogsBucket",
            bucket_name="petrobras-logs-backup",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            
            # Logs antigos são deletados automaticamente
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogsAfter30Days",
                    enabled=True,
                    expiration=Duration.days(30)
                )
            ]
        )

        # Configurar logs de acesso do bucket principal
        self.files_bucket.add_to_resource_policy(
            s3.BucketPolicy(
                self, "FilesBucketLogging",
                bucket=self.logs_bucket
            ).document
        )

        # Outputs
        CfnOutput(self, "FilesBucketName", value=self.files_bucket.bucket_name)
        CfnOutput(self, "FilesBucketArn", value=self.files_bucket.bucket_arn)
        CfnOutput(self, "LogsBucketName", value=self.logs_bucket.bucket_name)
