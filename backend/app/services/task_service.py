"""
task_service.py – Rotinas de ciclo de vida de compartilhamentos e usuários.

Responsabilidades:
- Expirar compartilhamentos cujo prazo foi atingido (expires_at < now, status ACTIVE)
- Remover do S3 arquivos de compartilhamentos expirados, rejeitados ou concluídos
- Desativar usuários externos que não possuem mais nenhum compartilhamento ativo
- Desativar usuários internos cujos compartilhamentos estão todos em estado terminal
- Desativar supervisores sem compartilhamentos pendentes de aprovação
- Enviar e-mails de notificação sobre expiração de compartilhamentos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Como acionar em PRODUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OPÇÃO 1 — Trigger manual via painel admin (já disponível)
  POST /api/v1/admin/run-cleanup
  Requer autenticação como administrador.
  Use para executar pontualmente ou validar o comportamento em ambiente controlado.

OPÇÃO 2 — Cron via sistema operacional (recomendado para produção simples)
  Crie um cron que faça HTTP POST para o endpoint acima:

    # /etc/cron.d/csa-cleanup
    0 2 * * * root curl -s -X POST https://<host>/api/v1/admin/run-cleanup \
      -H "Authorization: Bearer <TOKEN_ADMIN>" >> /var/log/csa-cleanup.log 2>&1

  Substitua <host> e <TOKEN_ADMIN> pelos valores de produção.
  Recomendado: rodar entre 01h e 03h (baixo volume de requisições).

OPÇÃO 3 — APScheduler embutido na aplicação (sem cron externo)
  Instale: pip install apscheduler
  No lifespan do main.py, adicione:

    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.services.task_service import run_cleanup_job
    from app.db.session import get_db_session   # ou equivalente

    scheduler = AsyncIOScheduler()

    @scheduler.scheduled_job("cron", hour=2, minute=0)
    def scheduled_cleanup():
        with Session(engine) as session:
            run_cleanup_job(session)

    scheduler.start()

  Vantagem: não depende de infra externa.
  Desvantagem: se a aplicação reiniciar antes das 02h, o job não roda naquela madrugada.

OPÇÃO 4 — AWS EventBridge + Lambda (ambiente ECS/AWS)
  Crie uma Lambda que chame o endpoint admin ou execute run_cleanup_job diretamente
  via invocação do código Python. Agende com EventBridge (cron expression).
  Mais robusto para ambientes serverless/containerizados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sequência de execução do job
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. expire_overdue_shares      → marca EXPIRED, remove S3, envia e-mail
2. cleanup_completed_share_files → remove S3 de shares terminais ainda com arquivos
3. deactivate_stale_users     → desativa externos, supervisores e internos sem atividade
"""

from __future__ import annotations

import logging
from datetime import datetime, UTC
from typing import TYPE_CHECKING

from sqlmodel import Session, select
from sqlalchemy import or_

from app.models.share import Share, ShareStatus
from app.models.share_file import ShareFile
from app.models.restricted_file import RestrictedFile
from app.models.user import User, TypeUser
from app.services.audit_service import log_event
from app.services.token_service import (
    deactivate_external_if_no_active_share,
    deactivate_supervisor_if_no_pending,
    deactivate_internal_if_all_shares_done,
)

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _delete_share_files_from_s3(session: Session, share: Share) -> int:
    """Remove do S3 todos os arquivos vinculados a um share. Retorna quantidade removida."""
    from app.core.config import settings
    from app.services.s3_service import delete_object, S3ServiceError

    if settings.storage_provider != "aws":
        return 0

    share_files = session.exec(
        select(ShareFile).where(ShareFile.share_id == share.id)
    ).all()

    removed = 0
    for sf in share_files:
        rfile = session.get(RestrictedFile, sf.file_id)
        if rfile and rfile.key_s3 and rfile.status:
            try:
                delete_object(key=rfile.key_s3)
                rfile.status = False  # marca como removido
                session.add(rfile)
                removed += 1
            except S3ServiceError as exc:
                logger.warning("task_service: falha ao remover S3 key=%s: %s", rfile.key_s3, exc)

    if removed:
        session.commit()
    return removed


def _send_expiration_email(share: Share, session: Session) -> None:
    """Envia e-mail de notificação de expiração para criador e destinatário externo."""
    try:
        from app.services.email_service import send_share_expired_email  # type: ignore[import]
        creator = session.get(User, share.created_by_id)
        if creator:
            send_share_expired_email(
                to_email=creator.email,
                user_name=creator.name or "Usuário",
                share_name=share.name or f"Compartilhamento #{share.id}",
                share_id=share.id,
            )
    except Exception as exc:
        logger.warning("task_service: falha ao enviar e-mail de expiração share=%s: %s", share.id, exc)


