"""Initial schema - Todas as tabelas do sistema SCAC

Revision ID: 001_initial_schema
Revises: 
Create Date: 2024-05-17

Este script cria todas as tabelas necessárias para o sistema SCAC (Sistema de
Compartilhamento de Arquivos Corporativos) da Petrobras.

Tabelas criadas:
- user: Usuários internos, externos, supervisores e admins
- credential_local: Credenciais de login para usuários externos
- shared_area: Áreas/pastas de compartilhamento no S3
- areasupervisor: Associação N:N entre áreas e supervisores
- restricted_file: Arquivos armazenados no S3
- share: Compartilhamentos de arquivos com externos
- share_file: Associação N:N entre shares e arquivos
- token_access: Tokens OTP e de acesso para externos
- audit: Logs de auditoria do sistema
- notification: Notificações in-app
- email_log: Rastreamento de emails enviados
- session_token: Tokens de sessão (refresh/reset)
- support_registration: Cadastros feitos pelo suporte
- support_audit: Auditoria de ações do suporte
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # =========================================================================
    # ENUMS
    # =========================================================================
    
    # Tipo de usuário
    user_type_enum = postgresql.ENUM(
        'externo', 'internal',
        name='usertype',
        create_type=False
    )
    
    # Status do compartilhamento
    share_status_enum = postgresql.ENUM(
        'pendente', 'aprovado', 'rejeitado', 'ativo', 
        'concluido', 'expirado', 'cancelado',
        name='sharestatus',
        create_type=False
    )
    
    # Política de consumo
    consumption_policy_enum = postgresql.ENUM(
        'apos_todos', 'apos_primeiro',
        name='consumptionpolicy',
        create_type=False
    )
    
    # Tipo de token
    token_type_enum = postgresql.ENUM(
        'otp', 'access',
        name='tokentype',
        create_type=False
    )
    
    # Nível de log
    audit_level_enum = postgresql.ENUM(
        'info', 'success', 'warning', 'error',
        name='auditlevel',
        create_type=False
    )
    
    # Tipo de notificação
    notification_type_enum = postgresql.ENUM(
        'info', 'success', 'warning', 'error', 
        'approval', 'rejection', 'download', 'expiration',
        name='notificationtype',
        create_type=False
    )
    
    # Prioridade de notificação
    notification_priority_enum = postgresql.ENUM(
        'low', 'medium', 'high', 'urgent',
        name='notificationpriority',
        create_type=False
    )
    
    # Status de email
    email_status_enum = postgresql.ENUM(
        'pending', 'queued', 'sent', 'delivered', 
        'opened', 'clicked', 'bounced', 'complained', 'failed',
        name='emailstatus',
        create_type=False
    )
    
    # Tipo de email
    email_type_enum = postgresql.ENUM(
        'otp_verification', 'share_notification', 'share_approved',
        'share_rejected', 'download_complete', 'expiration_warning',
        'password_reset', 'welcome', 'support_notification',
        name='emailtype',
        create_type=False
    )
    
    # Tipo de token de sessão
    session_token_type_enum = postgresql.ENUM(
        'refresh', 'reset',
        name='sessiontokentype',
        create_type=False
    )
    
    # Status de registro de suporte
    support_status_enum = postgresql.ENUM(
        'ativo', 'pendente', 'inativo', 'cancelado',
        name='supportstatus',
        create_type=False
    )
    
    # Ação de suporte
    support_action_enum = postgresql.ENUM(
        'CADASTRO', 'REATIVACAO', 'INATIVACAO', 'ALTERACAO', 'CONSULTA',
        name='supportaction',
        create_type=False
    )
    
    # Criar os ENUMs no PostgreSQL
    op.execute("CREATE TYPE usertype AS ENUM ('externo', 'internal')")
    op.execute("CREATE TYPE sharestatus AS ENUM ('pendente', 'aprovado', 'rejeitado', 'ativo', 'concluido', 'expirado', 'cancelado')")
    op.execute("CREATE TYPE consumptionpolicy AS ENUM ('apos_todos', 'apos_primeiro')")
    op.execute("CREATE TYPE tokentype AS ENUM ('otp', 'access')")
    op.execute("CREATE TYPE auditlevel AS ENUM ('info', 'success', 'warning', 'error')")
    op.execute("CREATE TYPE notificationtype AS ENUM ('info', 'success', 'warning', 'error', 'approval', 'rejection', 'download', 'expiration')")
    op.execute("CREATE TYPE notificationpriority AS ENUM ('low', 'medium', 'high', 'urgent')")
    op.execute("CREATE TYPE emailstatus AS ENUM ('pending', 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')")
    op.execute("CREATE TYPE emailtype AS ENUM ('otp_verification', 'share_notification', 'share_approved', 'share_rejected', 'download_complete', 'expiration_warning', 'password_reset', 'welcome', 'support_notification')")
    op.execute("CREATE TYPE sessiontokentype AS ENUM ('refresh', 'reset')")
    op.execute("CREATE TYPE supportstatus AS ENUM ('ativo', 'pendente', 'inativo', 'cancelado')")
    op.execute("CREATE TYPE supportaction AS ENUM ('CADASTRO', 'REATIVACAO', 'INATIVACAO', 'ALTERACAO', 'CONSULTA')")

    # =========================================================================
    # TABELA: user
    # Propósito: Armazena todos os usuários do sistema
    # Tipos: interno, externo, supervisor, admin
    # =========================================================================
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('type', user_type_enum, nullable=False, server_default='internal',
                  comment='Tipo: externo (parceiros) ou internal (Petrobras)'),
        sa.Column('name', sa.String(255), nullable=False,
                  comment='Nome completo do usuário'),
        sa.Column('email', sa.String(255), nullable=False,
                  comment='Email único (usado como login)'),
        sa.Column('phone', sa.String(20), nullable=True,
                  comment='Telefone de contato'),
        sa.Column('department', sa.String(255), nullable=True,
                  comment='Departamento ou área'),
        sa.Column('job_title', sa.String(255), nullable=True,
                  comment='Cargo do funcionário'),
        sa.Column('employee_id', sa.String(50), nullable=True,
                  comment='Matrícula ou ID do funcionário'),
        sa.Column('photo_url', sa.String(500), nullable=True,
                  comment='URL da foto do perfil'),
        sa.Column('manager_id', sa.Integer(), nullable=True,
                  comment='FK para o gestor/supervisor hierárquico'),
        sa.Column('is_supervisor', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se pode aprovar/rejeitar compartilhamentos'),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se é super administrador global (vê TUDO)'),
        sa.Column('status', sa.Boolean(), nullable=False, server_default='true',
                  comment='Ativo/Inativo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, 
                  server_default=sa.text('CURRENT_TIMESTAMP'),
                  comment='Data de criação'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True,
                  comment='Último login'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['manager_id'], ['user.id'], 
                                name='fk_user_manager', ondelete='SET NULL'),
        sa.UniqueConstraint('email', name='uq_user_email'),
        
        comment='Usuários do sistema: internos, externos, supervisores e admins'
    )
    
    # Índices para user
    op.create_index('ix_user_email', 'user', ['email'])
    op.create_index('ix_user_type', 'user', ['type'])
    op.create_index('ix_user_manager_id', 'user', ['manager_id'])
    op.create_index('ix_user_is_supervisor', 'user', ['is_supervisor'])
    op.create_index('ix_user_is_admin', 'user', ['is_admin'])
    op.create_index('ix_user_status', 'user', ['status'])

    # =========================================================================
    # TABELA: credential_local
    # Propósito: Credenciais de login local (hash de senha) para externos
    # Internos NÃO usam - autenticam via Entra ID
    # =========================================================================
    op.create_table(
        'credential_local',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False,
                  comment='Referência ao usuário'),
        sa.Column('password_hash', sa.String(255), nullable=False,
                  comment='Hash SHA-256 da senha'),
        sa.Column('salt', sa.String(64), nullable=False,
                  comment='Salt usado no hash'),
        sa.Column('failed_attempts', sa.Integer(), nullable=False, server_default='0',
                  comment='Tentativas de login falhas consecutivas'),
        sa.Column('blocked_until', sa.DateTime(timezone=True), nullable=True,
                  comment='Bloqueado até esta data (após 5 falhas)'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True,
                  onupdate=sa.text('CURRENT_TIMESTAMP')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_credential_user', ondelete='CASCADE'),
        sa.UniqueConstraint('user_id', name='uq_credential_user'),
        
        comment='Credenciais de login local para usuários externos'
    )
    
    op.create_index('ix_credential_user_id', 'credential_local', ['user_id'])

    # =========================================================================
    # TABELA: shared_area
    # Propósito: Áreas/pastas de compartilhamento no S3
    # =========================================================================
    op.create_table(
        'shared_area',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False,
                  comment='Nome da área'),
        sa.Column('prefix_s3', sa.String(500), nullable=False,
                  comment='Prefixo no bucket S3'),
        sa.Column('description', sa.Text(), nullable=True,
                  comment='Descrição da área'),
        sa.Column('status', sa.Boolean(), nullable=False, server_default='true',
                  comment='Ativa/Inativa'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de expiração'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('applicant_id', sa.Integer(), nullable=True,
                  comment='Usuário que criou a área'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['applicant_id'], ['user.id'],
                                name='fk_area_applicant', ondelete='SET NULL'),
        
        comment='Áreas/pastas de compartilhamento no S3'
    )
    
    op.create_index('ix_area_applicant_id', 'shared_area', ['applicant_id'])
    op.create_index('ix_area_status', 'shared_area', ['status'])

    # =========================================================================
    # TABELA: areasupervisor
    # Propósito: Associação N:N entre áreas e supervisores
    # =========================================================================
    op.create_table(
        'areasupervisor',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False,
                  comment='Referência à área'),
        sa.Column('supervisor_id', sa.Integer(), nullable=False,
                  comment='Referência ao supervisor'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['area_id'], ['shared_area.id'],
                                name='fk_areasup_area', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supervisor_id'], ['user.id'],
                                name='fk_areasup_supervisor', ondelete='CASCADE'),
        sa.UniqueConstraint('area_id', 'supervisor_id', name='uq_area_supervisor'),
        
        comment='Associação N:N entre áreas e supervisores'
    )
    
    op.create_index('ix_areasup_area_id', 'areasupervisor', ['area_id'])
    op.create_index('ix_areasup_supervisor_id', 'areasupervisor', ['supervisor_id'])

    # =========================================================================
    # TABELA: restricted_file
    # Propósito: Metadados dos arquivos enviados para o S3
    # =========================================================================
    op.create_table(
        'restricted_file',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=True,
                  comment='Área onde o arquivo está'),
        sa.Column('name', sa.String(500), nullable=False,
                  comment='Nome original do arquivo'),
        sa.Column('key_s3', sa.String(1000), nullable=False,
                  comment='Chave completa no S3'),
        sa.Column('size_bytes', sa.BigInteger(), nullable=True,
                  comment='Tamanho em bytes'),
        sa.Column('mime_type', sa.String(255), nullable=True,
                  comment='Tipo MIME do arquivo'),
        sa.Column('checksum', sa.String(128), nullable=True,
                  comment='Hash MD5/SHA do arquivo para verificação'),
        sa.Column('upload_id', sa.Integer(), nullable=True,
                  comment='Usuário que fez upload'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de expiração'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('status', sa.Boolean(), nullable=False, server_default='true',
                  comment='Ativo/Excluído'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['area_id'], ['shared_area.id'],
                                name='fk_file_area', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['upload_id'], ['user.id'],
                                name='fk_file_uploader', ondelete='SET NULL'),
        
        comment='Metadados dos arquivos armazenados no S3'
    )
    
    op.create_index('ix_file_area_id', 'restricted_file', ['area_id'])
    op.create_index('ix_file_upload_id', 'restricted_file', ['upload_id'])
    op.create_index('ix_file_status', 'restricted_file', ['status'])
    op.create_index('ix_file_key_s3', 'restricted_file', ['key_s3'])

    # =========================================================================
    # TABELA: share
    # Propósito: Compartilhamentos de arquivos com externos
    # =========================================================================
    op.create_table(
        'share',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=True,
                  comment='Título do compartilhamento'),
        sa.Column('description', sa.String(1000), nullable=True,
                  comment='Descrição'),
        sa.Column('area_id', sa.Integer(), nullable=True,
                  comment='Área relacionada'),
        sa.Column('external_email', sa.String(255), nullable=False,
                  comment='Email do destinatário externo'),
        sa.Column('status', share_status_enum, nullable=False, server_default='pendente',
                  comment='Status: pendente, aprovado, rejeitado, ativo, concluido, expirado, cancelado'),
        sa.Column('consumption_policy', consumption_policy_enum, nullable=False, 
                  server_default='apos_todos',
                  comment='Política: apos_todos (expira quando todos baixam) ou apos_primeiro'),
        sa.Column('expiration_hours', sa.Integer(), nullable=False, server_default='72',
                  comment='Horas de validade solicitadas'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data efetiva de expiração'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('created_by_id', sa.Integer(), nullable=True,
                  comment='Usuário interno que criou'),
        sa.Column('approver_id', sa.Integer(), nullable=True,
                  comment='Supervisor que aprovou/rejeitou'),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de aprovação'),
        sa.Column('rejected_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de rejeição'),
        sa.Column('rejection_reason', sa.String(500), nullable=True,
                  comment='Motivo da rejeição'),
        sa.Column('approval_comments', sa.String(500), nullable=True,
                  comment='Comentários do aprovador'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['area_id'], ['shared_area.id'],
                                name='fk_share_area', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'],
                                name='fk_share_creator', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['approver_id'], ['user.id'],
                                name='fk_share_approver', ondelete='SET NULL'),
        
        comment='Compartilhamentos de arquivos com usuários externos'
    )
    
    op.create_index('ix_share_area_id', 'share', ['area_id'])
    op.create_index('ix_share_external_email', 'share', ['external_email'])
    op.create_index('ix_share_status', 'share', ['status'])
    op.create_index('ix_share_created_by_id', 'share', ['created_by_id'])
    op.create_index('ix_share_approver_id', 'share', ['approver_id'])
    op.create_index('ix_share_expires_at', 'share', ['expires_at'])

    # =========================================================================
    # TABELA: share_file
    # Propósito: Associação N:N entre shares e arquivos
    # =========================================================================
    op.create_table(
        'share_file',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('share_id', sa.Integer(), nullable=False,
                  comment='Referência ao share'),
        sa.Column('file_id', sa.Integer(), nullable=False,
                  comment='Referência ao arquivo'),
        sa.Column('downloaded', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se já foi baixado'),
        sa.Column('downloaded_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data do download'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['share_id'], ['share.id'],
                                name='fk_sharefile_share', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['file_id'], ['restricted_file.id'],
                                name='fk_sharefile_file', ondelete='CASCADE'),
        sa.UniqueConstraint('share_id', 'file_id', name='uq_share_file'),
        
        comment='Associação N:N entre shares e arquivos'
    )
    
    op.create_index('ix_sharefile_share_id', 'share_file', ['share_id'])
    op.create_index('ix_sharefile_file_id', 'share_file', ['file_id'])
    op.create_index('ix_sharefile_downloaded', 'share_file', ['downloaded'])

    # =========================================================================
    # TABELA: token_access
    # Propósito: Tokens OTP e de acesso para externos
    # =========================================================================
    op.create_table(
        'token_access',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('type', token_type_enum, nullable=False,
                  comment='Tipo: otp (código 6 dígitos) ou access (link)'),
        sa.Column('token', sa.String(500), nullable=True,
                  comment='Token de acesso (para type=access)'),
        sa.Column('token_hash', sa.String(128), nullable=True,
                  comment='Hash do OTP (para type=otp)'),
        sa.Column('user_id', sa.Integer(), nullable=True,
                  comment='Usuário externo'),
        sa.Column('share_id', sa.Integer(), nullable=True,
                  comment='Share relacionado'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False,
                  comment='Data de expiração'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se já foi usado'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0',
                  comment='Tentativas de verificação'),
        sa.Column('blocked_until', sa.DateTime(timezone=True), nullable=True,
                  comment='Bloqueado até (após muitas tentativas)'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_token_user', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['share_id'], ['share.id'],
                                name='fk_token_share', ondelete='CASCADE'),
        
        comment='Tokens OTP e de acesso para usuários externos'
    )
    
    op.create_index('ix_token_type', 'token_access', ['type'])
    op.create_index('ix_token_token', 'token_access', ['token'])
    op.create_index('ix_token_user_id', 'token_access', ['user_id'])
    op.create_index('ix_token_share_id', 'token_access', ['share_id'])
    op.create_index('ix_token_used', 'token_access', ['used'])
    op.create_index('ix_token_expires_at', 'token_access', ['expires_at'])

    # =========================================================================
    # TABELA: audit
    # Propósito: Logs de auditoria do sistema
    # =========================================================================
    op.create_table(
        'audit',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('action', sa.String(100), nullable=False,
                  comment='Tipo de ação: UPLOAD, DOWNLOAD, APPROVE, REJECT, LOGIN, etc.'),
        sa.Column('level', audit_level_enum, nullable=False, server_default='info',
                  comment='Nível: info, success, warning, error'),
        sa.Column('user_id', sa.Integer(), nullable=True,
                  comment='Usuário que realizou a ação'),
        sa.Column('share_id', sa.Integer(), nullable=True,
                  comment='Share relacionado'),
        sa.Column('file_id', sa.Integer(), nullable=True,
                  comment='Arquivo relacionado'),
        sa.Column('ip_address', sa.String(45), nullable=True,
                  comment='Endereço IP do usuário'),
        sa.Column('user_agent', sa.String(500), nullable=True,
                  comment='Navegador/cliente'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('detail', sa.Text(), nullable=True,
                  comment='Detalhes adicionais em JSON'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_audit_user', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['share_id'], ['share.id'],
                                name='fk_audit_share', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['file_id'], ['restricted_file.id'],
                                name='fk_audit_file', ondelete='SET NULL'),
        
        comment='Logs de auditoria de todas as ações do sistema'
    )
    
    op.create_index('ix_audit_action', 'audit', ['action'])
    op.create_index('ix_audit_level', 'audit', ['level'])
    op.create_index('ix_audit_user_id', 'audit', ['user_id'])
    op.create_index('ix_audit_share_id', 'audit', ['share_id'])
    op.create_index('ix_audit_file_id', 'audit', ['file_id'])
    op.create_index('ix_audit_created_at', 'audit', ['created_at'])

    # =========================================================================
    # TABELA: notification
    # Propósito: Notificações in-app para usuários
    # =========================================================================
    op.create_table(
        'notification',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False,
                  comment='Usuário destinatário'),
        sa.Column('type', notification_type_enum, nullable=False, server_default='info',
                  comment='Tipo: info, success, warning, error, approval, rejection, download, expiration'),
        sa.Column('priority', notification_priority_enum, nullable=False, server_default='medium',
                  comment='Prioridade: low, medium, high, urgent'),
        sa.Column('title', sa.String(255), nullable=False,
                  comment='Título da notificação'),
        sa.Column('message', sa.String(1000), nullable=False,
                  comment='Mensagem'),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se foi lida'),
        sa.Column('action_label', sa.String(100), nullable=True,
                  comment='Texto do botão de ação'),
        sa.Column('action_url', sa.String(500), nullable=True,
                  comment='URL do botão de ação'),
        sa.Column('extra_metadata', sa.Text(), nullable=True,
                  comment='Dados extras em JSON'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_notification_user', ondelete='CASCADE'),
        
        comment='Notificações in-app para usuários'
    )
    
    op.create_index('ix_notification_user_id', 'notification', ['user_id'])
    op.create_index('ix_notification_type', 'notification', ['type'])
    op.create_index('ix_notification_read', 'notification', ['read'])
    op.create_index('ix_notification_created_at', 'notification', ['created_at'])

    # =========================================================================
    # TABELA: email_log
    # Propósito: Rastreamento de emails enviados pelo sistema
    # =========================================================================
    op.create_table(
        'email_log',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('message_id', sa.String(255), nullable=False,
                  comment='ID único do email (SES)'),
        sa.Column('email_type', email_type_enum, nullable=False,
                  comment='Tipo de email enviado'),
        sa.Column('from_email', sa.String(255), nullable=False,
                  comment='Remetente'),
        sa.Column('to_email', sa.String(255), nullable=False,
                  comment='Destinatário'),
        sa.Column('subject', sa.String(500), nullable=False,
                  comment='Assunto'),
        sa.Column('body_preview', sa.String(500), nullable=True,
                  comment='Preview do corpo'),
        sa.Column('status', email_status_enum, nullable=False, server_default='pending',
                  comment='Status: pending, queued, sent, delivered, opened, clicked, bounced, complained, failed'),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de envio'),
        sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de entrega'),
        sa.Column('opened_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de abertura'),
        sa.Column('clicked_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de clique'),
        sa.Column('bounced_at', sa.DateTime(timezone=True), nullable=True,
                  comment='Data de bounce'),
        sa.Column('error_message', sa.String(1000), nullable=True,
                  comment='Mensagem de erro'),
        sa.Column('error_code', sa.String(50), nullable=True,
                  comment='Código de erro'),
        sa.Column('user_id', sa.Integer(), nullable=True,
                  comment='Usuário relacionado'),
        sa.Column('share_id', sa.Integer(), nullable=True,
                  comment='Share relacionado'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True,
                  onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('extra_metadata', sa.Text(), nullable=True,
                  comment='Metadados adicionais em JSON'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_emaillog_user', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['share_id'], ['share.id'],
                                name='fk_emaillog_share', ondelete='SET NULL'),
        sa.UniqueConstraint('message_id', name='uq_email_message_id'),
        
        comment='Rastreamento de emails enviados pelo sistema'
    )
    
    op.create_index('ix_emaillog_message_id', 'email_log', ['message_id'])
    op.create_index('ix_emaillog_email_type', 'email_log', ['email_type'])
    op.create_index('ix_emaillog_to_email', 'email_log', ['to_email'])
    op.create_index('ix_emaillog_status', 'email_log', ['status'])
    op.create_index('ix_emaillog_user_id', 'email_log', ['user_id'])
    op.create_index('ix_emaillog_share_id', 'email_log', ['share_id'])
    op.create_index('ix_emaillog_created_at', 'email_log', ['created_at'])

    # =========================================================================
    # TABELA: session_token
    # Propósito: Tokens de sessão (refresh e reset de senha)
    # =========================================================================
    op.create_table(
        'session_token',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True,
                  comment='Usuário dono do token'),
        sa.Column('token_hash', sa.String(255), nullable=False,
                  comment='Hash do token'),
        sa.Column('token_type', session_token_type_enum, nullable=False,
                  comment='Tipo: refresh ou reset'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False,
                  comment='Data de expiração'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('used', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se foi usado'),
        sa.Column('revoked', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se foi revogado'),
        sa.Column('ip_address', sa.String(45), nullable=True,
                  comment='IP de criação'),
        sa.Column('user_agent', sa.String(500), nullable=True,
                  comment='Navegador de criação'),
        sa.Column('email', sa.String(255), nullable=True,
                  comment='Email (para reset de senha)'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'],
                                name='fk_session_user', ondelete='CASCADE'),
        
        comment='Tokens de sessão: refresh e reset de senha'
    )
    
    op.create_index('ix_session_user_id', 'session_token', ['user_id'])
    op.create_index('ix_session_token_hash', 'session_token', ['token_hash'])
    op.create_index('ix_session_token_type', 'session_token', ['token_type'])
    op.create_index('ix_session_expires_at', 'session_token', ['expires_at'])

    # =========================================================================
    # TABELA: support_registration
    # Propósito: Registra cadastros de externos feitos pelo suporte
    # =========================================================================
    op.create_table(
        'support_registration',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('request_number', sa.String(50), nullable=False,
                  comment='Número do chamado ServiceNow'),
        sa.Column('requester_email', sa.String(255), nullable=False,
                  comment='Email do solicitante interno'),
        sa.Column('external_user_email', sa.String(255), nullable=False,
                  comment='Email do externo cadastrado'),
        sa.Column('external_user_id', sa.Integer(), nullable=True,
                  comment='ID do usuário externo criado'),
        sa.Column('registered_by_id', sa.Integer(), nullable=True,
                  comment='Atendente que cadastrou'),
        sa.Column('registered_by_name', sa.String(255), nullable=False,
                  comment='Nome do atendente'),
        sa.Column('status', support_status_enum, nullable=False, server_default='ativo',
                  comment='Status: ativo, pendente, inativo, cancelado'),
        sa.Column('notes', sa.Text(), nullable=True,
                  comment='Observações'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True,
                  onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('is_reactivation', sa.Boolean(), nullable=False, server_default='false',
                  comment='Se foi reativação'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['external_user_id'], ['user.id'],
                                name='fk_support_external', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['registered_by_id'], ['user.id'],
                                name='fk_support_registrar', ondelete='SET NULL'),
        
        comment='Registros de cadastros feitos pelo time de suporte'
    )
    
    op.create_index('ix_support_reg_request_number', 'support_registration', ['request_number'])
    op.create_index('ix_support_reg_requester_email', 'support_registration', ['requester_email'])
    op.create_index('ix_support_reg_external_email', 'support_registration', ['external_user_email'])
    op.create_index('ix_support_reg_status', 'support_registration', ['status'])
    op.create_index('ix_support_reg_created_at', 'support_registration', ['created_at'])

    # =========================================================================
    # TABELA: support_audit
    # Propósito: Auditoria de ações do time de suporte
    # =========================================================================
    op.create_table(
        'support_audit',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('action', support_action_enum, nullable=False,
                  comment='Ação: CADASTRO, REATIVACAO, INATIVACAO, ALTERACAO, CONSULTA'),
        sa.Column('description', sa.String(500), nullable=False,
                  comment='Descrição da ação'),
        sa.Column('details', sa.Text(), nullable=True,
                  comment='Detalhes em JSON'),
        sa.Column('support_user_id', sa.Integer(), nullable=True,
                  comment='Atendente que realizou'),
        sa.Column('registration_id', sa.Integer(), nullable=True,
                  comment='Registro de suporte relacionado'),
        sa.Column('affected_user_id', sa.Integer(), nullable=True,
                  comment='Usuário afetado'),
        sa.Column('ip_address', sa.String(45), nullable=True,
                  comment='IP do atendente'),
        sa.Column('user_agent', sa.String(500), nullable=True,
                  comment='Navegador'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['support_user_id'], ['user.id'],
                                name='fk_supaudit_support', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['registration_id'], ['support_registration.id'],
                                name='fk_supaudit_registration', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['affected_user_id'], ['user.id'],
                                name='fk_supaudit_affected', ondelete='SET NULL'),
        
        comment='Auditoria de ações do time de suporte'
    )
    
    op.create_index('ix_supaudit_action', 'support_audit', ['action'])
    op.create_index('ix_supaudit_support_user_id', 'support_audit', ['support_user_id'])
    op.create_index('ix_supaudit_registration_id', 'support_audit', ['registration_id'])
    op.create_index('ix_supaudit_affected_user_id', 'support_audit', ['affected_user_id'])
    op.create_index('ix_supaudit_created_at', 'support_audit', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order (respecting FKs)
    op.drop_table('support_audit')
    op.drop_table('support_registration')
    op.drop_table('session_token')
    op.drop_table('email_log')
    op.drop_table('notification')
    op.drop_table('audit')
    op.drop_table('token_access')
    op.drop_table('share_file')
    op.drop_table('share')
    op.drop_table('restricted_file')
    op.drop_table('areasupervisor')
    op.drop_table('shared_area')
    op.drop_table('credential_local')
    op.drop_table('user')
    
    # Drop ENUMs
    op.execute("DROP TYPE IF EXISTS supportaction")
    op.execute("DROP TYPE IF EXISTS supportstatus")
    op.execute("DROP TYPE IF EXISTS sessiontokentype")
    op.execute("DROP TYPE IF EXISTS emailtype")
    op.execute("DROP TYPE IF EXISTS emailstatus")
    op.execute("DROP TYPE IF EXISTS notificationpriority")
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS auditlevel")
    op.execute("DROP TYPE IF EXISTS tokentype")
    op.execute("DROP TYPE IF EXISTS consumptionpolicy")
    op.execute("DROP TYPE IF EXISTS sharestatus")
    op.execute("DROP TYPE IF EXISTS usertype")
