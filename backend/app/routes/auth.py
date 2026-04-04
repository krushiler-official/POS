from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
from app.core.database import get_database
from app.core.utils import doc, to_oid
from app.models.user import UserRole
from app.schemas.user import UserCreate, UserOut, Token, LoginRequest, PromoteRequest

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer()

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        db = get_database()
        user = await db.users.find_one({"_id": to_oid(payload.get("sub"))})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return doc(user)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.post("/register", response_model=UserOut)
async def register(data: UserCreate):
    """Public registration — always creates a staff account."""
    db = get_database()
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    result = await db.users.insert_one({
        "name": data.name,
        "username": data.username,
        "hashed_password": hash_password(data.password),
        "role": UserRole.staff,
        "is_active": True,
    })
    user = await db.users.find_one({"_id": result.inserted_id})
    return doc(user)

@router.post("/promote", response_model=UserOut)
async def promote_user(data: PromoteRequest, admin=Depends(require_admin)):
    """Admin-only: promote or demote any user's role."""
    db = get_database()
    # Prevent admin from demoting themselves
    if data.user_id == admin["id"] and data.role != UserRole.admin:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    result = await db.users.find_one_and_update(
        {"_id": to_oid(data.user_id)},
        {"$set": {"role": data.role}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return doc(result)

@router.post("/login", response_model=Token)
async def login(data: LoginRequest):
    db = get_database()
    user = await db.users.find_one({"username": data.username})
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user = doc(user)
    token = create_token({"sub": user["id"], "role": str(user["role"])})
    return {"access_token": token, "token_type": "bearer", "user": user}
