#!/usr/bin/env python3
"""
Script para configuracao do Amazon CloudWatch para o sistema de
transferencia segura de arquivos da Petrobras.

Uso:
    python setup_cloudwatch.py create-log-groups [--env dev|staging|prod]
    python setup_cloudwatch.py create-alarms [--env dev|staging|prod]
    python setup_cloudwatch.py create-dashboard [--env dev|staging|prod]
    python setup_cloudwatch.py list
    python setup_cloudwatch.py delete [--env dev|staging|prod]
"""

import boto3
import json
import argparse
from botocore.exceptions import ClientError


DEFAULT_REGION = "sa-east-1"
PROJECT_PREFIX = "petrobras-file-transfer"


def get_logs_client(region: str = DEFAULT_REGION):
    """Retorna cliente CloudWatch Logs."""
    return boto3.client("logs", region_name=region)


def get_cloudwatch_client(region: str = DEFAULT_REGION):
    """Retorna cliente CloudWatch."""
    return boto3.client("cloudwatch", region_name=region)


def get_sts_client():
    """Retorna cliente STS."""
    return boto3.client("sts")


def get_account_id():
    """Obtem Account ID."""
    return get_sts_client().get_caller_identity()["Account"]


def create_log_groups(env: str, region: str = DEFAULT_REGION):
    """
    Cria Log Groups para a aplicacao.
    """
    logs = get_logs_client(region)
    
    print(f"Criando Log Groups para ambiente: {env}")
    print("=" * 60)
    
    # Log groups a criar
    log_groups = [
        {
            "name": f"/petrobras-file-transfer/{env}/application",
            "retention": 30 if env == "dev" else 90,
            "description": "Logs da aplicacao"
        },
        {
            "name": f"/petrobras-file-transfer/{env}/api",
            "retention": 30 if env == "dev" else 90,
            "description": "Logs de requisicoes API"
        },
        {
            "name": f"/petrobras-file-transfer/{env}/audit",
            "retention": 365,  # Manter por 1 ano para compliance
            "description": "Logs de auditoria"
        },
        {
            "name": f"/petrobras-file-transfer/{env}/security",
            "retention": 365,
            "description": "Logs de seguranca"
        },
        {
            "name": f"/petrobras-file-transfer/{env}/errors",
            "retention": 90,
            "description": "Logs de erros"
        }
    ]
    
    for lg in log_groups:
        print(f"\nCriando: {lg['name']}")
        
        try:
            logs.create_log_group(
                logGroupName=lg["name"],
                tags={
                    "Project": "PetrobrasFileTransfer",
                    "Environment": env,
                    "Description": lg["description"]
                }
            )
            print(f"  [OK] Log group criado")
            
            # Configurar retencao
            logs.put_retention_policy(
                logGroupName=lg["name"],
                retentionInDays=lg["retention"]
            )
            print(f"  [OK] Retencao configurada: {lg['retention']} dias")
            
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceAlreadyExistsException":
                print(f"  [INFO] Log group ja existe")
                # Atualizar retencao mesmo assim
                try:
                    logs.put_retention_policy(
                        logGroupName=lg["name"],
                        retentionInDays=lg["retention"]
                    )
                except:
                    pass
            else:
                print(f"  [ERROR] Erro ao criar: {e}")


def create_metric_filters(env: str, region: str = DEFAULT_REGION):
    """
    Cria Metric Filters para extrair metricas dos logs.
    """
    logs = get_logs_client(region)
    
    print(f"\nCriando Metric Filters para ambiente: {env}")
    print("=" * 60)
    
    filters = [
        {
            "log_group": f"/petrobras-file-transfer/{env}/api",
            "name": f"{PROJECT_PREFIX}-{env}-4xx-errors",
            "pattern": "[timestamp, request_id, level=\"ERROR\", status_code=4*, ...]",
            "metric_name": "4xxErrors",
            "metric_value": "1"
        },
        {
            "log_group": f"/petrobras-file-transfer/{env}/api",
            "name": f"{PROJECT_PREFIX}-{env}-5xx-errors",
            "pattern": "[timestamp, request_id, level=\"ERROR\", status_code=5*, ...]",
            "metric_name": "5xxErrors",
            "metric_value": "1"
        },
        {
            "log_group": f"/petrobras-file-transfer/{env}/application",
            "name": f"{PROJECT_PREFIX}-{env}-file-uploads",
            "pattern": '{ $.action = "UPLOAD_*" }',
            "metric_name": "FileUploads",
            "metric_value": "1"
        },
        {
            "log_group": f"/petrobras-file-transfer/{env}/application",
            "name": f"{PROJECT_PREFIX}-{env}-file-downloads",
            "pattern": '{ $.action = "DOWNLOAD_*" }',
            "metric_name": "FileDownloads",
            "metric_value": "1"
        },
        {
            "log_group": f"/petrobras-file-transfer/{env}/security",
            "name": f"{PROJECT_PREFIX}-{env}-auth-failures",
            "pattern": '{ $.event = "AUTH_FAILURE" }',
            "metric_name": "AuthFailures",
            "metric_value": "1"
        },
        {
            "log_group": f"/petrobras-file-transfer/{env}/security",
            "name": f"{PROJECT_PREFIX}-{env}-otp-failures",
            "pattern": '{ $.event = "OTP_FAILURE" }',
            "metric_name": "OTPFailures",
            "metric_value": "1"
        }
    ]
    
    namespace = f"PetrobrasFileTransfer/{env}"
    
    for f in filters:
        print(f"\nCriando filter: {f['name']}")
        
        try:
            logs.put_metric_filter(
                logGroupName=f["log_group"],
                filterName=f["name"],
                filterPattern=f["pattern"],
                metricTransformations=[
                    {
                        "metricName": f["metric_name"],
                        "metricNamespace": namespace,
                        "metricValue": f["metric_value"],
                        "defaultValue": 0
                    }
                ]
            )
            print(f"  [OK] Metric filter criado")
            
        except ClientError as e:
            print(f"  [ERROR] Erro ao criar: {e}")


