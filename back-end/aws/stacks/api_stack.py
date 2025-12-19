from aws_cdk import (
    Stack,
    aws_apigateway as apigw,
    CfnOutput
)
from constructs import Construct

class ApiStack(Stack):
    """
    Stack para criar API Gateway REST conectado às funções Lambda.
    """

    def __init__(self, scope: Construct, construct_id: str, lambda_stack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Criar API Gateway REST
        api = apigw.RestApi(
            self, "PetrobrasAPI",
            rest_api_name="petrobras-file-sharing-api",
            description="API para sistema de compartilhamento de arquivos Petrobras",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200
            ),
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,  # Em produção, especificar domínio
                allow_methods=apigw.Cors.ALL_METHODS,
                allow_headers=["*"]
            )
        )

        # Endpoint: POST /auth/login
        auth_resource = api.root.add_resource("auth")
        login_resource = auth_resource.add_resource("login")
        login_resource.add_method(
            "POST",
            apigw.LambdaIntegration(lambda_stack.auth_function)
        )

        # Endpoint: POST /uploads
        uploads_resource = api.root.add_resource("uploads")
        uploads_resource.add_method(
            "POST",
            apigw.LambdaIntegration(lambda_stack.upload_processor)
        )

        # Endpoint: GET /uploads
        uploads_resource.add_method(
            "GET",
            apigw.LambdaIntegration(lambda_stack.upload_processor)
        )

        # Outputs
        CfnOutput(self, "APIEndpoint", value=api.url)
        CfnOutput(
            self, "APILoginEndpoint", 
            value=f"{api.url}auth/login",
            description="Endpoint para autenticação"
        )
        CfnOutput(
            self, "APIUploadsEndpoint",
            value=f"{api.url}uploads",
            description="Endpoint para uploads"
        )
