from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel, Field

class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(default=Decimal("0"), ge=0)
    deadline: date | None = None
    color: str = "#10b981"

class GoalRead(BaseModel):
    id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: date | None
    color: str
    progress_percent: float
    created_at: datetime
    model_config = {"from_attributes": True}

class GoalUpdate(BaseModel):
    name: str | None = None
    target_amount: Decimal | None = None
    current_amount: Decimal | None = None
    deadline: date | None = None
    color: str | None = None
