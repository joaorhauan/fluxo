import os
import shutil
from pathlib import Path
from datetime import date, timedelta
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from dateutil.relativedelta import relativedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType, RecurrenceType
from app.schemas.transaction import TransactionCreate, TransactionRead, TransactionUpdate

router = APIRouter(prefix="/transactions", tags=["Transações"])

UPLOAD_DIR = Path("uploads/receipts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

async def _enrich(t: Transaction, db: AsyncSession) -> dict:
    data = {c.name: getattr(t, c.name) for c in t.__table__.columns}
    data["category_name"] = None
    data["category_icon"] = None
    data["category_color"] = None
    if t.category_id:
        cat = await db.get(Category, t.category_id)
        if cat:
            data["category_name"] = cat.name
            data["category_icon"] = cat.icon
            data["category_color"] = cat.color
    return data

@router.get("/", response_model=list[TransactionRead])
async def list_transactions(
    start: date | None = Query(None),
    end: date | None = Query(None),
    account_id: int | None = Query(None),
    category_id: int | None = Query(None),
    is_paid: bool | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Transaction).where(Transaction.user_id == current_user.id)
    if start:
        q = q.where(Transaction.date >= start)
    if end:
        q = q.where(Transaction.date <= end)
    if account_id:
        q = q.where(Transaction.account_id == account_id)
    if category_id:
        q = q.where(Transaction.category_id == category_id)
    if is_paid is not None:
        q = q.where(Transaction.is_paid == is_paid)
    if search:
        q = q.where(Transaction.description.ilike(f"%{search}%"))
    q = q.order_by(Transaction.date.desc())
    result = await db.execute(q)
    txs = result.scalars().all()
    return [await _enrich(t, db) for t in txs]

@router.get("/upcoming", response_model=list[TransactionRead])
async def upcoming_transactions(
    days: int = Query(default=7),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    end = today + timedelta(days=days)
    q = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.is_paid == False,
        or_(
            Transaction.due_date.between(today, end),
            Transaction.date.between(today, end),
        ),
    ).order_by(Transaction.due_date)
    result = await db.execute(q)
    txs = result.scalars().all()
    return [await _enrich(t, db) for t in txs]

@router.post("/", response_model=list[TransactionRead], status_code=201)
async def create_transaction(
    data: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acc_result = await db.execute(select(Account).where(Account.id == data.account_id, Account.user_id == current_user.id))
    account = acc_result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

    created = []
    installments = data.installments
    amount_per = (data.amount / installments).quantize(Decimal("0.01"))

    if data.type == TransactionType.transfer:
        if not data.destination_account_id:
            raise HTTPException(status_code=400, detail="Conta destino obrigatória para transferência")
        dest_result = await db.execute(select(Account).where(Account.id == data.destination_account_id, Account.user_id == current_user.id))
        dest_account = dest_result.scalar_one_or_none()
        if not dest_account:
            raise HTTPException(status_code=404, detail="Conta destino não encontrada")
        t = Transaction(
            user_id=current_user.id,
            account_id=data.account_id,
            destination_account_id=data.destination_account_id,
            amount=data.amount,
            type=TransactionType.transfer,
            description=data.description,
            date=data.date,
            is_paid=data.is_paid,
        )
        db.add(t)
        account.balance -= data.amount
        dest_account.balance += data.amount
        await db.flush()
        created.append(await _enrich(t, db))
        return created

    for i in range(1, installments + 1):
        tx_date = data.date if i == 1 else data.date + relativedelta(months=i - 1)
        t = Transaction(
            user_id=current_user.id,
            account_id=data.account_id,
            category_id=data.category_id,
            amount=amount_per,
            type=data.type,
            description=data.description if installments == 1 else f"{data.description} ({i}/{installments})",
            date=tx_date,
            due_date=data.due_date,
            is_paid=data.is_paid,
            installment_total=installments if installments > 1 else None,
            installment_current=i if installments > 1 else None,
            recurrence=data.recurrence,
            recurrence_end_date=data.recurrence_end_date,
            notes=data.notes,
        )
        db.add(t)
        created.append(t)

    if data.is_paid:
        if data.type == TransactionType.income:
            account.balance += data.amount
        elif data.type == TransactionType.expense:
            account.balance -= data.amount

    await db.flush()
    return [await _enrich(t, db) for t in created]

@router.patch("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(t, field, value)
    return await _enrich(t, db)

@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    await db.delete(t)

@router.post("/bulk-categorize", status_code=200)
async def bulk_categorize(
    category_id: int,
    transaction_ids: list[int],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Transaction).where(
            Transaction.id.in_(transaction_ids),
            Transaction.user_id == current_user.id,
        )
    )
    txs = result.scalars().all()
    for t in txs:
        t.category_id = category_id
    await db.commit()
    return {"updated": len(txs)}

@router.post("/{transaction_id}/upload")
async def upload_receipt(
    transaction_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    
    file_path = UPLOAD_DIR / f"{current_user.id}_{transaction_id}_{file.filename}"
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    t.attachment_url = f"/uploads/receipts/{file_path.name}"
    await db.commit()
    
    return {"attachment_url": t.attachment_url}

@router.post("/process-recurrences", status_code=200)
async def process_recurrences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    result = await db.execute(
        select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.recurrence != RecurrenceType.none,
            Transaction.recurrence_end_date >= today
        )
    )
    txs = result.scalars().all()
    generated = 0
    
    for t in txs:
        next_date = None
        if t.recurrence == RecurrenceType.monthly:
            next_date = t.date + relativedelta(months=1)
        elif t.recurrence == RecurrenceType.weekly:
            next_date = t.date + timedelta(weeks=1)
        elif t.recurrence == RecurrenceType.yearly:
            next_date = t.date + relativedelta(years=1)
            
        if next_date and next_date <= t.recurrence_end_date and next_date <= (today + relativedelta(months=1)):
            check_exists = await db.execute(
                select(Transaction).where(
                    Transaction.parent_id == (t.parent_id or t.id),
                    Transaction.date == next_date
                )
            )
            if not check_exists.scalar_one_or_none():
                new_tx = Transaction(
                    user_id=t.user_id,
                    account_id=t.account_id,
                    category_id=t.category_id,
                    amount=t.amount,
                    type=t.type,
                    description=t.description,
                    date=next_date,
                    due_date=t.due_date + (next_date - t.date) if t.due_date else None,
                    is_paid=False, 
                    parent_id=t.parent_id or t.id,
                    recurrence=t.recurrence,
                    recurrence_end_date=t.recurrence_end_date,
                )
                db.add(new_tx)
                generated += 1

    if generated > 0:
        await db.commit()
        
    return {"generated_transactions": generated}
import os
from fastapi.responses import FileResponse

@router.get("/{tx_id}/attachment")
async def get_transaction_attachment(
    tx_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Busca a transação e garante que pertence ao usuário autenticado
    result = await db.execute(
        select(Transaction).where(Transaction.id == tx_id, Transaction.user_id == current_user.id)
    )
    tx = result.scalar_one_or_none()
    
    if not tx or not tx.attachment_url:
        raise HTTPException(status_code=404, detail="Anexo não encontrado")
    
    # Remove a barra inicial se houver para não quebrar o caminho local
    file_path = tx.attachment_url.lstrip("/")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo físico não encontrado no servidor")
        
    return FileResponse(file_path)
