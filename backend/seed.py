"""
Seed script - run once to populate sample data
Usage: venv\Scripts\python seed.py
"""
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import random

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient("mongodb+srv://posuser:pospassword123@cluster0.p0mhvyn.mongodb.net/", serverSelectionTimeoutMS=8000)
db = client["pos_cafe"]

# Clear existing
db.users.delete_many({})
db.tables.delete_many({})
db.products.delete_many({})
db.orders.delete_many({})

# Users
db.users.insert_many([
    {"name": "Admin User", "username": "admin", "hashed_password": pwd.hash("admin123"), "role": "admin", "is_active": True},
    {"name": "Staff One", "username": "staff1", "hashed_password": pwd.hash("staff123"), "role": "staff", "is_active": True},
    {"name": "Staff Two", "username": "staff2", "hashed_password": pwd.hash("staff123"), "role": "staff", "is_active": True},
])
print("Users seeded")

# Tables
tables = [{"number": i, "capacity": random.choice([2, 4, 6]), "status": "available"} for i in range(1, 11)]
db.tables.insert_many(tables)
print("Tables seeded")

# Products
products = [
    {"name": "Espresso", "category": "Coffee", "price": 80, "is_available": True},
    {"name": "Cappuccino", "category": "Coffee", "price": 120, "is_available": True},
    {"name": "Latte", "category": "Coffee", "price": 130, "is_available": True},
    {"name": "Cold Coffee", "category": "Coffee", "price": 150, "is_available": True},
    {"name": "Green Tea", "category": "Tea", "price": 60, "is_available": True},
    {"name": "Masala Chai", "category": "Tea", "price": 40, "is_available": True},
    {"name": "Veg Sandwich", "category": "Food", "price": 120, "is_available": True},
    {"name": "Paneer Wrap", "category": "Food", "price": 160, "is_available": True},
    {"name": "French Fries", "category": "Snacks", "price": 100, "is_available": True},
    {"name": "Nachos", "category": "Snacks", "price": 130, "is_available": True},
    {"name": "Chocolate Cake", "category": "Dessert", "price": 180, "is_available": True},
    {"name": "Brownie", "category": "Dessert", "price": 120, "is_available": True},
    {"name": "Fresh Lime Soda", "category": "Drinks", "price": 70, "is_available": True},
    {"name": "Mango Shake", "category": "Drinks", "price": 140, "is_available": True},
]
result = db.products.insert_many(products)
product_ids = result.inserted_ids
print("Products seeded")

# Sample orders for analytics
staff_id = str(db.users.find_one({"username": "staff1"})["_id"])
table_ids = [str(t["_id"]) for t in db.tables.find()]

for i in range(20):
    days_ago = random.randint(0, 6)
    created = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=random.randint(0, 8))
    items = random.sample(list(zip(products, product_ids)), random.randint(1, 3))
    order_items = [{"product_id": str(pid), "product_name": p["name"], "quantity": random.randint(1, 3), "unit_price": p["price"]} for p, pid in items]
    total = sum(it["unit_price"] * it["quantity"] for it in order_items)
    db.orders.insert_one({
        "table_id": random.choice(table_ids),
        "staff_id": staff_id,
        "status": "paid",
        "payment_method": random.choice(["cash", "upi"]),
        "total_amount": total,
        "items": order_items,
        "created_at": created,
    })

print("Sample orders seeded")
print("\nDone! Login credentials:")
print("  Admin  -> username: admin    password: admin123")
print("  Staff  -> username: staff1   password: staff123")
client.close()
