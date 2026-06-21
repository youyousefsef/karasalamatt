"""add_indexes_and_unique_constraints

Revision ID: 618e54f61c7f
Revises: 053822965df0
Create Date: 2026-06-14 14:28:07.047799

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '618e54f61c7f'
down_revision: Union[str, Sequence[str], None] = '053822965df0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f("ix_admin_reg_phone_num"), "admin_reg", ["phone_num"])
    op.create_index(op.f("ix_hse_reg_phone_num"), "hse_reg", ["phone_num"])
    op.create_index(op.f("ix_hse_reg_owner_id"), "hse_reg", ["owner_id"])
    op.create_unique_constraint("uq_users_phone_number", "users", ["phone_number"])
    op.create_index(op.f("ix_users_phone_number"), "users", ["phone_number"])
    op.create_index(op.f("ix_verified_otp_code_phone_number"), "verified_otp_code", ["phone_number"])


def downgrade() -> None:
    op.drop_index(op.f("ix_verified_otp_code_phone_number"), table_name="verified_otp_code")
    op.drop_index(op.f("ix_users_phone_number"), table_name="users")
    op.drop_constraint("uq_users_phone_number", "users", type_="unique")
    op.drop_index(op.f("ix_hse_reg_owner_id"), table_name="hse_reg")
    op.drop_index(op.f("ix_hse_reg_phone_num"), table_name="hse_reg")
    op.drop_index(op.f("ix_admin_reg_phone_num"), table_name="admin_reg")
