from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["Autenticação"])

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    user = User(email=data.email, name=data.name, password_hash=hash_password(data.password))
    db.add(user)
    await db.flush()
    return TokenResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    return TokenResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))