def create_alarms(env: str, sns_topic_arn: str = None, region: str = DEFAULT_REGION):
    """
    Cria CloudWatch Alarms para monitoramento.
    """
    cw = get_cloudwatch_client(region)
    
    print(f"\nCriando Alarms para ambiente: {env}")
    print("=" * 60)
    
    namespace = f"PetrobrasFileTransfer/{env}"
    
    # Configuracoes de threshold por ambiente
    thresholds = {
        "dev": {"errors": 10, "auth_failures": 20, "latency": 5000},
        "staging": {"errors": 5, "auth_failures": 10, "latency": 3000},
        "prod": {"errors": 3, "auth_failures": 5, "latency": 2000}
    }
    
    t = thresholds.get(env, thresholds["prod"])
    
    alarms = [
        {
            "name": f"{PROJECT_PREFIX}-{env}-high-5xx-errors",
            "description": f"Alta taxa de erros 5xx no ambiente {env}",
            "metric": "5xxErrors",
            "threshold": t["errors"],
            "comparison": "GreaterThanThreshold",
            "period": 300,
            "evaluation_periods": 2,
            "statistic": "Sum"
        },
        {
            "name": f"{PROJECT_PREFIX}-{env}-high-4xx-errors",
            "description": f"Alta taxa de erros 4xx no ambiente {env}",
            "metric": "4xxErrors",
            "threshold": t["errors"] * 2,
            "comparison": "GreaterThanThreshold",
            "period": 300,
            "evaluation_periods": 2,
            "statistic": "Sum"
        },
        {
            "name": f"{PROJECT_PREFIX}-{env}-auth-failures",
            "description": f"Muitas falhas de autenticacao no ambiente {env}",
            "metric": "AuthFailures",
            "threshold": t["auth_failures"],
            "comparison": "GreaterThanThreshold",
            "period": 300,
            "evaluation_periods": 1,
            "statistic": "Sum"
        },
        {
            "name": f"{PROJECT_PREFIX}-{env}-otp-brute-force",
            "description": f"Possivel tentativa de brute force OTP no ambiente {env}",
            "metric": "OTPFailures",
            "threshold": 10,
            "comparison": "GreaterThanThreshold",
            "period": 60,
            "evaluation_periods": 1,
            "statistic": "Sum"
        }
    ]
    
    for alarm in alarms:
        print(f"\nCriando alarm: {alarm['name']}")
        
        try:
            params = {
                "AlarmName": alarm["name"],
                "AlarmDescription": alarm["description"],
                "MetricName": alarm["metric"],
                "Namespace": namespace,
                "Statistic": alarm["statistic"],
                "Period": alarm["period"],
                "EvaluationPeriods": alarm["evaluation_periods"],
                "Threshold": alarm["threshold"],
                "ComparisonOperator": alarm["comparison"],
                "TreatMissingData": "notBreaching",
                "Tags": [
                    {"Key": "Project", "Value": "PetrobrasFileTransfer"},
                    {"Key": "Environment", "Value": env}
                ]
            }
            
            if sns_topic_arn:
                params["AlarmActions"] = [sns_topic_arn]
                params["OKActions"] = [sns_topic_arn]
            
            cw.put_metric_alarm(**params)
            print(f"  [OK] Alarm criado")
            
        except ClientError as e:
            print(f"  [ERROR] Erro ao criar: {e}")


