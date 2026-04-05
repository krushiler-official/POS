from pymongo import MongoClient
from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
client = MongoClient("mongodb+srv://posuser:pospassword123@cluster0.p0mhvyn.mongodb.net/", serverSelectionTimeoutMS=8000)
db = client["pos_cafe"]

db.users.delete_many({"username": "kashyap"})
db.users.insert_one({
    "name": "Kashyap",
    "username": "kashyap",
    "hashed_password": pwd.hash("Kasyap@123"),
    "role": "admin",
    "is_active": True,
})

user = db.users.find_one({"username": "kashyap"})
print("Admin created successfully!")
print("  Name    :", user["name"])
print("  Username:", user["username"])
print("  Password: Kasyap@123")
print("  Role    :", user["role"])
client.close()
