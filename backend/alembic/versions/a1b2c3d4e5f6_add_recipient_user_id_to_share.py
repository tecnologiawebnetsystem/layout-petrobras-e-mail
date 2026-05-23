"""add recipient_user_id to share

Revision ID: a1b2c3d4e5f6
Revises: e9662255fe47
Create Date: 2026-05-17 10:00:00.000000

Provisiona o destinatário externo como User no momento da criação do share,
em vez de criá-lo de forma lazy no fluxo de OTP.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "e9662255fe47"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("share", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("recipient_user_id", sa.Integer(), nullable=True)
        )
        batch_op.create_index(
            batch_op.f("ix_share_recipient_user_id"),
            ["recipient_user_id"],
            unique=False,
        )
        batch_op.create_foreign_key(
            "fk_share_recipient_user_id",
            "user",
            ["recipient_user_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("share", schema=None) as batch_op:
        batch_op.drop_constraint("fk_share_recipient_user_id", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_share_recipient_user_id"))
        batch_op.drop_column("recipient_user_id")