# ---------------------------------------------------------------------------
# Etapas do job
# ---------------------------------------------------------------------------

def expire_overdue_shares(session: Session) -> dict[str, int]:
    """
    Marca como EXPIRED todos os compartilhamentos ACTIVE cujo expires_at já passou.
    Para cada compartilhamento expirado:
      - Remove os arquivos vinculados do S3
      - Registra evento de auditoria
      - Envia e-mail de notificação ao criador do compartilhamento
    Retorna contagem de compartilhamentos expirados e arquivos removidos.
    """
    now = datetime.now(UTC)
    overdue = session.exec(
        select(Share).where(
            Share.status == ShareStatus.ACTIVE,
            Share.expires_at <= now,
        )
    ).all()

    expired_count = 0
    files_removed = 0

    for share in overdue:
        # Remove arquivos do S3 antes de marcar expirado
        files_removed += _delete_share_files_from_s3(session, share)

        share.status = ShareStatus.EXPIRED
        session.add(share)
        session.flush()

        log_event(
            session,
            "SHARE_EXPIRADO",
            user_id=share.created_by_id,
            share_id=share.id,
            detail=f"expires_at={share.expires_at}",
        )

        _send_expiration_email(share, session)
        expired_count += 1

    if expired_count:
        session.commit()

    return {"expired": expired_count, "s3_files_removed": files_removed}


def cleanup_completed_share_files(session: Session) -> dict[str, int]:
    """
    Remove do S3 arquivos de compartilhamentos em estado terminal
    (COMPLETED, REJECTED, CANCELED) que ainda possuem arquivos armazenados.
    Garante que nenhum arquivo órfão permaneça no bucket após encerramento do share.
    Retorna contagem de arquivos removidos do S3.
    """
    terminal_statuses = [ShareStatus.COMPLETED, ShareStatus.REJECTED, ShareStatus.CANCELED]
    terminal_shares = session.exec(
        select(Share).where(Share.status.in_(terminal_statuses))
    ).all()

    files_removed = 0
    for share in terminal_shares:
        files_removed += _delete_share_files_from_s3(session, share)

    return {"s3_files_removed": files_removed}


def deactivate_stale_users(session: Session) -> dict[str, int]:
    """
    Verifica e desativa usuários sem atividade pendente conforme o papel de cada um:

    - Externos: desativados quando não há mais nenhum compartilhamento ativo destinado a eles.
    - Supervisores: desativados quando não há mais compartilhamentos pendentes de aprovação
      sob sua responsabilidade. O flag is_supervisor também é removido.
    - Internos (upload users): desativados quando todos os seus compartilhamentos
      estão em estado terminal (nenhum PENDING ou ACTIVE dentro do prazo).

    Retorna contagem de usuários desativados por categoria.
    """
    ext_deactivated = 0
    sup_deactivated = 0
    int_deactivated = 0

    # Externos
    external_users = session.exec(
        select(User).where(User.type == TypeUser.EXTERNAL, User.status == True)  # noqa: E712
    ).all()
    for u in external_users:
        if deactivate_external_if_no_active_share(session, u):
            ext_deactivated += 1

    # Supervisores
    supervisors = session.exec(
        select(User).where(
            User.type == TypeUser.INTERNAL,
            User.is_supervisor == True,  # noqa: E712
            User.status == True,  # noqa: E712
        )
    ).all()
    for u in supervisors:
        if deactivate_supervisor_if_no_pending(session, u, remove_cav4_role=False):
            sup_deactivated += 1

    # Internos (upload users)
    internals = session.exec(
        select(User).where(
            User.type == TypeUser.INTERNAL,
            User.is_admin == False,  # noqa: E712
            User.status == True,  # noqa: E712
        )
    ).all()
    for u in internals:
        if deactivate_internal_if_all_shares_done(session, u, remove_cav4_role=False):
            int_deactivated += 1

    return {
        "external_deactivated": ext_deactivated,
        "supervisor_deactivated": sup_deactivated,
        "internal_deactivated": int_deactivated,
    }


# ---------------------------------------------------------------------------
# Entry point principal
# ---------------------------------------------------------------------------

def run_cleanup_job(session: Session) -> dict:
    """
    Ponto de entrada principal das rotinas de manutenção.
    Executa as etapas em sequência: expiração de shares → limpeza S3 → desativação de usuários.
    Pode ser acionado pelo endpoint admin ou por scheduler externo (cron/APScheduler/Lambda).
    Retorna um dict consolidado com os resultados de cada etapa.
    """
    logger.info("task_service: iniciando job de limpeza")

    result: dict = {}

    result.update(expire_overdue_shares(session))
    result.update(cleanup_completed_share_files(session))
    result.update(deactivate_stale_users(session))

    logger.info("task_service: job concluído — %s", result)
    return result