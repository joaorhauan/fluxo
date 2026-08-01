from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.category import Category, CategoryType

DEFAULT_CATEGORIES = [
    # Despesas
    {"name": "Alimentação", "type": CategoryType.expense, "color": "#f59e0b", "icon": "🍔"},
    {"name": "Mercado", "type": CategoryType.expense, "color": "#10b981", "icon": "🛒"},
    {"name": "Transporte", "type": CategoryType.expense, "color": "#3b82f6", "icon": "🚗"},
    {"name": "Saúde", "type": CategoryType.expense, "color": "#ef4444", "icon": "💊"},
    {"name": "Lazer", "type": CategoryType.expense, "color": "#8b5cf6", "icon": "🎮"},
    {"name": "Educação", "type": CategoryType.expense, "color": "#06b6d4", "icon": "📚"},
    {"name": "Moradia", "type": CategoryType.expense, "color": "#f97316", "icon": "🏠"},
    {"name": "Vestuário", "type": CategoryType.expense, "color": "#ec4899", "icon": "👕"},
    {"name": "Assinaturas", "type": CategoryType.expense, "color": "#6366f1", "icon": "📱"},
    {"name": "Delivery", "type": CategoryType.expense, "color": "#f43f5e", "icon": "🛵"},
    {"name": "Academia", "type": CategoryType.expense, "color": "#14b8a6", "icon": "💪"},
    {"name": "Viagem", "type": CategoryType.expense, "color": "#0ea5e9", "icon": "✈️"},
    {"name": "Pet", "type": CategoryType.expense, "color": "#a78bfa", "icon": "🐾"},
    {"name": "Outros", "type": CategoryType.expense, "color": "#6b7280", "icon": "📦"},
    # Receitas
    {"name": "Salário", "type": CategoryType.income, "color": "#10b981", "icon": "💰"},
    {"name": "Freelance", "type": CategoryType.income, "color": "#6366f1", "icon": "💻"},
    {"name": "Investimentos", "type": CategoryType.income, "color": "#f59e0b", "icon": "📈"},
    {"name": "Presente", "type": CategoryType.income, "color": "#ec4899", "icon": "🎁"},
    {"name": "Outras Receitas", "type": CategoryType.income, "color": "#6b7280", "icon": "💵"},
]


async def seed_categories(db: AsyncSession):
    result = await db.execute(
        select(Category).where(Category.user_id == None).limit(1)
    )
    if result.scalar_one_or_none():
        return  # já tem seed

    for cat in DEFAULT_CATEGORIES:
        db.add(Category(user_id=None, **cat))
    await db.commit()
