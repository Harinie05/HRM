"""add_employee_ids_to_salary_structures

Revision ID: fc89d29dfa27
Revises: 8f08415706d4
Create Date: 2025-12-29 01:30:31.162801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fc89d29dfa27'
down_revision: Union[str, Sequence[str], None] = '8f08415706d4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add employee_ids column to salary_structures table
    op.add_column('salary_structures', sa.Column('employee_ids', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove employee_ids column from salary_structures table
    op.drop_column('salary_structures', 'employee_ids')
