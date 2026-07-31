from datetime import datetime
from typing import TYPE_CHECKING
import enum
from sqlalchemy import String, ForeignKey, DateTime, func, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.transaction import Transaction

class CategoryType(str, enum.Enum):
    income = "income"
    expense = "expense"

CATEGORY_ICONS = {
    "Alimentação": "🍔", "Transporte": "🚗", "Saúde": "💊", "Lazer": "🎮",
    "Educação": "📚", "Moradia": "🏠", "Vestuário": "👕", "Viagem": "✈️",
    "Assinaturas": "📱", "Investimentos": "📈", "Salário": "💰", "Freelance": "💻",
    "Delivery": "🛵", "Mercado": "🛒", "Academia": "💪", "Outros": "📦",
}

class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType), nullable=False)
    color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    icon: Mapped[str] = mapped_column(String(10), default="📦")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")
