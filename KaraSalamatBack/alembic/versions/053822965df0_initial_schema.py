"""initial_schema

Revision ID: 053822965df0
Revises: 
Create Date: 2026-06-14 14:17:57.245215

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '053822965df0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_reg",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("phone_num", sa.String(), nullable=True),
    )
    op.create_table(
        "verified_otp_code",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("otp_code", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("fullname", sa.String(), nullable=True),
        sa.Column("phone_number", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("otp_code", sa.Integer(), nullable=True),
        sa.Column("sub", sa.Integer(), nullable=True),
    )
    op.create_table(
        "hse_reg",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("phone_num", sa.String(), nullable=True),
        sa.Column("role", sa.String(), default="HSESupervisor"),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("admin_reg.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("hse_reg")
    op.drop_table("users")
    op.drop_table("verified_otp_code")
    op.drop_table("admin_reg")
