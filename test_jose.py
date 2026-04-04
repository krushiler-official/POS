from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "test"
ALGORITHM = "HS256"

try:
    expire = datetime.utcnow() + timedelta(minutes=10)
    token = jwt.encode({"sub": "123", "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)
    print("Encoded successfully!")
except Exception as e:
    print(f"Failed to encode: {e}")
