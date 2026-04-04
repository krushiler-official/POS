from fastapi import APIRouter, Depends
from app.core.database import get_database
from app.core.utils import doc
from app.models.order import OrderStatus
from app.routes.auth import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/overview")
async def get_overview(_=Depends(get_current_user)):
    db = get_database()
    total_orders = await db.orders.count_documents({})
    all_orders = await db.orders.find({}).to_list(None)
    total_revenue = sum(o.get("total_amount", 0) for o in all_orders)
    total_tables = await db.tables.count_documents({})
    occupied = await db.tables.count_documents({"status": "occupied"})
    total_products = await db.products.count_documents({"is_available": True})
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_tables": total_tables,
        "occupied_tables": occupied,
        "total_products": total_products,
        "pending": await db.orders.count_documents({"status": OrderStatus.pending}),
        "preparing": await db.orders.count_documents({"status": OrderStatus.preparing}),
        "completed": await db.orders.count_documents({"status": OrderStatus.completed}),
    }

@router.get("/daily-revenue")
async def get_daily_revenue(_=Depends(get_current_user)):
    db = get_database()
    days = []
    for i in range(6, -1, -1):
        day_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        orders = await db.orders.find({
            "payment_status": "paid",
            "created_at": {"$gte": day_start, "$lt": day_end}
        }).to_list(None)
        revenue = sum(o.get("total_amount", 0) for o in orders)
        days.append({
            "date": day_start.strftime("%a"),
            "revenue": round(revenue, 2),
            "orders": len(orders)
        })
    return days

@router.get("/top-products")
async def get_top_products(_=Depends(get_current_user)):
    db = get_database()
    orders = await db.orders.find({"payment_status": "paid"}).to_list(None)
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            name = item.get("product_name", "Unknown")
            qty = item.get("quantity", 0)
            revenue = item.get("unit_price", 0) * qty
            if name not in product_sales:
                product_sales[name] = {"name": name, "quantity": 0, "revenue": 0}
            product_sales[name]["quantity"] += qty
            product_sales[name]["revenue"] += revenue
    top = sorted(product_sales.values(), key=lambda x: x["quantity"], reverse=True)[:6]
    return top

@router.get("/staff")
async def get_staff_list(_=Depends(get_current_user)):
    db = get_database()
    users = await db.users.find({}, {"hashed_password": 0}).to_list(None)
    return [doc(u) for u in users]
