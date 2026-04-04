from datetime import datetime, timezone
from fastapi import HTTPException
from app.core.utils import doc, to_oid
from app.schemas.order import OrderCreate

async def create_order_with_items(db, data: OrderCreate, staff_id: str) -> dict:
    total = 0.0
    items_data = []

    for item in data.items:
        product = await db.products.find_one({"_id": to_oid(item.product_id), "is_available": True})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        total += product["price"] * item.quantity
        items_data.append({
            "product_id": str(product["_id"]),
            "product_name": product["name"],
            "quantity": item.quantity,
            "unit_price": product["price"],
        })

    result = await db.orders.insert_one({
        "table_id": data.table_id,
        "staff_id": staff_id,
        "status": "pending",
        "payment_status": "paid",
        "payment_method": data.payment_method,
        "total_amount": round(total, 2),
        "items": items_data,
        "created_at": datetime.now(timezone.utc),
    })

    order = await db.orders.find_one({"_id": result.inserted_id})
    return doc(order)
