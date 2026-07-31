from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.account import Account, AccountType, InvoiceStatus
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate

router = APIRouter(prefix="/accounts", tags=["Contas"])

@router.get("/", response_model=list[AccountRead])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Account).where(Account.user_id == current_user.id).order_by(Account.name)
    )
    return result.scalars().all()

@router.post("/", response_model=AccountRead, status_code=201)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    acc = Account(**data.model_dump(), user_id=current_user.id)
    
    if acc.type == AccountType.credit:
        acc.invoice_status = InvoiceStatus.open

    db.add(acc)
    await db.commit()
    await db.refresh(acc)
    return acc

@router.patch("/{account_id}", response_model=AccountRead)
async def update_account(
    account_id: int,
    data: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(acc, field, value)
        
    await db.commit()
    await db.refresh(acc)
    return acc

@router.delete("/{account_id}", status_code=204)
async def delete_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    acc = result.scalar_one_or_none()
    if not acc:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    await db.delete(acc)
    await db.commit()

@router.post("/process-invoices", status_code=200)
async def process_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    current_day = today.day

    result = await db.execute(
        select(Account).where(
            Account.user_id == current_user.id,
            Account.type == AccountType.credit,
            Account.closing_day.is_not(None),
            Account.due_day.is_not(None)
        )
    )
    accounts = result.scalars().all()
    updated = 0

    for acc in accounts:
        new_status = InvoiceStatus.open
        
        if acc.closing_day > acc.due_day:
            if current_day >= acc.closing_day or current_day <= acc.due_day:
                new_status = InvoiceStatus.closed
        else:
            if acc.closing_day <= current_day <= acc.due_day:
                new_status = InvoiceStatus.closed

        if acc.invoice_status != new_status:
            acc.invoice_status = new_status
            updated += 1
            
    if updated > 0:
        await db.commit()
        
    return {"updated_accounts": updated}
