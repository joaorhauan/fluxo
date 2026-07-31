from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate

router = APIRouter(prefix="/goals", tags=["Metas"])

@router.get("/", response_model=list[GoalRead])
async def list_goals(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.user_id == current_user.id))
    return result.scalars().all()

@router.post("/", response_model=GoalRead, status_code=201)
async def create_goal(data: GoalCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = Goal(**data.model_dump(), user_id=current_user.id)
    db.add(goal)
    await db.flush()
    return goal

@router.patch("/{goal_id}", response_model=GoalRead)
async def update_goal(goal_id: int, data: GoalUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(goal, field, value)
    return goal

@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == current_user.id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    await db.delete(goal)
