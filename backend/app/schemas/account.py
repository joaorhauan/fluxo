from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel
from app.models.account import AccountType, InvoiceStatus

class AccountCreate(BaseModel):
    name: str
    type: AccountType
    balance: Decimal = Decimal("0")
    color: str = "#6366f1"
    icon: str = "wallet"
    credit_limit: Decimal | None = None
    closing_day: int | None = None
    due_day: int | None = None

class AccountRead(BaseModel):
    id: int
    name: str
    type: AccountType
    balance: Decimal
    color: str
    icon: str
    credit_limit: Decimal | None
    closing_day: int | None
    due_day: int | None
    invoice_status: InvoiceStatus | None
    created_at: datetime
    model_config = {"from_attributes": True}

class AccountUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    icon: str | None = None
    credit_limit: Decimal | None = None
    closing_day: int | None = None
    due_day: int | None = None