def create_dashboard(env: str, region: str = DEFAULT_REGION):
    """
    Cria dashboard CloudWatch para visualizacao.
    """
    cw = get_cloudwatch_client(region)
    
    dashboard_name = f"{PROJECT_PREFIX}-{env}"
    namespace = f"PetrobrasFileTransfer/{env}"
    
    print(f"\nCriando Dashboard: {dashboard_name}")
    
    # Widgets do dashboard
    dashboard_body = {
        "widgets": [
            # Titulo
            {
                "type": "text",
                "x": 0, "y": 0, "width": 24, "height": 1,
                "properties": {
                    "markdown": f"# Petrobras File Transfer - {env.upper()}"
                }
            },
            # Erros HTTP
            {
                "type": "metric",
                "x": 0, "y": 1, "width": 12, "height": 6,
                "properties": {
                    "title": "Erros HTTP",
                    "region": region,
                    "metrics": [
                        [namespace, "4xxErrors", {"label": "4xx Errors", "color": "#ff7f0e"}],
                        [namespace, "5xxErrors", {"label": "5xx Errors", "color": "#d62728"}]
                    ],
                    "period": 300,
                    "stat": "Sum",
                    "view": "timeSeries",
                    "stacked": False
                }
            },
            # Uploads e Downloads
            {
                "type": "metric",
                "x": 12, "y": 1, "width": 12, "height": 6,
                "properties": {
                    "title": "Uploads e Downloads",
                    "region": region,
                    "metrics": [
                        [namespace, "FileUploads", {"label": "Uploads", "color": "#2ca02c"}],
                        [namespace, "FileDownloads", {"label": "Downloads", "color": "#1f77b4"}]
                    ],
                    "period": 300,
                    "stat": "Sum",
                    "view": "timeSeries",
                    "stacked": False
                }
            },
            # Seguranca
            {
                "type": "metric",
                "x": 0, "y": 7, "width": 12, "height": 6,
                "properties": {
                    "title": "Eventos de Seguranca",
                    "region": region,
                    "metrics": [
                        [namespace, "AuthFailures", {"label": "Auth Failures", "color": "#d62728"}],
                        [namespace, "OTPFailures", {"label": "OTP Failures", "color": "#ff7f0e"}]
                    ],
                    "period": 60,
                    "stat": "Sum",
                    "view": "timeSeries",
                    "stacked": False
                }
            },
            # S3 Metrics
            {
                "type": "metric",
                "x": 12, "y": 7, "width": 12, "height": 6,
                "properties": {
                    "title": "S3 Storage",
                    "region": region,
                    "metrics": [
                        ["AWS/S3", "BucketSizeBytes", "BucketName", f"{PROJECT_PREFIX}-{env}", "StorageType", "StandardStorage", {"label": "Storage Size"}]
                    ],
                    "period": 86400,
                    "stat": "Average",
                    "view": "singleValue"
                }
            },
            # Alarms Status
            {
                "type": "alarm",
                "x": 0, "y": 13, "width": 24, "height": 3,
                "properties": {
                    "title": "Status dos Alarms",
                    "alarms": [
                        f"arn:aws:cloudwatch:{region}:{get_account_id()}:alarm:{PROJECT_PREFIX}-{env}-high-5xx-errors",
                        f"arn:aws:cloudwatch:{region}:{get_account_id()}:alarm:{PROJECT_PREFIX}-{env}-auth-failures",
                        f"arn:aws:cloudwatch:{region}:{get_account_id()}:alarm:{PROJECT_PREFIX}-{env}-otp-brute-force"
                    ]
                }
            },
            # Logs Insights - Erros recentes
            {
                "type": "log",
                "x": 0, "y": 16, "width": 24, "height": 6,
                "properties": {
                    "title": "Erros Recentes",
                    "region": region,
                    "query": f"SOURCE '/petrobras-file-transfer/{env}/errors' | fields @timestamp, @message | sort @timestamp desc | limit 20",
                    "view": "table"
                }
            }
        ]
    }
    
    try:
        cw.put_dashboard(
            DashboardName=dashboard_name,
            DashboardBody=json.dumps(dashboard_body)
        )
        print(f"  [OK] Dashboard criado")
        print(f"\n  Acesse: https://{region}.console.aws.amazon.com/cloudwatch/home?region={region}#dashboards:name={dashboard_name}")
        
    except ClientError as e:
        print(f"  [ERROR] Erro ao criar dashboard: {e}")


