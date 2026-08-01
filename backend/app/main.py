from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings, get_allowed_origins
from app.api import auth, accounts, categories, transactions, goals, reports

app = FastAPI(title="Fluxo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in [auth.router, accounts.router, categories.router, transactions.router, goals.router, reports.router]:
    app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup():
    from app.core.seed import seed_categories
    from app.core.database import SessionLocal
    async with SessionLocal() as db:
        await seed_categories(db)

@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "online"}

@app.head("/")
def test():
    return {"app": settings.APP_NAME, "status": "online"}

