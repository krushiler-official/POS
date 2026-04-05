import enum

class OrderStatus(str, enum.Enum):
    preparing = "preparing"
    completed = "completed"

class PaymentStatus(str, enum.Enum):
    paid = "paid"

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    upi = "upi"
