from aws_cdk import (
    Stack,
    aws_ses as ses,
    aws_iam as iam,
    CfnOutput
)
from constructs import Construct

class EmailStack(Stack):
    """
    Stack para configurar AWS SES (Simple Email Service) para envio de e-mails.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Verificar domínio no SES (necessário para enviar e-mails)
        # NOTA: Após criar, você precisa adicionar os registros DNS manualmente
        email_identity = ses.EmailIdentity(
            self, "PetrobrasEmailIdentity",
            identity=ses.Identity.domain("petrobras.com.br")  # Substitua pelo domínio real
        )

        # Criar configuração para enviar e-mails
        configuration_set = ses.CfnConfigurationSet(
            self, "EmailConfigurationSet",
            name="petrobras-email-config"
        )

        # IAM Role para permitir que Lambda/API Gateway envie e-mails
        self.ses_send_role = iam.Role(
            self, "SESSendEmailRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role para permitir envio de e-mails via SES"
        )

        # Adicionar permissão para enviar e-mails
        self.ses_send_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ses:SendEmail",
                    "ses:SendRawEmail"
                ],
                resources=["*"]
            )
        )

        # Outputs
        CfnOutput(self, "SESRoleArn", value=self.ses_send_role.role_arn)
        CfnOutput(
            self, "EmailIdentityName", 
            value=email_identity.email_identity_name,
            description="Adicione os registros DNS na configuração do domínio"
        )
