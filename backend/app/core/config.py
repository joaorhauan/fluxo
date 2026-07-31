from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Fluxo"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql+asyncpg://fluxo:fluxo@localhost:5432/fluxo"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://fluxo:fluxo@localhost:5432/fluxo"
    SECRET_KEY: str = "troque-isso-em-producao"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8081"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
