from decimal import Decimal
from datetime import datetime, date
from typing import TYPE_CHECKING
import enum
from sqlalchemy import String, Numeric, ForeignKey, DateTime, Date, func, Enum, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.account import Account
    from app.models.category import Category

class TransactionType(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class RecurrenceType(str, enum.Enum):
    none = "none"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"

class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    destination_account_id: Mapped[int | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Parcelamento
    installment_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    installment_current: Mapped[int | None] = mapped_column(Integer, nullable=True)
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("transactions.id"), nullable=True)
    # Recorrência
    recurrence: Mapped[RecurrenceType] = mapped_column(Enum(RecurrenceType), default=RecurrenceType.none)
    recurrence_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # Anexo
    attachment_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user: Mapped["User"] = relationship(back_populates="transactions")
    account: Mapped["Account"] = relationship(
    back_populates="transactions",
    foreign_keys=[account_id]
    )
    category: Mapped["Category | None"] = relationship(back_populates="transactions")
