"""credit card installments recurrence
Revision ID: 138d57462ef5
Revises: 40efc977fda0
Create Date: 2026-07-31 01:57:59.763679
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '138d57462ef5'
down_revision: Union[str, None] = '40efc977fda0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    invoicestatus = sa.Enum('open', 'closed', 'overdue', name='invoicestatus')
    invoicestatus.create(op.get_bind(), checkfirst=True)

    recurrencetype = sa.Enum('none', 'weekly', 'monthly', 'yearly', name='recurrencetype')
    recurrencetype.create(op.get_bind(), checkfirst=True)

    op.add_column('accounts', sa.Column('credit_limit', sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column('accounts', sa.Column('closing_day', sa.Integer(), nullable=True))
    op.add_column('accounts', sa.Column('due_day', sa.Integer(), nullable=True))
    op.add_column('accounts', sa.Column('invoice_status', sa.Enum('open', 'closed', 'overdue', name='invoicestatus'), nullable=True))
    op.alter_column('categories', 'icon', existing_type=sa.VARCHAR(length=50), type_=sa.String(length=10), existing_nullable=False)
    op.add_column('transactions', sa.Column('destination_account_id', sa.Integer(), nullable=True))
    op.add_column('transactions', sa.Column('is_paid', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('transactions', sa.Column('due_date', sa.Date(), nullable=True))
    op.add_column('transactions', sa.Column('recurrence', sa.Enum('none', 'weekly', 'monthly', 'yearly', name='recurrencetype'), nullable=False, server_default='none'))
    op.add_column('transactions', sa.Column('recurrence_end_date', sa.Date(), nullable=True))
    op.add_column('transactions', sa.Column('attachment_url', sa.String(length=500), nullable=True))
    op.add_column('transactions', sa.Column('notes', sa.Text(), nullable=True))
    op.create_foreign_key(None, 'transactions', 'accounts', ['destination_account_id'], ['id'], ondelete='SET NULL')

def downgrade() -> None:
    op.drop_constraint(None, 'transactions', type_='foreignkey')
    op.drop_column('transactions', 'notes')
    op.drop_column('transactions', 'attachment_url')
    op.drop_column('transactions', 'recurrence_end_date')
    op.drop_column('transactions', 'recurrence')
    op.drop_column('transactions', 'due_date')
    op.drop_column('transactions', 'is_paid')
    op.drop_column('transactions', 'destination_account_id')
    op.alter_column('categories', 'icon', existing_type=sa.String(length=10), type_=sa.VARCHAR(length=50), existing_nullable=False)
    op.drop_column('accounts', 'invoice_status')
    op.drop_column('accounts', 'due_day')
    op.drop_column('accounts', 'closing_day')
    op.drop_column('accounts', 'credit_limit')
    sa.Enum(name='invoicestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='recurrencetype').drop(op.get_bind(), checkfirst=True)
