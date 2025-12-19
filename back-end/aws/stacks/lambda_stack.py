from aws_cdk import (
    Stack,
    aws_lambda as lambda_,
    aws_iam as iam,
    Duration,
    CfnOutput
)
from constructs import Construct

class LambdaStack(Stack):
    """
    Stack para criar funções Lambda.
    """

    def __init__(self, scope: Construct, construct_id: str, database_stack, storage_stack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Lambda Layer com dependências Python (boto3, fastapi, etc)
        dependencies_layer = lambda_.LayerVersion(
            self, "DependenciesLayer",
            code=lambda_.Code.from_asset("../python/lambda_layer"),  # Criar essa pasta depois
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
            description="Dependências Python comuns (boto3, fastapi)"
        )

        # Lambda Function - Processamento de Uploads
        self.upload_processor = lambda_.Function(
            self, "UploadProcessor",
            function_name="petrobras-upload-processor",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("../python/lambdas/upload_processor"),
            timeout=Duration.seconds(30),
            memory_size=512,
            layers=[dependencies_layer],
            environment={
                "UPLOADS_TABLE": database_stack.uploads_table.table_name,
                "FILES_BUCKET": storage_stack.files_bucket.bucket_name
            }
        )

        # Dar permissão para Lambda acessar DynamoDB
        database_stack.uploads_table.grant_read_write_data(self.upload_processor)
        
        # Dar permissão para Lambda acessar S3
        storage_stack.files_bucket.grant_read_write(self.upload_processor)

        # Lambda Function - Autenticação ServiceNow
        self.auth_function = lambda_.Function(
            self, "AuthFunction",
            function_name="petrobras-auth-servicenow",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_asset("../python/lambdas/auth"),
            timeout=Duration.seconds(10),
            memory_size=256,
            layers=[dependencies_layer],
            environment={
                "USERS_TABLE": database_stack.users_table.table_name,
                "SESSIONS_TABLE": database_stack.sessions_table.table_name
            }
        )

        database_stack.users_table.grant_read_write_data(self.auth_function)
        database_stack.sessions_table.grant_read_write_data(self.auth_function)

        # Outputs
        CfnOutput(self, "UploadProcessorArn", value=self.upload_processor.function_arn)
        CfnOutput(self, "AuthFunctionArn", value=self.auth_function.function_arn)
