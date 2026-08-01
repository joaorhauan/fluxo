import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Fluxo"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://fluxo:fluxo@postgres:5432/fluxo"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://fluxo:fluxo@postgres:5432/fluxo"
    SECRET_KEY: str = "troque-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

def get_allowed_origins() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",")]
