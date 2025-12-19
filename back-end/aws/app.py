#!/usr/bin/env python3
import aws_cdk as cdk
from stacks.database_stack import DatabaseStack
from stacks.lambda_stack import LambdaStack
from stacks.api_stack import ApiStack
from stacks.storage_stack import StorageStack
from stacks.email_stack import EmailStack

app = cdk.App()

# Configurações do ambiente
env = cdk.Environment(
    account="YOUR_AWS_ACCOUNT_ID",  # Substitua pelo ID da sua conta AWS
    region="us-east-1"  # Região AWS (Norte da Virgínia)
)

# 1. Stack de Banco de Dados (DynamoDB)
database_stack = DatabaseStack(
    app, 
    "PetrobrasDatabaseStack",
    env=env,
    description="Tabelas DynamoDB para sistema de compartilhamento de arquivos"
)

# 2. Stack de Armazenamento (S3)
storage_stack = StorageStack(
    app,
    "PetrobrasStorageStack",
    env=env,
    description="Buckets S3 para armazenamento de arquivos"
)

# 3. Stack de E-mail (SES)
email_stack = EmailStack(
    app,
    "PetrobrasEmailStack",
    env=env,
    description="Configuração AWS SES para envio de e-mails"
)

# 4. Stack de Lambda Functions
lambda_stack = LambdaStack(
    app,
    "PetrobrasLambdaStack",
    database_stack=database_stack,
    storage_stack=storage_stack,
    env=env,
    description="Funções Lambda para processamento"
)

# 5. Stack de API Gateway
api_stack = ApiStack(
    app,
    "PetrobrasApiStack",
    lambda_stack=lambda_stack,
    env=env,
    description="API Gateway REST para back-end Python"
)

app.synth()
