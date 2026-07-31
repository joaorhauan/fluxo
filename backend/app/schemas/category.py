from datetime import datetime
from pydantic import BaseModel
from app.models.category import CategoryType

class CategoryCreate(BaseModel):
    name: str
    type: CategoryType
    color: str = "#6366f1"
    icon: str = "tag"

class CategoryRead(BaseModel):
    id: int
    name: str
    type: CategoryType
    color: str
    icon: str
    model_config = {"from_attributes": True}
