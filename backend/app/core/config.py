import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import Any

class Settings(BaseSettings):
    APP_NAME: str = "Fluxo"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://fluxo:fluxo@postgres:5432/fluxo"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://fluxo:fluxo@postgres:5432/fluxo"
    SECRET_KEY: str = "troque-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 525600
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [o.strip() for o in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
