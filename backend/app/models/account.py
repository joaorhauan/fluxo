from decimal import Decimal
from datetime import datetime, date
from typing import TYPE_CHECKING
import enum
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Date, func, Enum, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.transaction import Transaction

class AccountType(str, enum.Enum):
    checking = "checking"
    savings = "savings"
    credit = "credit"
    cash = "cash"
    investment = "investment"

class InvoiceStatus(str, enum.Enum):
    open = "open"
    closed = "closed"
    overdue = "overdue"

class Account(Base):
    __tablename__ = "accounts"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[AccountType] = mapped_column(Enum(AccountType), nullable=False)
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    icon: Mapped[str] = mapped_column(String(50), default="wallet")
    # Campos exclusivos de cartão de crédito
    credit_limit: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    closing_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    due_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    invoice_status: Mapped[InvoiceStatus | None] = mapped_column(Enum(InvoiceStatus), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(
    back_populates="account",
    foreign_keys="[Transaction.account_id]"
)
