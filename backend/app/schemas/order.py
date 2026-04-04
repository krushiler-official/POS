from pydantic import BaseModel, field_validator
from typing import List
from datetime import datetime
from app.models.order import OrderStatus, PaymentStatus, PaymentMethod
from app.schemas.order_item import OrderItemCreate, OrderItemOut

class OrderCreate(BaseModel):
    table_id: str
    items: List[OrderItemCreate]
    payment_method: PaymentMethod

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

class OrderOut(BaseModel):
    id: str
    table_id: str
    staff_id: str
    status: OrderStatus
    payment_status: PaymentStatus
    payment_method: PaymentMethod
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut]
