from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import create_client, Client
from app.config import get_settings
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from fastapi import HTTPException, status

settings = get_settings()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _supabase() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def hash_password(password: str) -> str:
    return pwd_ctx.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_ctx.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


async def register_user(data: UserRegister) -> TokenResponse:
    db = _supabase()
    # Check duplicate
    existing = db.table("users").select("id").eq("email", data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(data.password)
    result = db.table("users").insert({
        "email": data.email,
        "full_name": data.full_name,
        "password_hash": hashed,
        "settings": {},
    }).execute()

    user = result.data[0]
    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"],
                          full_name=user.get("full_name"), avatar_url=user.get("avatar_url")),
    )


async def login_user(data: UserLogin) -> TokenResponse:
    db = _supabase()
    result = db.table("users").select("*").eq("email", data.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = result.data[0]
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"],
                          full_name=user.get("full_name"), avatar_url=user.get("avatar_url")),
    )


async def get_user_by_id(user_id: str) -> UserResponse:
    db = _supabase()
    result = db.table("users").select("id,email,full_name,avatar_url").eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    u = result.data[0]
    return UserResponse(id=u["id"], email=u["email"],
                        full_name=u.get("full_name"), avatar_url=u.get("avatar_url"))
