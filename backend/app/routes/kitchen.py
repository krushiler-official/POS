from fastapi import APIRouter, Depends
from typing import List
from app.core.database import get_database
from app.core.utils import doc
from app.models.order import OrderStatus
from app.schemas.order import OrderOut
from app.routes.auth import get_current_user

router = APIRouter(prefix="/kitchen", tags=["kitchen"])

@router.get("/orders", response_model=List[OrderOut])
async def get_kitchen_orders(_=Depends(get_current_user)):
    db = get_database()
    orders = await db.orders.find(
        {"status": {"$in": [OrderStatus.pending, OrderStatus.preparing]}}
    ).sort("created_at", 1).to_list(None)
    return [doc(o) for o in orders]

@router.get("/dashboard")
async def get_dashboard(_=Depends(get_current_user)):
    db = get_database()
    total_orders = await db.orders.count_documents({})
    all_orders = await db.orders.find({}).to_list(None)
    total_revenue = sum(o.get("total_amount", 0) for o in all_orders)
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "pending": await db.orders.count_documents({"status": OrderStatus.pending}),
        "preparing": await db.orders.count_documents({"status": OrderStatus.preparing}),
        "completed": await db.orders.count_documents({"status": OrderStatus.completed}),
    }
