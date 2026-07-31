from decimal import Decimal
from datetime import date as date_type, datetime
from pydantic import BaseModel, Field, field_validator
from app.models.transaction import TransactionType, RecurrenceType

class TransactionCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    type: TransactionType
    description: str = Field(min_length=1, max_length=255)
    date: date_type
    account_id: int
    destination_account_id: int | None = None
    category_id: int | None = None
    installments: int = Field(default=1, ge=1, le=360)
    recurrence: RecurrenceType = RecurrenceType.none
    recurrence_end_date: date_type | None = None
    is_paid: bool = True
    due_date: date_type | None = None
    notes: str | None = None

class TransactionRead(BaseModel):
    id: int
    amount: Decimal
    type: TransactionType
    description: str
    date: date_type
    account_id: int
    destination_account_id: int | None
    category_id: int | None
    installment_total: int | None
    installment_current: int | None
    parent_id: int | None
    recurrence: RecurrenceType
    is_paid: bool
    due_date: date_type | None
    notes: str | None
    attachment_url: str | None
    created_at: datetime
    category_name: str | None = None
    category_icon: str | None = None
    category_color: str | None = None
    model_config = {"from_attributes": True}

class TransactionUpdate(BaseModel):
    amount: Decimal | None = None
    description: str | None = None
    date: date_type | None = None
    category_id: int | None = None
    is_paid: bool | None = None
    notes: str | None = None
