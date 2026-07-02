"""merge heads 8df and b3c

Revision ID: bd7ab86e7ecc
Revises: 8dfc0a7f3beb, b3c4d5e6f7a8
Create Date: 2026-06-26 15:31:09.941955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd7ab86e7ecc'
down_revision: Union[str, Sequence[str], None] = ('8dfc0a7f3beb', 'b3c4d5e6f7a8')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
