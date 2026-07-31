import io
import pandas as pd
from datetime import date, timedelta
from calendar import monthrange
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction, TransactionType
from app.models.category import Category
import random

router = APIRouter(prefix="/reports", tags=["Relatórios"])

@router.get("/summary")
async def get_monthly_summary(
    year: int = Query(...),
    month: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date = date(year, month, 1)
    _, last_day = monthrange(year, month)
    end_date = date(year, month, last_day)

    prev_month_date = start_date - timedelta(days=1)
    prev_start_date = date(prev_month_date.year, prev_month_date.month, 1)
    prev_end_date = prev_month_date

    curr_result = await db.execute(
        select(Transaction, Category.name, Category.color, Category.icon)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.date.between(start_date, end_date),
            Transaction.type != TransactionType.transfer
        )
    )
    curr_txs = curr_result.all()

    prev_result = await db.execute(
        select(Transaction, Category.name)
        .outerjoin(Category, Transaction.category_id == Category.id)
        .where(
            Transaction.user_id == current_user.id,
            Transaction.date.between(prev_start_date, prev_end_date),
            Transaction.type != TransactionType.transfer
        )
    )
    prev_txs = prev_result.all()

    curr_income = sum(t[0].amount for t in curr_txs if t[0].type == TransactionType.income)
    curr_expense = sum(t[0].amount for t in curr_txs if t[0].type == TransactionType.expense)
    
    prev_income = sum(t[0].amount for t in prev_txs if t[0].type == TransactionType.income)
    prev_expense = sum(t[0].amount for t in prev_txs if t[0].type == TransactionType.expense)

    income_mom = ((curr_income - prev_income) / prev_income * 100) if prev_income > 0 else (100 if curr_income > 0 else 0)
    expense_mom = ((curr_expense - prev_expense) / prev_expense * 100) if prev_expense > 0 else (100 if curr_expense > 0 else 0)

    daily_data = []
    cumulative_balance = 0
    tx_by_day = {}
    for t in curr_txs:
        day = t[0].date.day
        if day not in tx_by_day:
            tx_by_day[day] = {"income": 0, "expense": 0}
        if t[0].type == TransactionType.income:
            tx_by_day[day]["income"] += t[0].amount
        else:
            tx_by_day[day]["expense"] += t[0].amount

    for day in range(1, last_day + 1):
        daily_inc = tx_by_day.get(day, {}).get("income", 0)
        daily_exp = tx_by_day.get(day, {}).get("expense", 0)
        cumulative_balance += (daily_inc - daily_exp)
        daily_data.append({
            "day": str(day),
            "balance": float(cumulative_balance),
            "income": float(daily_inc),
            "expense": float(daily_exp)
        })

    cat_summary = {}
    for t in curr_txs:
        if t[0].type == TransactionType.expense:
            cat_name = t[1] or "Sem Categoria"
            if cat_name not in cat_summary:
                cat_summary[cat_name] = {"amount": 0, "color": t[2] or "#6b7280", "icon": t[3] or "📦"}
            cat_summary[cat_name]["amount"] += t[0].amount

    prev_cat_summary = {}
    for t in prev_txs:
        if t[0].type == TransactionType.expense:
            cat_name = t[1] or "Sem Categoria"
            prev_cat_summary[cat_name] = prev_cat_summary.get(cat_name, 0) + t[0].amount

    categories_list = []
    for name, data in cat_summary.items():
        curr_amt = data["amount"]
        prev_amt = prev_cat_summary.get(name, 0)
        mom_percent = ((curr_amt - prev_amt) / prev_amt * 100) if prev_amt > 0 else (100 if curr_amt > 0 else 0)
        categories_list.append({
            "name": name,
            "icon": data["icon"],
            "color": data["color"],
            "amount": float(curr_amt),
            "mom_percent": float(mom_percent),
            "is_increase": curr_amt > prev_amt
        })
        
    categories_list.sort(key=lambda x: x["amount"], reverse=True)

    savings_rate = ((curr_income - curr_expense) / curr_income * 100) if curr_income > 0 else 0

    return {
        "totals": {
            "income": float(curr_income),
            "expense": float(curr_expense),
            "balance": float(curr_income - curr_expense),
            "income_mom": float(income_mom),
            "expense_mom": float(expense_mom)
        },
        "daily_evolution": daily_data,
        "by_category": categories_list,
        "savings_rate": float(savings_rate)
    }


@router.get("/export/csv")
async def export_csv(
    start: str = Query(...),
    end: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end)

    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.date.between(start_date, end_date)
        )
    )
    transactions = result.scalars().all()
    
    if not transactions:
        raise HTTPException(status_code=400, detail="Nenhuma transação encontrada no período.")

    data = [{
        "Data": str(t.date),
        "Descrição": t.description,
        "Tipo": t.type.value if hasattr(t.type, 'value') else str(t.type),
        "Valor": float(t.amount),
        "Pago": "Sim" if t.is_paid else "Não"
    } for t in transactions]

    df = pd.DataFrame(data)
    output = io.StringIO()
    df.to_csv(output, index=False, sep=";")
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=relatorio_{start}_{end}.csv"}
    )


@router.get("/export/excel")
async def export_excel(
    start: str = Query(...),
    end: str = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = date.fromisoformat(start)
    end_date = date.fromisoformat(end)

    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.date.between(start_date, end_date)
        )
    )
    transactions = result.scalars().all()
    
    if not transactions:
        raise HTTPException(status_code=400, detail="Nenhuma transação encontrada no período.")

    data = [{
        "Data": str(t.date),
        "Descrição": t.description,
        "Tipo": t.type.value if hasattr(t.type, 'value') else str(t.type),
        "Valor": float(t.amount),
        "Pago": "Sim" if t.is_paid else "Não"
    } for t in transactions]

    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Transacoes')
    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=relatorio_{start}_{end}.xlsx"}
    )

@router.get("/tips")
async def get_financial_tips(
    current_user: User = Depends(get_current_user)
):
    """
    Retorna dicas financeiras aleatórias para exibir no Dashboard ou tela de Metas.
    No futuro, você pode integrar isso com a API do Gemini para dicas com IA baseadas nos gastos do usuário!
    """
    all_tips = [
        "Poupe pelo menos 20% da sua renda mensal para alcançar suas metas mais rápido.",
        "O ideal é ter uma reserva de emergência equivalente a 6 meses do seu custo de vida.",
        "Revise suas assinaturas mensais e corte serviços que você quase não usa.",
        "Evite parcelamentos muito longos para não comprometer sua renda futura.",
        "Anote todos os seus pequenos gastos (o famoso 'gasto formiga') para não perder o controle.",
        "Sempre pague o valor total da fatura do cartão de crédito para evitar juros abusivos.",
        "Defina marcos menores dentro da sua meta principal para manter a motivação em alta.",
        "Espere 24 horas antes de fazer uma compra por impulso. Se ainda quiser, avalie o orçamento."
    ]
    
    # Retorna 3 dicas aleatórias a cada carregamento
    return random.sample(all_tips, 3)
