import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# SSL para Neon/produção
connect_args = {}
if "neon.tech" in settings.DATABASE_URL or "sslmode=require" in settings.DATABASE_URL:
    ssl_ctx = ssl.create_default_context()
    connect_args = {"ssl": ssl_ctx}

# Remove sslmode da URL do asyncpg (ele não suporta via query string)
db_url = settings.DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
)

SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
