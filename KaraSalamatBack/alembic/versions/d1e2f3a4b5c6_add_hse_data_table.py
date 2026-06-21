"""add_hse_data_table

Revision ID: d1e2f3a4b5c6
Revises: 618e54f61c7f
Create Date: 2026-06-20 13:57:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1e2f3a4b5c6'
down_revision: Union[str, Sequence[str], None] = '618e54f61c7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "hse_data",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("supervisor_id", sa.Integer(), sa.ForeignKey("hse_reg.id"), nullable=True, index=True),
        sa.Column("metric", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("hse_data")
