from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel, field_validator
from app.core.database import get_database
from app.core.utils import doc, to_oid
from app.schemas.product import ProductOut
from app.schemas.order import OrderOut
from app.services.order_service import create_order_with_items
from app.websockets.manager import manager
from datetime import datetime

router = APIRouter(prefix="/public", tags=["public"])

class PublicOrderItem(BaseModel):
    product_id: str
    quantity: int

class PublicOrderCreate(BaseModel):
    table_id: str
    items: List[PublicOrderItem]
    payment_method: str = "cash"
    customer_name: str = "Guest"

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v

def _serialize(order: dict) -> dict:
    o = dict(order)
    if hasattr(o.get("created_at"), "isoformat"):
        o["created_at"] = o["created_at"].isoformat()
    return o

@router.get("/table/{table_id}")
async def get_table(table_id: str):
    db = get_database()
    table = await db.tables.find_one({"_id": to_oid(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return doc(table)

@router.get("/products", response_model=List[ProductOut])
async def get_public_products():
    db = get_database()
    products = await db.products.find({"is_available": True}).to_list(None)
    return [doc(p) for p in products]

@router.post("/orders", response_model=OrderOut)
async def create_public_order(data: PublicOrderCreate):
    db = get_database()
    table = await db.tables.find_one({"_id": to_oid(data.table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    # Use a system staff_id for self-orders
    system_user = await db.users.find_one({"role": "admin"})
    staff_id = str(system_user["_id"]) if system_user else "self-order"

    # Build order using same service
    from app.schemas.order import OrderCreate
    from app.schemas.order_item import OrderItemCreate
    order_data = OrderCreate(
        table_id=data.table_id,
        items=[OrderItemCreate(product_id=i.product_id, quantity=i.quantity) for i in data.items],
        payment_method=data.payment_method,
    )
    order = await create_order_with_items(db, order_data, staff_id)
    await db.tables.update_one({"_id": to_oid(data.table_id)}, {"$set": {"status": "occupied"}})
    await manager.broadcast("NEW_ORDER", _serialize(order))
    return order
