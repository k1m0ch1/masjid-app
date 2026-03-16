from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session
from supabase import Client, create_client

from app.core.config import settings
from app.db.session import get_db
from app.models.user import ALL_MODULES, User, UserRole
from app.schemas.user import UserResponse

router = APIRouter()
security = HTTPBearer(auto_error=False)


def get_supabase_client(use_service_role: bool = False) -> Client:
    key = settings.SUPABASE_KEY
    if use_service_role and settings.SUPABASE_SERVICE_ROLE_KEY:
        key = settings.SUPABASE_SERVICE_ROLE_KEY
    return create_client(settings.SUPABASE_URL, key)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _get_user_by_email(db: Session, email: str) -> Optional[User]:
    normalized_email = _normalize_email(email)
    return db.query(User).filter(
        func.lower(User.email) == normalized_email,
        User.deleted_at.is_(None),
    ).first()


def _assert_user_allowed(user: User):
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User nonaktif")
    if not user.is_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email tidak diizinkan")


def _sync_user_profile(user: User, supabase_user, db: Session, *, set_last_login: bool = False) -> User:
    metadata = getattr(supabase_user, "user_metadata", None) or {}
    full_name = metadata.get("full_name") or metadata.get("name") or user.full_name or user.email
    avatar_url = metadata.get("avatar_url") or metadata.get("picture")
    google_id = getattr(supabase_user, "id", None)

    changed = False
    if full_name and user.full_name != full_name:
        user.full_name = full_name
        changed = True
    if avatar_url is not None and user.avatar_url != avatar_url:
        user.avatar_url = avatar_url
        changed = True
    if google_id and user.google_id != str(google_id):
        user.google_id = str(google_id)
        changed = True
    if not user.is_verified:
        user.is_verified = True
        changed = True
    if set_last_login:
        user.last_login_at = func.now()
        changed = True

    if changed:
        db.commit()
        db.refresh(user)

    return user


def _verify_token_via_supabase(token: str):
    """Verify token by calling Supabase auth API — no JWT secret needed."""
    try:
        client = get_supabase_client()
        response = client.auth.get_user(token)
        if not response or not response.user:
            raise ValueError("No user in response")
        return response.user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        if settings.DEBUG:
            dev_user = _get_user_by_email(db, "dev@localhost.local")
            if not dev_user:
                dev_user = User(
                    email="dev@localhost.local",
                    full_name="Dev User",
                    role=UserRole.ADMIN,
                    is_active=True,
                    is_verified=True,
                    is_allowed=True,
                    allowed_modules=ALL_MODULES,
                )
                db.add(dev_user)
                db.commit()
                db.refresh(dev_user)
            return dev_user

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    supabase_user = _verify_token_via_supabase(credentials.credentials)
    email = supabase_user.email

    user = _get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email tidak diizinkan")

    _assert_user_allowed(user)
    return _sync_user_profile(user, supabase_user, db)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hanya admin yang diizinkan")
    return current_user


def require_modules(modules: list[str]):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        allowed_modules = set(current_user.allowed_modules or [])
        missing = [m for m in modules if m not in allowed_modules]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Akses ditolak untuk modul: {', '.join(missing)}",
            )
        return current_user
    return dependency


def require_module(module: str):
    return require_modules([module])


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info — verifies via Supabase, checks users table."""
    return UserResponse.model_validate(current_user)


@router.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}
