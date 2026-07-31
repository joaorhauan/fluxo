from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction, TransactionType

router = APIRouter(prefix="/budgets", tags=["Orçamentos"])

class BudgetCreate(BaseModel):
    category_id: int
    amount: float
    month: int
    year: int

@router.get("/")
async def get_budgets(
    year: int = Query(...),
    month: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Busca orçamentos do mês/ano
    result = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.year == year,
            Budget.month == month
        )
    )
    budgets = result.scalars().all()
    
    # Calcula o quanto já foi gasto em cada categoria neste mês
    # (Pode ser integrado diretamente no retorno)
    response = []
    for b in budgets:
        # Soma transações da categoria no mês
        tx_result = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.user_id == current_user.id,
                Transaction.category_id == b.category_id,
                Transaction.type == TransactionType.expense,
                func.extract('year', Transaction.date) == year,
                func.extract('month', Transaction.date) == month
            )
        )
        spent = tx_result.scalar() or 0.0
        response.append({
            "id": b.id,
            "category_id": b.category_id,
            "amount": float(b.amount),
            "spent": float(spent),
            "remaining": float(b.amount) - float(spent),
            "percentage": (float(spent) / float(b.amount)) * 100 if b.amount > 0 else 0,
            "month": b.month,
            "year": b.year
        })
        
    return response

@router.post("/")
async def create_budget(
    data: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verifica se já existe orçamento para essa categoria nesse mês/ano
    existing = await db.execute(
        select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.category_id == data.category_id,
            Budget.month == data.month,
            Budget.year == data.year
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Já existe um orçamento para esta categoria neste mês.")

    new_budget = Budget(
        user_id=current_user.id,
        category_id=data.category_id,
        amount=data.amount,
        month=data.month,
        year=data.year
    )
    db.add(new_budget)
    await db.commit()
    await db.refresh(new_budget)
    return new_budget

@router.delete("/{budget_id}")
async def delete_budget(
    budget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    
    await db.delete(budget)
    await db.commit()
    return {"message": "Orçamento removido com sucesso"}
