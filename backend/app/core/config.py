from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URL: str
    MONGO_DB: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
