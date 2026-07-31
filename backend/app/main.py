# ===== backend/main.py =====
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import Base, engine
from app.api import auth, accounts, categories, transactions, goals, reports, budgets

app = FastAPI(title="Fluxo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluindo os routers da aplicação
app.include_router(auth.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Cria as tabelas no banco de dados caso não existam (incluindo a nova tabela budgets)
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def root():
    return {"message": "API Fluxo rodando com sucesso!"}
