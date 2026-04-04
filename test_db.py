import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test_conn():
    url = os.getenv("MONGO_URL")
    db_name = os.getenv("MONGO_DB")
    print(f"Connecting to {url}...")
    try:
        client = AsyncIOMotorClient(url, serverSelectionTimeoutMS=5000)
        await client.server_info()
        print("Connected successfully!")
        db = client[db_name]
        count = await db.users.count_documents({})
        print(f"Users in DB: {count}")
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_conn())
