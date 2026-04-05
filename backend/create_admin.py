from pymongo import MongoClient
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient("mongodb+srv://posuser:pospassword123@cluster0.p0mhvyn.mongodb.net/", serverSelectionTimeoutMS=8000)
db = client["pos_cafe"]

# Remove any existing superadmin
db.users.delete_many({"username": "superadmin"})

db.users.insert_one({
    "name": "Super Admin",
    "username": "superadmin",
    "hashed_password": pwd.hash("Cafe@2024"),
    "role": "admin",
    "is_active": True,
})

user = db.users.find_one({"username": "superadmin"})
print("Admin created successfully!")
print("  Name    :", user["name"])
print("  Username:", user["username"])
print("  Password: Cafe@2024")
print("  Role    :", user["role"])
client.close()
