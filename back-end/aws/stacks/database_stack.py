from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class DatabaseStack(Stack):
    """
    Stack para criar todas as tabelas DynamoDB necessárias.
    
    Cria 5 tabelas:
    1. uploads - Armazena informações de uploads
    2. users - Armazena usuários do sistema
    3. audit_logs - Registra todas as ações
    4. notifications - Armazena notificações
    5. sessions - Gerencia sessões de usuários
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Tabela 1: UPLOADS
        self.uploads_table = dynamodb.Table(
            self, "UploadsTable",
            table_name="petrobras-uploads",
            partition_key=dynamodb.Attribute(
                name="upload_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # Paga só o que usar
            removal_policy=RemovalPolicy.RETAIN,  # Não deleta tabela se deletar stack
            point_in_time_recovery=True,  # Backup automático
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Criptografia
        )

        # Índice Global Secundário (GSI) - Buscar por status
        self.uploads_table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )

        # Índice para buscar por sender_email
        self.uploads_table.add_global_secondary_index(
            index_name="sender-index",
            partition_key=dynamodb.Attribute(
                name="sender_email",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )

        # Tabela 2: USERS
        self.users_table = dynamodb.Table(
            self, "UsersTable",
            table_name="petrobras-users",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # Índice para buscar por email
        self.users_table.add_global_secondary_index(
            index_name="email-index",
            partition_key=dynamodb.Attribute(
                name="email",
                type=dynamodb.AttributeType.STRING
            )
        )

        # Tabela 3: AUDIT LOGS
        self.audit_logs_table = dynamodb.Table(
            self, "AuditLogsTable",
            table_name="petrobras-audit-logs",
            partition_key=dynamodb.Attribute(
                name="log_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="ttl",  # Logs expiram automaticamente
        )

        # Índice para buscar logs por usuário
        self.audit_logs_table.add_global_secondary_index(
            index_name="user-index",
            partition_key=dynamodb.Attribute(
                name="user_email",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING
            )
        )

        # Tabela 4: NOTIFICATIONS
        self.notifications_table = dynamodb.Table(
            self, "NotificationsTable",
            table_name="petrobras-notifications",
            partition_key=dynamodb.Attribute(
                name="notification_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # Índice para buscar notificações por destinatário
        self.notifications_table.add_global_secondary_index(
            index_name="recipient-index",
            partition_key=dynamodb.Attribute(
                name="recipient_email",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )

        # Tabela 5: SESSIONS
        self.sessions_table = dynamodb.Table(
            self, "SessionsTable",
            table_name="petrobras-sessions",
            partition_key=dynamodb.Attribute(
                name="session_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            time_to_live_attribute="expires_at",  # Sessões expiram automaticamente
        )

        # Outputs - Nomes das tabelas para usar em outros stacks
        CfnOutput(self, "UploadsTableName", value=self.uploads_table.table_name)
        CfnOutput(self, "UsersTableName", value=self.users_table.table_name)
        CfnOutput(self, "AuditLogsTableName", value=self.audit_logs_table.table_name)
        CfnOutput(self, "NotificationsTableName", value=self.notifications_table.table_name)
        CfnOutput(self, "SessionsTableName", value=self.sessions_table.table_name)
