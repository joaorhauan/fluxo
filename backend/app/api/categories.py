from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["Categorias"])

@router.get("/", response_model=list[CategoryRead])
async def list_categories(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Retorna categorias do usuário + categorias padrão do sistema (user_id = null)
    result = await db.execute(
        select(Category).where(or_(Category.user_id == current_user.id, Category.user_id == None))
    )
    return result.scalars().all()

@router.post("/", response_model=CategoryRead, status_code=201)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    category = Category(**data.model_dump(), user_id=current_user.id)
    db.add(category)
    await db.flush()
    return category
