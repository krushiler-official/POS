from pydantic import BaseModel
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    username: str
    password: str

class PromoteRequest(BaseModel):
    user_id: str
    role: UserRole

class UserOut(BaseModel):
    id: str
    name: str
    username: str
    role: UserRole

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    username: str
    password: str
