import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import get_db
from app.api import auth, accounts, categories, transactions, goals, reports

app = FastAPI(title="Fluxo API", version="1.0.0")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, accounts.router, categories.router, transactions.router, goals.router, reports.router]:
    app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup():
    from app.core.seed import seed_categories
    async with __import__('app.core.database', fromlist=['SessionLocal']).SessionLocal() as db:
        await seed_categories(db)

@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "online"}
