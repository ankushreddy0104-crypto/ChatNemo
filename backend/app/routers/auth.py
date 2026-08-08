from fastapi import APIRouter, Depends
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserUpdate, UserResponse
from app.services import auth_service
from app.middleware.auth import get_current_user_id
from supabase import create_client
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister):
    return await auth_service.register_user(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    return await auth_service.login_user(data)


@router.get("/me", response_model=UserResponse)
async def me(user_id: str = Depends(get_current_user_id)):
    return await auth_service.get_user_by_id(user_id)


@router.patch("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, user_id: str = Depends(get_current_user_id)):
    db = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    db.table("users").update(updates).eq("id", user_id).execute()
    return await auth_service.get_user_by_id(user_id)