def list_resources(region: str = DEFAULT_REGION):
    """
    Lista recursos CloudWatch do projeto.
    """
    logs = get_logs_client(region)
    cw = get_cloudwatch_client(region)
    
    print("Recursos CloudWatch do projeto:")
    print("=" * 60)
    
    # Log Groups
    print("\nLog Groups:")
    try:
        paginator = logs.get_paginator("describe_log_groups")
        for page in paginator.paginate(logGroupNamePrefix="/petrobras-file-transfer"):
            for lg in page["logGroups"]:
                print(f"  - {lg['logGroupName']}")
                print(f"    Retencao: {lg.get('retentionInDays', 'Indefinida')} dias")
    except ClientError as e:
        print(f"  [ERROR] {e}")
    
    # Alarms
    print("\nAlarms:")
    try:
        paginator = cw.get_paginator("describe_alarms")
        for page in paginator.paginate(AlarmNamePrefix=PROJECT_PREFIX):
            for alarm in page["MetricAlarms"]:
                state = alarm["StateValue"]
                print(f"  - {alarm['AlarmName']}: {state}")
    except ClientError as e:
        print(f"  [ERROR] {e}")
    
    # Dashboards
    print("\nDashboards:")
    try:
        response = cw.list_dashboards(DashboardNamePrefix=PROJECT_PREFIX)
        for dash in response.get("DashboardEntries", []):
            print(f"  - {dash['DashboardName']}")
    except ClientError as e:
        print(f"  [ERROR] {e}")


def delete_resources(env: str, region: str = DEFAULT_REGION):
    """
    Deleta recursos CloudWatch de um ambiente.
    """
    logs = get_logs_client(region)
    cw = get_cloudwatch_client(region)
    
    print(f"Deletando recursos CloudWatch do ambiente: {env}")
    print("=" * 60)
    
    # Deletar Log Groups
    print("\nDeletando Log Groups...")
    try:
        paginator = logs.get_paginator("describe_log_groups")
        for page in paginator.paginate(logGroupNamePrefix=f"/petrobras-file-transfer/{env}"):
            for lg in page["logGroups"]:
                try:
                    logs.delete_log_group(logGroupName=lg["logGroupName"])
                    print(f"  [OK] Deletado: {lg['logGroupName']}")
                except ClientError as e:
                    print(f"  [ERROR] {lg['logGroupName']}: {e}")
    except ClientError as e:
        print(f"  [ERROR] {e}")
    
    # Deletar Alarms
    print("\nDeletando Alarms...")
    try:
        paginator = cw.get_paginator("describe_alarms")
        alarm_names = []
        for page in paginator.paginate(AlarmNamePrefix=f"{PROJECT_PREFIX}-{env}"):
            for alarm in page["MetricAlarms"]:
                alarm_names.append(alarm["AlarmName"])
        
        if alarm_names:
            cw.delete_alarms(AlarmNames=alarm_names)
            for name in alarm_names:
                print(f"  [OK] Deletado: {name}")
    except ClientError as e:
        print(f"  [ERROR] {e}")
    
    # Deletar Dashboard
    print("\nDeletando Dashboard...")
    try:
        cw.delete_dashboards(DashboardNames=[f"{PROJECT_PREFIX}-{env}"])
        print(f"  [OK] Dashboard deletado")
    except ClientError as e:
        if "ResourceNotFound" not in str(e):
            print(f"  [ERROR] {e}")


def main():
    parser = argparse.ArgumentParser(
        description="Configuracao CloudWatch para Petrobras File Transfer"
    )
    
    parser.add_argument(
        "action",
        choices=[
            "create-log-groups", "create-metric-filters", "create-alarms",
            "create-dashboard", "create-all", "list", "delete"
        ],
        help="Acao a executar"
    )
    
    parser.add_argument("--env", choices=["dev", "staging", "prod"], default="dev")
    parser.add_argument("--region", default=DEFAULT_REGION)
    parser.add_argument("--sns-topic", help="ARN do topico SNS para notificacoes")
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Petrobras File Transfer - Configuracao CloudWatch")
    print("=" * 60)
    print(f"Ambiente: {args.env}")
    print(f"Regiao: {args.region}")
    print("=" * 60)
    
    if args.action == "create-log-groups":
        create_log_groups(args.env, args.region)
    
    elif args.action == "create-metric-filters":
        create_metric_filters(args.env, args.region)
    
    elif args.action == "create-alarms":
        create_alarms(args.env, args.sns_topic, args.region)
    
    elif args.action == "create-dashboard":
        create_dashboard(args.env, args.region)
    
    elif args.action == "create-all":
        create_log_groups(args.env, args.region)
        create_metric_filters(args.env, args.region)
        create_alarms(args.env, args.sns_topic, args.region)
        create_dashboard(args.env, args.region)
    
    elif args.action == "list":
        list_resources(args.region)
    
    elif args.action == "delete":
        confirm = input(f"Deletar recursos CloudWatch do ambiente {args.env}? (sim/nao): ")
        if confirm.lower() == "sim":
            delete_resources(args.env, args.region)


if __name__ == "__main__":
    main()
